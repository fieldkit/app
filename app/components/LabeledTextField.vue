<template>
    <StackLayout>
        <Label ref="label" :text="label" class="size-12 field-label" :visibility="typing ? 'visible' : 'collapsed'" width="100%" />

        <GridLayout rows="auto" :columns="canShow ? '*, 45' : '*'">
            <TextField
                row="0"
                :class="fieldClass"
                :hint="label"
                :text="value"
                :keyboardType="keyboardType"
                :secure="secure && hidden"
                :isEnabled="isEnabled"
                autocorrect="false"
                autocapitalizationType="none"
                @focus="onFocus"
                @textChange="onChange"
                @blur="onBlur"
            />

            <Label
                v-if="canShow"
                row="0"
                col="1"
                :text="hidden ? _L('show') : _L('hide')"
                class="size-16"
                verticalAlignment="middle"
                @tap="toggle"
            />
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { Enums } from "@nativescript/core";

export default Vue.extend({
    props: {
        value: {
            type: String,
            default: "",
        },
        label: {
            type: String,
            default: "",
        },
        keyboardType: {
            type: String,
            default: "name",
        },
        secure: {
            type: Boolean,
            default: false,
        },
        canShow: {
            type: Boolean,
            default: false,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
    },
    data(): {
        typing: boolean;
        focus: boolean;
        hidden: boolean;
    } {
        return {
            typing: false,
            focus: false,
            hidden: true,
        };
    },
    computed: {
        fieldClass(): string {
            return ["labeled-text-field", "input", this.focus ? "active-line" : "inactive-line"].join(" ");
        },
    },
    mounted(): void {
        console.log("can-show", this.canShow);
    },
    methods: {
        onFocus(): void {
            this.focus = true;
            this.$emit("focus");
        },
        onChange(ev: { value: string }): void {
            const value = ev.value;
            if (!this.typing && value) {
                // eslint-disable-next-line
                this.animateLabel((this.$refs.label as any).nativeView);
            } else if (!value) {
                this.typing = false;
            }
            this.$emit("input", ev.value);
        },
        onBlur(ev: unknown): void {
            this.focus = false;
            this.$emit("blur", ev);
        },
        // eslint-disable-next-line
        animateLabel(nativeView: any): void {
            // eslint-disable-next-line
            nativeView.opacity = 0;
            // eslint-disable-next-line
            nativeView.translateX = 5;
            // eslint-disable-next-line
            nativeView.translateY = 20;
            // eslint-disable-next-line
            nativeView.animate({
                opacity: 0.75,
                translate: { x: 0, y: 0 },
                duration: 300,
                curve: Enums.AnimationCurve.easeIn,
            });
            this.typing = true;
        },
        toggle(): void {
            this.hidden = !this.hidden;
            console.log(`toggle hidden`);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.field-label {
    color: $fk-gray-hint;
}
.labeled-text-field {
    color: $fk-primary-black;
    padding-bottom: 5;
    width: 100%;
    font-size: 18;
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
</style>
