/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { getHtmlFlatNode, validate } from './util';
import { HtmlNode as HtmlFlatNode } from 'EmmetFlatNode';
import { getRootNode } from './parseMarkupDocument';

export function updateTag(tagName: string): Thenable<boolean> | undefined {
	if (!validate(false) || !vscode.window.activeTextEditor) {
		return;
	}

	const editor = vscode.window.activeTextEditor;
	const document = editor.document;
	const rangesToUpdate = editor.selections.reverse()
		.reduce<vscode.Range[]>((prev, selection) =>
			prev.concat(getRangesToUpdate(document, selection)), []);

	return editor.edit(editBuilder => {
		rangesToUpdate.forEach(range => {
			editBuilder.replace(range, tagName);
		});
	});
}

function getPositionFromOffset(offset: number | undefined, document: vscode.TextDocument): vscode.Position | undefined {
	if (offset === undefined) {
		return undefined;
	}
	const pos = document.positionAt(offset);
	return new vscode.Position(pos.line, pos.character);
}

function getRangesFromNode(node: HtmlFlatNode, document: vscode.TextDocument): vscode.Range[] {
	const start = getPositionFromOffset(node.open.start, document)!;
	const startTagEnd = getPositionFromOffset(node.open.end, document);
	const endTagStart = getPositionFromOffset(node.close?.start, document);
	const end = getPositionFromOffset(node.close?.end, document)!;

	let ranges: vscode.Range[] = [];
	if (startTagEnd) {
		ranges.push(new vscode.Range(start.translate(0, 1),
			start.translate(0, 1).translate(0, node.name.length)));
	}
	if (endTagStart) {
		ranges.push(new vscode.Range(endTagStart.translate(0, 2), end.translate(0, -1)));
	}
	return ranges;
}

function getRangesToUpdate(document: vscode.TextDocument, selection: vscode.Selection): vscode.Range[] {
	const documentText = document.getText();
	const rootNode = getRootNode(document, true);
	const offset = document.offsetAt(selection.start);
	const nodeToUpdate = getHtmlFlatNode(documentText, rootNode, offset, true);
	if (!nodeToUpdate) {
		return [];
	}
	return getRangesFromNode(nodeToUpdate, document);
}
