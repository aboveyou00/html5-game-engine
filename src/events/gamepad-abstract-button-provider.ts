import { GameEvent, GamepadButtonT } from './events';
import { EventQueue } from './event-queue';

import { AbstractButtonProvider } from './abstract-button-provider';

export class GamepadAbstractButtonProvider implements AbstractButtonProvider {
    constructor(private queue: EventQueue) { }
    
    private _buttons = new Map<GamepadButtonT, string>();
    bindAbstractButton(name: string, ...buttons: GamepadButtonT[]) {
        for (let button of buttons) {
            if (this._buttons.has(button)) throw new Error(`The gamepad button '${button}' is already registered to the '${this._buttons.get(button)}' abstract button.`);
            this._buttons.set(button, name);
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
            if (!this._buttons.has(button) || this._buttons.get(button) !== name) throw new Error(`The gamepad button '${button}' is not registered to the '${name}' abstract button.`);
            this._buttons.delete(button);
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
                let abName = this._buttons.get(e.button);
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
        else if (e.type === 'gamepadButtonReleased') {
            if (this._buttons.has(e.button)) {
                let abName = this._buttons.get(e.button);
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
        else return null;
    }
    
    isAbstractButtonDown(name: string) {
        for (let button of <any>this._buttons.keys()) {
            if (this._buttons.get(button) === name) {
                if (this.queue.isGamepadButtonDown(button)) return true;
            }
        }
        return false;
    }
}
