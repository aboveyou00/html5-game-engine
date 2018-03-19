import { Rect } from './utils/rect';
import { Game } from './game';
import { GameEvent } from './events/events';
import { measureSprite } from './utils/render';
import { degToRad } from './utils/math';
import { GameScene } from './game-scene';
import { Camera } from './camera/camera';
import { ResourceLoader } from './resource-loader';
import { EventQueue } from './events/event-queue';
import { CollisionMask } from './physics/collision-mask';
import { GraphicsAdapter } from './graphics/graphics-adapter';
import { Component } from './component';
import { PhysicsComponent, PhysicsComponentOptions } from './physics/physics-component';
import { SpriteRendererComponent, SpriteRendererComponentOptions } from './graphics/sprite-renderer-component';

export type RenderCameraT = 'default' | 'none' | Camera;

export interface GameObjectOptions {
    name?: string,
    
    x?: number,
    y?: number,
    
    physics?: null | PhysicsComponent | PhysicsComponentOptions,
    
    renderDepth?: number,
    renderCamera?: RenderCameraT,
    
    spriteRenderer?: null | SpriteRendererComponent | SpriteRendererComponentOptions,
    
    components?: Component[]
};

export class GameObject {
    constructor(opts: GameObjectOptions = {}) {
        if (typeof opts.name !== 'undefined') this._name = opts.name;
        else this._name = this.constructor.name;
        
        if (typeof opts.x != 'undefined') this.x = opts.x;
        if (typeof opts.y != 'undefined') this.y = opts.y;
        
        if (typeof opts.renderDepth != 'undefined') this.renderDepth = opts.renderDepth;
        if (typeof opts.renderCamera != 'undefined') this.renderCamera = opts.renderCamera;
        
        if (opts.physics === null) this._physics = null;
        else {
            if (!opts.physics) opts.physics = {};
            if (!(opts.physics instanceof PhysicsComponent)) opts.physics = new PhysicsComponent(opts.physics);
            this._physics = <PhysicsComponent>opts.physics;
        }
        
        if (opts.spriteRenderer === null) this._spriteRenderer = null;
        else {
            if (!opts.spriteRenderer) opts.spriteRenderer = {};
            if (!(opts.spriteRenderer instanceof SpriteRendererComponent)) opts.spriteRenderer = new SpriteRendererComponent(opts.spriteRenderer);
            this._spriteRenderer = <SpriteRendererComponent>opts.spriteRenderer;
        }
        
        if (this._physics) this.addComponent(this._physics);
        if (this._spriteRenderer) this.addComponent(this._spriteRenderer);
        if (opts.components) {
            for (let comp of opts.components) {
                this.addComponent(comp);
            }
        }
    }
    
    private _name: string;
    get name(): string {
        return this._name;
    }
    set name(val: string) {
        this._name = val;
    }
    
    private _x = 0;
    get x() {
        return this._x;
    }
    set x(val) {
        this._x = val;
    }
    private _y = 0;
    get y() {
        return this._y;
    }
    set y(val) {
        this._y = val;
    }
    
    private _renderCamera: RenderCameraT = 'default';
    get renderCamera(): RenderCameraT {
        return this._renderCamera;
    }
    set renderCamera(val: RenderCameraT) {
        this._renderCamera = val;
    }
    
    private _renderDepth: number = 0;
    get renderDepth(): number {
        return this._renderDepth;
    }
    set renderDepth(val: number) {
        if (val === this._renderDepth) return;
        this._renderDepth = val;
    }
    
    private _scene: GameScene | null;
    get scene(): GameScene {
        if (!this._scene) throw new Error(`This GameObject hasn't been added to a scene yet.`);
        return this._scene;
    }
    
    private addToScene(scene: GameScene) {
        if (this._scene) throw new Error('This game object is already added to a scene!');
        this._scene = scene;
        this.onAddToScene();
    }
    private removeFromScene() {
        if (!this._scene) throw new Error(`This game object is not in a scene!`);
        let prevScene = this.scene;
        this._scene = <any>null;
        this.onRemoveFromScene(prevScene);
    }
    
    get game(): Game {
        return this.scene.game;
    }
    get resources(): ResourceLoader {
        return this.game.resourceLoader;
    }
    get events(): EventQueue {
        return this.game.eventQueue;
    }
    
    private _physics: PhysicsComponent | null;
    get physics() {
        return this._physics;
    }
    private _spriteRenderer: SpriteRendererComponent | null;
    get spriteRenderer() {
        return this._spriteRenderer;
    }
    
    private _components: Component[] = [];
    addComponent(comp: Component) {
        this._components.push(comp);
        try {
            (<any>comp).addToGameObject(this);
        }
        catch (e) {
            let idx = this._components.indexOf(comp);
            this._components.splice(idx, 1);
            throw e;
        }
        return this;
    }
    getComponent<T extends Component>(ctor: new(...args: any[]) => T, required?: true): T;
    getComponent<T extends Component>(ctor: new(...args: any[]) => T, required: false): T | null;
    getComponent<T extends Component>(ctor: new(...args: any[]) => T, required = true) {
        for (let comp of this._components) {
            if (comp instanceof ctor) return comp;
        }
        if (!required) return null;
        throw new Error(`Cannot find component with type ${ctor.name}`);
    }
    getOrCreateComponent<T extends Component>(ctor: new() => T) {
        let comp = this.getComponent(ctor, false);
        if (!comp) {
            comp = new ctor();
            this.addComponent(comp);
        }
        return comp;
    }
    getComponents<T extends Component>(ctor: new(...args: any[]) => T): T[] {
        return <T[]>this._components.filter(comp => comp instanceof ctor);
    }
    
    onAddToScene() {
        for (let comp of this._components) {
            comp.onAddToScene();
        }
    }
    onRemoveFromScene(scene: GameScene) {
        for (let comp of this._components) {
            comp.onRemoveFromScene(scene);
        }
    }
    
    onSceneEnter() {
        for (let comp of this._components) {
            comp.onSceneEnter();
        }
    }
    onSceneExit() {
        for (let comp of this._components) {
            comp.onSceneExit();
        }
    }
    
    handleEvent(evt: GameEvent): boolean {
        for (let comp of this._components.filter(comp => comp.enabled)) {
            if (comp.handleEvent(evt)) return true;
        }
        return false;
    }
    
    tick(delta: number) {
        for (let comp of this._components.filter(comp => comp.enabled && comp.shouldTick)) {
            comp.tick(delta);
        }
    }
    fixedTick() {
        for (let comp of this._components.filter(comp => comp.enabled && comp.shouldTick)) {
            comp.fixedTick();
        }
    }
    
    private renderTransformedSymbol = Symbol();
    render(adapter: GraphicsAdapter) {
        adapter.renderTransformed(this.x, this.y, 0, 1, 1, () => {
            for (let comp of this._components.filter(comp => comp.enabled && comp.shouldRender)) {
                comp.render(adapter);
            }
        }, this.renderTransformedSymbol);
    }
    
    transformPixelCoordinates(adapter: GraphicsAdapter, x: number, y: number): [number, number];
    transformPixelCoordinates(adapter: GraphicsAdapter, coords: { x: number, y: number }): [number, number];
    transformPixelCoordinates(canvasSize: [number, number], x: number, y: number): [number, number];
    transformPixelCoordinates(canvasSize: [number, number], coords: { x: number, y: number }): [number, number];
    transformPixelCoordinates(canvasSize: [number, number] | GraphicsAdapter, x: number | { x: number, y: number }, y?: number): [number, number] {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        let camera: RenderCameraT | null = this.renderCamera;
        if (camera === 'default' || !camera) camera = this.scene.camera;
        if (camera === 'none' || !camera) return [x, y!];
        else return camera.transformPixelCoordinates(<[number, number]><any>canvasSize, x, <any>y);
    }
}
