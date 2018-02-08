import { GameEvent } from './events';
import { EventQueue } from './event-queue';

import { AbstractButtonProvider } from './abstract-button-provider';

export class KeyboardAbstractButtonProvider implements AbstractButtonProvider {
    constructor(private queue: EventQueue) { }
    
    //key code => abstract button names[]
    private _keys = new Map<string, string[]>();
    bindAbstractButton(name: string, ...keys: string[]) {
        for (let key of keys) {
            if (!this._keys.has(key)) this._keys.set(key, []);
            this._keys.get(key)!.push(name);
            if (!this.queue.abstractButtons.has(name)) this.queue.abstractButtons.set(name, false);
            let previous = this.queue.abstractButtons.get(name);
            let current = this.queue.isKeyDown(key);
            if (!previous && current) {
                this.queue.abstractButtons.set(name, true);
                this.queue.enqueue({
                    type: 'abstractButtonPressed',
                    name: name
                });
            }
        }
    }
    unbindAbstractButton(name: string, ...keys: string[]) {
        for (let key of keys) {
            if (!this._keys.has(key)) throw new Error(`The key '${key}' is not registered to the '${name}' abstract button.`);
            let abstractButtons = this._keys.get(key);
            let abidx = abstractButtons!.indexOf(name);
            if (abidx === -1) throw new Error(`The key '${key}' is not registered to the '${name}' abstract button.`);
            abstractButtons!.splice(abidx);
            if (abstractButtons!.length === 0) this._keys.delete(key);
            let previous = this.queue.abstractButtons.get(name);
            let current = this.queue.isAbstractButtonDown(name, true);
            if (previous && !current) {
                this.queue.abstractButtons.set(name, false);
                this.queue.enqueue({
                    type: 'abstractButtonReleased',
                    name: name
                });
            }
        }
    }
    
    transformEvent(e: GameEvent): GameEvent | null {
        if (e.type === 'keyPressed') {
            if (this._keys.has(e.code)) {
                let abNames = this._keys.get(e.code)!;
                for (let abName of abNames) {
                    if (!this.queue.isAbstractButtonDown(abName)) {
                        this.queue.abstractButtons.set(abName, true);
                        this.queue.enqueue({
                            type: 'abstractButtonPressed',
                            name: abName,
                            wrappedEvent: e
                        });
                    }
                }
            }
        }
        else if (e.type === 'keyReleased') {
            if (this._keys.has(e.code)) {
                let abNames = this._keys.get(e.code)!;
                for (let abName of abNames) {
                    if (this.queue.isAbstractButtonDown(abName) && !this.queue.isAbstractButtonDown(abName, true)) {
                        this.queue.abstractButtons.set(abName, false);
                        this.queue.enqueue({
                            type: 'abstractButtonReleased',
                            name: abName,
                            wrappedEvent: e
                        });
                    }
                }
            }
        }
        return null;
    }
    
    isAbstractButtonDown(name: string) {
        for (let key of <any>this._keys.keys()) {
            let abstractButtons = this._keys.get(key)!;
            if (abstractButtons.indexOf(name) !== -1) {
                if (this.queue.isKeyDown(key)) return true;
            }
        }
        return false;
    }
}
