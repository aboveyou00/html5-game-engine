import { GameObject } from '../game-object';

export abstract class CollisionMask {
    constructor(private _gobj: GameObject) { }
    
    get gameObject() {
        return this._gobj;
    }
    
    abstract render(context: CanvasRenderingContext2D);
}
