import { GameObject } from './game-object';
import { GameScene } from './game-scene';
import { GameEvent } from './events/events';
import { EventQueue } from './events/event-queue';
import { ResourceLoader } from './resource-loader';
import { Game } from './game';
import { GraphicsAdapter } from './graphics/graphics-adapter';

export type ComponentOptions = {
    shouldTick?: boolean,
    shouldRender?: boolean
};

export abstract class Component {
    constructor(opts?: ComponentOptions) {
        opts = opts || {};
        
        if (typeof opts.shouldTick !== 'undefined') this.shouldTick = opts.shouldTick;
        if (typeof opts.shouldRender !== 'undefined') this.shouldRender = opts.shouldRender;
    }
    
    private _gameObject: GameObject | null = null;
    get gameObject(): GameObject {
        if (!this._gameObject) throw new Error(`This Component hasn't been added to a GameObject yet`);
        return this._gameObject;
    }
    
    private addToGameObject(gameObject: GameObject) {
        if (this._gameObject) throw new Error(`This Component has already been added to a GameObject!`);
        this._gameObject = gameObject;
        this.onAddToGameObject();
    }
    onAddToGameObject() { }
    
    get scene() {
        return this.gameObject.scene;
    }
    onAddToScene() { }
    onRemoveFromScene(scene: GameScene) { }
    onSceneEnter() { }
    onSceneExit() { }
    
    get game() {
        return this.gameObject.game;
    }
    get resources() {
        return this.gameObject.resources;
    }
    get events() {
        return this.gameObject.events;
    }
    
    private _enabled: boolean = true;
    get enabled() {
        return this._enabled;
    }
    set enabled(val: boolean) {
        if (this._enabled === val) return;
        this._enabled = val;
    }
    
    private _shouldTick = false;
    get shouldTick() {
        return this._shouldTick;
    }
    set shouldTick(val) {
        if (this._shouldTick === val) return;
        this._shouldTick = val;
    }
    
    private _shouldRender = false;
    get shouldRender() {
        return this._shouldRender;
    }
    set shouldRender(val) {
        if (this._shouldRender === val) return;
        this._shouldRender = val;
    }
    
    handleEvent(evt: GameEvent): boolean {
        return false;
    }
    
    tick(delta: number) { }
    fixedTick() { }
    
    render(adapter: GraphicsAdapter) {
        adapter.renderComponent(this);
    }
}
