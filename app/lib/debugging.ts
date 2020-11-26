import { isAndroid } from "@nativescript/core";
import Sqlite from "@/wrappers/sqlite";
import { Services } from "@/services";

export function downloadDatabase(services: Services, url: string): Promise<void> {
    if (true) {
        return Promise.resolve();
    }

    const progress = (total: number, copied: number, info) => {
        console.log("progress", total, copied);
    };

    const folder = services.FileSystem().getFolder(isAndroid ? "app" : "");
    const name = "fieldkit.sqlite3";
    const destination = folder.getFile(name);

    return services
        .Conservify()
        .download({
            method: "GET",
            url: url,
            path: destination.path,
            progress: progress,
        })
        .catch((error) => {
            console.log("error", error);
            return Promise.resolve();
        })
        .then((response) => {
            new Sqlite().copy(name);
        });
}
