import { GameObject } from '../game-object';
import { degToRad } from '../utils/math';

export abstract class CollisionMask {
    constructor(private _gobj: GameObject) { }
    
    get gameObject() {
        return this._gobj;
    }
    
    render(context: CanvasRenderingContext2D) {
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
