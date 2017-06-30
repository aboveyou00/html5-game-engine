import { Camera } from './camera';
import { GameScene } from './game-scene';
import { GameObject } from './game-object';
import { GraphicsAdapter } from './graphics/graphics-adapter';

export class FollowCamera extends Camera {
    constructor(scene: GameScene) {
        super(scene);
    }

    private _follow: GameObject = null;
    get follow(): GameObject {
        return this._follow;
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

    //TODO: add beforeRender lifecycle hook; use that hook to avoid calling this method multiple times in one render cycle
    renderTransformed(adapter: GraphicsAdapter, act: () => void) {
        if (this.follow) {
            let target: [number, number] = [this._follow.x + this._offset[0], this._follow.y + this._offset[1]];
            this.center = target;
        }
        super.renderTransformed(adapter, act);
    }
}
