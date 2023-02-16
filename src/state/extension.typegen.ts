// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
	"@@xstate/typegen": true;
	internalEvents: {
		"done.invoke.extension.checking_saved_url:invocation[0]": {
			type: "done.invoke.extension.checking_saved_url:invocation[0]";
			data: unknown;
			__tip: "See the XState TS docs to learn how to strongly type this.";
		};
		"done.invoke.extension.configuring:invocation[0]": {
			type: "done.invoke.extension.configuring:invocation[0]";
			data: unknown;
			__tip: "See the XState TS docs to learn how to strongly type this.";
		};
		"done.invoke.extension.reconfiguring:invocation[0]": {
			type: "done.invoke.extension.reconfiguring:invocation[0]";
			data: unknown;
			__tip: "See the XState TS docs to learn how to strongly type this.";
		};
		"xstate.init": { type: "xstate.init" };
	};
	invokeSrcNameMap: {
		getBaseUrlFromUser:
			| "done.invoke.extension.configuring:invocation[0]"
			| "done.invoke.extension.reconfiguring:invocation[0]";
		getBaseUrlFromWorkspaceConfig: "done.invoke.extension.checking_saved_url:invocation[0]";
		persistBaseUrl: "done.invoke.extension.setting_up:invocation[0]";
	};
	missingImplementations: {
		actions: never;
		delays: never;
		guards: never;
		services: never;
	};
	eventsCausingActions: {
		refresh: "REFRESH";
		setup:
			| "done.invoke.extension.checking_saved_url:invocation[0]"
			| "done.invoke.extension.configuring:invocation[0]"
			| "done.invoke.extension.reconfiguring:invocation[0]";
		showNotConfiguredError: "REFRESH";
	};
	eventsCausingDelays: {};
	eventsCausingGuards: {};
	eventsCausingServices: {
		getBaseUrlFromUser: "CONFIGURE";
		getBaseUrlFromWorkspaceConfig: "ACTIVATE";
		persistBaseUrl:
			| "done.invoke.extension.checking_saved_url:invocation[0]"
			| "done.invoke.extension.configuring:invocation[0]"
			| "done.invoke.extension.reconfiguring:invocation[0]";
	};
	matchesStates:
		| "awaiting_configuration"
		| "checking_saved_url"
		| "configured"
		| "configuring"
		| "idle"
		| "reconfiguring"
		| "setting_up";
	tags: never;
}
