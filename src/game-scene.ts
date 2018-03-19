import { Game } from './game';
import { GameObject } from './game-object';
import { Camera } from './camera';
import { CollisionMask } from './physics/collision-mask';
import { ForceGenerator } from './physics/force-generator';
import { GraphicsAdapter } from './graphics/graphics-adapter';
import { GameEvent } from './events/events';

export class GameScene {
    constructor(private _game: Game | null = null) {
    }
    
    get game() {
        return this._game!;
    }
    set game(val: Game) {
        this._game = val;
    }
    
    public onEnter() {
        this.start();
        for (let obj of this._objects) {
            obj.onSceneEnter();
        }
    }
    public onExit() {
        this.stop();
        for (let obj of this._objects) {
            obj.onSceneExit();
        }
    }
    
    public start() {
        if (!this.camera) this.initCamera();
    }
    public stop() {
    }
    
    get cursor(): string[] {
        return this.getCursor();
    }
    getCursor(): string[] {
        let showMouse = this.game && this.game.eventQueue.currentInputType === 'mouse';
        return showMouse ? ['default'] : ['none'];
    }
    
    private _generators: ForceGenerator[] = [];
    get forceGenerators() {
        return this._generators;
    }
    addForceGenerator(generator: ForceGenerator) {
        this._generators.push(generator);
    }
    removeForceGenerator(generator: ForceGenerator) {
        let idx = this._generators.indexOf(generator);
        if (idx === -1) return;
        this._generators.splice(idx, 1);
    }
    
    public handleEvent(evt: GameEvent) {
        for (let obj of this._objects) {
            if (obj.handleEvent(evt)) return true;
        }
        return false;
    }
    
    public tick(delta: number) {
        for (let obj of this._objects) {
            obj.tick(delta);
        }
        if (this.camera) this.camera.tick(delta);
        this.physicsTick(delta);
    }
    public fixedTick() {
        for (let obj of this._objects) {
            obj.fixedTick();
        }
        if (this.camera) this.camera.fixedTick();
        this.physicsTick(0);
    }
    public physicsTick(delta: number) {
        for (let q = 0; q < this._colliders.length; q++) {
            this._colliders[q].clearContacts();
        }
        for (let q = 0; q < this._colliders.length; q++) {
            let first = this._colliders[q];
            for (let w = q + 1; w < this._colliders.length; w++) {
                let second = this._colliders[w];
                first.checkForCollisions(second);
            }
        }
        for (let q = 0; q < this._colliders.length; q++) {
            let collider = this._colliders[q];
            collider.resolveCollisions();
        }
        for (let q = 0; q < this._colliders.length; q++) {
            let collider = this._colliders[q];
            collider.resolveImpulses();
        }
        for (let q = 0; q < this._colliders.length; q++) {
            let collider = this._colliders[q];
            collider.applyForces(delta);
        }
    }
    
    public render(adapter: GraphicsAdapter) {
        let defaultCamera = this.camera;
        if (defaultCamera) defaultCamera.clear(adapter);
        
        this.verifyRenderOrder();
        
        for (let obj of this._renderOrder) {
            let renderCamera = obj.renderCamera === 'default' ? defaultCamera :
                                  obj.renderCamera !== 'none' ? obj.renderCamera :
                                                                null;
            if (!renderCamera) obj.render(adapter);
            else renderCamera.renderTransformed(adapter, () => obj.render(adapter));
        }
        
        if (this.game.renderPhysics) this.renderPhysics(adapter);
    }
    public renderPhysics(adapter: GraphicsAdapter) {
        let defaultCamera = this.camera;
        
        for (let collider of this._colliders) {
            let obj = collider.gameObject;
            let renderCamera = obj.renderCamera === 'default' ? defaultCamera :
                                  obj.renderCamera !== 'none' ? obj.renderCamera :
                                                              null;
            if (!renderCamera) collider.render(adapter);
            else renderCamera.renderTransformed(adapter, () => collider.render(adapter));
        }
    }
    
    private verifyRenderOrder() {
        this._renderOrder.forEach(obj => {
            (<any>obj).__sceneIndex = this._objects.indexOf(obj);
        });
        this._renderOrder.sort((lhs, rhs) => {
            if (lhs.renderDepth > rhs.renderDepth) return -1;
            else if (lhs.renderDepth < rhs.renderDepth) return 1;
            else if ((<any>lhs).__sceneIndex < (<any>rhs).__sceneIndex) return -1;
            else return 1;
        });
    }
    
    private _objects: GameObject[] = [];
    private _renderOrder: GameObject[] = [];
    addObject(obj: GameObject) {
        this._objects.push(obj);
        this._renderOrder.push(obj);
        (<any>obj).addToScene(this);
    }
    removeObject(obj: GameObject) {
        let idx = this._objects.indexOf(obj);
        if (idx === -1) throw new Error(`Cannot remove game object '${obj.name}': it has not been added.`);
        this._objects.splice(idx, 1);
        
        idx = this._renderOrder.indexOf(obj);
        if (idx !== -1) this._renderOrder.splice(idx, 1);
        
        (<any>obj).removeFromScene();
    }
    findObject(predicate: (obj: GameObject) => boolean): GameObject | null;
    findObject<T extends GameObject>(predicate: (obj: GameObject) => obj is T): T | null;
    findObject(name: string): GameObject | null;
    findObject(predicate: string | ((obj: GameObject) => boolean)) {
        if (typeof predicate == 'string') {
            let name = predicate;
            predicate = obj => obj.name == name;
        }
        else if (!predicate) throw new Error(`Invalid predicate: ${predicate}`);
        for (let obj of this._objects) {
            if (predicate(obj)) return obj;
        }
        return null;
    }
    findObjects(): GameObject[];
    findObjects(predicate: (obj: GameObject) => boolean): GameObject[];
    findObjects<T extends GameObject>(predicate: (obj: GameObject) => obj is T): T[];
    findObjects(predicate?: (obj: GameObject) => boolean) {
        if (!predicate) return [...this._objects];
        if (typeof predicate !== 'function') throw new Error(`Invalid predicate: ${predicate}`);
        return this._objects.filter(predicate);
    }
    
    private _colliders: CollisionMask[] = [];
    removeCollider(mask: CollisionMask) {
        let idx = this._colliders.indexOf(mask);
        if (idx !== -1) this._colliders.splice(idx, 1);
    }
    addCollider(mask: CollisionMask) {
        this._colliders.push(mask);
    }
    
    private initCamera() {
        this.camera = new Camera();
    }
    
    private _camera: Camera | null = null;
    get camera(): Camera | null {
        return this._camera;
    }
    set camera(val: Camera | null) {
        this._camera = val;
    }
};
