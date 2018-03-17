import { GameObject } from '../game-object';
import { degToRad } from '../utils/math';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { CollisionT } from './collision';
import { ForceGenerator } from './force-generator';

export abstract class CollisionMask {
    constructor(private _gobj: GameObject) {
        if (!this._gobj) throw new Error(`Collision mask created without a game object!`);
    }
    
    get gameObject() {
        return this._gobj;
    }
    
    private _isFixed = false;
    get isFixed() {
        return this._isFixed;
    }
    set isFixed(val: boolean) {
        this._isFixed = val;
    }
    
    private _isTrigger = false;
    get isTrigger() {
        return this._isTrigger;
    }
    set isTrigger(val: boolean) {
        this._isTrigger = val;
    }
    
    private _mass: number = 1;
    get mass() {
        return this._mass;
    }
    set mass(val: number) {
        this._mass = val;
    }
    
    contacts: CollisionT[] = [];
    triggers: CollisionMask[] = [];
    clearContacts() {
        this.contacts.length = 0;
        this.triggers.length = 0;
    }
    collisionImpulseX = 0;
    collisionImpulseY = 0;
    impulseCount = 0;
    resolveImpulses() {
        if (this.impulseCount == 0) return;
        this.addImpulse(this.collisionImpulseX / this.impulseCount, this.collisionImpulseY / this.impulseCount);
        this.collisionImpulseX = this.collisionImpulseY = this.impulseCount = 0;
    }
    forceAccumX = 0;
    forceAccumY = 0;
    impulseAccumX = 0;
    impulseAccumY = 0;
    addForce(x: number, y: number) {
        if (this.isFixed) return;
        if (isNaN(x) || isNaN(y)) throw new Error('Cannot add force with NaN as a component');
        this.forceAccumX += x;
        this.forceAccumY += y;
    }
    addImpulse(x: number, y: number) {
        if (this.isFixed) return;
        if (isNaN(x) || isNaN(y)) throw new Error('Cannot add impulse with NaN as a component');
        this.impulseAccumX += x;
        this.impulseAccumY += y;
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
    applyForces(delta: number) {
        if (this.isFixed) return;
        for (let generator of this.gameObject.scene.forceGenerators) {
            generator.updateCollider(this, delta);
        }
        for (let generator of this._generators) {
            generator.updateCollider(this, delta);
        }
        if (isNaN(this.impulseAccumX)) console.error(`impulseAccumX is NaN`);
        this.gameObject.physics!.hspeed += this.forceAccumX;
        this.gameObject.physics!.vspeed += this.forceAccumY;
        this.gameObject.x += this.impulseAccumX;
        this.gameObject.y += this.impulseAccumY;
        this.forceAccumX = this.forceAccumY = this.impulseAccumX = this.impulseAccumY = 0;
    }
    
    abstract checkForCollisions(other: CollisionMask): CollisionT[] | null;
    abstract resolveCollisions(): void;
    
    private renderTransformedSymbol = Symbol();
    render(adapter: GraphicsAdapter) {
        let angle = (this.gameObject.spriteRenderer && this.gameObject.spriteRenderer.imageAngle) || 0;
        adapter.renderTransformed(this.gameObject.x, this.gameObject.y, -degToRad(angle), 1, 1, () => {
            this.renderImpl(adapter);
        }, this.renderTransformedSymbol);
        
        for (let forceGenerator of this.forceGenerators) {
            forceGenerator.render(this, adapter);
        }
    }
    renderImpl(adapter: GraphicsAdapter) {
        adapter.renderCollisionMask(this);
    }
}
