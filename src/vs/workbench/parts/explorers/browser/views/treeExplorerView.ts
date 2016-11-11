/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import * as DOM from 'vs/base/browser/dom';
import { Builder, $ } from 'vs/base/browser/builder';
import { IWorkspace, IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { CollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { IAction, IActionRunner } from 'vs/base/common/actions';
import { IMessageService } from 'vs/platform/message/common/message';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ICustomTreeExplorerService } from 'vs/workbench/parts/explorers/common/customTreeExplorerService';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { TreeExplorerViewletState, TreeDataSource, TreeRenderer, TreeController } from 'vs/workbench/parts/explorers/browser/views/treeExplorerViewer';
import { RefreshViewExplorerAction } from 'vs/workbench/parts/explorers/browser/treeExplorerActions';
import { IProgressService } from 'vs/platform/progress/common/progress';

export class TreeExplorerView extends CollapsibleViewletView {
	private workspace: IWorkspace;

	constructor(
		private viewletState: TreeExplorerViewletState,
		private treeNodeProviderId: string,
		actionRunner: IActionRunner,
		headerSize: number,
		@IMessageService messageService: IMessageService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IWorkspaceContextService private contextService: IWorkspaceContextService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@ICustomTreeExplorerService private treeExplorerViewletService: ICustomTreeExplorerService,
		@IProgressService private progressService: IProgressService
	) {
		super(actionRunner, false, nls.localize('treeExplorerViewlet.tree', "Tree Explorer Section"), messageService, keybindingService, contextMenuService, headerSize);

		this.workspace = contextService.getWorkspace();

		this.create();
	}

	public renderBody(container: HTMLElement): void {
		this.treeContainer = super.renderViewTree(container);
		DOM.addClass(this.treeContainer, 'tree-explorer-viewlet-tree-view');

		this.tree = this.createViewer($(this.treeContainer));
	}

	public createViewer(container: Builder): ITree {
		const dataSource = this.instantiationService.createInstance(TreeDataSource, this.treeNodeProviderId);
		const renderer = this.instantiationService.createInstance(TreeRenderer, this.viewletState, this.actionRunner, container.getHTMLElement());
		const controller = this.instantiationService.createInstance(TreeController, this.treeNodeProviderId);
		const sorter = null;
		const filter = null;
		const dnd = null;
		const accessibilityProvider = null;

		return new Tree(container.getHTMLElement(), {
			dataSource,
			renderer,
			controller,
			sorter,
			filter,
			dnd,
			accessibilityProvider
		});
	}

	public getActions(): IAction[] {
		const refresh = this.instantiationService.createInstance(RefreshViewExplorerAction, this);
		return [refresh];
	}

	public create(): TPromise<void> {
		return this.updateInput();
	}

	public setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible);
	}

	public updateInput(): TPromise<void> {
		if (this.treeExplorerViewletService.hasProvider(this.treeNodeProviderId)) {
			return this.treeExplorerViewletService.provideRootNode(this.treeNodeProviderId).then(tree => {
				this.tree.setInput(tree);
			});
		}
		// Provider registration happens independently of the reading of extension's contribution,
		// which constructs the viewlet, so it's possible the viewlet is constructed before a provider
		// is registered.
		// This renders the viewlet first and wait for a corresponding provider is registered.
		else {
			this.treeExplorerViewletService.onTreeExplorerNodeProviderRegistered(providerId => {
				if (this.treeNodeProviderId === providerId) {
					return this.treeExplorerViewletService.provideRootNode(this.treeNodeProviderId).then(tree => {
						this.tree.setInput(tree);
					});
				}
			});

			return TPromise.as(null);
		}
	}

	public getOptimalWidth(): number {
		const parentNode = this.tree.getHTMLElement();
		const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));

		return DOM.getLargestChildWidth(parentNode, childNodes);
	}
}
