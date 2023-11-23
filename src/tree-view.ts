import path = require("path");
import * as vscode from "vscode";
import * as API from "./api";
import { mapDefinitionsByName } from "./definition";

export class CodebaseProvider
	implements vscode.TreeDataProvider<CodebaseTreeviewChild>
{
	_onDidChangeTreeData: vscode.EventEmitter<
		CodebaseTreeviewChild | undefined | null | void
	> = new vscode.EventEmitter<
		CodebaseTreeviewChild | undefined | null | void
	>();
	onDidChangeTreeData: vscode.Event<
		CodebaseTreeviewChild | undefined | null | void
	> = this._onDidChangeTreeData.event;

	constructor(private readonly apiClient: API.ApiClient) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async getTreeItem(
		element: CodebaseTreeviewChild
	): Promise<CodebaseTreeviewChild> {
		return element;
	}

	async resolveTreeItem(
		item: vscode.TreeItem,
		element: CodebaseTreeviewChild
	): Promise<vscode.TreeItem> {
		if (
			element.unisonChild.tag === "TermObject" ||
			element.unisonChild.tag === "TypeObject"
		) {
			const name =
				element.unisonChild.tag === "TermObject"
					? element.unisonChild.contents.termHash
					: element.unisonChild.contents.typeHash;

			const definition = await this.apiClient.getDefinition({
				names: name,
			});

			const mapDefinitions = mapDefinitionsByName(name);
			const termDefinitions = mapDefinitions(definition.termDefinitions);
			const typeDefinitions = mapDefinitions(definition.typeDefinitions);

			const signatureTokens =
				termDefinitions[name]?.signature ??
				typeDefinitions[name]?.typeDefinition.contents;

			if (signatureTokens) {
				const typeDefinition = signatureTokens
					.map((token) => token.segment)
					.join("");

				item.tooltip = new vscode.MarkdownString(
					`\`\`\`\n${typeDefinition}\n\`\`\``
				);
			}
		}

		return item;
	}

	async getChildren(
		element?: CodebaseTreeviewChild
	): Promise<CodebaseTreeviewChild[]> {
		const listing = await this.apiClient.list(element?.namespaceListingFQN);
		return listing.namespaceListingChildren
			.map((child) => mapListingChildToTreeItem(child, listing))
			.filter((child): child is CodebaseTreeviewChild => Boolean(child));
	}
}

const mapListingChildToTreeItem = (
	child: API.TNamespaceChild,
	listing: API.TNamespaceListing
): CodebaseTreeviewChild | null => {
	switch (child.tag) {
		case "Subnamespace":
			return new CodebaseTreeviewChild(
				child.contents.namespaceName,
				child,
				[listing.namespaceListingFQN, child.contents.namespaceName]
					.filter((n) => n !== "")
					.join(".")
			);

		case "TermObject":
			return new CodebaseTermTreeviewChild(child.contents.termName, child);

		case "TypeObject":
			return new CodebaseTypeTreeviewChild(child.contents.typeName, child);

		case "PatchObject":
			return null;
	}

	// Only reachable if we forget a child type
	throw new Error("Unimplemented " + (child as any).tag);
};

class CodebaseTreeviewChild extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly unisonChild: API.TNamespaceChild,
		public readonly namespaceListingFQN?: string
	) {
		super(
			label,
			namespaceListingFQN
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None
		);

		this.id = getNamespaceChildId(unisonChild);
		const iconName = getNamespaceChildIconName(unisonChild);
		if (iconName) {
			this.iconPath = path.join(__filename, "..", "..", "resources", iconName);
		}
	}
}

class CodebaseTypeTreeviewChild extends CodebaseTreeviewChild {
	constructor(
		public readonly label: string,
		public readonly unisonChild: API.TTypeObject,
		public readonly namespaceListingFQN?: string
	) {
		super(label, unisonChild, namespaceListingFQN);
		
        this.command = {
            title: "Edit Type",
            command: "unison-ui.edit",
            arguments: [unisonChild.contents.typeHash]
        };
	}
}

class CodebaseTermTreeviewChild extends CodebaseTreeviewChild {
	constructor(
		public readonly label: string,
		public readonly unisonChild: API.TTermObject,
		public readonly namespaceListingFQN?: string
	) {
		super(label, unisonChild, namespaceListingFQN);
		
        this.command = {
            title: "Edit Term",
            command: "unison-ui.edit",
            arguments: [unisonChild.contents.termHash]
        };
	}
}


function getNamespaceChildId(child: API.TNamespaceChild): string {
	switch (child.tag) {
		case "Subnamespace":
			// UCM sometimes has namespaces with the same hash under different names. I guess this makes sense, and I think that a name+hash is a unique identifier for a namespace.
			return `${child.contents.namespaceName}${child.contents.namespaceHash}`;

		case "TermObject":
			return `${child.contents.termName}${child.contents.termHash}`;

		case "TypeObject":
			return `${child.contents.typeName}${child.contents.typeHash}`;

		case "PatchObject":
			throw new Error("Id is not implemented for PatchObject");
	}
}

function getNamespaceChildIconName(child: API.TNamespaceChild): string | null {
	if (child.tag === "PatchObject") {
		return "icon-patch.svg";
	}

	if (child.tag === "TypeObject") {
		switch (child.contents.typeTag) {
			case "Ability":
				return "icon-ability.svg";
			case "Data":
				return "icon-type.svg";
			default:
				return null;
		}
	}

	if (child.tag === "TermObject") {
		switch (child.contents.termTag) {
			case "Doc":
				return "icon-document.svg";
			case "Test":
				return "icon-checkmark.svg";
			default:
				return "icon-term.svg";
		}
	}

	return null;
}
