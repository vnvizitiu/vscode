/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

export interface TSConfig {
	path: string;
	workspaceFolder?: vscode.WorkspaceFolder;
}

export default class TsConfigProvider extends vscode.Disposable {
	private readonly tsconfigs = new Map<string, TSConfig>();

	private activated: boolean = false;
	private disposables: vscode.Disposable[] = [];

	constructor() {
		super(() => this.dispose());
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
	}

	public async getConfigsForWorkspace(): Promise<Iterable<TSConfig>> {
		if (!vscode.workspace.workspaceFolders) {
			return [];
		}
		await this.ensureActivated();
		return this.tsconfigs.values();
	}

	private async ensureActivated(): Promise<this> {
		if (this.activated) {
			return this;
		}
		this.activated = true;

		this.reloadWorkspaceConfigs();

		const configFileWatcher = vscode.workspace.createFileSystemWatcher('**/tsconfig*.json');
		this.disposables.push(configFileWatcher);
		configFileWatcher.onDidCreate(this.handleProjectCreate, this, this.disposables);
		configFileWatcher.onDidDelete(this.handleProjectDelete, this, this.disposables);

		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			this.reloadWorkspaceConfigs();
		}, this, this.disposables);

		return this;
	}

	private async reloadWorkspaceConfigs(): Promise<this> {
		this.tsconfigs.clear();
		for (const config of await vscode.workspace.findFiles('**/tsconfig*.json', '**/node_modules/**')) {
			this.handleProjectCreate(config);
		}
		return this;
	}

	private handleProjectCreate(config: vscode.Uri) {
		const root = vscode.workspace.getWorkspaceFolder(config);
		if (root) {
			this.tsconfigs.set(config.fsPath, {
				path: config.fsPath,
				workspaceFolder: root
			});
		}
	}

	private handleProjectDelete(e: vscode.Uri) {
		this.tsconfigs.delete(e.fsPath);
	}
}
