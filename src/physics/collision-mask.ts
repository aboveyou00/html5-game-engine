import { GameObject } from '../game-object';
import { degToRad } from '../utils/math';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from '../graphics/default-graphics-adapter';
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
    
    private _mass: number = 1;
    get mass() {
        return this._mass;
    }
    set mass(val: number) {
        this._mass = val;
    }
    
    contacts: CollisionT[] = [];
    clearContacts() {
        this.contacts.length = 0;
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
        this.forceAccumX += x;
        this.forceAccumY += y;
    }
    addImpulse(x: number, y: number) {
        if (this.isFixed) return;
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
        this.gameObject.hspeed += this.forceAccumX;
        this.gameObject.vspeed += this.forceAccumY;
        this.gameObject.x += this.impulseAccumX;
        this.gameObject.y += this.impulseAccumY;
        this.forceAccumX = this.forceAccumY = this.impulseAccumX = this.impulseAccumY = 0;
    }
    
    abstract checkForCollision(other: CollisionMask);
    abstract resolveCollisions();
    
    render(adapter: GraphicsAdapter) {
        if (adapter instanceof DefaultGraphicsAdapter) this.renderContext2d(adapter.context);
        else throw new Error(`Not implemented!`);
    }
    protected renderContext2d(context: CanvasRenderingContext2D) {
        context.save();

        try {
            context.translate(this.gameObject.x, this.gameObject.y);
            context.rotate(-degToRad(this.gameObject.imageAngle));

            this.renderImpl(context);
        }
        finally {
            context.restore();
        }
        
        for (let forceGenerator of this.forceGenerators) {
            forceGenerator.render(this, context);
        }
    }
    abstract renderImpl(context: CanvasRenderingContext2D);
}
