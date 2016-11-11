/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { KeyMod, KeyChord, KeyCode } from 'vs/base/common/keyCodes';
import { Range } from 'vs/editor/common/core/range';
import { EditorContextKeys, ICommonCodeEditor } from 'vs/editor/common/editorCommon';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import { ServicesAccessor, editorAction, EditorAction } from 'vs/editor/common/editorCommonExtensions';
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IDebugService, CONTEXT_IN_DEBUG_MODE, CONTEXT_NOT_IN_DEBUG_REPL, State, REPL_ID, VIEWLET_ID, IDebugEditorContribution, EDITOR_CONTRIBUTION_ID } from 'vs/workbench/parts/debug/common/debug';
import { BreakpointWidget } from 'vs/workbench/parts/debug/browser/breakpointWidget';
import { IPanelService } from 'vs/workbench/services/panel/common/panelService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';

@editorAction
class ToggleBreakpointAction extends EditorAction {
	constructor() {
		super({
			id: 'editor.debug.action.toggleBreakpoint',
			label: nls.localize('toggleBreakpointAction', "Debug: Toggle Breakpoint"),
			alias: 'Debug: Toggle Breakpoint',
			precondition: null,
			kbOpts: {
				kbExpr: EditorContextKeys.TextFocus,
				primary: KeyCode.F9
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): TPromise<void> {
		const debugService = accessor.get(IDebugService);

		const lineNumber = editor.getPosition().lineNumber;
		const modelUri = editor.getModel().uri;
		const bp = debugService.getModel().getBreakpoints()
			.filter(bp => bp.lineNumber === lineNumber && bp.uri.toString() === modelUri.toString()).pop();

		if (bp) {
			return debugService.removeBreakpoints(bp.getId());
		}
		if (debugService.getConfigurationManager().canSetBreakpointsIn(editor.getModel())) {
			return debugService.addBreakpoints(modelUri, [{ lineNumber }]);
		}
	}
}

@editorAction
class EditorConditionalBreakpointAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.debug.action.conditionalBreakpoint',
			label: nls.localize('conditionalBreakpointEditorAction', "Debug: Add Conditional Breakpoint..."),
			alias: 'Debug: Add Conditional Breakpoint...',
			precondition: null
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): void {
		const debugService = accessor.get(IDebugService);
		const instantiationService = accessor.get(IInstantiationService);

		const lineNumber = editor.getPosition().lineNumber;
		if (debugService.getConfigurationManager().canSetBreakpointsIn(editor.getModel())) {
			BreakpointWidget.createInstance(<ICodeEditor>editor, lineNumber, instantiationService);
		}
	}
}


@editorAction
class RunToCursorAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.debug.action.runToCursor',
			label: nls.localize('runToCursor', "Debug: Run to Cursor"),
			alias: 'Debug: Run to Cursor',
			precondition: ContextKeyExpr.and(CONTEXT_IN_DEBUG_MODE, CONTEXT_NOT_IN_DEBUG_REPL),
			menuOpts: {
				group: 'debug',
				order: 2
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): TPromise<void> {
		const debugService = accessor.get(IDebugService);

		if (debugService.state !== State.Stopped) {
			return TPromise.as(null);
		}
		const lineNumber = editor.getPosition().lineNumber;
		const uri = editor.getModel().uri;

		const oneTimeListener = debugService.getViewModel().focusedProcess.session.onDidEvent(event => {
			if (event.event === 'stopped' || event.event === 'exit') {
				const toRemove = debugService.getModel().getBreakpoints()
					.filter(bp => bp.lineNumber === lineNumber && bp.uri.toString() === uri.toString()).pop();
				if (toRemove) {
					debugService.removeBreakpoints(toRemove.getId());
				}
				oneTimeListener.dispose();
			}
		});

		const bpExists = !!(debugService.getModel().getBreakpoints().filter(bp => bp.lineNumber === lineNumber && bp.uri.toString() === uri.toString()).pop());
		return (bpExists ? TPromise.as(null) : debugService.addBreakpoints(uri, [{ lineNumber }])).then(() => {
			debugService.getViewModel().focusedThread.continue();
		});
	}
}

@editorAction
class SelectionToReplAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.debug.action.selectionToRepl',
			label: nls.localize('debugEvaluate', "Debug: Evaluate"),
			alias: 'Debug: Evaluate',
			precondition: ContextKeyExpr.and(EditorContextKeys.HasNonEmptySelection, CONTEXT_IN_DEBUG_MODE, CONTEXT_NOT_IN_DEBUG_REPL),
			menuOpts: {
				group: 'debug',
				order: 0
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): TPromise<void> {
		const debugService = accessor.get(IDebugService);
		const panelService = accessor.get(IPanelService);

		const text = editor.getModel().getValueInRange(editor.getSelection());
		return debugService.addReplExpression(text)
			.then(() => panelService.openPanel(REPL_ID, true))
			.then(_ => void 0);
	}
}

@editorAction
class SelectionToWatchExpressionsAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.debug.action.selectionToWatch',
			label: nls.localize('debugAddToWatch', "Debug: Add to Watch"),
			alias: 'Debug: Add to Watch',
			precondition: ContextKeyExpr.and(EditorContextKeys.HasNonEmptySelection, CONTEXT_IN_DEBUG_MODE, CONTEXT_NOT_IN_DEBUG_REPL),
			menuOpts: {
				group: 'debug',
				order: 1
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): TPromise<void> {
		const debugService = accessor.get(IDebugService);
		const viewletService = accessor.get(IViewletService);

		const text = editor.getModel().getValueInRange(editor.getSelection());
		return viewletService.openViewlet(VIEWLET_ID).then(() => debugService.addWatchExpression(text));
	}
}

@editorAction
class ShowDebugHoverAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.debug.action.showDebugHover',
			label: nls.localize('showDebugHover', "Debug: Show Hover"),
			alias: 'Debug: Show Hover',
			precondition: CONTEXT_IN_DEBUG_MODE,
			kbOpts: {
				kbExpr: EditorContextKeys.TextFocus,
				primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_K, KeyMod.CtrlCmd | KeyCode.KEY_I)
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): TPromise<void> {
		const position = editor.getPosition();
		const word = editor.getModel().getWordAtPosition(position);
		if (!word) {
			return TPromise.as(null);
		}

		const range = new Range(position.lineNumber, position.column, position.lineNumber, word.endColumn);
		return editor.getContribution<IDebugEditorContribution>(EDITOR_CONTRIBUTION_ID).showHover(range, word.word, true);
	}
}
