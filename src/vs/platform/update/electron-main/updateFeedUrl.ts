/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as fs from 'original-fs';
import * as path from 'path';
import product from 'vs/platform/node/product';

export const Win32UninstallPath = path.join(path.dirname(process.execPath), 'unins000.exe');

export function getUpdateFeedUrl(channel: string, commit: string = product.commit, arch: string = process.arch): string {
	if (!channel) {
		return null;
	}

	if (process.platform === 'win32' && !fs.existsSync(Win32UninstallPath)) {
		return null;
	}

	if (!product.updateUrl || !commit) {
		return null;
	}

	const platform = getUpdatePlatform(arch);

	return `${product.updateUrl}/api/update/${platform}/${channel}/${commit}`;
}

function getUpdatePlatform(arch: string): string {
	if (process.platform === 'linux') {
		return `linux-${arch}`;
	}

	if (process.platform === 'win32' && arch === 'x64') {
		return 'win32-x64';
	}

	return process.platform;
}