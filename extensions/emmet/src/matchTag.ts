/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { validate, getHtmlFlatNode, offsetRangeToSelection } from './util';
import { getRootNode } from './parseMarkupDocument';
import { HtmlNode as HtmlFlatNode } from 'EmmetFlatNode';

export function matchTag() {
	if (!validate(false) || !vscode.window.activeTextEditor) {
		return;
	}

	const editor = vscode.window.activeTextEditor;
	const document = editor.document;
	const rootNode = getRootNode(document, true);

	let updatedSelections: vscode.Selection[] = [];
	editor.selections.forEach(selection => {
		const updatedSelection = getUpdatedSelections(document, rootNode, selection.start);
		if (updatedSelection) {
			updatedSelections.push(updatedSelection);
		}
	});
	if (updatedSelections.length) {
		editor.selections = updatedSelections;
		editor.revealRange(editor.selections[updatedSelections.length - 1]);
	}
}

function getUpdatedSelections(document: vscode.TextDocument, rootNode: HtmlFlatNode, position: vscode.Position): vscode.Selection | undefined {
	const offset = document.offsetAt(position);
	const currentNode = getHtmlFlatNode(document.getText(), rootNode, offset, true);
	if (!currentNode) {
		return;
	}

	// If no closing tag or cursor is between open and close tag, then no-op
	if (currentNode.close === undefined
		|| (offset > currentNode.open.end && offset < currentNode.close.start)) {
		return;
	}

	// Place cursor inside the close tag if cursor is inside the open tag, else place it inside the open tag
	const finalOffset = (offset <= currentNode.open.end) ? currentNode.close.end + 2 : currentNode.start + 1;
	return offsetRangeToSelection(document, finalOffset, finalOffset);
}
