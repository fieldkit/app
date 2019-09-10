import axios from "axios";
import protobuf from "protobufjs";
import Config from '../config';
import deepmerge from 'deepmerge';

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpQuery = appRoot.lookupType("fk_app.HttpQuery");
const HttpReply = appRoot.lookupType("fk_app.HttpReply");
const QueryType = appRoot.lookup("fk_app.QueryType");
const ReplyType = appRoot.lookup("fk_app.ReplyType");

const MandatoryStatus = {
    status: {
        power: {
            battery: {
                percentage: 0.0
            }
        },
        memory: {
            dataMemoryConsumption: 0
        }
    },
};

export default class QueryStation {
    getStatus(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_STATUS
        });

        return this.stationQuery(address, message).then(reply => {
            return this.fixupStatus(reply);
        });
    }

    takeReadings(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_TAKE_READINGS
        });

        return this.stationQuery(address, message).then(reply => {
            return this.fixupStatus(reply);
        });
    }

    startDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { enabled: true }
        });

        return this.stationQuery(address, message).then(reply => {
            return this.fixupStatus(reply);
        });
    }

    stopDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { enabled: false }
        });

        return this.stationQuery(address, message).then(reply => {
            return this.fixupStatus(reply);
        });
    }

    configureName(address, name) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            identity: { name: name }
        });

        return this.stationQuery(address, message).then(reply => {
            return this.fixupStatus(reply);
        });
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        const binaryQuery = HttpQuery.encodeDelimited(message).finish();
        const requestBody = new Buffer.from(binaryQuery).toString("hex");
        if (Config.logging.station_queries) {
            console.log("querying", url, message, requestBody);
        }
        return axios({
            method: "POST",
            url: url,
            headers: {
                /* When we get rid of this hex encoding nonsense we'll fix this, too */
                // 'Content-Type': 'application/octet-stream',
                "Content-Type": "text/plain"
            },
            data: requestBody
        }).then(
            response => {
                if (response.data.length == 0) {
                    if (Config.logging.station_queries) {
                        console.log("query success", "<empty>");
                    }
                    return {};
                }
                const binaryReply = Buffer.from(response.data, "hex");
                const decoded = HttpReply.decodeDelimited(binaryReply);
                if (Config.logging.station_queries) {
                    console.log("query success", decoded);
                }
                return decoded;
            },
            err => {
                console.log("query error", err);
            }
        );
    }

    fixupStatus(reply) {
        // NOTE deepmerge ruins deviceId.
        if (reply.status && reply.status.identity) {
            reply.status.identity.deviceId = new Buffer.from(reply.status.identity.deviceId).toString("hex");
        }
        return deepmerge.all([MandatoryStatus, reply]);
    }
}
