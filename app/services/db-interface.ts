import _ from "lodash";
import Config from "@/config";
import Settings from "@/settings";
import { sqliteToJs } from "@/utilities";
import { Database } from "@/wrappers/sqlite";
import { Download, FileTypeUtils, Station, Module, Stream } from "@/store/types";
import {
    AccountsTableRow,
    DownloadTableRow,
    NotesTableRow,
    NotificationsTableRow,
    StationTableRow,
    PortalConfigTableRow,
    StationAddressRow,
    FirmwareTableRow,
    StreamTableRow,
    SensorTableRow,
    ModuleTableRow,
} from "@/store/row-types";
import { Services } from "@/services";
import { Notification } from "~/store/modules/notifications";

const log = Config.logger("DbInterface");

export interface UserAccount {
    name: string;
    email: string;
    portalId: string;
    token: string;
    usedAt: Date | null;
}

export default class DatabaseInterface {
    constructor(private readonly services: Services) {}

    private getDatabase(): Promise<Database> {
        return this.services.CreateDb().getDatabase();
    }

    public getAll(): Promise<StationTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM stations"))
            .then((rows) => sqliteToJs(rows))
            .catch((err) => Promise.reject(new Error(`error fetching stations: ${err}`)));
    }

    public getModuleAll(): Promise<ModuleTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM modules ORDER BY station_id"))
            .then((rows) => sqliteToJs(rows));
    }

    public getSensorAll(): Promise<SensorTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM sensors ORDER BY module_id"))
            .then((rows) => sqliteToJs(rows));
    }

    public getStreamAll(): Promise<StreamTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM streams ORDER BY station_id"))
            .then((rows) => sqliteToJs(rows));
    }

    public getDownloadAll(): Promise<DownloadTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM downloads ORDER BY station_id"))
            .then((rows) => sqliteToJs(rows));
    }

    public removeNullIdModules(): Promise<void> {
        return this.getDatabase().then((db) => db.execute("DELETE FROM modules WHERE device_id IS NULL"));
    }

    public getAvailablePortalEnvs(): Promise<PortalConfigTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM config"))
            .then((rows) => sqliteToJs(rows));
    }

    public updatePortalEnv(row: PortalConfigTableRow): Promise<void> {
        return this.getDatabase().then((db) =>
            this.getAvailablePortalEnvs().then((envs) => {
                const addRow = (): Promise<void> => {
                    return db.execute("INSERT INTO config (base_uri, ingestion_uri) VALUES (?, ?)", [row.baseUri, row.ingestionUri]);
                };

                if (envs.length > 1) {
                    return db.execute("DELETE FROM config").then(() => {
                        return addRow();
                    });
                }
                if (envs.length == 0) {
                    return addRow();
                }
                return db.execute("UPDATE config SET base_uri = ?, ingestion_uri = ?", [row.baseUri, row.ingestionUri]);
            })
        );
    }

    public setStationPortalId(station: { id: number; portalId: null | number }): Promise<void> {
        if (!station.portalId) {
            console.log(`no portal id`);
            return Promise.reject(new Error(`no portal id`));
        }
        return this.getDatabase()
            .then((db) =>
                db.execute("UPDATE stations SET portal_id = ?, updated = ? WHERE id = ?", [station.portalId, new Date(), station.id])
            )
            .catch((error) => {
                console.log(`error setting portal id ${error}`);
                throw new Error(`error setting portal id ${error}`);
            });
    }

    public setStationPortalError(station: { id: number }, error: any): Promise<void> {
        return this.getDatabase()
            .then((db) =>
                db.execute("UPDATE stations SET portal_http_error = ?, portal_updated = ?, updated = ? WHERE id = ?", [
                    JSON.stringify(error),
                    new Date(),
                    new Date(),
                    station.id,
                ])
            )
            .catch((error) => {
                console.log(`error setting portal error ${error}`);
                throw new Error(`error setting portal error ${error}`);
            });
    }

    private updateStation(station: Station): Promise<void> {
        if (!station.id) {
            return Promise.reject(new Error(`no station id in update station`));
        }

        // For the time being, need to not update the fields that are being set individually,
        // as they get overwritten with null if we do. Those include:
        // station.locationName,
        // station.studyObjective,
        // station.locationPurpose,
        // station.siteCriteria,
        // station.siteDescription,
        // station.percentComplete,

        const values = [
            false, // TODO remove station.connected,
            station.generationId,
            station.name,
            "", // TODO remove URL
            station.portalId,
            "", // TODO remove status
            station.deployStartTime,
            station.batteryLevel,
            station.consumedMemory,
            station.totalMemory,
            0, // TODO remove consumedMemoryPercent
            JSON.stringify(station.schedules),
            "", // TODO remove JSON.stringify(station.statusJson),
            station.longitude,
            station.latitude,
            station.serializedStatus,
            new Date(),
            station.lastSeen,
            station.id,
        ];
        return this.getDatabase().then((db) =>
            db.execute(
                `
					UPDATE stations SET connected = ?, generation_id = ?, name = ?, url = ?, portal_id = ?, status = ?,
						   deploy_start_time = ?, battery_level = ?, consumed_memory = ?, total_memory = ?, consumed_memory_percent = ?,
						   schedules = ?, status_json = ?, longitude = ?, latitude = ?, serialized_status = ?, updated = ?, last_seen = ?
					WHERE id = ?`,
                values
            )
        );
    }

    private getModulePrimaryKey(deviceId: string): Promise<number> {
        if (_.isString(deviceId)) {
            return this.getDatabase().then((db) =>
                db.query("SELECT id FROM modules WHERE device_id = ? ORDER BY id DESC", [deviceId]).then((rows) => {
                    if (rows.length == 0) {
                        return Promise.reject(new Error(`no such module: ${deviceId} ${rows.length}`));
                    }
                    if (rows.length > 1) {
                        const keeping = rows[0];
                        console.log(`deleting duplicate modules ${deviceId} ${rows.length}`);
                        return db
                            .query("DELETE FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE device_id = ? AND id != ?)", [
                                deviceId,
                                keeping,
                            ])
                            .then(() => {
                                return db.query("DELETE FROM modules WHERE device_id = ? AND id != ?", [deviceId, keeping]).then(() => {
                                    return keeping;
                                });
                            });
                    }
                    return rows[0].id;
                })
            );
        }
        return Promise.resolve(deviceId);
    }

    private insertSensor(sensor): Promise<void> {
        return this.getDatabase().then((db) =>
            this.getModulePrimaryKey(sensor.moduleId).then((modulePrimaryKey) =>
                db
                    .execute("INSERT INTO sensors (module_id, name, unit, frequency, current_reading) VALUES (?, ?, ?, ?, ?)", [
                        modulePrimaryKey,
                        sensor.name,
                        sensor.unitOfMeasure,
                        sensor.frequency,
                        sensor.currentReading | sensor.reading,
                    ])
                    .catch((err) => Promise.reject(new Error(`error inserting sensor: ${err}`)))
            )
        );
    }

    private insertModule(module): Promise<void> {
        // Note: device_id is the module's unique hardware id (not the station's)
        const values = [
            module.moduleId || module.deviceId,
            module.deviceId || module.moduleId,
            module.name,
            module.interval || 0,
            module.position,
            module.stationId,
            module.flags || 0,
            module.status ? JSON.stringify(module.status) : "",
        ];
        return this.getDatabase().then((db) =>
            db
                .execute(
                    "INSERT INTO modules (module_id, device_id, name, interval, position, station_id, flags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    values
                )
                .catch((err) => {
                    console.log(`error inserting module: ${err}`);
                    console.log(values);
                    return Promise.reject(new Error(`error inserting module: ${err}`));
                })
        );
    }

    private synchronizeSensors(db: Database, moduleId: string, module: Module, sensorRows: SensorTableRow[]): Promise<void> {
        // TODO: include position?
        const incoming = _.keyBy(module.sensors, (s) => s.name);
        const existing = _.keyBy(sensorRows, (s) => s.name);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize sensors", adding, removed, keeping);

        function getTrend(name: string): number {
            if (!existing[name] || !incoming[name] || !existing[name].currentReading || !incoming[name].reading) {
                return 0;
            }
            const previous = Math.round(existing[name].currentReading! * 10) / 10;
            const current = Math.round(incoming[name].reading! * 10) / 10;
            return current == previous ? 0 : current > previous ? 1 : -1;
        }

        return Promise.all([
            Promise.all(
                adding.map((name) =>
                    this.insertSensor(
                        _.merge(
                            {
                                moduleId: module.moduleId,
                                deviceId: module.moduleId,
                            },
                            incoming[name]
                        )
                    )
                )
            ),
            Promise.all(removed.map((name) => db.query("DELETE FROM sensors WHERE id = ?", [existing[name].id]))),
            Promise.all(
                keeping
                    .map((name) => {
                        return {
                            id: existing[name].id,
                            reading: incoming[name].reading,
                            trend: getTrend(name),
                        };
                    })
                    .filter((update) => update.reading != null)
                    .map((update) =>
                        db.query("UPDATE sensors SET current_reading = ?, trend = ? WHERE id = ?", [
                            update.reading,
                            update.trend,
                            update.id,
                        ])
                    )
            ),
        ]).then(() => Promise.resolve());
    }

    private synchronizeModules(
        db: Database,
        stationId: number,
        station: Station,
        moduleRows: ModuleTableRow[],
        sensorRows: SensorTableRow[]
    ): Promise<void> {
        const incoming = _.keyBy(station.modules, (m) => m.moduleId);
        const existing = _.keyBy(moduleRows, (m) => m.moduleId); // || deviceId
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize modules", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(
                adding.map((moduleId) =>
                    this.insertModule(_.extend({ stationId: stationId }, incoming[moduleId])).then(() =>
                        this.synchronizeSensors(db, moduleId, incoming[moduleId], [])
                    )
                )
            ),
            Promise.all(
                removed.map((moduleId) =>
                    db
                        .execute("DELETE FROM sensors WHERE module_id = ?", [existing[moduleId].id])
                        .then(() => db.execute("DELETE FROM modules WHERE id = ?", [existing[moduleId].id]))
                )
            ),
            Promise.all(
                keeping.map((moduleId) => {
                    const status = incoming[moduleId].status ? JSON.stringify(incoming[moduleId].status) : "";
                    const values = [incoming[moduleId].flags || 0, status, existing[moduleId].id];
                    return db.execute("UPDATE modules SET flags = ?, status = ? WHERE id = ?", values).then(() => {
                        const moduleSensorRows = sensorRows.filter((r) => r.moduleId == existing[moduleId].id);
                        return this.synchronizeSensors(db, moduleId, incoming[moduleId], moduleSensorRows);
                    });
                })
            ),
        ]).then(() => Promise.resolve());
    }

    private insertStream(db: Database, stationId: number, stream: Stream): Promise<void> {
        // NOTE We're always created for the first time from a status
        // reply and these are the values we're guaranteed to get from
        // those, to avoid inserting NULLs, which the Android SQLITE
        // library seems to handle poorly?!
        const values = [
            stationId,
            stream.deviceId,
            stream.type,
            stream.deviceSize,
            stream.deviceFirstBlock,
            stream.deviceLastBlock,
            new Date(),
        ];
        return db.execute(
            `INSERT INTO streams (station_id, device_id, type, device_size, device_first_block, device_last_block, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            values
        );
    }

    public forgetUploads(): Promise<void> {
        return this.getDatabase()
            .then((db) => db.query("UPDATE streams SET portal_size = NULL, portal_first_block = NULL, portal_last_block = NULL"))
            .then(() => this.getDatabase())
            .then((db) => db.query("SELECT * FROM streams"))
            .then((rows) => sqliteToJs(rows))
            .then((rows) => console.log(rows))
            .then(() => Promise.resolve());
    }

    public forgetDownloads(): Promise<void> {
        return this.getDatabase().then((db) => db.execute("DELETE FROM streams"));
    }

    private updateStream(db: Database, streamId: number, stream: Stream): Promise<void> {
        const updates: Promise<void>[] = [];

        if (stream.deviceSize !== null && stream.deviceFirstBlock !== null && stream.deviceLastBlock !== null) {
            updates.push(
                db.execute(`UPDATE streams SET device_size = ?, device_first_block = ?, device_last_block = ?, updated = ? WHERE id = ?`, [
                    stream.deviceSize,
                    stream.deviceFirstBlock,
                    stream.deviceLastBlock,
                    stream.updated,
                    streamId,
                ])
            );
        }

        if (stream.downloadSize !== null && stream.downloadFirstBlock !== null && stream.downloadLastBlock !== null) {
            updates.push(
                db.execute(
                    `UPDATE streams SET download_size = ?, download_first_block = ?, download_last_block = ?, updated = ? WHERE id = ?`,
                    [stream.downloadSize, stream.downloadFirstBlock, stream.downloadLastBlock, stream.updated, streamId]
                )
            );
        }

        if (stream.portalSize !== null && stream.portalFirstBlock !== null && stream.portalLastBlock !== null) {
            updates.push(
                db.execute(`UPDATE streams SET portal_size = ?, portal_first_block = ?, portal_last_block = ?, updated = ? WHERE id = ?`, [
                    stream.portalSize,
                    stream.portalFirstBlock,
                    stream.portalLastBlock,
                    stream.updated,
                    streamId,
                ])
            );
        }

        return Promise.all(updates).then(() => Promise.resolve());
    }

    private synchronizeStreams(db: Database, stationId: number, station: Station, streamRows: StreamTableRow[]): Promise<void> {
        const incoming = _.keyBy(station.streams, (m) => m.type);
        const existing = _.keyBy(streamRows, (m) => m.type);
        const adding = _.difference(_.keys(incoming), _.keys(existing));
        const removed = _.difference(_.keys(existing), _.keys(incoming));
        const keeping = _.intersection(_.keys(existing), _.keys(incoming));

        log.verbose("synchronize streams", stationId, adding, removed, keeping);

        return Promise.all([
            Promise.all(adding.map((name) => this.insertStream(db, stationId, incoming[name]))),
            Promise.all(removed.map((name) => db.query("DELETE FROM streams WHERE id = ?", [existing[name].id]))),
            Promise.all(keeping.map((name) => this.updateStream(db, existing[name].id, incoming[name].keepingFrom(existing[name])))),
        ]).then(() => Promise.resolve());
    }

    private insertStation(newStation: Station): Promise<void> {
        return this.getDatabase().then((db) =>
            db
                .execute(
                    `
					INSERT INTO stations (device_id,
						generation_id, name, url, status,
						deploy_start_time, battery_level, consumed_memory, total_memory,
						consumed_memory_percent, schedules, status_json,
						longitude, latitude, serialized_status, updated, last_seen)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newStation.deviceId,
                        newStation.generationId,
                        newStation.name,
                        "", // TODO remove newStatus.url,
                        "", // TODO remove newStation.status,
                        newStation.deployStartTime,
                        newStation.batteryLevel,
                        newStation.consumedMemory,
                        newStation.totalMemory,
                        0, // TODO remove newStation.consumedMemoryPercent,
                        JSON.stringify(newStation.schedules),
                        "", // TODO remove JSON.stringify(statusJson),
                        newStation.longitude,
                        newStation.latitude,
                        newStation.serializedStatus,
                        new Date(),
                        newStation.lastSeen,
                    ]
                )
                .catch((err) => Promise.reject(new Error(`error inserting station: ${err}`)))
        );
    }

    public addOrUpdateStation(station: Station, url: string): Promise<void> {
        return this.getDatabase().then((db) => {
            return this.getStationIdByDeviceId(station.deviceId)
                .then((id: number | null) => {
                    if (id === null) {
                        return this.insertStation(station);
                    }
                    return this.updateStation(_.merge({}, station, { id: id }));
                })
                .then(() => this.getStationIdByDeviceId(station.deviceId))
                .then((stationId) => {
                    if (!stationId) throw new Error(`serious error adding station`);
                    return this.updateStationAddress(stationId, url).then(() => {
                        return stationId;
                    });
                })
                .then((stationId) => {
                    return Promise.all([
                        db.query("SELECT * FROM modules WHERE station_id = ?", [stationId]).then((r) => sqliteToJs(r)),
                        db
                            .query("SELECT * FROM sensors WHERE module_id IN (SELECT id FROM modules WHERE station_id = ?)", [stationId])
                            .then((r) => sqliteToJs(r)),
                        db.query("SELECT * FROM streams WHERE station_id = ?", [stationId]).then((r) => sqliteToJs(r)),
                    ]).then((all) => {
                        const moduleRows: ModuleTableRow[] = all[0];
                        const sensorRows: SensorTableRow[] = all[1];
                        const streamRows: StreamTableRow[] = all[2];
                        return this.synchronizeModules(db, stationId, station, moduleRows, sensorRows).then(() => {
                            return this.synchronizeStreams(db, stationId, station, streamRows);
                        });
                    });
                });
        });
    }

    private updateStationAddress(stationId: number, url: string): Promise<void> {
        return this.getDatabase()
            .then((db) => {
                return db
                    .query("SELECT * FROM station_addresses WHERE station_id = ?", [stationId])
                    .then((existing: StationAddressRow[]) => {
                        const byUrl = _.keyBy(existing, (e) => e.url);
                        if (byUrl[url]) {
                            const id = byUrl[url].id;
                            return db.query("UPDATE station_addresses SET url = ?, time = ? WHERE id = ?", [url, new Date(), id]);
                        } else {
                            return db.query("INSERT INTO station_addresses (station_id, time, url) VALUES (?, ?, ?)", [
                                stationId,
                                new Date(),
                                url,
                            ]);
                        }
                    });
            })
            .then(() => Promise.resolve());
    }

    public queryRecentlyActiveAddresses(): Promise<{ deviceId: string; url: string; time: string }[]> {
        return this.getDatabase().then((db) =>
            db
                .query(
                    "SELECT sa.url, s.device_id, time FROM station_addresses AS sa JOIN stations AS s ON (sa.station_id = s.id) ORDER BY sa.time DESC"
                )
                .then((rows) => sqliteToJs(rows))
                .then((rows) => {
                    return rows;
                })
        );
    }

    public insertDownload(download: DownloadTableRow): Promise<void> {
        return this.getDatabase().then((db) => {
            return db
                .execute(
                    `INSERT INTO downloads (station_id, device_id, generation, path, type, timestamp, url, size, blocks, first_block, last_block)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        download.stationId,
                        download.deviceId,
                        download.generation,
                        download.path,
                        download.type,
                        download.timestamp,
                        download.url,
                        download.size,
                        download.blocks,
                        download.firstBlock,
                        download.lastBlock,
                    ]
                )
                .then(() => {
                    const values = [
                        download.size,
                        download.firstBlock,
                        download.lastBlock,
                        download.lastBlock,
                        download.stationId,
                        download.type,
                    ];
                    console.log("downloaded", download.firstBlock, download.lastBlock);
                    return db.execute(
                        `UPDATE streams SET download_size = COALESCE(download_size, 0) + ?,
							                download_first_block = MIN(COALESCE(download_first_block, 0xffffffff), ?),
							                download_last_block = MAX(COALESCE(download_last_block, 0), ?),
							                device_last_block = MAX(COALESCE(device_last_block, 0), ?)
						 WHERE station_id = ? AND type = ?`,
                        values
                    );
                })
                .catch((err) => Promise.reject(new Error(`error inserting download: ${err}`)));
        });
    }

    public markDownloadAsUploaded(download: Download): Promise<void> {
        if (download.stationId === null || download.fileType === null) {
            console.log("malformed download row", download.stationId, download.fileType, download);
            throw new Error("malformed download row");
        }
        return this.getDatabase().then((db) => {
            return db.query("UPDATE downloads SET uploaded = ? WHERE id = ?", [new Date(), download.id]).then(() => {
                const values = [
                    download.size,
                    download.firstBlock,
                    download.lastBlock,
                    download.stationId,
                    FileTypeUtils.toString(download.fileType),
                ];
                return db.execute(
                    `UPDATE streams SET portal_size = COALESCE(portal_size, 0) + ?,
							            portal_first_block = MIN(COALESCE(portal_first_block, 0xffffffff), ?),
							            portal_last_block = MAX(COALESCE(portal_last_block, 0), ?)
					 WHERE station_id = ? AND type = ?`,
                    values
                );
            });
        });
    }

    private getStationIdByDeviceId(deviceId: string): Promise<number | null> {
        if (!deviceId) {
            return Promise.reject(new Error(`invalid device id`));
        }
        return this.getDatabase()
            .then((db) => db.query("SELECT id FROM stations WHERE device_id = ?", [deviceId]))
            .then((rows) => {
                if (rows.length != 1) {
                    return null;
                }
                return rows[0].id;
            });
    }

    // Firwmare

    public getAllFirmware(): Promise<FirmwareTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM firmware ORDER BY time DESC"))
            .then((rows) => sqliteToJs(rows));
    }

    public getLatestFirmware(): Promise<FirmwareTableRow | null> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM firmware ORDER BY time DESC LIMIT 1"))
            .then((rows) => sqliteToJs(rows))
            .then((all) => {
                if (all.length == 0) {
                    return null;
                }
                return all[0];
            });
    }

    public deleteAllFirmwareExceptIds(ids: number[]): Promise<FirmwareTableRow[]> {
        const values = _.range(ids.length)
            .map(() => "?")
            .join(",");
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM firmware WHERE id NOT IN (" + values + ")", ids))
            .then((data) => {
                return this.getDatabase()
                    .then((db) => db.execute("DELETE FROM firmware WHERE id NOT IN (" + values + ")", ids))
                    .then(() => {
                        return data;
                    });
            });
    }

    public addOrUpdateFirmware(firmware: FirmwareTableRow): Promise<void> {
        return this.getDatabase()
            .then((db) => db.query("SELECT id FROM firmware WHERE id = ?", [firmware.id]))
            .then((id) => {
                if (id.length === 1) {
                    return Promise.resolve(id[0]);
                }
                const values = [
                    firmware.id,
                    firmware.time,
                    firmware.url,
                    firmware.module,
                    firmware.profile,
                    firmware.etag,
                    firmware.path,
                    firmware.meta,
                    firmware.buildTime,
                    firmware.buildNumber,
                ];
                return this.getDatabase().then((db) =>
                    db.execute(
                        `INSERT INTO firmware (id, time, url, module, profile, etag, path, meta, build_time, build_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        values
                    )
                );
            });
    }

    public addOrUpdateNotes(notes: { stationId: number }): Promise<void> {
        function serializeNotesJson(notes): string {
            try {
                return JSON.stringify(notes);
            } catch (err) {
                log.error(`error serializing notes JSON: ${err}`);
                throw new Error(`error serializing notes JSON: ${err}`);
            }
        }

        return this.getDatabase()
            .then((db) =>
                db.query(`SELECT id FROM notes WHERE station_id = ?`, [notes.stationId]).then((maybeId) => {
                    const json = serializeNotesJson(notes);
                    if (maybeId.length == 0) {
                        const values = [notes.stationId, new Date(), new Date(), json];
                        return db.execute(`INSERT INTO notes (station_id, created_at, updated_at, notes) VALUES (?, ?, ?, ?)`, values);
                    }
                    const values = [new Date(), json, maybeId[0].id];
                    return db.execute(`UPDATE notes SET updated_at = ?, notes = ? WHERE id = ?`, values);
                })
            )
            .then(() => Promise.resolve())
            .catch((err) => Promise.reject(new Error(`error fetching notes: ${err}`)));
    }

    public getAllNotes(): Promise<NotesTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM notes"))
            .then((rows) => sqliteToJs(rows))
            .then((rows) =>
                rows.map((row) => {
                    try {
                        row.notesObject = JSON.parse(row.notes);
                        return row;
                    } catch (err) {
                        log.error(`error deserializing notes JSON: ${err}`);
                        log.error(`JSON: ${row.notes}`);
                    }
                    return row;
                })
            )
            .catch((err) => Promise.reject(new Error(`error fetching notes: ${err}`)));
    }

    public checkSettings(): Promise<void> {
        return this.getSettings().then((result) => {
            if (result.length == 0) {
                console.log("settings: initializing", Settings);
                return this.insertSettings(Settings);
            } else {
                console.log("existing settings: ", result[0]);
                return;
            }
        });
    }

    public getSettings(): Promise<{ settingsObject: any }[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM settings LIMIT 1"))
            .then((rows) => sqliteToJs(rows))
            .then((rows) =>
                rows.map((row) => {
                    try {
                        row.settingsObject = JSON.parse(row.settings);
                        return row;
                    } catch (err) {
                        log.error(`error deserializing notes JSON: ${err}`);
                        log.error(`JSON: ${row.settings}`);
                    }
                    return row;
                })
            )
            .catch((err) => Promise.reject(new Error(`error fetching settings: ${err}`)));
    }

    public insertSettings(settings: any): Promise<void> {
        return this.getDatabase()
            .then((db) =>
                db.execute("INSERT INTO settings (created_at, updated_at,settings) VALUES (?, ?, ?)", [
                    new Date(),
                    new Date(),
                    JSON.stringify(settings),
                ])
            )
            .catch((error) => {
                console.log(`error inserting settings: ${error}`);
                throw new Error(`error inserting settings: ${error}`);
            });
    }

    public updateSettings(settings: any): Promise<void> {
        return this.getDatabase()
            .then((db) => db.execute("UPDATE settings SET settings = ?", [JSON.stringify(settings)]))
            .catch((error) => {
                console.log(`error updating settings: ${error}`);
                throw new Error(`error updating settings: ${error}`);
            });
    }

    public getAllAccounts(): Promise<AccountsTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM accounts"))
            .then((rows) => sqliteToJs(rows))
            .catch((err) => Promise.reject(new Error(`error fetching accounts: ${err}`)));
    }

    public addOrUpdateAccounts(account: UserAccount): Promise<void> {
        console.log("addOrUpdateAccounts", account);
        return this.getDatabase()
            .then((db) =>
                db.query(`SELECT id FROM accounts WHERE email = ?`, [account.email]).then((maybeId) => {
                    if (maybeId.length == 0) {
                        const values = [account.name, account.email, account.portalId, account.token, new Date()];
                        return db.execute(`INSERT INTO accounts (name, email, portal_id, token, used_at) VALUES (?, ?, ?, ?, ?)`, values);
                    }
                    const values = [account.name, account.email, account.portalId, account.token, new Date(), maybeId[0].id];
                    return db.execute(
                        `UPDATE accounts SET name = ?, email = ?, portal_id = ?, token = ?, used_at = ? WHERE id = ?`,
                        values
                    );
                })
            )
            .then(() => Promise.resolve())
            .catch((err) => Promise.reject(new Error(`error fetching accounts: ${err}`)));
    }

    public deleteAllAccounts(): Promise<AccountsTableRow[]> {
        return this.getDatabase().then((db) => db.query(`DELETE FROM accounts`));
    }

    public getAllNotifications(): Promise<NotificationsTableRow[]> {
        return this.getDatabase()
            .then((db) => db.query("SELECT * FROM notifications"))
            .then((rows) => sqliteToJs(rows))
            .then((rows) =>
                rows.map((row) => {
                    try {
                        return {
                            ...row,
                            silenced: row.silenced === "true" ? true : false,
                            project: JSON.parse(row.project),
                            user: JSON.parse(row.user),
                            station: JSON.parse(row.station),
                        };
                    } catch (err) {
                        log.error(`error deserializing notifications JSON: ${err}`);
                        log.error(`JSON: ${row}`);
                    }
                    return row;
                })
            )
            .catch((err) => Promise.reject(new Error(`error fetching notifications: ${err}`)));
    }

    public addNotification(notification: Notification): Promise<void> {
        console.log("addNotifications", notification);
        return this.getDatabase()
            .then((db) =>
                db.query(`SELECT id FROM notifications WHERE key = ?`, [notification.key]).then((maybeId) => {
                    if (maybeId.length == 0) {
                        const values = [
                            notification.key,
                            notification.kind,
                            Number(new Date()),
                            notification.silenced,
                            JSON.stringify(notification.project),
                            JSON.stringify(notification.user),
                            JSON.stringify(notification.station),
                            notification.actions,
                        ];
                        return db.execute(
                            `INSERT INTO notifications (key, kind, created, silenced, project, user, station, actions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            values
                        );
                    }
                    return;
                })
            )
            .then(() => Promise.resolve())
            .catch((err) => Promise.reject(new Error(`error adding notifications: ${err}`)));
    }

    public updateNotification(notification: Notification): Promise<void> {
        console.log("updateNotification", notification);
        return this.getDatabase()
            .then((db) =>
                db.query(`SELECT * FROM notifications WHERE key = ?`, [notification.key]).then((maybe) => {
                    if (maybe.length > 0) {
                        const dbValues = maybe[0];
                        const values = [
                            notification.key ?? dbValues.key,
                            notification.kind ?? dbValues.kind,
                            notification.silenced === true ? "true" : "false",
                            notification.dismissed_at ?? dbValues.dismissed_at,
                            notification.satisfied_at ?? dbValues.satisfied_at,
                            notification.project ? JSON.stringify(notification.project) : dbValues.project,
                            notification.user ? JSON.stringify(notification.user) : dbValues.user,
                            notification.station ? JSON.stringify(notification.station) : dbValues.station,
                            notification.actions ?? dbValues.actions,
                            notification.id,
                        ];

                        return db.execute(
                            `UPDATE notifications SET key = ?, kind = ?, silenced = ?, dismissed_at = ?, satisfied_at = ?, project = ?, user = ?, station = ?, actions = ? WHERE id = ?`,
                            values
                        );
                    }

                    return;
                })
            )
            .then(() => Promise.resolve())
            .catch((err) => Promise.reject(new Error(`error updating notifications: ${err}`)));
    }
}
