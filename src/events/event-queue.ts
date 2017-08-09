import { GameEvent, MouseButton, InputTypeT, standardGamepadButtonNames, standardGamepadAxisNames, GamepadButtonT } from './events';
import { AbstractButtonProvider } from './abstract-button-provider';
import { KeyboardAbstractButtonProvider } from './keyboard-abstract-button-provider';

export class EventQueue {
    constructor() {
        this.init();
    }

    private DEBUG_KEYS = true;
    private DEBUG_MOUSE = false;
    private DEBUG_MOUSE_VERBOSE = false;
    private DEBUG_GAMEPAD = false;
    private DEBUG_GAMEPAD_VERBOSE = false;
    private GAMEPAD_AXIS_THRESHOLD = .4;

    private init() {
        let body = document.getElementsByTagName('body')[0];
        this.initKeyboard(body);
        this.initMouse(body);
        
        this.initGamepad(window);
    }
    
    private initKeyboard(body: HTMLBodyElement) {
        body.addEventListener('keydown', e => {
            if (e.code === 'F12') return;
            if (e.code === 'F4' && e.altKey) return;
            if (!e.ctrlKey || (e.code !== 'KeyV' && e.code !== 'KeyX' && e.code !== 'KeyC')) e.preventDefault();
            this.currentInputType = 'keyboard';
            if (this.DEBUG_KEYS) console.log(`Key Pressed: ${e.key}; ${e.code}`);
            if (!this.isKeyDown(e.code)) {
                this._keys.set(e.code, true);
                this.enqueue({
                    type: 'keyPressed',
                    code: e.code,
                    altPressed: !!e.altKey,
                    ctrlPressed: !!e.ctrlKey,
                    shiftPressed: !!e.shiftKey
                });
            }
            this.enqueue({
                type: 'keyTyped',
                key: e.key,
                code: e.code,
                altPressed: !!e.altKey,
                ctrlPressed: !!e.ctrlKey,
                shiftPressed: !!e.shiftKey
            });
        });
        body.addEventListener('keyup', e => {
            e.preventDefault();
            this.currentInputType = 'keyboard';
            if (this.DEBUG_KEYS) console.log(`Key Released: ${e.key}; ${e.code}`);
            if (this.isKeyDown(e.code)) {
                this._keys.set(e.code, false);
                this.enqueue({
                    type: 'keyReleased',
                    code: e.code,
                    altPressed: !!e.altKey,
                    ctrlPressed: !!e.ctrlKey,
                    shiftPressed: !!e.shiftKey
                });
            }
        });
    }
    
    private initMouse(body: HTMLBodyElement) {
        body.addEventListener('mousemove', e => {
            e.preventDefault();
            this.currentInputType = 'mouse';
            if (this.DEBUG_MOUSE_VERBOSE) console.log(`Mouse moved. Movement: ${e.movementX}, ${e.movementY}; Position: ${e.pageX}, ${e.pageY}`);
            if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
            else this._pageX += e.movementX;
            if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
            else this._pageY += e.movementY;
            this.enqueue({
                type: 'mouseMoved',
                movementX: e.movementX,
                movementY: e.movementY,
                pageX: this._pageX,
                pageY: this._pageY
            });
        });
        body.addEventListener('mousedown', e => {
            e.preventDefault();
            this.currentInputType = 'mouse';
            if (this.DEBUG_MOUSE) console.log(`Mouse button pressed. Button: ${e.button}; Position: ${e.pageX}, ${e.pageY}`);
            if (!this.isMouseButtonDown(e.button)) {
                if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
                if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
                this._mouseButtons.set(e.button, true);
                this.enqueue({
                    type: 'mouseButtonPressed',
                    button: <MouseButton>e.button,
                    pageX: this._pageX,
                    pageY: this._pageY
                });
            }
        });
        body.addEventListener('mouseup', e => {
            e.preventDefault();
            this.currentInputType = 'mouse';
            if (this.DEBUG_MOUSE) console.log(`Mouse button released. Button: ${e.button}; Position: ${e.pageX}, ${e.pageY}`);
            if (this.isMouseButtonDown(e.button)) {
                if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
                if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
                this._mouseButtons.set(e.button, false);
                this.enqueue({
                    type: 'mouseButtonReleased',
                    button: <MouseButton>e.button,
                    pageX: this._pageX,
                    pageY: this._pageY
                });
            }
        });
        body.addEventListener('wheel', e => {
            e.preventDefault();
            this.currentInputType = 'mouse';
            if (this.DEBUG_MOUSE) console.log(`Mouse wheel. delta: ${e.deltaY}; Position: ${e.pageX}, ${e.pageY}`);
            if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
            if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
            this.enqueue({
                type: 'mouseWheel',
                delta: e.deltaY,
                pageX: this._pageX,
                pageY: this._pageY
            });
        });
    }
    
    private initGamepad(window: Window) {
        window.addEventListener('gamepadconnected', (e: GamepadEvent) => this.connectGamepad(e.gamepad));
        window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => this.disconnectGamepad(e.gamepad));
        if (!window.navigator) return;
        for (let gp of navigator.getGamepads()) {
            if (!gp || !gp.connected) continue;
            this.connectGamepad(gp);
        }
    }
    private connectGamepad(gp: Gamepad) {
        if (gp.mapping !== 'standard') {
            console.error(`Gamepad connected with invalid mapping: "${gp.mapping}"`);
            return;
        }
        this._gamepads.push(gp.index);
        if (this.DEBUG_GAMEPAD) console.log(`Gamepad connected. ID: ${gp.id}; Index: ${gp.index}`);
        this.refreshGamepads();
    }
    private disconnectGamepad(gp: Gamepad) {
        let idx = this._gamepads.indexOf(gp.index);
        if (idx === -1) return;
        this._gamepads.splice(idx);
        if (this.DEBUG_GAMEPAD) console.log(`Gamepad disconnected. ID: ${gp.id}; Index: ${gp.index}`);
        this.refreshGamepads();
    }
    private refreshGamepads() {
        let axes: number[] = [];
        for (let q = 0; q < this._gamepadAxes.length; q++) {
            axes[q] = 0;
        }
        let buttons: boolean[] = [];
        for (let q = 0; q < this._gamepadButtonsRaw.length; q++) {
            buttons[q] = false;
        }
        let gamepads = navigator.getGamepads();
        for (let gpIdx of this._gamepads) {
            let gp = gamepads[gpIdx];
            if (!gp.connected) continue;
            for (let q = 0; q < gp.axes.length; q++) {
                if (typeof axes[q] === 'undefined') axes[q] = 0;
                axes[q] += gp.axes[q];
            }
            for (let q = 0; q < gp.buttons.length; q++) {
                if (typeof buttons[q] === 'undefined') buttons[q] = false;
                if (gp.buttons[q].pressed) buttons[q] = true;
            }
        }
        for (let q = 0; q < axes.length; q++) {
            if (Math.abs(axes[q]) > 1) axes[q] = Math.sign(axes[q]);
            if (axes[q] !== 0) this.currentInputType = 'gamepad';
            if (typeof this._gamepadAxes[q] === 'undefined') this._gamepadAxes[q] = 0;
            if (this._gamepadAxes[q] !== axes[q]) {
                if (this.DEBUG_GAMEPAD_VERBOSE) console.log(`Gamepad axis changed. Idx: ${q}, Value: ${axes[q]}; Previous: ${this._gamepadAxes[q]}`);
                this.enqueue({
                    type: 'gamepadAxisChanged',
                    idx: q,
                    previousValue: this._gamepadAxes[q],
                    value: axes[q]
                });
                let oldAxisSign = Math.abs(this._gamepadAxes[q]) < this.GAMEPAD_AXIS_THRESHOLD ? 0 : Math.sign(this._gamepadAxes[q]);
                let newAxisSign = Math.abs(axes[q]) < this.GAMEPAD_AXIS_THRESHOLD ? 0 : Math.sign(axes[q]);
                if (oldAxisSign !== newAxisSign) {
                    let axisNames = standardGamepadAxisNames[q] || <any>[`Axis${q}Negative`, `Axis${q}Positive`];
                    if (this._gamepadAxes[q] < -this.GAMEPAD_AXIS_THRESHOLD) {
                        //negative button released
                        if (this.DEBUG_GAMEPAD) console.log(`Gamepad button released. Button: ${axisNames[0]}`);
                        this._gamepadButtons.set(axisNames[0], false);
                        this.enqueue({
                            type: 'gamepadButtonReleased',
                            button: axisNames[0]
                        });
                    }
                    else if (this._gamepadAxes[q] > this.GAMEPAD_AXIS_THRESHOLD) {
                        //positive button released
                        if (this.DEBUG_GAMEPAD) console.log(`Gamepad button released. Button: ${axisNames[1]}`);
                        this._gamepadButtons.set(axisNames[1], false);
                        this.enqueue({
                            type: 'gamepadButtonReleased',
                            button: axisNames[1]
                        });
                    }
                    if (axes[q] < -this.GAMEPAD_AXIS_THRESHOLD) {
                        //negative button pressed
                        if (this.DEBUG_GAMEPAD) console.log(`Gamepad button pressed. Button: ${axisNames[0]}`);
                        this._gamepadButtons.set(axisNames[0], true);
                        this.enqueue({
                            type: 'gamepadButtonPressed',
                            button: axisNames[0]
                        });
                    }
                    else if (axes[q] > this.GAMEPAD_AXIS_THRESHOLD) {
                        //positive button pressed
                        if (this.DEBUG_GAMEPAD) console.log(`Gamepad button pressed. Button: ${axisNames[1]}`);
                        this._gamepadButtons.set(axisNames[1], true);
                        this.enqueue({
                            type: 'gamepadButtonPressed',
                            button: axisNames[1]
                        });
                    }
                }
            }
            this._gamepadAxes[q] = axes[q];
        }
        for (let q = 0; q < buttons.length; q++) {
            let buttonName = standardGamepadButtonNames[q] || <any>`${q}`;
            if (!this._gamepadButtonsRaw[q]) this._gamepadButtonsRaw[q] = false;
            if (!this._gamepadButtonsRaw[q] && buttons[q]) {
                if (this.DEBUG_GAMEPAD) console.log(`Gamepad button pressed. Button: ${buttonName}`);
                this._gamepadButtons.set(buttonName, true);
                this.currentInputType = 'gamepad';
                this.enqueue({
                    type: 'gamepadButtonPressed',
                    button: buttonName
                });
            }
            else if (this._gamepadButtonsRaw[q] && !buttons[q]) {
                if (this.DEBUG_GAMEPAD) console.log(`Gamepad button released. Button: ${buttonName}`);
                this._gamepadButtons.set(buttonName, false);
                this.currentInputType = 'gamepad';
                this.enqueue({
                    type: 'gamepadButtonReleased',
                    button: buttonName
                });
            }
            this._gamepadButtonsRaw[q] = buttons[q];
        }
    }

    tick(delta: number) {
        this.refreshGamepads();
    }

    private _events: GameEvent[] = [];
    
    private _keys = new Map<string, boolean>();
    
    private _mouseButtons = new Map<MouseButton, boolean>();
    private _pageX: number = 0;
    private _pageY: number = 0;
    
    private _gamepads: number[] = [];
    private _gamepadAxes: number[] = [];
    private _gamepadButtonsRaw: boolean[] = [];
    private _gamepadButtons = new Map<string, boolean>();

    private _currentInputT: InputTypeT = 'keyboard';
    get currentInputType(): InputTypeT {
        return this._currentInputT;
    }
    set currentInputType(val: InputTypeT) {
        if (this._currentInputT === val) return;
        this.enqueue({
            type: 'currentInputTypeChanged',
            previous: this._currentInputT,
            current: this._currentInputT = val
        });
    }
    
    private _abstractButtonProviders: AbstractButtonProvider[] = [];
    addAbstractButtonProvider(provider: AbstractButtonProvider) {
        this._abstractButtonProviders.push(provider);
    }

    isKeyDown(code: string) {
        if (!this._keys.has(code)) return false;
        return this._keys.get(code);
    }
    
    isMouseButtonDown(button: MouseButton) {
        if (!this._mouseButtons.has(button)) return false;
        return this._mouseButtons.get(button);
    }
    get mousePosition() {
        return { x: this._pageX, y: this._pageY };
    }

    isGamepadButtonDown(idx: number | GamepadButtonT) {
        if (typeof idx === 'number') {
            if (idx < 0 || idx >= this._gamepadButtonsRaw.length) return false;
            return this._gamepadButtonsRaw[idx];
        }
        else {
            return this._gamepadButtons.get(idx) || false;
        }
    }
    getGamepadAxis(idx: number) {
        if (idx < 0 || idx >= this._gamepadAxes.length) return 0;
        return this._gamepadAxes[idx];
    }

    abstractButtons = new Map<string, boolean>();
    isAbstractButtonDown(name: string, manualCheck = false) {
        if (!this.abstractButtons.has(name)) return false;
        if (manualCheck) {
            for (let provider of this._abstractButtonProviders) {
                if (provider.isAbstractButtonDown(name)) return true;
            }
            return false;
        }
        else {
            return this.abstractButtons.get(name);
        }
    }

    enqueue(e: GameEvent) {
        let lastEvent = this._events[this._events.length - 1];
        if (lastEvent) {
            if (lastEvent.type == e.type) {
                switch (e.type) {
                case 'mouseMoved':
                    (<any>lastEvent).movementX += e.movementX;
                    (<any>lastEvent).movementY += e.movementY;
                    (<any>lastEvent).pageX = e.pageX;
                    (<any>lastEvent).pageY = e.pageY;
                    return;
                case 'mouseWheel':
                    (<any>lastEvent).delta += e.delta;
                    return;
                case 'canvasResize':
                    (<any>lastEvent).size = e.size;
                    return;
                case 'gamepadAxisChanged':
                    (<any>lastEvent).value = e.value;
                    if ((<any>lastEvent).value === (<any>lastEvent).previousValue) this._events.splice(this._events.length - 1, 1);
                    return;
                }
            }
        }
        for (let provider of this._abstractButtonProviders) {
            e = provider.transformEvent(e) || e;
        }
        this._events.push(e);
    }
    clearQueue() {
        return this._events.splice(0);
    }
}
