<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout :rows="currentStation.connected ? (ios ? '68,*,80' : '78,*,80') : '105,*,80'">
            <StackLayout row="0">
                <ScreenHeader
                    :title="_L('deployment')"
                    :subtitle="currentStation.name"
                    :canNavigateBack="false"
                    :canCancel="true"
                    :onCancel="onNavCancel"
                    :canNavigateSettings="false"
                />
                <GridLayout rows="auto" columns="33*,33*,34*" class="top-line-bkgd">
                    <StackLayout col="0" class="top-line"></StackLayout>
                </GridLayout>
                <StackLayout class="text-center disconnect-warning" v-if="!currentStation.connected">
                    <Label :text="_L('stationDisconnected')" />
                </StackLayout>
            </StackLayout>

            <ScrollView row="1">
                <FlexboxLayout flexDirection="column" justifyContent="space-between">
                    <StackLayout>
                        <Mapbox
                            :accessToken="mapboxToken"
                            automationText="currentLocationMap"
                            mapStyle="mapbox://styles/mapbox/outdoors-v11"
                            height="150"
                            hideCompass="false"
                            zoomLevel="0"
                            showUserLocation="false"
                            disableZoom="false"
                            disableRotation="false"
                            disableScroll="false"
                            disableTilt="false"
                            @mapReady="onMapReady"
                        />
                    </StackLayout>

                    <GridLayout rows="*" columns="*" class="m-t-30 m-b-20 m-x-10">
                        <StackLayout row="0">
                            <LabeledTextField v-model="form.location" :label="_L('nameYourLocation')" @blur="checkLocationName" />
                            <Label
                                class="validation-error"
                                id="no-location"
                                horizontalAlignment="left"
                                :text="_L('locationRequired')"
                                textWrap="true"
                                :visibility="form.v.required ? 'visible' : 'collapsed'"
                            />
                            <Label
                                class="validation-error"
                                id="location-too-long"
                                horizontalAlignment="left"
                                :text="_L('locationOver255')"
                                textWrap="true"
                                :visibility="form.v.longLength ? 'visible' : 'collapsed'"
                            />
                            <Label
                                class="validation-error"
                                id="location-not-printable"
                                horizontalAlignment="left"
                                :text="_L('locationNotPrintable')"
                                textWrap="true"
                                :visibility="form.v.characters ? 'visible' : 'collapsed'"
                            />
                        </StackLayout>
                    </GridLayout>

                    <ConfigureCaptureInterval v-model="form.interval" ref="configCaptureInterval" @input="onIntervalChange" />
                </FlexboxLayout>
            </ScrollView>

            <StackLayout row="2">
                <Button class="btn btn-primary btn-padded m-b-10" :text="_L('continue')" automationText="nextButton" @tap="goToNext"></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script>
import { isIOS } from "tns-core-modules/platform";
import { MAPBOX_ACCESS_TOKEN } from "../../secrets";
import Services from "../../services/services";
import routes from "../../routes";
import * as ActionTypes from "../../store/actions";

import LabeledTextField from "../LabeledTextField";
import ScreenHeader from "../ScreenHeader";
import ConfigureCaptureInterval from "../ConfigureCaptureInterval";
import * as animations from "../animations";

export default {
    components: {
        ScreenHeader,
        ConfigureCaptureInterval,
        LabeledTextField,
    },
    data() {
        return {
            ios: isIOS,
            mapboxToken: MAPBOX_ACCESS_TOKEN,
            form: {
                location: "",
                interval: 300,
                v: {
                    any: false,
                    required: false,
                    characters: false,
                    longLength: false,
                },
            },
        };
    },
    props: {
        station: {
            type: Object,
        },
        stationId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        currentNotes() {
            return this.$store.state.notes.stations[this.stationId];
        },
        currentStation() {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(args) {
            this.form.location = this.currentNotes.location || "";
        },
        onMapReady(args) {
            this.map = args.map;
            this.displayStation();
        },
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.currentStation.id,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        goToNext(event) {
            if (this.$refs.configCaptureInterval.checkAllIntervals()) {
                return this.saveForm().then(() => {
                    return this.$navigateTo(routes.deployNotes, {
                        props: {
                            stationId: this.stationId,
                            station: this.currentStation,
                        },
                    });
                });
            }
        },
        onNavCancel(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId,
                        station: this.currentStation,
                    },
                }),
            ]);
        },
        displayStation() {
            const station = this.$store.getters.legacyStations[this.stationId];
            const location = station.location();
            if (!location) {
                return;
            }
            this.map.setCenter({
                lat: location.latitude,
                lng: location.longitude,
                animated: false,
            });
            this.map.setZoomLevel({
                level: 14,
            });
            this.mapMarker = {
                lat: location.latitude,
                lng: location.longitude,
                title: station.name,
                subtitle: _L("readyToDeploy"),
                iconPath: "images/Icon_Map_Dot.png",
            };
            this.map.addMarkers([this.mapMarker]);
        },
        checkLocationName() {
            this.form.v = {
                required: false,
                long: false,
                characters: false,
                any: false,
            };

            this.form.v.required = this.form.location.length == 0;
            const matches = this.form.location.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.form.v.characters = !matches || matches.length == 0;
            this.form.v.long = this.form.location.length > 40;
            this.form.v.any = this.form.v.required || this.form.v.long || this.form.v.characters;
            return !this.form.v.any;
        },
        onIntervalChange(interval) {
            console.log("interval", interval);
        },
        saveForm() {
            if (!this.checkLocationName()) {
                return Promise.reject(new Error("validation error"));
            }
            return Promise.all([this.$store.dispatch(ActionTypes.STATION_LOCATION, { stationId: this.stationId, location: this.form.location })]).then(() => {
                return Promise.all([this.$store.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDUES, { stationId: this.stationId, interval: this.form.interval })]);
            });
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

.top-line-bkgd {
    background-color: $fk-gray-lighter;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}

#location-name-field {
    color: $fk-primary-black;
    padding-bottom: 5;
    width: 100%;
    font-size: 18;
}
#hidden-instruction {
    color: $fk-gray-hint;
}

.inactive-line {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.active-line {
    border-bottom-color: $fk-secondary-blue;
    border-bottom-width: 2;
}
.validation-error {
    width: 100%;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}

#hidden-field {
    opacity: 0;
}
</style>