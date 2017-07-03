import { Game } from './game';
import { GameObject } from './game-object';
import { Camera } from './camera';
import { CollisionMask } from './physics/collision-mask';
import { GraphicsAdapter } from './graphics/graphics-adapter';

export class GameScene {
    constructor(private _game: Game = null) {
    }
    
    get game() {
        return this._game;
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

    public handleEvent(evt) {
        for (let obj of this._objects) {
            if (obj.shouldTick && obj.handleEvent(evt)) return true;
        }
        return false;
    }

    public tick(delta: number) {
        for (let obj of this._objects) {
            if (obj.shouldTick) obj.tick(delta);
        }
        if (this.camera) this.camera.tick(delta);
        this.physicsTick(delta);
    }
    public fixedTick() {
        for (let obj of this._objects) {
            if (obj.shouldTick) obj.fixedTick();
        }
        if (this.camera) this.camera.fixedTick();
        this.physicsTick(0);
    }
    public physicsTick(delta: number) {
        
    }
    
    public render(adapter: GraphicsAdapter) {
        let defaultCamera = this.camera;
        if (defaultCamera) defaultCamera.clear(adapter);

        for (let obj of this._objects) {
            if (obj.shouldRender) {
                let renderCamera = obj.renderCamera === 'default' ? defaultCamera :
                                      obj.renderCamera !== 'none' ? obj.renderCamera :
                                                                    null;
                if (!renderCamera) obj.render(adapter);
                else renderCamera.renderTransformed(adapter, () => obj.render(adapter));
            }
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

    private _objects: GameObject[] = [];
    addObject(obj: GameObject) {
        this._objects.push(obj);
        obj.addToScene(this);
    }
    removeObject(obj: GameObject) {
        let idx = this._objects.indexOf(obj);
        if (idx == -1) throw new Error(`Cannot remove game object '${obj.name}': it has not been added.`);
        this._objects.splice(idx, 1);
        obj.removeFromScene();
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
        this.camera = new Camera(this);
    }

    private _camera: Camera | null = null;
    get camera(): Camera | null {
        return this._camera;
    }
    set camera(val: Camera | null) {
        this._camera = val;
    }
};
