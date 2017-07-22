/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//tslint:disable
'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

type AutoDetect = 'on' | 'off';
let taskProvider: vscode.Disposable | undefined;

export function activate(_context: vscode.ExtensionContext): void {
	if (!vscode.workspace.workspaceFolders) {
		return;
	}

	function onConfigurationChanged() {
		let autoDetect = vscode.workspace.getConfiguration('npm').get<AutoDetect>('autoDetect');
		if (taskProvider && autoDetect === 'off') {
			taskProvider.dispose();
			taskProvider = undefined;
		} else if (!taskProvider && autoDetect === 'on') {
			taskProvider = vscode.workspace.registerTaskProvider('npm', {
				provideTasks: () => {
					return provideNpmScripts();
				},
				resolveTask(_task: vscode.Task): vscode.Task | undefined {
					return undefined;
				}
			});
		}
	}
	vscode.workspace.onDidChangeConfiguration(onConfigurationChanged);
	onConfigurationChanged();
}

export function deactivate(): void {
	if (taskProvider) {
		taskProvider.dispose();
	}
}

async function exists(file: string): Promise<boolean> {
	return new Promise<boolean>((resolve, _reject) => {
		fs.exists(file, (value) => {
			resolve(value);
		});
	});
}

async function readFile(file: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		fs.readFile(file, (err, data) => {
			if (err) {
				reject(err);
			}
			resolve(data.toString());
		});
	});
}

interface NpmTaskDefinition extends vscode.TaskDefinition {
	script: string;
	file?: string;
}

const buildNames: string[] = ['build', 'compile', 'watch'];
function isBuildTask(name: string): boolean {
	for (let buildName of buildNames) {
		if (name.indexOf(buildName) !== -1) {
			return true;
		}
	}
	return false;
}

const testNames: string[] = ['test'];
function isTestTask(name: string): boolean {
	for (let testName of testNames) {
		if (name === testName) {
			return true;
		}
	}
	return false;
}

function isNotPreOrPostScript(script: string): boolean {
	return !(script.startsWith('pre') || script.startsWith('post'));
}

async function provideNpmScripts(): Promise<vscode.Task[]> {
	let emptyTasks: vscode.Task[] = [];
	let allTasks: vscode.Task[] = [];
	let folders = vscode.workspace.workspaceFolders;

	if (!folders) {
		return emptyTasks;
	}

	const isSingleRoot = folders.length === 1;

	for (let i = 0; i < folders.length; i++) {
		let tasks = await provideNpmScriptsForFolder(folders[i], isSingleRoot);
		allTasks.push(...tasks);
	}
	return allTasks;
}

async function provideNpmScriptsForFolder(folder: vscode.WorkspaceFolder, singleRoot: boolean): Promise<vscode.Task[]> {
	let rootPath = folder.uri.fsPath;
	let emptyTasks: vscode.Task[] = [];

	let packageJson = path.join(rootPath, 'package.json');
	if (!await exists(packageJson)) {
		return emptyTasks;
	}

	try {
		var contents = await readFile(packageJson);
		var json = JSON.parse(contents);
		if (!json.scripts) {
			return emptyTasks;
		}

		const result: vscode.Task[] = [];
		Object.keys(json.scripts).filter(isNotPreOrPostScript).forEach(each => {
			const task = createTask(each, `run ${each}`, rootPath, folder.name, singleRoot);
			const lowerCaseTaskName = each.toLowerCase();
			if (isBuildTask(lowerCaseTaskName)) {
				task.group = vscode.TaskGroup.Build;
			} else if (isTestTask(lowerCaseTaskName)) {
				task.group = vscode.TaskGroup.Test;
			}
			result.push(task);
		});
		// always add npm install (without a problem matcher)
		result.push(createTask('install', 'install', rootPath, folder.name, singleRoot, []));
		return result;
	} catch (e) {
		return emptyTasks;
	}
}

function createTask(script: string, cmd: string, rootPath: string, shortPath: string, singleRoot: boolean, matcher?: any): vscode.Task {

	function getTaskName(script: string, shortPath: string, singleRoot: boolean) {
		if (singleRoot) {
			return script;
		}
		return `${script} - ${shortPath}`;
	}

	function getNpmCommandLine(cmd: string): string {
		if (vscode.workspace.getConfiguration('npm').get<boolean>('runSilent')) {
			return `npm --silent ${cmd}`;
		}
		return `npm ${cmd}`;
	}

	let kind: NpmTaskDefinition = {
		type: 'npm',
		script: script
	};
	let taskName = getTaskName(script, shortPath, singleRoot);

	return new vscode.Task(kind, taskName, 'npm', new vscode.ShellExecution(getNpmCommandLine(cmd), { cwd: rootPath }), matcher);
}