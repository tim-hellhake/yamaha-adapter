/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';
import { DeviceInfo, Features, Yamaha, RangeStepEntity, Status, PlayInfo } from './yamaha';
import { discovery } from './discovery';

class PowerProperty extends Property {
  constructor(private device: Device, private yamaha: Yamaha) {
    super(device, 'power', {
      type: 'boolean',
      title: 'power',
      description: 'Whether the device is powered on'
    })
  }

  async setValue(value: boolean) {
    try {
      console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
      await super.setValue(value);
      const power = value ? 'on' : 'standby';
      const response = await this.yamaha.setPower(power);
      console.log(JSON.stringify(response));
    } catch (e) {
      console.log(`Could not set value: ${e}`);
    }
  }

  public update(status: Status) {
    if (this.value !== status.power) {
      this.setCachedValue(status.power == 'on');
      this.device.notifyPropertyChanged(this);
    }
  }
}

class VolumeProperty extends Property {
  constructor(private device: Device, private yamaha: Yamaha, rangeStep?: RangeStepEntity) {
    super(device, 'volume', {
      '@type': 'LevelProperty',
      type: 'integer',
      minimum: rangeStep?.min || 0,
      maximum: rangeStep?.max || 600,
      multipleOf: rangeStep?.step || 1,
      title: 'volume',
      description: 'The volume'
    })
  }

  async setValue(value: number) {
    try {
      console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
      await super.setValue(value);
      const response = await this.yamaha.setVolume(value);
      console.log(JSON.stringify(response));
    } catch (e) {
      console.log(`Could not set value: ${e}`);
    }
  }

  public update(status: Status) {
    if (this.value !== status.volume) {
      this.setCachedValue(status.volume);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class InputProperty extends Property {
  constructor(private device: Device, private yamaha: Yamaha, features: Features) {
    super(device, 'input', {
      type: 'string',
      title: 'input',
      description: 'The input',
      enum: (features?.system?.input_list || []).map(input => input.id)
    })
  }

  async setValue(value: string) {
    try {
      console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
      await super.setValue(value);
      const response = await this.yamaha.setInput(value);
      console.log(JSON.stringify(response));
    } catch (e) {
      console.log(`Could not set value: ${e}`);
    }
  }

  public update(status: Status) {
    if (this.value !== status.input) {
      this.setCachedValue(status.input);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class TrackProperty extends Property {
  constructor(private device: Device) {
    super(device, 'track', {
      type: 'string',
      title: 'track',
      description: 'The track which is currently played',
      readOnly: true
    })
  }

  public update(playInfo: PlayInfo) {
    if (this.value !== playInfo.track) {
      this.setCachedValue(playInfo.track);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class AlbumProperty extends Property {
  constructor(private device: Device) {
    super(device, 'album', {
      type: 'string',
      title: 'album',
      description: 'The album which is currently played',
      readOnly: true
    })
  }

  public update(playInfo: PlayInfo) {
    if (this.value !== playInfo.album) {
      this.setCachedValue(playInfo.album);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class ArtistProperty extends Property {
  constructor(private device: Device) {
    super(device, 'artist', {
      type: 'string',
      title: 'artist',
      description: 'The artist which is currently played',
      readOnly: true
    })
  }

  public update(playInfo: PlayInfo) {
    if (this.value !== playInfo.artist) {
      this.setCachedValue(playInfo.artist);
      this.device.notifyPropertyChanged(this);
    }
  }
}

class YamahaDevice extends Device {
  private callbacks: { [name: string]: () => void } = {};
  private powerProperty: PowerProperty;
  private volumeProperty: VolumeProperty;
  private inputProperty: InputProperty;
  private trackProperty: TrackProperty;
  private albumProperty: AlbumProperty;
  private artistProperty: ArtistProperty;

  constructor(adapter: Adapter, private yamaha: Yamaha, deviceInfo: DeviceInfo, features: Features) {
    super(adapter, `yamaha-${deviceInfo.device_id}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this['@type'] = ['MultiLevelSwitch'];
    this.name = deviceInfo.device_id;

    this.powerProperty = new PowerProperty(this, yamaha);
    this.properties.set(this.powerProperty.name, this.powerProperty);

    const zones = features.zone || [];
    const rangeSteps = findFirst(zone => zone.id == 'main', zones)?.range_step || [];
    const rangeStep = findFirst(rangeStep => rangeStep.id == 'volume', rangeSteps);
    this.volumeProperty = new VolumeProperty(this, yamaha, rangeStep);
    this.properties.set(this.volumeProperty.name, this.volumeProperty);

    this.inputProperty = new InputProperty(this, yamaha, features);
    this.properties.set(this.inputProperty.name, this.inputProperty);

    this.trackProperty = new TrackProperty(this);
    this.properties.set(this.trackProperty.name, this.trackProperty);

    this.albumProperty = new AlbumProperty(this);
    this.properties.set(this.albumProperty.name, this.albumProperty);

    this.artistProperty = new ArtistProperty(this);
    this.properties.set(this.artistProperty.name, this.artistProperty);

    this.addCallbackAction('play', 'Continue the playback', () => {
      this.yamaha.setPlayback('play');
    });

    this.addCallbackAction('pause', 'Pause the playback', () => {
      this.yamaha.setPlayback('pause');
    });

    this.addCallbackAction('previous', 'Jump to the previous track', () => {
      this.yamaha.setPlayback('previous');
    });

    this.addCallbackAction('next', 'Jump to the next track', () => {
      this.yamaha.setPlayback('next');
    });
  }

  public startPolling(milliseconds: number) {
    setInterval(() => {
      this.poll();
    }, milliseconds)
  }

  private async poll() {
    const status = await this.yamaha.getStatus();
    this.powerProperty.update(status);
    this.volumeProperty.update(status);
    this.inputProperty.update(status);

    const playInfo = await this.yamaha.getPlayInfo();
    this.trackProperty.update(playInfo);
    this.albumProperty.update(playInfo);
    this.artistProperty.update(playInfo);
  }

  addCallbackAction(title: string, description: string, callback: () => void) {
    this.addAction(title, {
      title,
      description
    });

    this.callbacks[title] = callback;
  }

  async performAction(action: any) {
    action.start();

    const callback = this.callbacks[action.name];

    if (callback) {
      callback();
    } else {
      console.warn(`Unknown action ${action.name}`);
    }

    action.finish();
  }
}

function findFirst<T>(predicate: (t: T) => boolean, arr: T[]): T | undefined {
  const found = arr.filter(predicate);

  if (found.length > 0) {
    return found[0];
  }

  return undefined;
}

export class YamahaAdapter extends Adapter {
  private knownDevices: { [key: string]: YamahaDevice } = {};

  constructor(addonManager: any, manifest: any) {
    super(addonManager, YamahaAdapter.name, manifest.id);
    addonManager.addAdapter(this);

    const {
      pollInterval
    } = manifest.moziot.config;

    this.search(pollInterval || 1000);
  }

  private search(pollInterval: number) {
    discovery(async ip => {
      const yamaha = new Yamaha(ip);
      const deviceInfo = await yamaha.getDeviceInfo();

      if (!this.knownDevices[deviceInfo.device_id]) {
        console.log(`Found yamaha ${deviceInfo.model_name} (${deviceInfo.device_id})`);
        const features = await yamaha.getFeatures();
        const device = new YamahaDevice(this, yamaha, deviceInfo, features);
        this.knownDevices[deviceInfo.device_id] = device;
        this.handleDeviceAdded(device);
        device.startPolling(pollInterval);
      }
    });
  }
}
