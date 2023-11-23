import * as vscode from "vscode";
import { ApiClient } from "./api";
import { definitionSource, mapDefinitionsByName } from "./definition";

// BUG: if a definition exists in the file already, we should not insert it again.
// BUG: when inserting at the beginning of a file whitespace formats nicely, but when inserting inside a file it does not.
// CONSIDERATION: should the definition be shared when it's loaded from the sidebar? i was worried about dealing with stale data.
export const edit = (apiClient: ApiClient) => async  (names: string) => {
    const fsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!fsPath) {
        throw new Error("Could not find VSCode workspace");
    }

    // build the source
    const definition = await apiClient.getDefinition({ names });
    const mapDefinitions = mapDefinitionsByName(names);
    const termDefinitions = mapDefinitions(definition.termDefinitions);
    const typeDefinitions = mapDefinitions(definition.typeDefinitions);
    const source = definitionSource(
        termDefinitions[names]?.termDefinition ||
        typeDefinitions[names]?.typeDefinition
    );

    if (!source) {
        throw new Error(`Could not find definitions for ${names}`);
    }

    // create scratch.u and focus it
    const uri = vscode.Uri.file([fsPath, "scratch.u"].join("/"));
    const edit = new vscode.WorkspaceEdit();
    edit.createFile(uri, { ignoreIfExists: true });
    await vscode.workspace.applyEdit(edit);
    await vscode.window.showTextDocument(uri, { preview: false });
    
    // prepend source to scratch.u at current selection, and reset current selection.
    // this enables both the "prepend to top" default, as well as "insert how you want".
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active;
        editor.edit((text) => text.replace(position, `${source}\n\n`));
        editor.selections = [new vscode.Selection(position, position)];
    }
};
