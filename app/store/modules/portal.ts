import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ServiceRef } from "@/services";
import { CurrentUser } from "@/services/portal-interface";
import { ActionTypes, LoginAction, ChangePortalEnvAction } from "../actions";
import { PortalEnv } from "../types";
import { MutationTypes } from "../mutations";
import { AccountsTableRow, SettingsTableRow } from "../row-types";
import Config from "@/config";

export { CurrentUser };

const fkprd: PortalEnv = {
    name: "fkprd",
    baseUri: "https://api.fieldkit.org",
    ingestionUri: "https://api.fieldkit.org/ingestion",
};

const fkdev: PortalEnv = {
    name: "fkdev",
    baseUri: "https://api.fkdev.org",
    ingestionUri: "https://api.fkdev.org/ingestion",
};

export class PortalState {
    authenticated = false;
    settings: Record<string, unknown> = {};
    accounts: AccountsTableRow[] = [];
    currentUser: CurrentUser | null = null;
    availableEnvs: PortalEnv[] = [fkprd, fkdev];
    env: PortalEnv = fkprd;
}

type ActionParameters = ActionContext<PortalState, never>;

const getters = {
    usersById(state: PortalState): { [id: number]: CurrentUser } {
        return _.fromPairs(
            state.accounts.map((row) => {
                return [row.portalId, _.extend({ transmission: null }, row)];
            })
        );
    },
};

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: async ({ dispatch }: ActionParameters) => {
            await Promise.all([
                dispatch(ActionTypes.LOAD_SETTINGS),
                dispatch(ActionTypes.LOAD_ACCOUNTS),
                dispatch(ActionTypes.LOAD_PORTAL_ENVS),
            ]);

            const users = Config.defaultUsers;
            if (users.length > 0) {
                try {
                    console.log(`authenticating default-users`);
                    await Promise.all(
                        users.map(async (da) => {
                            try {
                                await dispatch(new LoginAction(da.email, da.password));
                                console.log(`authenticated: ${JSON.stringify(da.email)}`);
                            } catch (error) {
                                console.log(`default-user failed: ${JSON.stringify(error)}`);
                            }
                        })
                    );
                } catch (error) {
                    console.log(`failed: ${JSON.stringify(error)}`);
                }
            }
        },
        [ActionTypes.LOAD_SETTINGS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getSettings()
                .then((settings) => {
                    commit(MutationTypes.LOAD_SETTINGS, settings);
                })
                .catch((e) => console.log(ActionTypes.LOAD_SETTINGS, e));
        },
        [ActionTypes.UPDATE_SETTINGS]: async ({ dispatch }: ActionParameters, settings) => {
            await services
                .db()
                .updateSettings(settings)
                .then((res) => dispatch(ActionTypes.LOAD_SETTINGS).then(() => res))
                .catch((e) => console.log(ActionTypes.UPDATE_SETTINGS, e));
        },
        [ActionTypes.LOAD_ACCOUNTS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getAllAccounts()
                .then((accounts) => {
                    commit(MutationTypes.LOAD_ACCOUNTS, accounts);

                    const sorted = _.reverse(_.sortBy(accounts, (a) => a.usedAt));
                    if (sorted.length > 0 && !state.currentUser) {
                        commit(MutationTypes.SET_CURRENT_USER, sorted[0]);
                    }
                })
                .catch((e) => console.log(ActionTypes.LOAD_ACCOUNTS, e));
        },
        [ActionTypes.LOGIN]: async ({ commit, dispatch, state }: ActionParameters, payload: LoginAction) => {
            const portal = services.portal();
            const self = await portal.login(payload);

            commit(MutationTypes.SET_CURRENT_USER, self);

            await services.db().addOrUpdateAccounts(self);

            await dispatch(ActionTypes.LOAD_ACCOUNTS);

            await dispatch(ActionTypes.AUTHENTICATED);
        },
        [ActionTypes.LOGOUT_ACCOUNTS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .deleteAllAccounts()
                .then(() => {
                    commit(MutationTypes.LOGOUT_ACCOUNTS);
                    return dispatch(ActionTypes.LOAD_ACCOUNTS);
                })
                .catch((e) => console.log(ActionTypes.LOGOUT_ACCOUNTS, e));

            commit(MutationTypes.LOGOUT);
        },
        [ActionTypes.CHANGE_ACCOUNT]: async ({ commit, dispatch, state }: ActionParameters, email: string) => {
            const chosen = state.accounts.filter((a) => a.email === email);
            if (chosen.length == 0) throw new Error(`no such account: ${email}`);
            await services
                .db()
                .addOrUpdateAccounts(chosen[0])
                .then(() => {
                    // services.portal().setCurrentUser(chosen[0]);
                    commit(MutationTypes.SET_CURRENT_USER, chosen[0]);
                })
                .catch((e) => console.log(ActionTypes.CHANGE_ACCOUNT, e));
        },
        [ActionTypes.LOAD_PORTAL_ENVS]: async ({ commit, dispatch, state }: ActionParameters, _payload: ChangePortalEnvAction) => {
            await services
                .db()
                .getAvailablePortalEnvs()
                .then((rows) => {
                    if (Config.env.developer) {
                        console.log(`portal-envs: using developer`);
                        const env = {
                            name: null,
                            baseUri: Config.baseUri,
                            ingestionUri: Config.ingestionUri,
                        };
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, env);
                    } else if (rows.length > 1) {
                        console.log(`portal-envs: ${JSON.stringify(rows[0])}`);
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, rows[0]);
                    } else {
                        console.log(`portal-envs: ${JSON.stringify(fkprd)}`);
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, fkprd);
                    }
                });
        },
        [ActionTypes.CHANGE_PORTAL_ENV]: async ({ commit, dispatch, state }: ActionParameters, payload: ChangePortalEnvAction) => {
            await services
                .db()
                .updatePortalEnv(payload.env)
                .then(() => {
                    commit(MutationTypes.SET_CURRENT_PORTAL_ENV, payload.env);
                });
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: PortalState) => {
        Object.assign(state, new PortalState());
    },
    [MutationTypes.SET_CURRENT_USER]: (state: PortalState, currentUser: CurrentUser) => {
        Vue.set(state, "currentUser", currentUser);
    },
    [MutationTypes.LOGIN]: (state: PortalState) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: PortalState) => {
        Vue.set(state, "authenticated", false);
        Vue.set(state, "currentUser", null);
    },
    [MutationTypes.LOAD_SETTINGS]: (state: PortalState, rows: SettingsTableRow[]) => {
        if (rows.length == 0) {
            Vue.set(state, "settings", {});
        } else {
            Vue.set(state, "settings", rows[0].settingsObject);
        }
    },
    [MutationTypes.LOGOUT_ACCOUNTS]: (state: PortalState) => {
        Vue.set(state, "accounts", []);
    },
    [MutationTypes.LOAD_ACCOUNTS]: (state: PortalState, accounts: AccountsTableRow[]) => {
        Vue.set(state, "accounts", accounts);
    },
    [MutationTypes.SET_CURRENT_PORTAL_ENV]: (state: PortalState, env: PortalEnv) => {
        Vue.set(state, "env", env);
    },
};

type ModuleType = Module<PortalState, never>;

export const portal = (services: ServiceRef): ModuleType => {
    const state = () => new PortalState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
