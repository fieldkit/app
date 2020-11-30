import { analytics } from "@nativescript/firebase/analytics";
import { Services } from "@/services";
import { promiseAfter } from "@/utilities";
import { ActionTypes, OurStore } from "@/store";
import registerLifecycleEvents from "@/services/lifecycle";
// import { ProcessAllStationsTask } from "@/lib/process";

function updateStore(store: OurStore): void {
    void promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((error) => {
            console.log(`refresh:error: ${JSON.stringify(error)}`);
        })
        .finally(() => void updateStore(store));
}

function enableLocationServices(services: Services): void {
    // On iOS this can take a while, so we do this in the background.
    void services.PhoneLocation().enableAndGetLocation();
}

async function resumePortalSession(services: Services): Promise<void> {
    const store = services.Store();
    if (store.state.portal.currentUser) {
        await store.dispatch(ActionTypes.AUTHENTICATED);
    }
}

async function background(services: Services): Promise<void> {
    await resumePortalSession(services);

    await Promise.all([
        services.StationFirmware().cleanupFirmware(),
        enableLocationServices(services),
        services.DiscoverStation().startMonitorinNetwork(),
        updateStore(services.Store()),
        services.PortalUpdater().start(),
        // await services.Tasks().enqueue(new ProcessAllStationsTask()))
    ]);

    registerLifecycleEvents(() => services.DiscoverStation());
}

export async function initializeApplication(services: Services): Promise<void> {
    const started = new Date();

    try {
        await analytics.logEvent({ key: "app_open" });
    } catch (error) {
        console.log(`firebase:error: ${JSON.stringify(error)}`);
    }

    try {
        await services.CreateDb().initialize(null, false, false);
        await services.Database().startup();
        await services.Store().dispatch(ActionTypes.LOAD);

        console.log("startup:bg");

        void background(services);

        const now = new Date();
        const elapsed = now.getTime() - started.getTime();
        console.log("startup:started", elapsed);
    } catch (error) {
        console.log(`startup:error: ${JSON.stringify(error)}`);
    }
}