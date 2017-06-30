import { GameObject } from '../game-object';
import { degToRad } from '../utils/math';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from '../graphics/default-graphics-adapter';

export abstract class CollisionMask {
    constructor(private _gobj: GameObject) { }
    
    get gameObject() {
        return this._gobj;
    }
    
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
