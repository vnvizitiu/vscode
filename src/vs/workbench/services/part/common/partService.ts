/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { createDecorator, ServiceIdentifier } from 'vs/platform/instantiation/common/instantiation';
import Event from 'vs/base/common/event';

export enum Parts {
	ACTIVITYBAR_PART,
	SIDEBAR_PART,
	PANEL_PART,
	EDITOR_PART,
	STATUSBAR_PART,
	TITLEBAR_PART
}

export enum Position {
	LEFT,
	RIGHT
}

export interface ILayoutOptions {
	forceStyleRecompute?: boolean;
	toggleMaximizedPanel?: boolean;
}

export const IPartService = createDecorator<IPartService>('partService');

export interface IPartService {
	_serviceBrand: ServiceIdentifier<any>;

	/**
	 * Emits when the visibility of the title bar changes.
	 */
	onTitleBarVisibilityChange: Event<void>;

	/**
	 * Asks the part service to layout all parts.
	 */
	layout(options?: ILayoutOptions): void;

	/**
	 * Asks the part service to if all parts have been created.
	 */
	isCreated(): boolean;

	/**
	 * Promise is complete when all parts have been created.
	 */
	joinCreation(): TPromise<boolean>;

	/**
	 * Returns whether the given part has the keyboard focus or not.
	 */
	hasFocus(part: Parts): boolean;

	/**
	 * Returns the parts HTML element, if there is one.
	 */
	getContainer(part: Parts): HTMLElement;

	/**
	 * Returns iff the part is visible.
	 */
	isVisible(part: Parts): boolean;

	/**
	 * Checks if the activity bar is currently hidden or not
	 */
	isActivityBarHidden(): boolean;

	/**
	 * Set activity bar hidden or not
	 */
	setActivityBarHidden(hidden: boolean): void;

	/**
	 * Returns iff the custom titlebar part is visible.
	 */
	isTitleBarHidden(): boolean;

	/**
	 * Number of pixels (adjusted for zooming) that the title bar (if visible) pushes down the workbench contents.
	 */
	getTitleBarOffset(): number;

	/**
	 * Checks if the statusbar is currently hidden or not
	 */
	isStatusBarHidden(): boolean;

	/**
	 * Checks if the sidebar is currently hidden or not
	 */
	isSideBarHidden(): boolean;

	/**
	 * Set sidebar hidden or not
	 */
	setSideBarHidden(hidden: boolean): void;

	/**
	 * Checks if the panel part is currently hidden or not
	 */
	isPanelHidden(): boolean;

	/**
	 * Set panel part hidden or not
	 */
	setPanelHidden(hidden: boolean): void;

	/**
	 * Maximizes the panel height if the panel is not already maximized.
	 * Shrinks the panel to the default starting size if the panel is maximized.
	 */
	toggleMaximizedPanel(): void;

	/**
	 * Gets the current side bar position. Note that the sidebar can be hidden too.
	 */
	getSideBarPosition(): Position;

	/**
	 * Adds a class to the workbench part.
	 */
	addClass(clazz: string): void;

	/**
	 * Removes a class from the workbench part.
	 */
	removeClass(clazz: string): void;

	/**
	 * Returns the identifier of the element that contains the workbench.
	 */
	getWorkbenchElementId(): string;

	/**
	 * Enables to restore the contents of the sidebar after a restart.
	 */
	setRestoreSidebar(): void;
}