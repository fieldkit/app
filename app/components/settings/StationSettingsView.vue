<template>
    <Page>
        <PlatformHeader :title="_L('stationSettings.title')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <StackLayout :class="station.connected ? 'm-t-5' : ''">
                        <Label
                            v-for="(option, i) in menuOptions"
                            :key="option"
                            :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                            :text="option"
                            textWrap="true"
                            @tap="selectFromMenu"
                        />
                    </StackLayout>
                </StackLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import Services from "@/services/singleton";
import SharedComponents from "@/components/shared";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";
import General from "./StationSettingsGeneral.vue";
import Networks from "./StationSettingsNetworks.vue";
import Firmware from "./StationSettingsFirmware.vue";
import Modules from "./StationSettingsModuleList.vue";
import EndDeploy from "./StationSettingsEndDeploy.vue";
import * as animations from "@/components/animations";
import { AvailableStation } from "@/store";

export default Vue.extend({
    data(): {
        loggedIn: boolean;
        menuOptions: string[];
    } {
        return {
            loggedIn: Services.PortalInterface().isLoggedIn(),
            menuOptions: [_L("general"), _L("networks"), _L("firmware"), _L("modulesTitle"), _L("endDeployment")],
        };
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    components: {
        ...SharedComponents,
        General,
        Firmware,
        Networks,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        selectFromMenu(ev: Event): Promise<void> {
            void animations.pressed(ev);

            switch ((ev as any).object.text) {
                case _L("general"):
                    return this.goToGeneral();
                case _L("networks"):
                    return this.goToNetworks();
                case _L("firmware"):
                    return this.goToFirmware();
                case _L("modulesTitle"):
                    return this.goToModules();
                case _L("endDeployment"):
                    return this.goToEndDeploy();
            }

            throw new Error("unknown option");
        },
        async goToGeneral(): Promise<void> {
            await this.$navigateTo(General, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToNetworks(): Promise<void> {
            await this.$navigateTo(Networks, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToFirmware(): Promise<void> {
            await this.$navigateTo(Firmware, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToModules(): Promise<void> {
            await this.$navigateTo(Modules, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToEndDeploy(): Promise<void> {
            await this.$navigateTo(EndDeploy, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
