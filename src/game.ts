import { ResourceLoader } from './resource-loader';
import { GameEvent } from './utils/events';
import { EventQueue } from './event-queue';
import { EventEmitter } from './utils/event-emitter';
import { GameScene } from './game-scene';
import { GraphicsAdapter } from './graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from './graphics/default-graphics-adapter';

export interface GameOptions {
    framesPerSecond?: number,
    graphicsAdapter?: GraphicsAdapter,
    maximumDelta?: number
};

export class Game {
    constructor(options?: GameOptions) {
        if (!options) options = {};
        this.framesPerSecond = options.framesPerSecond || 30;
        this.graphicsAdapter = options.graphicsAdapter || new DefaultGraphicsAdapter();
        this.timePerFixedTick = 1 / this.framesPerSecond;
        this.maximumDelta = options.maximumDelta || 0;
        this.init();
    }
    
    public readonly framesPerSecond: number;
    public readonly graphicsAdapter: GraphicsAdapter;

    private _scene: GameScene = null;
    private _nextScene: GameScene = null;

    get scene() {
        return this._scene;
    }
    get nextScene() {
        return this._nextScene;
    }

    public changeScene(newScene: GameScene) {
        if (!newScene) { throw new Error("Tried to changeScene to a bad scene!"); }
        if (this._nextScene) { throw new Error("Scene cannot be set more than once per tick!"); }

        this._nextScene = newScene;
        if (!this._scene) { this.handleSceneChange(); }
    }

    private handleSceneChange() {
        if (this._nextScene) {
            if (this._scene) this._scene.onExit();
            this._scene = this._nextScene;
            this._scene.game = this;
            this._scene.onEnter();
            this._nextScene = null;
        }
    }

    private LOGIC_TICKS_PER_RENDER_TICK = 3;
    private maximumDelta = .25;

    private init() {
        this._resourceLoader = new ResourceLoader();
        this._eventQueue = new EventQueue();
        let body = document.getElementsByTagName('body')[0];
        this.initResize(body);
    }

    public bodyResized = new EventEmitter();
    private initResize(body: HTMLBodyElement) {
        window.addEventListener('resize', () => this.bodyResized.emit(void(0)));
        this.bodyResized.addListener(() => {
            if (!this.canvas) return;
            this.canvasSize = [this.canvas.scrollWidth, this.canvas.scrollHeight];
        });
    }

    private _renderPhysics = false;
    get renderPhysics() {
        return this._renderPhysics;
    }
    set renderPhysics(val: boolean) {
        this._renderPhysics = val;
    }

    get canvas() {
        return this.graphicsAdapter.canvas;
    }
    private previousTick: Date = null;

    private _resourceLoader: ResourceLoader = null;
    get resourceLoader() {
        return this._resourceLoader;
    }

    private _eventQueue: EventQueue = null;
    get eventQueue() {
        return this._eventQueue;
    }

    private _intervalHandle: number;
    private _isRunning = false;
    get isRunning() {
        return this._isRunning;
    }

    start() {
        if (this.isRunning) throw new Error(`This game is already running. You can't run it again.`);
        this._isRunning = true;

        this.graphicsAdapter.init(this);
        this.bodyResized.emit(void(0));
        document.currentScript.parentElement.insertBefore(this.canvas, document.currentScript);

        this._intervalHandle = setInterval(() => this.onTick(), 1000 / this.framesPerSecond);
    }
    stop() {
        if (this.isRunning) clearInterval(this._intervalHandle);
        this._isRunning = false;
    }

    private _size: [number, number] = [640, 480];
    get canvasSize(): [number, number] {
        return [this._size[0], this._size[1]];
    }
    set canvasSize([newWidth, newHeight]: [number, number]) {
        if (newWidth == this._size[0] && newHeight == this._size[1]) return;
        let prevSize = this._size;
        this._size = [newWidth, newHeight];
        this.eventQueue.enqueue({
            type: 'canvasResize',
            previousSize: prevSize,
            size: [newWidth, newHeight]
        });
    }

    private onTick() {
        if (!this.isRunning) throw new Error(`An error occurred. Game.onTick was invoked although the game is not running.`);
        let currentTime = new Date();
        let delta = (this.previousTick == null) ? 0 : (currentTime.valueOf() - this.previousTick.valueOf()) / 1000;
        if (this.maximumDelta && delta > this.maximumDelta) delta = this.maximumDelta;
        this.previousTick = currentTime;
        this.sendEvents(this.scene);

        if (this.resourceLoader.isDone) {
            for (let q = 0; q < this.LOGIC_TICKS_PER_RENDER_TICK; q++) {
                this.tick(delta / this.LOGIC_TICKS_PER_RENDER_TICK);
            }
            this.render(this.graphicsAdapter);
        }
        else {
            this.resourceLoader.render(this.graphicsAdapter);
        }
    }
    protected sendEvents(sendTo: GameScene) {
        let events = this._eventQueue.clearQueue();
        for (let evt of events) {
            if (this.resourceLoader.isDone && this.sendEvent(sendTo, evt)) return true;
            this.handleEvent(evt);
        }
    }
    protected handleEvent(evt: GameEvent) {
        if (evt.type === 'keyPressed' && evt.code === 'F5') {
            location.reload(evt.shiftPressed);
            return true;
        }
        else if (evt.type === 'keyPressed' && evt.code === 'F11') {
            this.toggleFullscreen();
            return true;
        }
        return false;
    }
    protected sendEvent(sendTo: GameScene, evt: GameEvent) {
        if (this._scene) return this._scene.handleEvent(evt);
        return false;
    }
    private toggleFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) {
            //Exit fullscreen
            if (document.exitFullscreen) document.exitFullscreen();
            else if ((<any>document).mozExitFullscreen) (<any>document).mozExitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if ((<any>document).msExitFullscreen) (<any>document).wskitExitFullscreen();
        }
        else {
            let body = document.getElementsByTagName('body')[0];
            if (body.requestFullscreen) body.requestFullscreen();
            else if ((<any>body).mozRequestFullScreen) (<any>body).mozRequestFullScreen();
            else if (body.webkitRequestFullscreen) body.webkitRequestFullscreen();
            else if ((<any>body).msRequestFullscreen) (<any>body).msRequestFullscreen();
        }
    }
    private fixedTickDelta = 0;
    private timePerFixedTick = 1;
    protected tick(delta: number) {
        if (this._scene) {
            this._scene.tick(delta);
            this.handleSceneChange();
        }
        this.fixedTickDelta += delta;
        while (this.fixedTickDelta >= this.timePerFixedTick) {
            this.fixedTickDelta -= this.timePerFixedTick;
            this.fixedTick();
        }
    }
    protected fixedTick() {
        if (this._scene) {
            this._scene.fixedTick();
            this.handleSceneChange();
        }
    }
    protected render(adapter: GraphicsAdapter) {
        if (!adapter) throw new Error(`What the heck just happened? There is no graphics adapter!`);
        if (this._scene) adapter.renderScene(this._scene);
    }
}
