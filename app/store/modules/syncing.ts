import _ from "lodash";
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { Station, Download, FileType, FileTypeUtils } from "../types";
import { Services, ServiceRef } from "./utilities";
import { GlobalGetters } from "./global";
import { serializePromiseChain, getPathTimestamp } from "../../utilities";
import { DownloadTableRow } from "../row-types";

export type HttpHeaders = { [index: string]: string };

export class TransferProgress {
    constructor(
        public readonly deviceId: string,
        public readonly path: string,
        public readonly total: number,
        public readonly copied: number
    ) {}

    get decimal(): number {
        return this.copied / this.total;
    }

    get percentage(): string {
        return (this.decimal * 100.0).toFixed(0) + "%";
    }
}

export class LocalFile {
    constructor(public readonly path: string, public readonly size: number) {}
}

export class PendingUpload {
    constructor(
        public readonly fileType: FileType,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number,
        public readonly files: LocalFile[] = [],
        public readonly progress: TransferProgress | null = null
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }
}

export class PendingDownload {
    constructor(
        public readonly fileType: FileType,
        public readonly url: string,
        public readonly path: string,
        public readonly firstBlock: number,
        public readonly lastBlock: number,
        public readonly bytes: number,
        public readonly progress: TransferProgress | null = null
    ) {}

    get blocks(): number {
        return this.lastBlock - this.firstBlock;
    }

    name(): string {
        return FileTypeUtils.toString(this.fileType) + ".fkpb";
    }
}

export class StationSyncStatus {
    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        private readonly generationId: string,
        public readonly name: string,
        public readonly connected: boolean,
        public readonly lastSeen: Date,
        public readonly time: Date,
        private readonly downloaded: number,
        private readonly uploaded: number,
        public readonly downloads: PendingDownload[] = [],
        public readonly uploads: PendingUpload[] = []
    ) {}

    private get data(): PendingDownload[] {
        return this.downloads.filter(file => file.fileType == FileType.Data);
    }

    get progress(): TransferProgress | null {
        return (
            this.downloads
                .filter(p => p.progress)
                .map(p => p.progress)
                .find(p => true) || null
        );
    }

    readingsReady(): number {
        return _.sum(this.data.map(f => f.blocks)) || 0;
    }

    readingsCopying(): number {
        return this.readingsReady();
    }

    readingsDownloaded(): number {
        return this.downloaded;
    }

    readingsUploaded(): number {
        return this.uploaded;
    }

    showReady(): boolean {
        return false;
    }

    showDownloading(): boolean {
        return this.downloads.filter(f => f.progress).length > 0;
    }

    showUploading(): boolean {
        return this.uploads.filter(f => f.progress).length > 0;
    }

    showHave(): boolean {
        return false;
    }

    getPathsToUpload(): string[] {
        return _(this.uploads)
            .map(u => u.files)
            .flatten()
            .map(f => f.path)
            .value();
    }

    makeRow(file: PendingDownload, headers: HttpHeaders): DownloadTableRow {
        delete headers["connection"];
        const { range, firstBlock, lastBlock } = parseBlocks(headers["fk-blocks"]);

        return {
            id: 0,
            stationId: this.id,
            deviceId: this.deviceId,
            generation: this.generationId,
            path: file.path,
            type: FileTypeUtils.toString(file.fileType),
            timestamp: this.time.getTime(),
            url: file.url,
            size: file.bytes,
            blocks: range,
            firstBlock: firstBlock,
            lastBlock: lastBlock,
            uploaded: null,
        };
    }
}

export class SyncingState {
    services: ServiceRef = new ServiceRef();
    stations: Station[] = [];
    clock: Date = new Date();
    progress: { [index: string]: TransferProgress } = {};
    downloads: { [index: string]: Download } = {};
}

type ActionParameters = { commit: any; dispatch: any; state: SyncingState };

const actions = {
    [ActionTypes.DOWNLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]) => {
        return Promise.all(syncs.map(dl => dispatch(ActionTypes.DOWNLOAD_STATION, dl)));
    },
    [ActionTypes.DOWNLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        return serializePromiseChain(sync.downloads, file => {
            if (true) {
                return state.services
                    .queryStation()
                    .download(file.url, file.path, (total, copied, info) => {
                        commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, file.path, total, copied));
                    })
                    .then(({ headers }) => state.services.db().insertDownload(sync.makeRow(file, headers)))
                    .catch(error => {
                        console.log("error downloading", error, error ? error.stack : null);
                        return Promise.reject(error);
                    });
            }
            return true;
        }).then(() => dispatch(ActionTypes.LOAD));
    },
    [ActionTypes.UPLOAD_ALL]: ({ commit, dispatch, state }: ActionParameters, syncs: StationSyncStatus[]) => {
        return Promise.all(syncs.map(dl => dispatch(ActionTypes.UPLOAD_STATION, dl)));
    },
    [ActionTypes.UPLOAD_STATION]: ({ commit, dispatch, state }: ActionParameters, sync: StationSyncStatus) => {
        const paths = sync.getPathsToUpload();
        const downloads = paths.map(path => state.downloads[path]).filter(d => d != null);
        if (downloads.length != paths.length) {
            throw new Error("download missing");
        }

        return serializePromiseChain(downloads, download => {
            return state.services
                .portal()
                .uploadPreviouslyDownloaded(sync.name, download, (total, copied, info) => {
                    commit(MutationTypes.TRANSFER_PROGRESS, new TransferProgress(sync.deviceId, download.path, total, copied));
                })
                .then(({ headers }) => state.services.db().markDownloadAsUploaded(download))
                .catch(error => {
                    console.log("error uploading", error, error ? error.stack : null);
                    return Promise.reject(error);
                });
        }).then(() => dispatch(ActionTypes.LOAD));
    },
};

const getters = {
    syncs: (state: SyncingState, _getters: never, rootState: never, rootGetters: GlobalGetters): StationSyncStatus[] => {
        return state.stations.map(station => {
            if (!station.id) {
                throw new Error("unexpected null station.id: " + station.name);
            }

            const available = rootGetters.availableStations.find(s => s.deviceId == station.deviceId);
            if (!available) {
                throw new Error("expected available station, missing");
            }
            const connected = available.connected;
            const lastSeen = station.lastSeen;
            const baseUrl = available.url || "";

            const downloads = station.streams
                .map(stream => {
                    const firstBlock = stream.downloadLastBlock || 0;
                    const lastBlock = stream.deviceLastBlock;
                    const estimatedBytes = stream.deviceSize - (stream.downloadSize || 0);
                    const typeName = FileTypeUtils.toString(stream.fileType());
                    const path = ["downloads", station.deviceId, getPathTimestamp(state.clock)].join("/");
                    const url = baseUrl + "/download/" + typeName + (firstBlock > 0 ? "?first=" + firstBlock : "");
                    const folder = state.services.fs().getFolder(path);
                    const file = folder.getFile(FileTypeUtils.toString(stream.fileType()) + ".fkpb");
                    const progress = state.progress[file.path];
                    return new PendingDownload(stream.fileType(), url, file.path, firstBlock, lastBlock, estimatedBytes, progress);
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });

            const uploads = station.streams
                .map(stream => {
                    const firstBlock = stream.portalLastBlock || 0;
                    const lastBlock = stream.downloadLastBlock || 0;
                    const estimatedBytes = (stream.downloadSize || 0) - (stream.portalSize || 0);
                    const files = station.downloads
                        .filter(d => d.fileType == stream.fileType())
                        .filter(d => !d.uploaded)
                        .map(d => new LocalFile(d.path, d.size));
                    return new PendingUpload(stream.fileType(), firstBlock, lastBlock, estimatedBytes, files, null);
                })
                .filter(dl => dl.firstBlock != dl.lastBlock)
                .filter(dl => dl.fileType != FileType.Unknown)
                .sort((a, b) => {
                    return a.fileType < b.fileType ? -1 : 1;
                });

            const downloaded = _.sum(station.streams.filter(s => s.fileType() == FileType.Data).map(s => s.downloadLastBlock));
            const uploaded = _.sum(station.streams.filter(s => s.fileType() == FileType.Data).map(s => s.portalLastBlock));

            return new StationSyncStatus(
                station.id,
                station.deviceId,
                station.generationId,
                station.name,
                connected,
                lastSeen,
                state.clock,
                downloaded || 0,
                uploaded || 0,
                downloads,
                uploads
            );
        });
    },
};

const mutations = {
    [MutationTypes.SERVICES]: (state: SyncingState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.STATIONS]: (state: SyncingState, stations: Station[]) => {
        Vue.set(state, "clock", new Date());
        Vue.set(state, "stations", stations);
        Vue.set(
            state,
            "downloads",
            _(stations)
                .map(s => s.downloads)
                .flatten()
                .keyBy(d => d.path)
                .value()
        );
    },
    [MutationTypes.TRANSFER_PROGRESS]: (state: SyncingState, progress: TransferProgress) => {
        Vue.set(state.progress, progress.path, progress);
    },
};

const state = () => new SyncingState();

export const syncing = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};

function parseBlocks(blocks) {
    if (Array.isArray(blocks)) {
        blocks = blocks[0];
    }

    if (!_.isString(blocks)) {
        throw new Error("Invalid fk-blocks header: " + blocks);
    }

    const parts = blocks
        .split(",")
        .map(s => s.trim())
        .map(s => Number(s));
    if (parts.length != 2) {
        throw new Error("Invalid fk-blocks header: " + blocks);
    }

    return {
        range: parts.join(","),
        firstBlock: parts[0],
        lastBlock: parts[1],
    };
}
