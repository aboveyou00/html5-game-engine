import { GameEvent, GamepadButtonT } from './events';
import { EventQueue } from './event-queue';

import { AbstractButtonProvider } from './abstract-button-provider';

export class GamepadAbstractButtonProvider implements AbstractButtonProvider {
    constructor(private queue: EventQueue) { }
    
    //button name => abstract button names[]
    private _buttons = new Map<GamepadButtonT, string[]>();
    bindAbstractButton(name: string, ...buttons: GamepadButtonT[]) {
        for (let button of buttons) {
            if (!this._buttons.has(button)) this._buttons.set(button, []);
            this._buttons.get(button).push(name);
            if (!this.queue.abstractButtons.has(name)) this.queue.abstractButtons.set(name, false);
            let previous = this.queue.abstractButtons.get(name);
            let current = this.queue.isGamepadButtonDown(button);
            if (!previous && current) {
                this.queue.abstractButtons.set(name, true);
                this.queue.enqueue({
                    type: 'abstractButtonPressed',
                    name: name
                });
            }
        }
    }
    unbindAbstractButton(name: string, ...buttons: GamepadButtonT[]) {
        for (let button of buttons) {
            if (!this._buttons.has(button)) throw new Error(`The gamepad button '${button}' is not registered to the '${name}' abstract button.`);
            let abstractButtons = this._buttons.get(button);
            let abidx = abstractButtons.indexOf(name);
            if (abidx === -1) throw new Error(`The gamepad button '${button}' is not registered to the '${name}' abstract button.`);
            abstractButtons.splice(abidx);
            if (abstractButtons.length === 0) this._buttons.delete(button);
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
        if (e.type === 'gamepadButtonPressed') {
            if (this._buttons.has(e.button)) {
                let abNames = this._buttons.get(e.button);
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
        else if (e.type === 'gamepadButtonReleased') {
            if (this._buttons.has(e.button)) {
                let abNames = this._buttons.get(e.button);
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
        else return null;
    }
    
    isAbstractButtonDown(name: string) {
        for (let button of <any>this._buttons.keys()) {
            let abstractButtons = this._buttons.get(button);
            if (abstractButtons.indexOf(name) !== -1) {
                if (this.queue.isGamepadButtonDown(button)) return true;
            }
        }
        return false;
    }
}
