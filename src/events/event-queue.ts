import { GameEvent, MouseButton, InputTypeT, standardGamepadButtonNames, standardGamepadAxisNames, GamepadButtonT } from './events';
import { AbstractButtonProvider } from './abstract-button-provider';
import { KeyboardAbstractButtonProvider } from './keyboard-abstract-button-provider';

export class EventQueue {
    constructor() { }
    
    private DEBUG_KEYS = false;
    private DEBUG_MOUSE = false;
    private DEBUG_MOUSE_VERBOSE = false;
    private DEBUG_GAMEPAD = false;
    private DEBUG_GAMEPAD_VERBOSE = false;
    private GAMEPAD_AXIS_THRESHOLD = .4;
    private ABSTRACT_BUTTON_TYPE_TIMEOUT = .5;
    private ABSTRACT_BUTTON_TYPE_REPEAT = 15;
    
    init() {
        let body = document.getElementsByTagName('body')[0];
        this.initKeyboard(body);
        this.initMouse(body);
        
        this.initGamepad(window);
    }
    cleanUp() {
        let body = document.getElementsByTagName('body')[0];
        this.cleanUpKeyboard(body);
        this.cleanUpMouse(body);
        
        this.cleanUpGamepad(window);
    }
    
    private keyDownListener: (e: KeyboardEvent) => void;
    private keyUpListener: (e: KeyboardEvent) => void;
    
    private initKeyboard(body: HTMLBodyElement) {
        this.keyDownListener = (e: KeyboardEvent) => {
            if (this.shouldIgnoreKeyboardEvent(e)) return;
            if (!e.ctrlKey || (e.code !== 'KeyV' && e.code !== 'KeyX' && e.code !== 'KeyC')) e.preventDefault();
            if (!this.isKeyAuxiliary(e.code)) this.currentInputType = 'keyboard';
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
        };
        this.keyUpListener = e => {
            if (this.shouldIgnoreKeyboardEvent(e)) return;
            e.preventDefault();
            if (!this.isKeyAuxiliary(e.code)) this.currentInputType = 'keyboard';
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
        };
        
        body.addEventListener('keydown', this.keyDownListener);
        body.addEventListener('keyup', this.keyUpListener);
        
        this.addIgnoreKeyboardEvent(e => {
            if (e.type !== 'keydown') return false;
            if (e.code === 'F12') return true;
            if (e.code === 'F5') return true;
            if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && e.altKey) return true;
            if (e.code === 'F4' && e.altKey) return true;
            return false;
        });
    }
    private cleanUpKeyboard(body: HTMLBodyElement) {
        body.removeEventListener('keydown', this.keyDownListener);
        body.removeEventListener('keyup', this.keyUpListener);
        
        this._ignoreKeyboardEventPredicates = [];
    }
    
    private AUXILIARY_KEYS: string[] = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'];
    private isKeyAuxiliary(code: string) {
        return (this.AUXILIARY_KEYS.indexOf(code) !== -1)
    }
    
    private _ignoreKeyboardEventPredicates: ((e: KeyboardEvent) => boolean)[] = [];
    shouldIgnoreKeyboardEvent(e: KeyboardEvent): boolean {
        return this._ignoreKeyboardEventPredicates.some(predicate => predicate(e));
    }
    addIgnoreKeyboardEvent(predicate: (e: KeyboardEvent) => boolean) {
        this._ignoreKeyboardEventPredicates.push(predicate);
    }
    
    private mouseMoveListener: (e: MouseEvent) => void;
    private mouseDownListener: (e: MouseEvent) => void;
    private mouseUpListener: (e: MouseEvent) => void;
    private wheelListener: (e: WheelEvent) => void;
    
    private initMouse(body: HTMLBodyElement) {
        this.mouseMoveListener = e => {
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
        };
        this.mouseDownListener = e => {
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
        };
        this.mouseUpListener = e => {
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
        };
        this.wheelListener = e => {
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
        };
        
        body.addEventListener('mousemove', this.mouseMoveListener);
        body.addEventListener('mousedown', this.mouseDownListener);
        body.addEventListener('mouseup', this.mouseUpListener);
        body.addEventListener('wheel', this.wheelListener);
    }
    private cleanUpMouse(body: HTMLBodyElement) {
        body.removeEventListener('mousemove', this.mouseMoveListener);
        body.removeEventListener('mousedown', this.mouseDownListener);
        body.removeEventListener('mouseup', this.mouseUpListener);
        body.removeEventListener('wheel', this.wheelListener);
    }
    
    private gamepadConnectedListener: (e: GamepadEvent) => void;
    private gamepadDisconnectedListener: (e: GamepadEvent) => void;
    
    private initGamepad(window: Window) {
        this.gamepadConnectedListener = (e: GamepadEvent) => this.connectGamepad(e.gamepad);
        this.gamepadDisconnectedListener = (e: GamepadEvent) => this.disconnectGamepad(e.gamepad);
        
        window.addEventListener('gamepadconnected', this.gamepadConnectedListener);
        window.addEventListener('gamepaddisconnected', this.gamepadDisconnectedListener);
        
        if (!window.navigator) return;
        for (let gp of navigator.getGamepads()) {
            if (!gp || !gp.connected) continue;
            this.connectGamepad(gp);
        }
    }
    private cleanUpGamepad(window: Window) {
        window.removeEventListener('gamepadconnected', this.gamepadConnectedListener);
        window.removeEventListener('gamepaddisconnected', this.gamepadDisconnectedListener);
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
        if (!window.navigator) return;
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
        if (this.isAbstractButtonDown(this.mrAbstractButton) && this.ABSTRACT_BUTTON_TYPE_REPEAT !== 0) {
            this.mrAbstractButtonTimeout -= delta;
            while (this.mrAbstractButtonTimeout < 0) {
                this.mrAbstractButtonTimeout += 1 / this.ABSTRACT_BUTTON_TYPE_REPEAT;
                this.enqueue({
                    type: 'abstractButtonTyped',
                    name: this.mrAbstractButton
                });
            }
        }
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
    
    private _currentInput: InputTypeT = 'keyboard';
    get currentInputType(): InputTypeT {
        return this._currentInput;
    }
    set currentInputType(val: InputTypeT) {
        if (this._currentInput === val) return;
        this.enqueue({
            type: 'currentInputTypeChanged',
            previous: this._currentInput,
            current: this._currentInput = val
        });
    }
    
    private _abstractButtonProviders: AbstractButtonProvider[] = [];
    addAbstractButtonProvider(provider: AbstractButtonProvider) {
        this._abstractButtonProviders.push(provider);
    }
    
    isKeyDown(code: string) {
        if (!this._keys.has(code)) return false;
        return this._keys.get(code)!;
    }
    
    isMouseButtonDown(button: MouseButton) {
        if (!this._mouseButtons.has(button)) return false;
        return this._mouseButtons.get(button)!;
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
    private mrAbstractButton: string = '';
    private mrAbstractButtonTimeout: number;
    isAbstractButtonDown(name: string, manualCheck = false) {
        if (!this.abstractButtons.has(name)) return false;
        if (manualCheck) {
            for (let provider of this._abstractButtonProviders) {
                if (provider.isAbstractButtonDown(name)) return true;
            }
            return false;
        }
        else {
            return this.abstractButtons.get(name)!;
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
        if (e.type === 'abstractButtonPressed') {
            this.mrAbstractButton = e.name;
            this.mrAbstractButtonTimeout = this.ABSTRACT_BUTTON_TYPE_TIMEOUT;
            this.enqueue({
                type: 'abstractButtonTyped',
                name: e.name,
                wrappedEvent: e.wrappedEvent
            });
        }
    }
    clearQueue() {
        return this._events.splice(0);
    }
}
