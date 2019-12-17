/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import fetch from 'node-fetch';

export class Yamaha {
    constructor(private host: string) {
    }

    public async getDeviceInfo(): Promise<DeviceInfo> {
        return this.get('system/getDeviceInfo');
    }

    public async getFeatures(): Promise<Features> {
        return this.get('system/getFeatures');
    }

    public async getStatus(zone: string = 'main'): Promise<Status> {
        return this.get(`${zone}/getStatus`);
    }

    public async setPower(power: "on" | "standby" | "toggle", zone: string = 'main'): Promise<Response> {
        return this.get(`${zone}/setPower?power=${power}`);
    }

    public async setVolume(volume: number, zone: string = 'main'): Promise<Response> {
        return this.get(`${zone}/setVolume?volume=${volume}`);
    }

    public async setInput(input: string, zone: string = 'main'): Promise<Response> {
        return this.get(`${zone}/setInput?input=${input}&mode=autoplay_disabled`);
    }

    public async getPlayInfo(): Promise<PlayInfo> {
        return this.get('netusb/getPlayInfo');
    }

    public async setPlayback(playback: string): Promise<Response> {
        return this.get(`netusb/setPlayback?playback=${playback}`);
    }

    private async get(commandPath: string) {
        const result = await fetch(`http://${this.host}/YamahaExtendedControl/v1/${commandPath}`);
        return await result.json();
    }
}

export enum ResponseCode {
    ok = 0
}

export interface Response {
    response_code: ResponseCode,
}

export interface DeviceInfo extends Response {
    model_name: string,
    destination: string,
    device_id: string,
    system_id: string,
    system_version: number,
    api_version: number,
    netmodule_generation: number,
    netmodule_version: string,
    netmodule_checksum: string,
    serial_number: string,
    category_code: number,
    operation_mode: string,
    update_error_code: string,
    net_module_num: number,
}

export interface Features extends Response {
    system: System;
    zone?: ZoneEntity[];
    tuner: Tuner;
    netusb: Netusb;
    distribution: Distribution;
    ccs: Ccs;
}

export interface System {
    func_list?: string[];
    zone_num: number;
    input_list?: InputListEntity[];
    bluetooth: Bluetooth;
    web_control_url: string;
    party_volume_list?: string[];
    hdmi_standby_through_list?: string[];
}

export interface InputListEntity {
    id: string;
    distribution_enable: boolean;
    rename_enable: boolean;
    account_enable: boolean;
    play_info_type: string;
}

export interface Bluetooth {
    update_cancelable: boolean;
}

export interface ZoneEntity {
    id: string;
    func_list?: string[];
    input_list?: string[];
    sound_program_list?: string[];
    surr_decoder_type_list?: string[];
    tone_control_mode_list?: string[];
    link_control_list?: string[];
    link_audio_delay_list?: string[];
    range_step?: RangeStepEntity[];
    scene_num: number;
    cursor_list?: string[];
    menu_list?: string[];
    actual_volume_mode_list?: string[];
    ccs_supported?: string[];
    zone_b?: boolean | null;
}

export interface RangeStepEntity {
    id: string;
    min: number;
    max: number;
    step: number;
}

export interface Tuner {
    func_list?: string[];
    range_step?: RangeStepEntity[];
    preset: Preset;
}

export interface Preset {
    type: string;
    num: number;
}

export interface Netusb {
    func_list?: string[];
    preset: PresetOrRecentInfo;
    recent_info: PresetOrRecentInfo;
    play_queue: PlayQueue;
    mc_playlist: McPlaylist;
    net_radio_type: string;
}

export interface PresetOrRecentInfo {
    num: number;
}

export interface PlayQueue {
    size: number;
}

export interface McPlaylist {
    size: number;
    num: number;
}

export interface Distribution {
    version: number;
    compatible_client?: number[];
    client_max: number;
    server_zone_list?: string[];
    mc_surround: McSurround;
}

export interface McSurround {
    version: number;
    func_list?: string[];
    master_role: MasterRole;
    slave_role: SlaveRole;
}

export interface MasterRole {
    surround_pair: boolean;
    stereo_pair: boolean;
    subwoofer_pair: boolean;
}

export interface SlaveRole {
    surround_pair_l_or_r: boolean;
    surround_pair_lr: boolean;
    subwoofer_pair: boolean;
}

export interface Ccs {
    supported: boolean;
}

export interface Status {
    response_code: number;
    power: "on" | "standby";
    sleep: number;
    volume: number;
    mute: boolean;
    max_volume: number;
    input: string;
    input_text: string;
    distribution_enable: boolean;
    sound_program: string;
    surr_decoder_type: string;
    direct: boolean;
    enhancer: boolean;
    tone_control: ToneControl;
    dialogue_level: number;
    subwoofer_volume: number;
    link_control: string;
    link_audio_delay: string;
    disable_flags: number;
    contents_display: boolean;
    actual_volume: ActualVolume;
    party_enable: boolean;
    extra_bass: boolean;
    adaptive_drc: boolean;
}

export interface ToneControl {
    mode: string;
    bass: number;
    treble: number;
}

export interface ActualVolume {
    mode: string;
    value: number;
    unit: string;
}

export interface PlayInfo extends Response {
    input: string,
    play_queue_type: string,
    playback: string,
    repeat: string,
    shuffle: string,
    play_time: number,
    total_time: number,
    artist: string,
    album: string,
    track: string,
    albumart_url: string,
    albumart_id: number,
    usb_devicetype: string,
    auto_stopped: false,
    attribute: number,
    repeat_available: [],
    shuffle_available: []
}
