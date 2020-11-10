import fs from "fs";
import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services, ServicesImpl } from "@/services";
import { Database } from "@/wrappers/sqlite";
import { ActionTypes, Station, StationSyncStatus } from "@/store";

async function openDiscardingChanges(services: Services, path: string): Promise<Database> {
    const temporaryPath = "/tmp/fk.db";
    fs.copyFileSync(path, temporaryPath);
    return await services.CreateDb().initialize(temporaryPath, false, false);
}

describe("Replay", () => {
    it.skip("load replay database and replay station reply", async () => {
        expect.assertions(1);

        const services = new ServicesImpl();
        const path = "/home/jlewallen/fieldkit/mobile/app/tests/replay-cases/70125844-4747-4ed2-9f40-0c8efde65938.db";
        const db = await openDiscardingChanges(services, path);
        expect(db).toBeDefined();

        await db.execute(`PRAGMA foreign_keys = OFF`);
        await db.execute(`DELETE FROM stations WHERE id != 4`);

        const store = services.Store();
        await store.dispatch(ActionTypes.LOAD_STATIONS);

        console.log(`loaded: ${store.state.stations.all.length}`);

        for (const station of store.state.stations.all) {
            const statusReply = station.decodeStatusReply();
            if (false) {
                console.log(statusReply);
            }
        }

        console.log(_.map(store.state.syncing.stations, (s) => [s.id, s.name]));

        const syncs: { [index: number]: StationSyncStatus } = _.keyBy(store.state.syncing.syncs, (s) => s.id);
        const stations: { [index: number]: Station } = _.keyBy(store.state.syncing.stations, (s) => s.id!);

        (stations[4] as any).serializedStatus = null;

        console.log("station", JSON.stringify(stations[4], null, 2));
        console.log("sync", JSON.stringify(syncs[4], null, 2));
    });
});