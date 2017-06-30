import { ResourceLoader } from './resource-loader';
import { EventQueue } from './event-queue';
import { GameScene } from './game-scene';
import { GraphicsAdapter } from './graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from './graphics/default-graphics-adapter';

export class Game {
    constructor(protected readonly framesPerSecond = 30, public readonly graphicsAdapter: GraphicsAdapter | null = null) {
        if (!this.graphicsAdapter) this.graphicsAdapter = new DefaultGraphicsAdapter();
        this.timePerFixedTick = 1 / framesPerSecond;
        this.init();
    }

    private _scene: GameScene = null;
    private _nextScene: GameScene = null;

    get scene() {
        return this._scene;
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

    private init() {
        this._resourceLoader = new ResourceLoader();
        this._eventQueue = new EventQueue();
        let body = document.getElementsByTagName('body')[0];
        this.initResize(body);
    }

    private initResize(body: HTMLBodyElement) {
        body.onresize = e => this.refreshCanvasSize();
    }
    private refreshCanvasSize() {
        if (this.canvas) {
            [this.canvas.width, this.canvas.height] = this.canvasSize = [this.canvas.scrollWidth, this.canvas.scrollHeight];
        }
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

        this.graphicsAdapter.init();
        this.refreshCanvasSize();

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

        if (this.resourceLoader.isDone) {
            let currentTime = new Date();
            let delta = (this.previousTick == null) ? 0 : (currentTime.valueOf() - this.previousTick.valueOf()) / 1000;
            this.previousTick = currentTime;

            this.sendEvents();
            for (let q = 0; q < this.LOGIC_TICKS_PER_RENDER_TICK; q++) {
                this.tick(delta / this.LOGIC_TICKS_PER_RENDER_TICK);
            }
            this.render(this.graphicsAdapter);
        }
        else {
            this.resourceLoader.render(this.graphicsAdapter);
        }
    }
    protected sendEvents() {
        let events = this._eventQueue.clearQueue();
        for (let evt of events) {
            if (this._scene) {
                let handled = this._scene.handleEvent(evt);
                if (!handled && evt.type === 'keyPressed' && evt.code === 'F5') {
                    location.reload();
                }
            }
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
        if (this._scene) this._scene.render(adapter);
    }
}
