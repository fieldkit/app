import _ from "lodash";
// import Services from "@/services/singleton";

import { TaskWorker } from "./tasks";
// import { SaveReadingsTask } from "./database";
// import { ProcessAllStationsTask, ProcessStationFilesTask } from "./process";
// import { createAdaptedDataServices } from "./data-services";

require("globals"); // eslint-disable-line

try {
    console.log(`worker:starting`);

    // eslint-disable-next-line
    const context: Worker = self as any;

    const services = () => {
        throw new Error();
    };

    // const services = createAdaptedDataServices(Services);
    const taskWorker = new TaskWorker(context, services, {
        // ProcessAllStationsTask,
        // ProcessStationFilesTask,
        // SaveReadingsTask,
    });

    context.onmessage = (message) => {
        taskWorker.message(message);
    };

    context.onerror = (error) => {
        return taskWorker.error(error);
    };

    console.log(`worker:started`);
} catch (error) {
    console.log(`worker:error: ${JSON.stringify(error)}`);
}
