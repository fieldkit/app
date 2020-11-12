import _ from "lodash";
import { Device, Folder, File, knownFolders } from "@nativescript/core";
import { copyLogs } from "@/lib/logging";
import { DiagnosticsDirectory, getDatabasePath, listAllFiles, dumpAllFiles } from "@/lib/fs";
import { Services } from "@/services";
import Config, { Build } from "@/config";

function uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export type ProgressFunc = (progress: { id: string; message: string }) => void;

export type DeviceInformation = Record<string, unknown>;

export interface SavedDiagnostics {
    id: string;
    reference: { phrase: string };
}

export default class Diagnostics {
    private readonly baseUrl: string;

    constructor(private readonly services: Services) {
        this.baseUrl = "https://code.conservify.org/diagnostics";
    }

    private async prepare(progress: ProgressFunc): Promise<string> {
        const id = uuidv4();

        console.log(`diagnostics-prepare: ${id}`);

        progress({ id: id, message: `Creating bundle...` });

        const folder = this.getDiagnosticsFolder().getFolder(id);

        const info = this.gatherDeviceInformation();
        const deviceJson = folder.getFile("device.json");
        console.log(`diagnostics-prepare: writing ${deviceJson.path}`);
        deviceJson.writeTextSync(JSON.stringify(info), (err) => {
            if (err) {
                console.log(`write-error:`, err);
            }
        });

        await copyLogs(folder.getFile("logs.txt"));

        const databasePath = getDatabasePath("fieldkit.sqlite3");
        const databaseFile = File.fromPath(databasePath);
        console.log(`diagnostics-prepare: database: ${databaseFile.path} ${databaseFile.size}`);
        await this.services.Conservify().copyFile(databasePath, folder.getFile("fk.db").path);

        console.log(`diagnostics-bundle:`);

        await dumpAllFiles(folder.path, true);

        console.log(`diagnostics-prepare: ready`);

        return id;
    }

    public async upload(progress: ProgressFunc): Promise<SavedDiagnostics | void> {
        try {
            await dumpAllFiles(null, false);

            const id = await this.prepare(progress);

            console.log(`diagnostics-upload: ${id}`);

            progress({ id: id, message: `Uploading bundle...` });

            /*
            if (true) {
                return {
                    reference: { phrase: "DONE" },
                    id: id,
                };
            }
			*/

            await this.uploadDirectory(id);

            progress({ id: id, message: `Uploading JS...` });

            const reference = await this.uploadBundle(id);

            progress({ id: id, message: "Done!" });

            console.log(`diagnostics-done: ${reference.toString()}`);

            return {
                reference: JSON.parse(reference.toString()) as { phrase: string },
                id: id,
            };
        } catch (err) {
            console.log(`diagnostics error: ${err.message}`, err);
            return Promise.resolve();
        }
    }

    private gatherDeviceInformation(): DeviceInformation {
        const device = Device;

        const info = {
            deviceType: device.deviceType,
            language: device.language,
            manufacturer: device.manufacturer,
            model: device.model,
            os: device.os,
            osVersion: device.osVersion,
            region: device.region,
            sdkVersion: device.sdkVersion,
            uuid: device.uuid,
            config: Config,
            build: Build,
        };

        return info;
    }

    private async uploadDirectory(id: string): Promise<void> {
        const files = await this.getAllFiles(DiagnosticsDirectory + "/" + id, 0);
        console.log(`uploading-directory: ${JSON.stringify(files)}`);
        for (const path of files) {
            const relative = path.replace(DiagnosticsDirectory, "");
            console.log(`uploading: ${path} ${relative}`);
            await this.services
                .Conservify()
                .upload({
                    method: "POST",
                    url: this.baseUrl + relative,
                    path: path,
                })
                .then(() => File.fromPath(path).remove());
        }
    }

    /*
    private uploadDatabase(id: string): Promise<Buffer> {
        console.log("getting database path");
        const path = getDatabasePath("fieldkit.sqlite3");
        console.log("diagnostics", path);
        return this.services
            .Conservify()
            .upload({
                method: "POST",
                url: this.baseUrl + "/" + id + "/fk.db",
                path: path,
                uploadCopy: true,
            })
            .then((response) => response.body);
    }
	*/

    private uploadBundle(id: string): Promise<Buffer> {
        const path = knownFolders.documents().getFolder("app").getFile("bundle.js").path;
        return this.services
            .Conservify()
            .upload({
                method: "POST",
                url: this.baseUrl + "/" + id + "/bundle.js",
                path: path,
            })
            .then((response) => response.body);
    }

    private getAllFiles(path: string, minimumDepth: number): Promise<string[]> {
        return listAllFiles(path).then((files) => {
            return _(files)
                .filter((f) => f.depth >= minimumDepth)
                .map((f) => f.path)
                .value();
        });
    }

    private getDiagnosticsFolder(): Folder {
        return knownFolders.documents().getFolder(DiagnosticsDirectory);
    }
}
