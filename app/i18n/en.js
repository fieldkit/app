// prettier-ignore
module.exports = {
    // Include module and sensor names
    ...require('./modules.en'),
    // AssembleStationView.vue
    notIncluded: "not included",
    welcome: "Welcome!",
    mobileAppIntro: "Our mobile app makes it easy to set up and deploy your FieldKit station.",
    getStarted: "Get Started",
    skipInstructions: "Skip instructions",
    assembleStation: "Assemble Station",
    haveEverything: "Do You Have Everything?",
    assembleStep1: "Check that you have all of the necessary parts to assemble your FieldKit.",
    assembleStep2: "Place your core board and radio board together.",
    assembleStep3: "Take the combined core board and radio board and attach it to the back plane.",
    assembleStep4: "Attach your individual modules to the back plane, then secure them with screws.",
    assembleStep5: "Take all of your attached components and place them inside the station enclosure. Secure the system down with screws.",
    assembleStep6: 'Attach the battery at the top of the radio board where it says "BATTERY."',
    assembleStep7: 'Insert the button cord to the radio board into the port labeled "BTN."',
    assembleStep8: "Plug in your micro USB cable to charge the station battery.",
    assembleStep9: 'Make sure that the switch is in the "On" position. Leave plugged in to charge for an hour.',
    assembleStep10: "Station Assembled",
    enclosure: "Enclosure",
    radioBoard: "Radio board",
    coreBoard: "Core board",
    backPlane: "Back plane",
    moduleParts: "Module(s)",
    battery: "battery",
    screws: "Screws",
    microCable: "Micro USB cable",
    screwdriver: "Screwdriver",
    // ConnectStationCheck.vue
    connecting: "Connecting",
    // ConnectStationError.vue
    havingProblems: "Having Problems Connecting?",
    problemStep1: "Press the WiFi button again",
    problemStep2: "Turn on station's WiFi access point directly from the station settings menu",
    problemStep3: "If you are still having trouble get help at our support and troubleshooting center",
    tryAgain: "Try Again",
    skipStep: "Skip this step",
    noModulesConnected: "No Modules Connected",
    noModulesInstruction: "Complete your FieldKit Station by adding sensor modules.",
    addModules: "Add Modules",
    continueWithoutModules: "Continue without modules",
    // ConnectStationForm.vue
    savedNetworks: "Saved WiFi Networks",
    noSavedNetworks: "No saved networks",
    show: "Show",
    hide: "Hide",
    changeStationName: "Name your FieldKit Station",
    changeStationNameInstruction: "You can always change this later.",
    saveNewName: "Save New Name",
    stationNameHint: "Enter a name for your station",
    reconnectToStation: "Reconnect to your FieldKit Station",
    yourWifi: "Your WiFi Network",
    wifiStep1: "Enter the name and password of the WiFi network you would like to connect your FieldKit station to.",
    wifiStep2: "Unfortunately, only 2.4GHz WiFi is currently supported and both fields are case sensitive.",
    next: "Next",
    networkNameHint: "Enter WiFi network name",
    networkPasswordHint: "Enter network password",
    // ConnectStationList.vue
    selectYourStation: "Select Your Station",
    selectStationInstruction: "We found FieldKit Stations. Choose the station you want to connect to.",
    noStationTryAgain: "Don't see your station? Try again.",
    // ConnectStationModules.vue
    connect: "Connect",
    setup: "Set Up",
    fetchingStationInfo: "Fetching station information",
    uncalibrated: "Uncalibrated",
    noCalibrationNeeded: "No calibration needed",
    calibrated: "Calibrated",
    startCalibrationStep1: "Let's set up your station before you deploy!",
    startCalibrationStep2: "To complete setup, calibrate each sensor module for accurate data readings.",
    done: "Done",
    setupLater: "Set up later",
    endCalibrationStep: "Your FieldKit station setup is complete.",
    // ConnectStationView.vue
    fieldkitWifi: "FieldKit Station WiFi",
    introConnectStep1: "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to your mobile device.",
    introConnectStep2: "Confirm that your station WiFi is on by pressing the external WiFi button.",
    connectYourStation: "Connect your FieldKit Station",
    connectStep1: "To connect to your station, go to your mobile phone WiFi settings and select the station's WiFi name as displayed on the station screen.",
    chooseWifiSettings: "WiFi Connection Settings",
    chooseWifiInstruction: "Choose how to connect and sync data. You can update this later in Settings.",
    stationWifi: "Station WiFi",
    stationWifiInfo: "Access point",
    stationWifiDescription: "Syncs station data to your phone only. When you have internet connection later, you can upload it to the FieldKit web portal.",
    recommended: "Recommended",
    yourWifi: "WiFi Network",
    yourWifiInfo: "Internet",
    yourWifiDescription: "Syncs station data to your phone only. When you have internet connection later, you can upload it to the FieldKit web portal.",
    reconnectInstruction: "To reconnect to your station, go to your mobile phone WiFi settings and select the station's new WiFi name as displayed on the station screen.",
    deploymentLocation: "Deployment Location",
    deploymentLocationInstructions: "What kind of place will you deploy your station? Will the station have internet access?",
    remoteLocationTitle: "Remote",
    remoteLocationDescription: "No internet",
    connectedLocationTitle: "Connected",
    connectedLocationDescription: "Internet access",
    connectStation: "Connect Station",
    dataSyncStationTitle:"Data Sync Details",
    dataSyncStationInfo:"How specifically do you want to sync your data? You can update this later in Settings.",
    completeSettings: "Connection Settings Complete",
    // Recalibrate.vue
    goToStations: "Go to Stations",
    noModulesAttachedTitle: "No Modules Attached",
    noModulesAttachedBody: "Your stations needs modules in order to complete setup, deploy and capture data.",
    // StationSettingsCaptureSchedule.vue
    // StationSettingsConnectionNote.vue
    mustBeConnected: "Note: You must be connected to the station to make this change.",
    // StationSettingsEndDeploy.vue
    notCurrentlyRecording: "is not currently recording.",
    areYouSureStopRecording: "Are you sure you want to stop recording?",
    // StationSettingsFirmware.vue
    firmware: "Firmware",
    stationFirmwareVersion: "Station firmware version",
    firmwareNumber: "Firmware number",
    appFirmwareVersion: "App has firmware version",
    upToDate: "You're up to date!",
    additionalInfo: "Additional information",
    firmwareBuild: "Firmware build",
    deviceId: "Device ID",
    // StationSettingsGeneral.vue
    general: "General",
    stationName: "Station Name",
    // StationSettingsLoRa.vue
    longRangeNetwork: "Long Range Network",
    // StationSettingsModule.vue
    moduleTitle: "Module",
    calibration: "Calibration",
    calibrateSensor: "Calibrate Sensor",
    calibrationRecommendation: "Calibrate your sensor any time. It is recommended to calibrate every 6 months to a year.",
    noCalibrationNeededSensor: "No calibration needed for this sensor.",
    // StationSettingsModuleList.vue
    modulesTitle: "Modules",
    // StationSettingsName.vue
    saveName: "Save Name",
    // StationSettingsNetworks.vue
    networks: "Networks",
    wifi: "WiFi",
    lora: "LoRa",
    // StationSettingsView.vue
    stationSettings: "Station Settings",
    // StationSettingsWiFi.vue
    network: "Network",
    uploadSchedule: "Upload Schedule",
    // StationSettingsWiFiNetwork.vue
    wifiNetwork: "WiFi Network",
    maxTwoNetworksWarning: "A maximum of two WiFi networks can be saved. Please remove one if you would like to add another.",
    uploadConfigUpdated: "Upload configuration has been updated.",
    unableToUpdate: "Unable to update",
    pleaseLogin: "Please log in to perform this action.",
    noteNeedInternet: "Note: you need to be connected to the internet in order to perform this action.",
    configuredToUploadDirectly: "Your station is currently configured to upload data directly over WiFi.",
    uploadViaApp: "Upload via App",
    noteUploadDirectlyOption: "If desired, you can set your station to upload data directly over WiFi.",
    uploadOverWifi: "Upload over WiFi",
    areYouSureRemoveNetwork: "Are you sure you want to remove this network?",
    // StationSettingsWiFiSchedule.vue
    // UpgradeFirmwareModal.vue
    upgradeInProcess: "Upgrading station firmware. Thank you for your patience.",
    noLocalFirmwareOffline: "No local firmware and you're offline so none can be downloaded.",
    downloadingFirmware: "Downloading firmware.",
    upgradeDone: "Upgrade done, your station is now restarting.",
    downloaded: "Downloaded.",
    // AppSettingsView.vue
    fieldkitSettings: "FieldKit Settings",
    // CalibrationView.vue
    stationDisconnectedTapHere: "Station disconnected.",
    expectedValue: "Expected value",
    calibrationFailed: "Calibration Failed",
    calibrationErrorOccured: "Looks like an error occured. Try calibration again now or try later if you prefer.",
    calibrateLater: "Calibrate later",
    waterPh: "Water pH",
    chooseCalibrationType: "Choose calibration type",
    choosePhInstruction: "Would you like to perform quick calibration or three-point calibration?",
    quickCalibration: "Quick calibration",
    threePointCalibration: "Three-point calibration",
    quickPhCalibration: "Quick pH Calibration",
    haveYourQuickSolution: "Make sure you have your quick calibration pH solution.",
    rinseWithDeionizedWater: "Rinse probe off with de-ionized water.",
    placeProbeInSolutionWithTemp: "Place probe inside cup with solution. Make sure water temperature is also inside solution.",
    startTimer: "Start Timer",
    calibrate: "Calibrate",
    makeSureYouHavePhFluids: "Make sure you have your pH calibration fluids for pH levels 7, 4, and 10.",
    midPointCalibration: "Mid-point Calibration",
    placeProbeIn7Solution: "Place probe inside cup with 7.0 solution. Make sure water temperature is also inside solution.",
    lowPointCalibration: "Low-point Calibration",
    placeProbeIn4Solution: "Place probe inside cup with 4.0 solution. Make sure water temperature is also inside solution.",
    highPointCalibration: "High-point Calibration",
    placeProbeIn10Solution: "Place probe inside cup with 10.0 solution. Make sure water temperature is also inside solution.",
    waterDissolvedOxygen: "Water Dissolved Oxygen",
    dissolvedOxygenCalibration: "Dissolved Oxygen Calibration",
    dryProbeBefore: "Make sure you dry your probe before calibration.",
    holdProbeOut: "Hold probe out in the atmosphere.",
    waterConductivity: "Water Electrical Conductivity",
    part1Dry: "Part 1: Dry Conductivity Calibration",
    part2Wet: "Part 2: Wet Conductivity Calibration",
    haveYourConductivitySolution: "Make sure you have your conductivity solution.",
    placeInAndStabilizeWithTemp: "Place probe inside cup with solution and let the readings stabilize. Make sure water temperature is also inside solution.",
    // ConfigureCaptureInterval.vue
    dataCaptureSchedule: "Data Capture Schedule",
    dataCaptureNotice: "Frequent data capture drains the battery at a quicker rate",
    scheduled: "Scheduled",
    basic: "Basic",
    captureTime: "Capture Time",
    start: "Start",
    startBeforeEnd: "Start must be before end",
    end: "End",
    endAfterStart: "End must be after start",
    every: "Every",
    intervalRequired: "Interval must not be blank.",
    intervalTooSmall: "Interval must be at least one minute.",
    intervalNotNumber: "Interval must be a number.",
    addTime: "Add Time",
    second: "second",
    seconds: "seconds",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    week: "week",
    weeks: "weeks",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
    saveStartTime: "Save Start Time",
    saveEndTime: "Save End Time",
    // DataSyncView.vue
    dataSync: "Data",
    totalDownAndUploaded: "total readings down & uploaded",
    totalDownloaded: "total readings downloaded",
    totalUploaded: "total readings uploaded",
    lastDownUpload: "Last down/upload",
    lastDownload: "Last download",
    lastUpload: "Last upload",
    downloading: "Downloading",
    notConnectedToStation: "Not connected to station",
    checkingDownload: "Checking for data to download...",
    readings: "Readings",
    waitingToUpload: "Waiting to upload",
    toUpload: "to upload",
    failedCheckConnection: "Unable to upload. Are you connected to the internet?",
    uploadSuccessful: "Upload successful",
    uploaded: "Uploaded",
    uploading: "Uploading",
    loginPrompt: "You're not logged in. Would you like to login so that you can upload your data?",
    yes: "Yes",
    notNow: "Not Now",
    // DeployMapView.vue
    stationDisconnected: "Station disconnected.",
    nameYourLocation: "Name your location",
    locationRequired: "Location is a required field.",
    required: "This field is required.",
    locationOver255: "Location must be less than 256 letters.",
    locationNotPrintable: "Location has invalid letters, acceptable letters are A-Z, 0-9 and \"~!@#$%^&*()-.'`",
    continue: "Continue",
    deployment: "Deployment",
    // DeployNotesView.vue
    fieldNote: "Field Note",
    fieldNotes: "Field Notes",
    photoDescription: "Photo Description",
    describePhoto: "Describe what is in the photo",
    complete: "Complete",
    provideDetails: "Help your community better understand their environment. Field notes can improve communication, troubleshooting and data insights.",
    photosRequired: "Photos (1 required)",
    photosInstruction: "A picture speaks a thousand words.",
    additionalNotes: "Additional Notes",
    addDetails: "Anything else? Capture more notes at any time.",
    addNote: "Add Note",
    save: "Save",
    studyObjective: "Study Objective",
    studyObjectiveInstruction: "What are your goals?",
    siteLocation: "Purpose of Site Location",
    siteLocationInstruction: "Why did you pick this spot?",
    siteCriteria: "Site Criteria",
    siteCriteriaInstruction: "How does it meet your needs?",
    siteDescription: "Site Description",
    siteDescriptionInstruction: "What can you see around you?",
    additionalNoteInstruction: "Tap to add additional notes",
    confirmDeleteNote: "Are you sure you want to delete this note?",
    cancel: "Cancel",
    addPhoto: "Add a photo",
    takePicture: "Take picture",
    selectFromGallery: "Select from gallery",
    // DeployReviewView.vue
    stationCoordinates: "Station Coordinates",
    latitude: "Latitude",
    longitude: "Longitude",
    noNameGiven: "No name given",
    record: "Record",
    mustBeConnectedToRecord: "Station not Connected",
    deploymentReview: "Deployment Review",
    processing: "Processing...",
    // FieldNoteForm.vue
    title: "Title",
    tapToAddTitle: "Tap to add a title",
    note: "Note",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
    audioNote: "audio note",
    confirmDeleteRecording: "Are you sure you want to delete this recording?",
    // DeveloperMenuView.vue
    viewStations: "View Stations",
    authenticated: "You have successfully authenticated.",
    currentEnvironment: "The current environment is",
    resetCalibration: "Reset Calibration",
    resetOnboarding: "Reset Onboarding",
    uploadDiagnostics: "Upload Diagnostics",
    deleteDB: "Delete DB",
    deleteFiles: "Delete Files",
    crash: "Crash",
    manualCrash: "Manual Crash",
    devOptions: "Development Options",
    noStationsFound: "No stations found",
    resetDoneGoToOnboarding: "Reset complete! Would you like to go to Onboarding?",
    no: "No",
    dbDeleted: "Database Deleted",
    errorRemovingFiles: "Error removing files!",
    filesRemoved: "Files removed!",
    includeThisPhrase: "Success! Please include this phrase in your bug report:",
    // LoginView.vue
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    nameRequired: "Name is a required field.",
    nameOver255: "Name must be less than 256 letters.",
    nameNoSpaces: "Name must not contain spaces.",
    emailRequired: "Email is a required field.",
    emailNotValid: "Must be a valid email address.",
    passwordRequired: "Password is a required field.",
    passwordTooShort: "Password must be at least 10 characters.",
    forgotLink: "Reset password",
    noMatch: "Your passwords do not match.",
    logIn: "Log In",
    signUp: "Sign Up",
    continueOffline: "Continue Offline",
    needAccount: "Create an account",
    backToLogin: "Back to Log In",
    provideBoth: "Please provide both an email address and password.",
    loginFailed: "Unfortunately we were unable to log you in. Please check your credentials and try again.",
    accountCreated: "Your account was successfully created.",
    accountCreateFailed: "Unfortunately we were unable to create your account.",
    forgotTitle: "Reset password",
    forgotInstruction: "Enter the email address you used to register for FieldKit to reset your password.",
    ok: "OK",
    passwordResetSucceeded: "Your password was successfully reset. Please check your email for instructions on choosing a new password.",
    passwordResetFailed: "Unfortunately, an error occurred resetting your password.",
    // ModuleDetailView.vue
    locateYourModule: "Locate %s here on your FieldKit station.",
    select: "Select...",
    // ModuleListView.vue
    viewGraph: "View Graph",
    lastReading: "Last reading",
    // NotificationFooter.vue
    notifications: "Notifications",
    notificationRemindLater: "Remind Later",
    notificationDontRemind: "Don't Remind",
    notificationArchive: "Archive",
    portalProblemHeading: "Problem with Portal connection",
    encounteredAPortalError: "We encountered an error when connecting to the Portal.",
    unableToUpdateHeading: "Unable to update Portal",
    doNotHavePortalPermission: "We do not have permission to update the Portal for this station. It may belong to another user.",
    unableToAccessHeading: "Unable to access Portal",
    notAuthorizedToUpdatePortal: "We are currently not authorized to update the Portal. Are you logged in?",
    stationDeployedHeading: "Station Deployed",
    stationDeployedText: "Station Deployed Text",
    calibrationRequiredHeading: "Calibration Required",
    calibrationRequiredText: "calibration Required Text",
    // NotificationView.vue
    dismiss: "Dismiss",
    // ScreenFooter.vue
    stations: "Stations",
    data: "Data",
    settings: "Settings",
    // ScreenHeader.vue
    // StationDetailView.vue
    stationDeployed: "Station Deployed",
    readyToDeploy: "Ready to deploy",
    deployed: "Deployed",
    // StationListView.vue
    lookingForStations: "Looking for stations ...",
    connectAStation: "Connect a Station",
    addStation: "Add a Station",
    addStationInstruction: "You have no stations. Add a station to start collecting data.",
    confirmViewDevMenu: "Do you want to view development options?",
    // StationPickerModal.vue
    tapStationToRecalibrate: "Tap the station you want to recalibrate:",
    // StationSettingsView.vue
    nameOver40: "Name has a 40-character maximum.",
    nameNotPrintable: "Name has invalid letters, acceptable letters are A-Z, 0-9 and \"~!@#$%^&*()-.'`",
    endDeployment: "End Deployment",
    mustBeConnectedToStop: "To undeploy and stop recording data, you must be connected to your station.",
    stopRecording: "Stop Recording",
    wifiNetworks: "WiFi Networks",
    addNetwork: "Add a network to station",
    networkName: "Network name",
    add: "Add",
    loraNetwork: "LoRa (Long Range) Network",
    deviceEUI: "Device EUI",
    editAppEUI: "Edit App EUI and Key",
    appEUI: "App EUI",
    invalidAppEUI: "Invalid App EUI",
    appKey: "App Key",
    invalidAppKey: "Invalid App Key",
    submit: "Submit",
    logOut: "Log Out",
    // StationStatusBox.vue
    unknown: "Unknown",
    since: "Since",
    recordingData: "Recording Data",
    notRecording: "Not Recording",
    connected: "Connected",
    notConnected: "Not Connected",
    memoryUsed: "Memory used",
    of: "of",
    deploy: "Deploy",
    daysHrsMin: "days hrs min",
    hrsMinSec: "hrs min sec",
	downloadFirmware: "Download Firmware",
	upgradeFirmware: "Upgrade Firmware",
    batteryLife: "Battery Life",
    appSettings: {
        title: "Settings",
		developer: {
			developer: "Developer",
			notice: "The options below have irreversible consequences. Please only use them when directed to."
		},
        data: {
            data: "Data",
            autoSyncStationTitle: "Auto Sync Station",
            autoSyncStationDescription: "Automatically download data from station",
            autoSyncPortalTitle: "Auto Sync Portal",
            autoSyncPortalDescription: "Automatically upload data portal",
            mobileDataUsageTitle: "Mobile Data Usage",
            mobileDataUsageDescription: "Only sync your data to portal while connected WiFi",
        },
        notifications: {
            notifications: "Notifications",
            pushNotificationsTitle: "Push Notifications",
            pushNotificationsDescription: "Placeholder text lorem ipsum"
        },
        units: {
            units: "Units",
            unitSystem: "Unit System",
            imperial: "Imperial",
            metric: "Metric",
            customMetricSettings: "Custom Metric Settings",
            temperature: "Temperature",
            unitName: "Unit Name",
            pressure: "Pressure",
            velocity: "Velocity"
        },
        permissions: {
            permissions: "Permissions",
            locationTitle: "Location",
            filesTitle: "Files",
            cameraTitle: "Camera",
            microphoneTitle: "Microphone",
        },
        appearance: {
			appearance: "Appearance",
            fontSize: "Font Size",
            language: "Language",
            darkMode: "Dark Mode",
            english: "English",
            spanish: "Spanish",
            chinese: "Mandarin Chinese",
            tiny: "Tiny",
            huge: "Huge"
        },
        account: {
            account: "Account",
            addAccount: "Add Account",
            logoutAll: "Log Out All Accounts",
            email: 'Email',
            password: 'Password',
            resetPassword: 'Reset Password',
            login: 'Log in',
            createAccount: 'Create an account'
        },
        help: {
            help: "Help",
            appVersion: "App Version",
            crashReports: "Crash Reports",
            tutorialGuide: "Tutorial Guide",
            version: "Version",
            updatesTitle: "Updates",
            updatesDescription: "No available updates",
            downloadUpdatesTitle: "Download Updates",
            downloadUpdatesDescription: "Download FieldKit app updates automatically when on WiFi internet "
        },
        legal: {
            legal: "Legal",
            termsOfService: "Terms of Service",
            privacyPolicy: "Privacy Policy",
            dataPolicy: "Data Policy",
            licenses: "Licenses"
        },
        lorem: "Lorem ipsum"
    }
};
