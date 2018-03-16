import { ResourceLoader } from './resource-loader';
import { GameEvent } from './events/events';
import { EventQueue } from './events/event-queue';
import { GameScene } from './game-scene';
import { GraphicsAdapter, DefaultGraphicsAdapter } from './graphics';
import { AudioController } from './audio/audio-controller';

export interface GameOptions {
    graphicsAdapter?: GraphicsAdapter,
    framesPerSecond?: number,
    maximumDelta?: number
};

export class Game {
    constructor(options?: GameOptions) {
        if (!options) options = {};
        
        this.framesPerSecond = options.framesPerSecond || 30;
        this.graphicsAdapter = options.graphicsAdapter || new DefaultGraphicsAdapter();
        this.timePerFixedTick = 1 / this.framesPerSecond;
        this.maximumDelta = options.maximumDelta || 0;
        
        this._resourceLoader = new ResourceLoader();
        this._eventQueue = new EventQueue();
        this._audioController = new AudioController();
    }
    
    public readonly framesPerSecond: number;
    public readonly graphicsAdapter: GraphicsAdapter;
    
    private _scene: GameScene | null = null;
    private _nextScene: GameScene | null = null;
    
    get scene() {
        return this._scene;
    }
    get nextScene() {
        return this._nextScene;
    }
    
    loadingScene: GameScene | null = null;
    
    public changeScene(newScene: GameScene) {
        if (!newScene) throw new Error("Tried to changeScene to a bad scene!");
        if (this._nextScene) throw new Error("Scene cannot be set more than once per tick!");
        
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
    
    private setUp() {
        this.eventQueue.init();
        
        this.graphicsAdapter.init(this);
        
        this._intervalHandle = <any>setInterval(() => this.onTick(), 1000 / this.framesPerSecond);
        this._isRunning = true;
    }
    private tearDown() {
        clearInterval(this._intervalHandle);
        this._intervalHandle = null;
        this._isRunning = false;
        
        if (this.scene) {
            if (this._scene) this._scene.onExit();
            this._scene = null;
        }
        
        this.graphicsAdapter.cleanUp();
        
        this.eventQueue.cleanUp();
    }
    
    private _renderPhysics = false;
    get renderPhysics() {
        return this._renderPhysics;
    }
    set renderPhysics(val: boolean) {
        this._renderPhysics = val;
    }
    
    private previousTick: Date | null = null;
    
    private _resourceLoader: ResourceLoader | null = null;
    get resourceLoader() {
        return this._resourceLoader!;
    }
    
    private _eventQueue: EventQueue | null = null;
    get eventQueue() {
        return this._eventQueue!;
    }
    
    private _audioController: AudioController;
    get audioController() {
        return this._audioController!;
    }
    
    private _intervalHandle: any;
    private _isRunning = false;
    get isRunning() {
        return this._isRunning;
    }
    
    start() {
        if (this.isRunning) throw new Error(`This game is already running. You can't run it again.`);
        this.setUp();
    }
    stop() {
        if (!this.isRunning) return;
        this.tearDown();
    }
    
    private fixedTickDelta = 0;
    private timePerFixedTick = 1 / 30;
    private onTick() {
        if (!this.isRunning) throw new Error(`An error occurred. Game.onTick was invoked although the game is not running.`);
        let currentTime = new Date();
        let delta = (this.previousTick == null) ? 0 : (currentTime.valueOf() - this.previousTick.valueOf()) / 1000;
        if (this.maximumDelta && delta > this.maximumDelta) delta = this.maximumDelta;
        this.previousTick = currentTime;
        
        let scene: GameScene | null;
        
        this.eventQueue.tick(delta);
        
        scene = this.resourceLoader.isDone ? this.scene : this.loadingScene;
        if (scene) this.sendEvents(scene);
        
        for (let q = 0; q < this.LOGIC_TICKS_PER_RENDER_TICK; q++) {
            let miniDelta = delta / this.LOGIC_TICKS_PER_RENDER_TICK;
            
            scene = this.resourceLoader.isDone ? this.scene : this.loadingScene;
            if (scene) this.tick(scene, miniDelta);
            
            this.fixedTickDelta += miniDelta;
            while (this.fixedTickDelta >= this.timePerFixedTick) {
                this.fixedTickDelta -= this.timePerFixedTick;
                scene = this.resourceLoader.isDone ? this.scene : this.loadingScene;
                if (scene) this.fixedTick(scene);
            }
        }
        
        scene = this.resourceLoader.isDone ? this.scene : this.loadingScene;
        this.updateCursor(scene);
        
        scene = this.resourceLoader.isDone ? this.scene : this.loadingScene;
        if (scene) this.render(scene, this.graphicsAdapter);
        else this.resourceLoader.render(this.graphicsAdapter);
    }
    protected sendEvents(sendTo: GameScene) {
        let events = this.eventQueue.clearQueue();
        for (let evt of events) {
            let handled = false;
            if (this.resourceLoader.isDone && this.sendEvent(sendTo, evt)) handled = true;
            if (!handled && this.handleEvent(evt)) handled = true;
            if (!handled && (evt.type === 'abstractButtonPressed' || evt.type === 'abstractButtonReleased') && evt.wrappedEvent) {
                if (this.resourceLoader.isDone && this.sendEvent(sendTo, evt.wrappedEvent)) handled = true;
                if (!handled && this.handleEvent(evt.wrappedEvent)) handled = true;
            }
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
            else if ((<any>document).msExitFullscreen) (<any>document).msExitFullscreen();
        }
        else {
            let body = document.getElementsByTagName('body')[0];
            if (body.requestFullscreen) body.requestFullscreen();
            else if ((<any>body).mozRequestFullScreen) (<any>body).mozRequestFullScreen();
            else if (body.webkitRequestFullscreen) body.webkitRequestFullscreen();
            else if ((<any>body).msRequestFullscreen) (<any>body).msRequestFullscreen();
        }
    }
    private updateCursor(scene: GameScene | null) {
        if (!scene) return;
        let cursors = scene.cursor;
        if (!this.graphicsAdapter.updateCursor(cursors)) {
            console.error(`Invalid set of cursors:`, cursors);
        }
    }
    protected tick(scene: GameScene, delta: number) {
        scene.tick(delta);
        this.handleSceneChange();
    }
    protected fixedTick(scene: GameScene) {
        scene.fixedTick();
        this.handleSceneChange();
    }
    protected render(scene: GameScene, adapter: GraphicsAdapter) {
        if (!adapter) throw new Error(`What the heck just happened? There is no graphics adapter!`);
        adapter.renderScene(scene);
    }
}
