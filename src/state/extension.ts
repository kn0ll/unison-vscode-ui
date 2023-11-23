import * as vscode from "vscode";
import { assign, createMachine } from "xstate";
import { createApiClient } from "../api";
import * as Commands from "../commands";
import { CodebaseProvider } from "../tree-view";

export interface Context {
	subscriptions: {
		dispose(): any;
	}[];
	codebaseProvider: CodebaseProvider | null;
}

export type ExtensionEvent =
	| {
			type: "READY";
			baseUrl: string;
	  }
	| {
			type: "REFRESH";
	  }
	| {
			type: "ACTIVATE";
	  }
	| {
			type: "CONFIGURE";
	  };

interface MachineDependencies {
	workspaceConfig: vscode.WorkspaceConfiguration;
}

type Services = {
	persistBaseUrl: {
		data: void;
	};
	getBaseUrlFromUser: {
		data: { baseUrl: string | undefined };
	};
	getBaseUrlFromWorkspaceConfig: {
		data: { baseUrl: string | undefined };
	};
};

export const createExtensionMachine = ({
	workspaceConfig,
}: MachineDependencies) =>
	createMachine(
		{
			id: "extension",
			initial: "idle",
			predictableActionArguments: true,
			tsTypes: {} as import("./extension.typegen").Typegen0,
			schema: {
				context: {} as Context,
				events: {} as ExtensionEvent,
				services: {} as Services,
			},
			context: {
				subscriptions: [],
				codebaseProvider: null,
			},
			states: {
				idle: {
					on: {
						ACTIVATE: "checking_saved_url",
					},
				},
				checking_saved_url: {
					invoke: {
						src: "getBaseUrlFromWorkspaceConfig",
						onDone: [
							{
								target: "setting_up",
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: "awaiting_configuration",
							},
						],
					},
				},
				awaiting_configuration: {
					on: {
						REFRESH: {
							target: "awaiting_configuration",
							actions: "showNotConfiguredError",
						},
						CONFIGURE: "configuring",
					},
				},
				configuring: {
					invoke: {
						src: "getBaseUrlFromUser",
						onDone: [
							{
								target: "setting_up",
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: "awaiting_configuration",
							},
						],
					},
				},
				setting_up: {
					entry: "setup",
					invoke: {
						src: "persistBaseUrl",
						onDone: "configured",
						onError: "awaiting_configuration",
					},
				},
				configured: {
					on: {
						REFRESH: {
							target: "configured",
							actions: "refresh",
						},
						CONFIGURE: "reconfiguring",
					},
				},
				reconfiguring: {
					invoke: {
						src: "getBaseUrlFromUser",
						onDone: [
							{
								target: "setting_up",
								cond: (_, event) => Boolean(event.data.baseUrl),
							},
							{
								target: "configured",
							},
						],
					},
				},
			},
		},
		{
			services: {
				getBaseUrlFromWorkspaceConfig: async () => ({
					baseUrl: workspaceConfig.get<string>(BASE_URL_CONFIG_NAME),
				}),
				getBaseUrlFromUser: async () => {
					const unisonUrl = await vscode.window.showInputBox({
						title: "Enter UCM URL",
					});

					if (unisonUrl === undefined) {
						vscode.window.showErrorMessage("Please enter a UCM URL.");
						return { baseUrl: undefined };
					}

					return { baseUrl: unisonUrl };
				},
				persistBaseUrl: async (_, event) => {
					await workspaceConfig.update(
						BASE_URL_CONFIG_NAME,
						event.data.baseUrl
					);
				},
			},
			actions: {
				setup: assign((ctx, event) => {
					if (!event.data.baseUrl) {
						return {};
					}

					const apiClient = createApiClient(event.data.baseUrl);

					const codebaseProvider = new CodebaseProvider(apiClient);

					const treeView = vscode.window.createTreeView("codebase", {
						treeDataProvider: codebaseProvider,
					});

					const editCommand = vscode.commands.registerCommand(
						"unison-ui.edit",
						Commands.edit(apiClient)
					);

					return {
						subscriptions: [...ctx.subscriptions, treeView, editCommand],
						codebaseProvider,
					};
				}),
				refresh: (ctx) => {
					if (!ctx.codebaseProvider) {
						throw new Error("Expected codebaseProvider in context");
					}

					ctx.codebaseProvider.refresh();
				},
				showNotConfiguredError: () =>
					vscode.window.showErrorMessage("Codebase not yet configured."),
			},
		}
	);

const BASE_URL_CONFIG_NAME = "unison-ui.apiBaseUrl";
