import _ from "lodash";
import Config from "@/config";
import { onlyAllowEvery } from "@/utilities";
import { FirmwareTableRow } from "@/store";
import { FirmwareResponse, Services } from "@/services";

const log = Config.logger("StationFirmware");

export type TransferProgress = { progress: number };

type ProgressCallback = (tp: TransferProgress) => void;

const NoopProgress: ProgressCallback = (/* { progress: number } */): void => {
    // NOOP
};

function transformProgress(callback: ProgressCallback, fn: (v: number) => number) {
    if (_.isFunction(callback)) {
        return (total: number, copied: number /*, info: never*/) => {
            callback({
                progress: fn((copied / total) * 100.0),
            });
        };
    }
    return () => {
        // NOOP
    };
}

export default class StationFirmware {
    private services: Services;
    public check: () => Promise<void>;

    constructor(services: Services) {
        this.services = services;
        this.check = onlyAllowEvery(
            60,
            () => {
                console.log("firmware check: allowed");
                return this.downloadFirmware(() => {
                    // NOOP
                }, false).catch((error) => {
                    console.log("firmware error", error);
                });
            },
            () => {
                console.log("firmware check: throttled");
                return true;
            }
        );
    }

    public downloadFirmware(progressCallback: ProgressCallback = NoopProgress, force = false): Promise<void> {
        log.info("downloading firmware");
        return this.services
            .PortalInterface()
            .listFirmware("fk-core")
            .then((firmware) => {
                log.info(
                    "firmwares",
                    _.map(firmware.firmwares, (fw) => fw.id)
                );
                return firmware.firmwares.map((f) => {
                    const local = this.services.FileSystem().getFolder("firmware").getFile(`fk-bundled-fkb-${f.id}.bin`);
                    log.verbose("local", local);
                    return _.extend(f, {
                        path: local.path,
                    });
                });
            })
            .then((firmwares) => {
                if (!firmwares || firmwares.length == 0) {
                    log.info("no firmware to download");
                    return;
                }

                return this.services
                    .Database()
                    .addOrUpdateFirmware(firmwares[0])
                    .then(() => {
                        const local = this.services.FileSystem().getFile(firmwares[0].path);
                        if (!local.exists || local.size == 0 || force === true) {
                            log.info("downloading", firmwares[0]);

                            const downloadProgress = transformProgress(progressCallback, (p) => p);

                            return this.services
                                .PortalInterface()
                                .downloadFirmware(firmwares[0].url, firmwares[0].path, downloadProgress)
                                .catch((err) => {
                                    log.error("downloading error:", err);
                                })
                                .then(() => {
                                    return firmwares[0];
                                });
                        }

                        log.info("already have", firmwares[0]);

                        return this.deleteOldFirmware().then(() => {
                            return firmwares[0];
                        });
                    })
                    .then(() => {
                        return firmwares;
                    });
            })
            .then((firmwares) => {
                const ids = _(firmwares).map("id").value();
                return this.services
                    .Database()
                    .deleteAllFirmwareExceptIds(ids)
                    .then((deleted: FirmwareTableRow[]) => {
                        console.log("deleted", deleted);
                        return Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
                    });
            })
            .then(() => Promise.resolve());
    }

    private async deleteFirmware(fw: { path: string }): Promise<void> {
        const local = this.services.FileSystem().getFile(fw.path);
        if (local && local.exists) {
            log.info("removing", fw.path, local.exists, local.size);
            await local.remove();
        }
    }

    private async deleteOldFirmware(): Promise<void> {
        await this.services
            .Database()
            .getAllFirmware()
            .then((firmware) => {
                return _(firmware)
                    .tail()
                    .map((fw) => this.deleteFirmware(fw))
                    .value();
            })
            .then(() => Promise.resolve());
    }

    public async cleanupFirmware(): Promise<void> {
        const firmware = await this.services.Database().getAllFirmware();
        const keeping: number[] = [];

        for (const fw of firmware) {
            const local = this.services.FileSystem().getFile(fw.path);
            if (local && local.exists && local.size > 0) {
                log.info("keeping", fw.path, local.exists, local.size);
                keeping.push(fw.id);
            } else {
                log.info("deleting", fw.path, local.exists, local.size);
            }
        }

        await this.services
            .Database()
            .deleteAllFirmwareExceptIds(keeping)
            .then((deleted) => {
                log.info("deleted", deleted);
                return Promise.all(deleted.map((fw) => this.deleteFirmware(fw)));
            });
    }

    public upgradeStation(url: string, progressCallback: ProgressCallback): Promise<FirmwareResponse> {
        log.info("upgrade", url);

        return this.haveFirmware().then((yes: boolean) => {
            if (!yes) {
                return Promise.reject(new Error("missingFirmware"));
            }
            return this.services
                .Database()
                .getLatestFirmware()
                .then((firmware) => {
                    if (!firmware) {
                        log.info("no firmware");
                        return { error: true };
                    }
                    log.info("firmware", firmware);
                    const uploadProgress = transformProgress(progressCallback, (p) => p);
                    return this.services.QueryStation().uploadFirmware(url, firmware.path, uploadProgress);
                });
        });
    }

    public haveFirmware(): Promise<boolean> {
        return this.services
            .Database()
            .getLatestFirmware()
            .then((firmware) => {
                if (!firmware) {
                    return false;
                }
                log.info("firmware", firmware, firmware.path);
                const local = this.services.FileSystem().getFile(firmware.path);
                if (!local.exists || local.size == 0) {
                    log.info("firmware", local.exists, local.size, firmware.path);
                    return false;
                }
                return true;
            });
    }
}
