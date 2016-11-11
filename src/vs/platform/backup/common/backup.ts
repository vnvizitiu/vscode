/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import Uri from 'vs/base/common/uri';

export interface IBackupWorkspacesFormat {
	folderWorkspaces: string[];
}

export const IBackupMainService = createDecorator<IBackupMainService>('backupService');

export interface IBackupMainService {
	_serviceBrand: any;

	/**
	 * Gets the set of active workspace backup paths being tracked for restoration.
	 *
	 * @return The set of active workspace backup paths being tracked for restoration.
	 */
	getWorkspaceBackupPaths(): string[];

	/**
	 * Pushes workspace backup paths to be tracked for restoration.
	 *
	 * @param workspaces The workspaces to add.
	 */
	pushWorkspaceBackupPathsSync(workspaces: Uri[]): void;

	/**
	 * Removes a workspace backup path being tracked for restoration.
	 *
	 * @param workspace The workspace to remove.
	 */
	removeWorkspaceBackupPathSync(workspace: Uri): void;

	/**
	 * Gets the set of untitled file backups for a particular workspace.
	 *
	 * @param workspace The workspace to get the backups for.
	 * @return The absolute paths for all the untitled file _backups_.
	 */
	getWorkspaceUntitledFileBackupsSync(workspace: Uri): string[];

	/**
	 * Gets whether the workspace has backup(s) associated with it (ie. if the workspace backup
	 * directory exists).
	 *
	 * @param workspace The workspace to evaluate.
	 * @return Whether the workspace has backups.
	 */
	hasWorkspaceBackup(workspace: Uri): boolean;
}
