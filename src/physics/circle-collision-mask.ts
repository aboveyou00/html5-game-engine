import { GameObject } from '../game-object';
import { CollisionMask } from './collision-mask';

export class CircleCollisionMask extends CollisionMask {
    constructor(gobj: GameObject, private _radius: number, private _offset: [number, number] = [0, 0]) {
        super(gobj);
    }
    
    get radius() {
        return this._radius;
    }
    set radius(val: number) {
        this._radius = val;
    }
    
    get offset() {
        return [this._radius[0], this._radius[1]];
    }
    set offset(val: [number, number]) {
        this._offset = [val[0], val[1]];
    }
    
    renderImpl(context: CanvasRenderingContext2D) {
        context.strokeStyle = 'red';
        context.beginPath();
        context.ellipse(this._offset[0], this._offset[1], this.radius, this.radius, 0, 0, 2 * Math.PI);
        context.stroke();
    }
}
