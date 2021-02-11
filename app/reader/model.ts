import _ from "lodash";

export interface SimpleScreen {
    body: string;
    images: { url: string }[];
}

export interface Header {
    title: string;
    subtitle: string;
}

export interface Screen {
    name: string;
    locale: string;
    forward: string;
    skip: string | null;
    guideTitle: string | null;
    guideUrl: string | null;
    header: Header;
    simple: SimpleScreen[];
}

export interface Flow {
    id: string;
    name: string;
    showProgress: boolean;
}

export interface FlowFile {
    data: {
        flows: Flow[];
        screens: Screen[];
    };
}

export class NavigationOption {
    private constructor(public readonly label: string | null) {}

    public get allowed(): boolean {
        return this != NavigationOption.Nope;
    }

    public static Nope = new NavigationOption("nope");
    public static Done = new NavigationOption("done");
    public static Forward = new NavigationOption("forward");
    public static Backward = new NavigationOption("backward");
    public static Skip = new NavigationOption("skip");

    public static allowed(label: string): NavigationOption {
        return new NavigationOption(label);
    }
}

export class NavigationOptions {
    constructor(public readonly backward: NavigationOption, public readonly forward: NavigationOption) {}
}

export class VisibleScreen {
    constructor(public readonly screen: Screen, public readonly navOptions: NavigationOptions) {}

    public get name(): string {
        return this.screen.name;
    }

    public get forward(): string {
        return this.screen.forward;
    }

    public get skip(): string | null {
        return this.screen.skip;
    }

    public get header(): Header {
        return this.screen.header;
    }

    public get simple(): SimpleScreen[] {
        return this.screen.simple;
    }
}

function screenOrder(screen: Screen): number {
    return Number(screen.name.replace(/[a-z.]+/, ""));
}

export class FlowNavigator {
    public readonly flow: Flow;
    private screens: Screen[];
    private visible: VisibleScreen;
    private index = 0;

    public get progress(): number {
        return (this.index / (this.screens.length - 1)) * 100.0;
    }

    public get key(): string {
        return `key-${this.index}`;
    }

    constructor(data: FlowFile, name: string) {
        const byKey = _.keyBy(data.data.flows, (f) => f.name);
        if (!byKey[name]) throw new Error(`no flow: ${name}`);
        this.flow = byKey[name];
        this.screens = data.data.screens.filter((screen) => this.getFlowForScreen(screen.name) == name);
        if (this.screens.length == 0) throw new Error(`no screens: ${name}`);
        this.screens.sort((a, b) => {
            return screenOrder(a) - screenOrder(b);
        });
        this.visible = this.createVisibleScreen();
    }

    private getFlowForScreen(name: string): string {
        return name.replace(/\.\d+$/, "");
    }

    private createVisibleScreen(): VisibleScreen {
        const screen = this.screens[this.index];
        const forward = this.index == this.screens.length - 1 ? NavigationOption.Done : NavigationOption.Forward;
        const backward = this.index == 0 ? NavigationOption.Nope : NavigationOption.Backward;
        const navOptions = new NavigationOptions(backward, forward);
        return new VisibleScreen(screen, navOptions);
    }

    private recreate(): Promise<boolean> {
        this.visible = this.createVisibleScreen();
        return Promise.resolve(false);
    }

    public move(option: NavigationOption): Promise<boolean> {
        switch (option) {
            case NavigationOption.Nope:
                throw new Error(`invalid navigation: Nope`);
            case NavigationOption.Done: {
                return Promise.resolve(true);
            }
            case NavigationOption.Skip: {
                return Promise.resolve(true);
            }
            case NavigationOption.Forward: {
                if (this.index == this.screens.length - 1) throw new Error("invalid nav forward");
                this.index++;
                return this.recreate();
            }
            case NavigationOption.Backward: {
                if (this.index == 0) throw new Error("invalid nav backward");
                this.index--;
                return this.recreate();
            }
        }

        throw new Error(`invalid navigation: ${JSON.stringify(option)}`);
    }

    public get screen(): VisibleScreen {
        return this.visible;
    }
}
