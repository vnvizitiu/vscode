/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import Event from 'vs/base/common/event';

export const IWindowsService = createDecorator<IWindowsService>('windowsService');

export interface IWindowsService {

	_serviceBrand: any;

	onWindowOpen: Event<number>;
	onWindowFocus: Event<number>;

	openFileFolderPicker(windowId: number, forceNewWindow?: boolean): TPromise<void>;
	openFilePicker(windowId: number, forceNewWindow?: boolean, path?: string): TPromise<void>;
	openFolderPicker(windowId: number, forceNewWindow?: boolean): TPromise<void>;
	reloadWindow(windowId: number): TPromise<void>;
	openDevTools(windowId: number): TPromise<void>;
	toggleDevTools(windowId: number): TPromise<void>;
	// TODO@joao: rename, shouldn't this be closeWindow?
	closeFolder(windowId: number): TPromise<void>;
	toggleFullScreen(windowId: number): TPromise<void>;
	setRepresentedFilename(windowId: number, fileName: string): TPromise<void>;
	addToRecentlyOpen(paths: { path: string, isFile?: boolean }[]): TPromise<void>;
	removeFromRecentlyOpen(paths: string[]): TPromise<void>;
	getRecentlyOpen(windowId: number): TPromise<{ files: string[]; folders: string[]; }>;
	focusWindow(windowId: number): TPromise<void>;
	isMaximized(windowId: number): TPromise<boolean>;
	maximizeWindow(windowId: number): TPromise<void>;
	unmaximizeWindow(windowId: number): TPromise<void>;
	setDocumentEdited(windowId: number, flag: boolean): TPromise<void>;
	toggleMenuBar(windowId: number): TPromise<void>;

	// Global methods
	// TODO@joao: rename, shouldn't this be openWindow?
	windowOpen(paths: string[], forceNewWindow?: boolean): TPromise<void>;
	openNewWindow(): TPromise<void>;
	showWindow(windowId: number): TPromise<void>;
	getWindows(): TPromise<{ id: number; path: string; title: string; }[]>;
	log(severity: string, ...messages: string[]): TPromise<void>;
	// TODO@joao: what?
	closeExtensionHostWindow(extensionDevelopmentPath: string): TPromise<void>;
	showItemInFolder(path: string): TPromise<void>;

	// This needs to be handled from browser process to prevent
	// foreground ordering issues on Windows
	openExternal(url: string): TPromise<void>;

	// TODO: this is a bit backwards
	startCrashReporter(config: Electron.CrashReporterStartOptions): TPromise<void>;
}

export const IWindowService = createDecorator<IWindowService>('windowService');

export interface IWindowService {

	_serviceBrand: any;

	getCurrentWindowId(): number;
	openFileFolderPicker(forceNewWindow?: boolean): TPromise<void>;
	openFilePicker(forceNewWindow?: boolean, path?: string): TPromise<void>;
	openFolderPicker(forceNewWindow?: boolean): TPromise<void>;
	reloadWindow(): TPromise<void>;
	openDevTools(): TPromise<void>;
	toggleDevTools(): TPromise<void>;
	closeFolder(): TPromise<void>;
	toggleFullScreen(): TPromise<void>;
	setRepresentedFilename(fileName: string): TPromise<void>;
	addToRecentlyOpen(paths: { path: string, isFile?: boolean }[]): TPromise<void>;
	removeFromRecentlyOpen(paths: string[]): TPromise<void>;
	getRecentlyOpen(): TPromise<{ files: string[]; folders: string[]; }>;
	focusWindow(): TPromise<void>;
	setDocumentEdited(flag: boolean): TPromise<void>;
	toggleMenuBar(): TPromise<void>;
	isMaximized(): TPromise<boolean>;
	maximizeWindow(): TPromise<void>;
	unmaximizeWindow(): TPromise<void>;
}