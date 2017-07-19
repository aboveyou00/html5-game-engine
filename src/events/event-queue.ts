import { GameEvent, MouseButton } from './events';

export class EventQueue {
    constructor() {
        this.init();
    }

    private DEBUG_KEYS = false;
    private DEBUG_MOUSE = false;

    private init() {
        let body = document.getElementsByTagName('body')[0];
        this.initKeyboard(body);
        this.initMouse(body);
    }
    private initKeyboard(body: HTMLBodyElement) {
        body.addEventListener('keydown', e => {
            if (e.code === 'F12') return;
            if (e.code === 'F4' && e.altKey) return;
            if (!e.ctrlKey || (e.code !== 'KeyV' && e.code !== 'KeyX' && e.code !== 'KeyC')) e.preventDefault();
            if (this.DEBUG_KEYS) console.log(`Key Pressed: ${e.key}; ${e.code}`);
            if (!this.isKeyDown(e.code)) {
                this.enqueue({
                    type: 'keyPressed',
                    code: e.code,
                    altPressed: !!e.altKey,
                    ctrlPressed: !!e.ctrlKey,
                    shiftPressed: !!e.shiftKey
                });
                this._keys.set(e.code, true);
                if (this._abstractButtonKeys.has(e.code)) {
                    let abName = this._abstractButtonKeys.get(e.code);
                    if (!this.isAbstractButtonDown(abName)) {
                        this.enqueue({
                            type: 'abstractButtonPressed',
                            name: abName
                        });
                        this._abstractButtons.set(abName, true);
                    }
                }
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
            if (this.DEBUG_KEYS) console.log(`Key Released: ${e.key}; ${e.code}`);
            if (this.isKeyDown(e.code)) {
                this.enqueue({
                    type: 'keyReleased',
                    code: e.code,
                    altPressed: !!e.altKey,
                    ctrlPressed: !!e.ctrlKey,
                    shiftPressed: !!e.shiftKey
                });
                this._keys.set(e.code, false);
                if (this._abstractButtonKeys.has(e.code)) {
                    let abName = this._abstractButtonKeys.get(e.code);
                    if (this.isAbstractButtonDown(abName) && !this.areAbstractButtonKeysDown(abName)) {
                        this.enqueue({
                            type: 'abstractButtonReleased',
                            name: abName
                        });
                        this._abstractButtons.set(abName, false);
                    }
                }
            }
        });
    }
    private initMouse(body: HTMLBodyElement) {
        body.addEventListener('mousemove', e => {
            e.preventDefault();
            if (this.DEBUG_MOUSE) console.log(`Mouse moved. Movement: ${e.movementX}, ${e.movementY}; Position: ${e.pageX}, ${e.pageY}`);
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
            if (this.DEBUG_MOUSE) console.log(`Mouse button pressed. Button: ${e.button}; Position: ${e.pageX}, ${e.pageY}`);
            if (!this.isMouseButtonDown(e.button)) {
                if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
                if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
                this.enqueue({
                    type: 'mouseButtonPressed',
                    button: <MouseButton>e.button,
                    pageX: this._pageX,
                    pageY: this._pageY
                });
                this._mouseButtons.set(e.button, true);
            }
        });
        body.addEventListener('mouseup', e => {
            e.preventDefault();
            if (this.DEBUG_MOUSE) console.log(`Mouse button released. Button: ${e.button}; Position: ${e.pageX}, ${e.pageY}`);
            if (this.isMouseButtonDown(e.button)) {
                if (typeof e.pageX !== 'undefined') this._pageX = e.pageX;
                if (typeof e.pageY !== 'undefined') this._pageY = e.pageY;
                this.enqueue({
                    type: 'mouseButtonReleased',
                    button: <MouseButton>e.button,
                    pageX: this._pageX,
                    pageY: this._pageY
                });
                this._mouseButtons.set(e.button, false);
            }
        });
        body.addEventListener('wheel', e => {
            e.preventDefault();
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

    private _events: GameEvent[] = [];
    private _keys = new Map<string, boolean>();
    private _mouseButtons = new Map<MouseButton, boolean>();
    private _abstractButtons = new Map<string, boolean>();
    private _abstractButtonKeys = new Map<string, string>();
    private _pageX: number = 0;
    private _pageY: number = 0;

    bindAbstractButton(name: string, ...keys: string[]) {
        for (let key of keys) {
            if (this._abstractButtonKeys.has(key)) throw new Error(`The key '${key}' is already registered to the '${this._abstractButtonKeys.get(key)}' abstract button.`);
            this._abstractButtonKeys.set(key, name);
            if (!this._abstractButtons.has(name)) this._abstractButtons.set(name, false);
            let previous = this._abstractButtons.get(name);
            let isKeyDown = this.isKeyDown(key);
            if (previous !== isKeyDown && isKeyDown) {
                this.enqueue({
                    type: 'abstractButtonPressed',
                    name: name
                });
                this._abstractButtons.set(name, true);
            }
        }
    }
    unbindAbstractButton(name: string, ...keys: string[]) {
        for (let key of keys) {
            if (!this._abstractButtonKeys.has(key) || this._abstractButtonKeys.get(key) !== name) throw new Error(`The key '${key}' is not registered to the '${name}' abstract button.`);
            this._abstractButtonKeys.delete(key);
            let previous = this._abstractButtons.get(name);
            let abPressed = this.areAbstractButtonKeysDown(name);
            if (typeof abPressed === 'undefined') this._abstractButtons.delete(name); //There are no more keys bound to this abstract button
            else if (previous && !abPressed) {
                this.enqueue({
                    type: 'abstractButtonReleased',
                    name: name
                });
                this._abstractButtons.set(name, false);
            }
        }
    }
    private areAbstractButtonKeysDown(name: string) {
        let abExists = false;
        for (let key in this._abstractButtonKeys.keys) {
            if (this._abstractButtonKeys.get(key) === name) {
                abExists = true;
                if (this.isKeyDown(key)) return true;
            }
        }
        if (!abExists) return undefined;
        return false;
    }

    isKeyDown(code: string) {
        if (!this._keys.has(code)) return false;
        return this._keys.get(code);
    }
    isMouseButtonDown(button: MouseButton) {
        if (!this._mouseButtons.has(button)) return false;
        return this._mouseButtons.get(button);
    }
    isAbstractButtonDown(name: string) {
        if (!this._abstractButtons.has(name)) return false;
        return this._abstractButtons.get(name);
    }
    get mousePosition() {
        return { x: this._pageX, y: this._pageY };
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
                }
            }
            else if ((e.type === 'abstractButtonPressed' && lastEvent.type === 'keyPressed') || (e.type === 'abstractButtonReleased' && lastEvent.type === 'keyReleased')) {
                e.wrappedEvent = lastEvent;
                this._events[this._events.length - 1] = e;
                return;
            }
        }
        this._events.push(e);
    }
    clearQueue() {
        return this._events.splice(0);
    }
}
