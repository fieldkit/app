import _ from "lodash";
import Vue from "vue";
import Bluebird from "bluebird";
import moment from "moment";
import { Trace, knownFolders } from "@nativescript/core";
import { firebase } from "@nativescript/firebase";
import { crashlytics } from "@nativescript/firebase/crashlytics";
import { analytics } from "@nativescript/firebase/analytics";
import { AuthenticationError, QueryThrottledError } from "./errors";
import { File } from "./fs";
// import { Zone } from "zone.js/dist/zone";
import { getTaskId } from "@/lib/zoning";

const SaveInterval = 10000;
const logs: string[][] = [];
const originalConsole = {
    log: console.log,
};
const MaximumLogSize = 1024 * 1024 * 5;

function getPrettyTime() {
    return moment().format();
}

function getLogsFile(): File {
    return knownFolders.documents().getFolder("diagnostics").getFile("logs.txt");
}

export async function truncateLogs(): Promise<void> {
    await getLogsFile().remove();
    logs.length = 0; // Empty logs.
}

function getExistingLogs(file: File): string {
    if (file.size < MaximumLogSize) {
        return file.readTextSync() || "";
    }
    return "";
}

function flush(): Promise<void> {
    const appending = _(logs)
        .map((log) => {
            return scrubMessage(_(log).join(" ")).trim() + "\n";
        })
        .join("");

    logs.length = 0; // Empty logs.

    return new Promise((resolve, reject) => {
        const file = getLogsFile();
        const existing = getExistingLogs(file);
        const replacing = (existing + "\n" + appending + "\n").replace(/\n+/, "\n");

        file.writeTextSync(replacing, (err) => {
            if (err) {
                reject(err);
            }
        });

        resolve();
    });
}

export async function copyLogs(where: File): Promise<void> {
    return await flush().then(() => {
        return new Promise((resolve, reject) => {
            const file = getLogsFile();
            const existing = file.readTextSync();

            where.writeTextSync(existing, (err) => {
                if (err) {
                    reject(err);
                }
            });

            resolve();
        });
    });
}

function configureGlobalErrorHandling(): void {
    try {
        Trace.setErrorHandler({
            handlerError(err) {
                void analytics.logEvent({
                    key: "app_error",
                });
                console.log("error", err, err ? err.stack : null);
            },
        });

        Trace.enable();

        Bluebird.onPossiblyUnhandledRejection((reason: Error, _promise: Promise<unknown>) => {
            if (reason instanceof AuthenticationError) {
                console.log("onPossiblyUnhandledRejection", reason);
            } else if (reason instanceof QueryThrottledError) {
                console.log("onPossiblyUnhandledRejection", reason);
            } else {
                if (/Animation cancelled/.test(reason.message)) {
                    console.log("onPossiblyUnhandledRejection", reason);
                } else {
                    console.log("onPossiblyUnhandledRejection", reason, reason ? reason.stack : null);
                }
            }
        });

        /*
        Promise.onUnhandledRejectionHandled((promise: Promise<any>) => {
            console.log("onUnhandledRejectionHandled");
        });
		*/

        // err: error trace
        // vm: component in which error occured
        // info: Vue specific error information such as lifecycle hooks, events etc.
        /*
        Vue.config.errorHandler = (err, vm, info) => {
            console.log("vuejs error:", err, err ? err.stack : null);
        };
		*/

        Vue.config.warnHandler = (msg: string, _vm, _info) => {
            console.log("vuejs warning:", msg);
        };
    } catch (error) {
        if (error instanceof Error) {
            console.log("startup error", error, error ? error.stack : null);
        } else {
            console.log("startup error", error);
        }
    }
}

function scrubMessage(message: string): string {
    return message.replace(/Bearer [^\s"']+/, "<TOKEN>");
}

type LogFunc = (...args: unknown[]) => void;

function wrapLoggingMethod(method: string): void {
    const original = console[method] as LogFunc;
    console[method] = function () {
        try {
            const errors: Error[] = [];
            // eslint-disable-next-line
            const args: unknown[] = Array.prototype.slice.apply(arguments);
            const time = getPrettyTime();
            const taskId = getTaskId();

            // Prepend time to the unaltered arguments we were
            // given and just log those using the original, we do
            // this before the persisted logging cause that may
            // throw errors and this helps fix them.
            args.unshift(taskId);
            args.unshift(time);
            if (original.apply) {
                original.apply(console, args);
            } else {
                original(args.join(" ")); // IE
            }

            // This takes args and gets good string representations
            // for them, filling up the parts arary, beginning with
            // the time.
            const parts: string[] = [];
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg instanceof Error) {
                    parts.push(arg.message);
                    if (arg.stack) parts.push(arg.stack);
                    errors.push(arg);
                } else if (typeof arg === "string") {
                    parts.push(arg.trim());
                } else {
                    try {
                        parts.push(JSON.stringify(arg));
                    } catch (e) {
                        originalConsole.log("[logging error]", e);
                    }
                }
            }

            // Append to our global logs array.
            logs.push(parts.slice());

            // Send string only representations to Crashlytics,
            // removing time since they do that for us.
            parts.shift();
            try {
                crashlytics.log(scrubMessage(parts.join(" ")));
            } catch (e) {
                originalConsole.log("crashlytics", e);
            }

            /*
            errors.forEach((error) => {
                crashlytics.error(error);
            });
			*/
        } catch (e) {
            originalConsole.log(e);
        }
    };
}

async function initializeFirebase(): Promise<void> {
    console.log("initialize:firebase");
    await firebase
        .init({
            crashlyticsCollectionEnabled: true,
        })
        .then((response) => {
            // eslint-disable-next-line
            const globalAny: any = global;
            // eslint-disable-next-line
            crashlytics.setString("env", globalAny.TNS_ENV);
            console.log("firebase:initialized", response);
            return Promise.resolve(true);
        })
        .catch((error) => {
            console.log("firebase:error", error);
            return Promise.resolve();
        });
}

async function initialize(): Promise<void> {
    // NOTE: http://tobyho.com/2012/07/27/taking-over-console-log/
    const globalAny: any = global; // eslint-disable-line
    // eslint-disable-next-line
    if (globalAny.TNS_ENV === "test") {
        return;
    }

    await initializeFirebase();

    const methods = ["log", "warn", "error"];
    for (let i = 0; i < methods.length; i++) {
        wrapLoggingMethod(methods[i]);
    }

    setInterval((): void => {
        void flush();
    }, SaveInterval);

    configureGlobalErrorHandling();

    return;
}

export function initializeLogging(): Promise<void> {
    return initialize();
}
