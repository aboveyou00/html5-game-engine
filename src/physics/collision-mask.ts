import { GameObject } from '../game-object';
import { degToRad } from '../utils/math';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from '../graphics/default-graphics-adapter';
import { CollisionT } from './collision';

export abstract class CollisionMask {
    constructor(private _gobj: GameObject) {
        if (!this._gobj) throw new Error(`Collision mask created without a game object!`);
    }
    
    get gameObject() {
        return this._gobj;
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
    impulsex = 0;
    impulsey = 0;
    impulseCount = 0;
    resolveImpulses() {
        if (this.impulseCount == 0) return;
        this.gameObject.x += this.impulsex / this.impulseCount;
        this.gameObject.y += this.impulsey / this.impulseCount;
        this.impulsex = this.impulsey = this.impulseCount = 0;
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
    }
    abstract renderImpl(context: CanvasRenderingContext2D);
}
