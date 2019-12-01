/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Client } from 'node-ssdp';
import fetch from 'node-fetch';

export function discovery(onDiscover: (ip: string) => void) {
    const client = new Client({});

    client.on('response', async (headers, _statusCode, rinfo) => {
        const location = headers['LOCATION'];

        if (!location) {
            console.log(`No location present, ignoring ${rinfo.address}`);
            return;
        }

        const response = await fetch(location);

        if (response.status != 200) {
            console.log(`Fetch to location returned ${response.status}, ignoring ${rinfo.address}`);
            return;
        }

        const xml = await response.text();

        if (xml.indexOf('urn:schemas-yamaha-com:service:X_YamahaExtendedControl:1') >= 0) {
            onDiscover(rinfo.address);
        }
    });

    client.search('urn:schemas-upnp-org:device:MediaRenderer:1');
}
