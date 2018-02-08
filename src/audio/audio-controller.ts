import { clamp } from '../utils/math';
import { EventEmitter } from '../events/event-emitter';

export class AudioController {
    constructor() { }
    
    private _volumes = new Map<string, number>();
    getVolume(channel: string): number {
        if (typeof channel !== 'string') throw new Error(`Invalid audio channel. Cannot get volume for channel ${channel}`);
        if (!this._volumes.has(channel)) return 1;
        return this._volumes.get(channel)!;
    }
    setVolume(channel: string, val: number) {
        if (typeof val !== 'number') throw new Error(`Invalid volume. Cannot set volume to ${val}`);
        if (typeof channel !== 'string') throw new Error(`Invalid audio channel. Cannot set volume for channel ${channel}`);
        val = clamp(val, 0, 1);
        let prev = this.getVolume(channel);
        if (val === prev) return;
        this._volumes.set(channel, val);
        this.volumeChanged.emit({
            channel: channel,
            volume: val
        });
    }
    
    volumeChanged = new EventEmitter<{ channel: string, volume: number }>();
}
