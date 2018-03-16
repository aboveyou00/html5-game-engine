import { Camera } from './camera';
import { GameScene } from './game-scene';
import { GameObject } from './game-object';
import { GraphicsAdapter } from './graphics/graphics-adapter';

export class FollowCamera extends Camera {
    constructor() {
        super();
    }
    
    private _follow: GameObject | null = null;
    get follow(): GameObject {
        return this._follow!;
    }
    set follow(val: GameObject) {
        this._follow = val;
    }
    
    private _offset: [number, number] = [0, 0];
    get followOffset(): [number, number] {
        return [this._offset[0], this._offset[1]];
    }
    set followOffset([offsetx, offsety]: [number, number]) {
        this._offset = [offsetx, offsety];
    }
    
    clampLeft = -Infinity;
    clampRight = Infinity;
    clampBottom = -Infinity;
    clampTop = Infinity;
    
    //TODO: add beforeRender lifecycle hook; use that hook to avoid calling this method multiple times in one render cycle
    renderTransformed(adapter: GraphicsAdapter, act: () => void) {
        if (this.follow) {
            let target: [number, number] = [this.follow.x + this._offset[0], this.follow.y + this._offset[1]];
            this.center = target;
        }
        let bounds = this.getBounds(adapter);
        if (bounds.right > this.clampRight) this.center = [this.center[0] - (bounds.right - this.clampRight), this.center[1]];
        if (bounds.left < this.clampLeft) this.center = [this.center[0] + (this.clampLeft - bounds.left), this.center[1]];
        if (bounds.top > this.clampTop) this.center = [this.center[0], this.center[1] - (bounds.top - this.clampTop)];
        if (bounds.bottom < this.clampBottom) this.center = [this.center[0], this.center[1] + (this.clampBottom - bounds.bottom)];
        super.renderTransformed(adapter, act);
    }
}
