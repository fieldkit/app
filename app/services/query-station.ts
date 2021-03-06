import _ from "lodash";
import Config from "@/config";
import { unixNow, promiseAfter, QueryThrottledError, StationQueryError, HttpError, ConnectionError } from "@/lib";
import { Services } from "@/services/interface";
import { Conservify, HttpResponse } from "@/wrappers/networking";
import { PhoneLocation, Schedules, NetworkInfo, LoraSettings } from "@/store/types";
import { prepareReply, SerializedStatus, HttpStatusReply } from "@/store/http-types";
import { StationError } from "@/lib";
import { fk_app as AppProto } from "fk-app-protocol/fk-app";

const HttpQuery = AppProto.HttpQuery;
const HttpReply = AppProto.HttpReply;
const QueryType = AppProto.QueryType;
const ReplyType = AppProto.ReplyType;

export type ProgressCallback = (total: number, bytes: number, info: never) => void;

export class CalculatedSize {
    constructor(public readonly size: number) {}
}

export interface TrackActivityOptions {
    url: string;
    throttle: boolean;
}

export interface QueryOptions {
    url?: string;
    throttle?: boolean;
}

export interface FirmwareResponse {
    error?: boolean;
    incomplete?: boolean;
    success?: boolean;
    unlink?: boolean;
    sdCard?: boolean;
    create?: boolean;
}

const log = Config.logger("QueryStation");

type StationQuery = { reply: AppProto.HttpReply; serialized: SerializedStatus };

type ResolveFunc = () => void;

export default class QueryStation {
    private readonly conservify: Conservify;
    private readonly openQueries: { [index: string]: boolean } = {};
    private readonly lastQueries: { [index: string]: Date } = {};
    private readonly lastQueryTried: { [index: string]: Date } = {};

    constructor(services: Services) {
        this.conservify = services.Conservify();
    }

    private buildLocateMessage(queryType: number, locate: PhoneLocation | null): AppProto.HttpQuery {
        if (locate) {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
                flags: AppProto.QueryFlags.QUERY_FLAGS_LOGS,
                locate: {
                    modifying: true,
                    longitude: locate.longitude,
                    latitude: locate.latitude,
                    time: locate.time,
                },
            });
        } else {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
            });
        }
    }

    public async getStatus(address: string, locate: PhoneLocation | null = null): Promise<HttpStatusReply> {
        const message = this.buildLocateMessage(QueryType.QUERY_STATUS, locate);
        return await this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async takeReadings(address: string, locate: PhoneLocation | null, options: QueryOptions = {}): Promise<HttpStatusReply> {
        const message = this.buildLocateMessage(QueryType.QUERY_TAKE_READINGS, locate);
        return await this.stationQuery(address, message, options).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async startDataRecording(address: string): Promise<HttpStatusReply> {
        const message = AppProto.HttpQuery.create({
            type: QueryType.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: true },
            time: unixNow(),
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async stopDataRecording(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: false },
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async scanNearbyNetworks(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_SCAN_NETWORKS,
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async scanModules(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_SCAN_MODULES,
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async configureSchedule(address: string, schedules: Schedules): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            schedules: { modifying: true, ...schedules },
            time: unixNow(),
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async sendNetworkSettings(address: string, networks: NetworkInfo[]): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            networkSettings: {
                modifying: true,
                networks: networks,
            },
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async sendLoraSettings(address: string, lora: LoraSettings): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            loraSettings: { appEui: lora.appEui, appKey: lora.appKey },
        });
        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async configureName(address: string, name: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            identity: { name: name },
        });

        return await this.stationQuery(address, message, { throttle: false }).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public async calculateDownloadSize(url: string): Promise<CalculatedSize> {
        return await this.trackActivity({ url: url, throttle: false }, () => {
            return this.catchErrors(
                this.conservify
                    .json({
                        method: "HEAD",
                        url: url,
                    })
                    .then((response: HttpResponse) => {
                        if (response.statusCode != 204) {
                            console.log("http-status", response.statusCode, response.headers);
                            return Promise.reject(new HttpError("status", response));
                        }

                        let size = 0;
                        if (response.headers["fk-bytes"]) {
                            size = Number(response.headers["fk-bytes"]);
                        }
                        if (response.headers["content-length"]) {
                            size = Number(response.headers["content-length"]);
                        }

                        console.log("size", size, response.headers);
                        return new CalculatedSize(size);
                    })
            );
        });
    }

    public async queryLogs(url: string): Promise<string> {
        return await this.trackActivityAndThrottle(url, () => {
            return this.catchErrors(
                this.conservify
                    .text({
                        url: url + "/download/logs",
                    })
                    .then((response: HttpResponse): string => {
                        return response.body.toString();
                    })
            );
        });
    }

    public async download(url: string, path: string, progress: ProgressCallback): Promise<HttpResponse> {
        return await this.trackActivity({ url: url, throttle: false }, () => {
            return this.conservify
                .download({
                    method: "GET",
                    url: url,
                    path: path,
                    progress: progress,
                })
                .then((response: HttpResponse) => {
                    // log.info("headers", response.headers);
                    // log.info("status", response.statusCode);
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                });
        });
    }

    public async uploadFirmware(url: string, path: string, progress: ProgressCallback): Promise<FirmwareResponse> {
        return await this.trackActivity({ url: url, throttle: false }, () => {
            return this.conservify
                .upload({
                    method: "POST",
                    url: url + "/upload/firmware?swap=1",
                    path: path,
                    progress: progress,
                    defaultTimeout: 30,
                })
                .then((response) => {
                    console.log("upload-firmware:", response.body);
                    return JSON.parse(response.body.toString()) as FirmwareResponse;
                });
        });
    }

    public async uploadViaApp(address: string): Promise<void> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    enabled: false,
                },
            },
            time: unixNow(),
        });

        return await this.stationQuery(address, message, { throttle: false })
            .then((reply) => {
                return this.fixupStatus(reply);
            })
            .then(() => Promise.resolve());
    }

    public async uploadOverWifi(address: string, transmissionUrl: string, transmissionToken: string): Promise<void> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    url: transmissionUrl,
                    token: transmissionToken,
                    enabled: true,
                },
            },
            schedules: { modifying: true, network: { duration: 0xffffffff } },
            time: unixNow(),
        });

        return await this.stationQuery(address, message, { throttle: false })
            .then((reply) => {
                return this.fixupStatus(reply);
            })
            .then(() => Promise.resolve());
    }

    private urlToStationKey(url: string): string {
        if (!url) throw new Error("no station url");
        // http://192.168.0.100:2380/fk/v1 -> http://192.168.0.100:2380/fk
        return url.replace(/\/v1.*/, "");
    }

    private readonly queued: { [index: string]: ResolveFunc } = {};

    private async trackActivity<T>(options: TrackActivityOptions, factory: () => Promise<T>): Promise<T> {
        const stationKey = this.urlToStationKey(options.url);
        if (this.openQueries[stationKey] === true) {
            if (options.throttle) {
                console.log(options.url, "query-station: throttle");
                return Promise.reject(new QueryThrottledError("throttled"));
            }
            return new Promise((resolve) => {
                console.log(options.url, "query-station: queuing station query");
                this.queued[stationKey] = () => resolve(undefined);
            }).then(() => {
                return this.trackActivity(options, factory);
            });
        }
        this.openQueries[stationKey] = true;
        this.lastQueryTried[stationKey] = new Date();

        return factory()
            .then(
                (value: T) => {
                    this.openQueries[stationKey] = false;
                    this.lastQueries[stationKey] = new Date();
                    return value;
                },
                (error) => {
                    this.openQueries[stationKey] = false;
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                if (this.queued[stationKey]) {
                    console.log("query-station: resuming");
                    const resume = this.queued[stationKey];
                    delete this.queued[stationKey];
                    resume();
                }
            });
    }

    private trackActivityAndThrottle<T>(url: string, factory): Promise<T> {
        return this.trackActivity<T>({ url: url, throttle: true }, factory);
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private async stationQuery(url: string, message: AppProto.HttpQuery, options: QueryOptions = {}): Promise<StationQuery> {
        const finalOptions = _.extend({ url: url, throttle: true }, options);
        return await this.trackActivity(finalOptions, () => {
            const binaryQuery = HttpQuery.encodeDelimited(message as AppProto.IHttpQuery).finish();
            log.info(url, "querying", JSON.stringify(message));

            return this.catchErrors(
                this.conservify
                    .protobuf({
                        method: "POST",
                        url: url,
                        body: binaryQuery,
                        connectionTimeout: 3,
                    })
                    .then((response) => response)
            );
        }).then(async (response: { statusCode: number; body: Buffer }) => {
            if (response.body.length == 0) {
                console.log(`empty station reply`, response);
                throw new Error(`empty station reply`);
            }

            const decoded = this.getResponseBody(response);
            return await this.handlePotentialBusyReply(decoded, url, message).then((finalReply) => {
                log.verbose(url, "query success", finalReply);
                return finalReply;
            });
        });
    }

    private catchErrors<T>(promise: Promise<T>): Promise<T> {
        return promise.catch((err) => {
            if (err instanceof ConnectionError) {
                console.log(`query-station error`, err.message);
            } else {
                console.log(`query-station error`, err);
            }
            return Promise.reject(err);
        });
    }

    private getResponseBody(response: { statusCode: number; body: Buffer }): StationQuery {
        if (response.statusCode == 500) throw new StationError(response.body.toString());
        if (Buffer.isBuffer(response.body)) {
            return {
                reply: HttpReply.decodeDelimited(response.body),
                serialized: response.body.toString("base64"),
            };
        }
        return response.body;
    }

    private fixupStatus(stationQuery: StationQuery): HttpStatusReply {
        try {
            return prepareReply(stationQuery.reply, stationQuery.serialized);
        } catch (error) {
            console.log(`fixup-status`, error);
            throw error;
        }
    }

    private async handlePotentialBusyReply(stationQuery: StationQuery, url: string, message: AppProto.HttpQuery): Promise<StationQuery> {
        const reply = stationQuery.reply;
        if (reply.type != ReplyType.REPLY_BUSY) {
            return Promise.resolve(stationQuery);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new StationQueryError("busy"));
        }
        return await this.retryAfter(delays, url, message);
    }

    private async retryAfter(delays: number, url: string, message: AppProto.HttpQuery): Promise<StationQuery> {
        log.info(url, "retrying after", delays);
        return await promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
