import { Component, ComponentOptions } from '../component';
import { Camera } from './camera';
import { GameScene } from '../game-scene';
import { GameObject } from '../game-object';
import { GraphicsAdapter } from '../graphics/graphics-adapter';

export type BindCameraComponentOptions = ComponentOptions & {
    camera?: Camera,
    offset?: [number, number],
    clampLeft?: number,
    clampRight?: number,
    clampTop?: number,
    clampBottom?: number
};

export class BindCameraComponent extends Component {
    constructor(opts: BindCameraComponentOptions = {}) {
        super();
        
        if (typeof opts.camera !== 'undefined') this._camera = opts.camera;
        if (typeof opts.offset !== 'undefined') [this._offset[0], this._offset[1]] = opts.offset;
        
        if (typeof opts.clampLeft !== 'undefined') this.clampLeft = opts.clampLeft;
        if (typeof opts.clampRight !== 'undefined') this.clampRight = opts.clampRight;
        if (typeof opts.clampTop !== 'undefined') this.clampTop = opts.clampTop;
        if (typeof opts.clampBottom !== 'undefined') this.clampBottom = opts.clampBottom;
    }
    
    private _camera: Camera | null = null;
    get camera(): Camera | null {
        return this._camera;
    }
    set camera(val: Camera | null) {
        this._camera = val;
    }
    
    private _offset: [number, number] = [0, 0];
    get offset(): [number, number] {
        return [this._offset[0], this._offset[1]];
    }
    set offset([offsetx, offsety]: [number, number]) {
        this._offset = [offsetx, offsety];
    }
    
    clampLeft = -Infinity;
    clampRight = Infinity;
    clampBottom = -Infinity;
    clampTop = Infinity;
    
    //TODO: add lateUpdate lifecycle hook; use that to avoid race conditions
    tick(delta: number) {
        super.tick(delta);
        if (this.camera) {
            let target: [number, number] = [this.gameObject.x + this._offset[0], this.gameObject.y + this._offset[1]];
            this.camera.center = target;
            let bounds = this.camera.getBounds(this.game.graphicsAdapter);
            if (bounds.right > this.clampRight) this.camera.center = [this.camera.center[0] - (bounds.right - this.clampRight), this.camera.center[1]];
            if (bounds.left < this.clampLeft) this.camera.center = [this.camera.center[0] + (this.clampLeft - bounds.left), this.camera.center[1]];
            if (bounds.top > this.clampTop) this.camera.center = [this.camera.center[0], this.camera.center[1] - (bounds.top - this.clampTop)];
            if (bounds.bottom < this.clampBottom) this.camera.center = [this.camera.center[0], this.camera.center[1] + (this.clampBottom - bounds.bottom)];
        }
    }
}
