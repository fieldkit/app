import _ from "lodash";

import DataSync from "../components/DataSyncView.vue";
import Login from "../components/LoginView.vue";

import StationDetail from "../components/StationDetailView.vue";
import StationListView from "../components/StationListView.vue";
import StationSettings from "../components/settings/StationSettingsView.vue";
import StationSettingsWiFiNetworks from "../components/settings/StationSettingsWiFiNetwork.vue";
import StationSettingsWiFiSchedule from "../components/settings/StationSettingsWiFiSchedule.vue";
import StationSettingsFirmware from "../components/settings/StationSettingsFirmware.vue";
import Calibrate from "../calibration/Calibrate.vue";

import AssembleStation from "../components/onboarding/AssembleStationView.vue";
import OnboardingStartView from "../components/onboarding/Start.vue";
import OnboardingSearchingView from "../components/onboarding/Searching.vue";
import OnboardingNearbyStationsView from "../components/onboarding/NearbyStations.vue";
import SearchFailedView from "../components/onboarding/SearchFailed.vue";
import OnboardingNetwork from "../components/onboarding/Network.vue";
import RenameStation from "../components/onboarding/RenameStation.vue";
import Recalibrate from "../components/onboarding/Recalibrate.vue";
import OnboardingReconnecting from "../components/onboarding/Reconnecting.vue";
import AddWifiNetwork from "../components/onboarding/AddWifi.vue";

import DeployMap from "../components/deploy/DeployMapView.vue";
import DeployNotes from "../components/deploy/DeployNotesView.vue";
import EditNoteView from "../components/deploy/EditNoteView.vue";
import DeployReview from "../components/deploy/DeployReviewView.vue";

import FlowView from "@/reader/FlowView.vue";

import AppSettings from "../components/app-settings/AppSettingsView.vue";
import AppSettingsData from "../components/app-settings/AppSettingsDataView.vue";
import AppSettingsNotifications from "../components/app-settings/AppSettingsNotificationsView.vue";
import AppSettingsPermissions from "~/components/app-settings/AppSettingsPermissionsView.vue";
import AppSettingsHelp from "~/components/app-settings/AppSettingsHelpView.vue";
import AppSettingsHelpAppVersion from "~/components/app-settings/AppSettingsHelpAppVersionView.vue";
import AppSettingsLegal from "~/components/app-settings/AppSettingsLegalView.vue";
import AppSettingsUnits from "~/components/app-settings/AppSettingsUnitsView.vue";
import AppSettingsAccount from "~/components/app-settings/AppSettingsAccountView.vue";
import AppSettingsAccountAdd from "~/components/app-settings/AppSettingsAccountAddView.vue";
import AppSettingsAppearance from "~/components/app-settings/AppSettingsAppearanceView.vue";
import AppSettingsAppearanceLanguage from "~/components/app-settings/AppSettingsAppearanceLanguageView.vue";
import AppSettingsAppearanceFontSize from "~/components/app-settings/AppSettingsAppearanceFontSizeView.vue";
import DeveloperMenu from "../components/app-settings/DeveloperMenuView.vue";

import AddModuleView from "~/components/onboarding/AddModuleView.vue";
import NotificationsView from "~/components/NotificationsView.vue";

import DeploymentLocation from "~/components/onboarding/DeploymentLocation.vue";
import DataSyncOnboarding from "~/components/onboarding/DataSync.vue";
import CompleteSettings from "~/components/onboarding/CompleteSettings.vue";

import TabbedLayout from "~/components/TabbedLayout.vue";

import { Route, RouteTable, FullRoute } from "./navigate";

const Frames = {
    Outer: "outer-frame",
    Stations: "stations-frame",
    Data: "data-frame",
    Settings: "settings-frame",
};

export const routes = {
    login: new Route(Login),
    tabbed: new Route(TabbedLayout),

    // Bottom navigation
    stations: new Route(StationListView, Frames.Stations),
    dataSync: new Route(DataSync, Frames.Data),
    appSettings: {
        list: new Route(AppSettings, Frames.Settings),
        data: new Route(AppSettingsData, Frames.Settings),
        units: new Route(AppSettingsUnits, Frames.Settings),
        notifications: new Route(AppSettingsNotifications, Frames.Settings),
        permissions: new Route(AppSettingsPermissions, Frames.Settings),
        account: new Route(AppSettingsAccount, Frames.Settings),
        accountAdd: new Route(AppSettingsAccountAdd, Frames.Settings),
        appearance: new Route(AppSettingsAppearance, Frames.Settings),
        appearanceFontSize: new Route(AppSettingsAppearanceFontSize, Frames.Settings),
        appearanceLanguage: new Route(AppSettingsAppearanceLanguage, Frames.Settings),
        help: new Route(AppSettingsHelp, Frames.Settings),
        helpAppVersion: new Route(AppSettingsHelpAppVersion, Frames.Settings),
        legal: new Route(AppSettingsLegal, Frames.Settings),
        developer: new Route(DeveloperMenu, Frames.Settings),
    },

    station: {
        detail: new Route(StationDetail, Frames.Stations),
        calibrate: new Route(Calibrate, Frames.Stations),
        settings: {
            menu: new Route(StationSettings, Frames.Stations),
            wifiSchedule: new Route(StationSettingsWiFiSchedule, Frames.Stations),
            wifiNetworks: new Route(StationSettingsWiFiNetworks, Frames.Stations),
            firmware: new Route(StationSettingsFirmware, Frames.Stations),
        },
    },

    // Onboarding
    onboarding: {
        assembleStation: new Route(AssembleStation, Frames.Stations),
        start: new Route(OnboardingStartView, Frames.Stations),
        searching: new Route(OnboardingSearchingView, Frames.Stations),
        nearby: new Route(OnboardingNearbyStationsView, Frames.Stations),
        searchFailed: new Route(SearchFailedView, Frames.Stations),
        network: new Route(OnboardingNetwork, Frames.Stations),
        addWifi: new Route(AddWifiNetwork, Frames.Stations),
        deploymentLocation: new Route(DeploymentLocation, Frames.Stations),
        dataSync: new Route(DataSyncOnboarding, Frames.Stations),
        rename: new Route(RenameStation, Frames.Stations),
        reconnecting: new Route(OnboardingReconnecting, Frames.Stations),
        recalibrate: new Route(Recalibrate, Frames.Stations),
        addModule: new Route(AddModuleView, Frames.Stations),
        completeSettings: new Route(CompleteSettings, Frames.Stations),
    },

    // Deployment
    deploy: {
        start: new Route(DeployMap, Frames.Stations),
        notes: new Route(DeployNotes, Frames.Stations),
        editing: new Route(EditNoteView, Frames.Stations),
        review: new Route(DeployReview, Frames.Stations),
    },

    // Reader
    reader: {
        flow: new Route(FlowView),
    },
    notifications: new Route(NotificationsView),
};

function inferNames(routes: RouteTable, prefix = ""): { [index: string]: Route } {
    const map: { [index: string]: Route } = {};
    for (const key of Object.keys(routes)) {
        const value = routes[key];
        if (value instanceof Route) {
            value.name = prefix + key;
            map[value.name] = value;
        } else {
            _.extend(map, inferNames(value, prefix + key + "/"));
        }
    }
    return map;
}

export const namedRoutes = inferNames(routes);

export const fullRoutes = {
    login: new FullRoute("login", Frames.Outer, {}),
    tabbed: new FullRoute("tabbed", Frames.Outer, {}),
    onboarding: {
        assemble: new FullRoute("tabbed", Frames.Outer, {
            firstTab: {
                index: 0,
                route: new FullRoute("onboarding/assembleStation", Frames.Stations, {}),
            },
        }),
        start: new FullRoute("tabbed", Frames.Outer, {
            firstTab: {
                index: 0,
                route: new FullRoute("onboarding/assembleStation", Frames.Stations, {}),
            },
        }),
    },
    stations: new FullRoute("tabbed", Frames.Outer, {
        firstTab: {
            index: 0,
            route: null,
        },
    }),
};
