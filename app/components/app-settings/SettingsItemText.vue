<template>
    <GridLayout rows="50" columns="*" class="bottom-bordered-item" :class="cssClass" @tap="goToRoute()">
        <Label :text="_L(text)" class="size-16 m-5 v-middle" row="0" col="1" verticalAlignment="center" />
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";

export default Vue.extend({
    props: {
        link: {
            type: String,
            default: null,
        },
        text: {
            type: String,
            required: true,
        },
        cssClass: {
            type: String,
            default: "",
        },
    },
    methods: {
        async goToRoute(): Promise<void> {
            if (this.link) {
                // eslint-disable-next-line
                await this.$navigateTo(routes.appSettings[this.link], {});
            } else {
                this.$emit("tap");
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.bottom-bordered-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
</style>
