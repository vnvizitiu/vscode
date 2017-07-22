/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as editorCommon from 'vs/editor/common/editorCommon';

export function getSelectionSearchString(editor: editorCommon.ICommonCodeEditor): string {
	let selection = editor.getSelection();

	// if selection spans multiple lines, default search string to empty
	if (selection.startLineNumber === selection.endLineNumber) {
		if (selection.isEmpty()) {
			let wordAtPosition = editor.getModel().getWordAtPosition(selection.getStartPosition());
			if (wordAtPosition) {
				return wordAtPosition.word;
			}
		} else {
			return editor.getModel().getValueInRange(selection);
		}
	}

	return null;
}
