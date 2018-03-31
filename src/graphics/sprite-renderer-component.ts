import { Component, ComponentOptions } from '../component';
import { Camera } from '../camera/camera';
import { SpriteT } from '../utils/render/sprite';
import { drawSprite } from '../utils/render/draw-sprite';
import { Context2dGraphicsAdapter } from './context2d-graphics-adapter';
import merge = require('lodash.merge');

export type SpriteRendererComponentOptions = ComponentOptions & {
    sprite?: SpriteT,
    animationAge?: number,
    animationSpeed?: number,
    imageAngle?: number,
    imageScale?: number,
    imageOpacity?: number,
    unitSpace?: boolean
};

export class SpriteRendererComponent extends Component {
    constructor(opts: SpriteRendererComponentOptions = {}) {
        super(merge({ shouldTick: true, shouldRender: true }, opts));
        
        if (typeof opts.sprite != 'undefined') this.sprite = opts.sprite;
        if (typeof opts.animationAge != 'undefined') this.animationAge = opts.animationAge;
        if (typeof opts.animationSpeed != 'undefined') this.animationSpeed = opts.animationSpeed;
        if (typeof opts.imageAngle != 'undefined') this.imageAngle = opts.imageAngle;
        if (typeof opts.imageScale != 'undefined') this.imageScale = opts.imageScale;
        if (typeof opts.imageOpacity != 'undefined') this.imageOpacity = opts.imageOpacity;
        if (typeof opts.unitSpace != 'undefined') this.unitSpace = opts.unitSpace;
    }
    
    private _sprite: SpriteT | null = null;
    get sprite(): SpriteT {
        return this._sprite!;
    }
    set sprite(val: SpriteT) {
        this._sprite = val;
    }
    
    private _animationAge = 0;
    get animationAge() {
        return this._animationAge;
    }
    set animationAge(val) {
        this._animationAge = val;
    }
    private _animationSpeed = 1;
    get animationSpeed() {
        return this._animationSpeed;
    }
    set animationSpeed(val) {
        this._animationSpeed = val;
    }
    
    private _imageAngle = 0;
    get imageAngle() {
        return this._imageAngle;
    }
    set imageAngle(val) {
        this._imageAngle = val;
    }
    
    private _imageScale = 1;
    get imageScale() {
        return this._imageScale;
    }
    set imageScale(val) {
        this._imageScale = val;
    }
    
    private _imageOpacity = 1;
    get imageOpacity() {
        return this._imageOpacity;
    }
    set imageOpacity(val) {
        this._imageOpacity = val;
    }
    
    private _unitSpace = false;
    get unitSpace() {
        return this._unitSpace;
    }
    set unitSpace(val) {
        this._unitSpace = val;
    }
    
    tick(delta: number) {
        super.tick(delta);
        
        this.animationAge += this.animationSpeed * delta;
    }
    
    renderContext2d(adapter: Context2dGraphicsAdapter) {
        let context = adapter.context!;
        let scale = this.imageScale;
        if (this.unitSpace) {
            if (this.gameObject.renderCamera === 'none') { ; }
            else if (this.gameObject.renderCamera instanceof Camera) scale /= this.gameObject.renderCamera.zoomScale;
            else if (this.scene.camera) scale /= this.scene.camera.zoomScale;
        }
        if (scale !== 1 || this.imageAngle !== 0 || this.imageOpacity !== 1) {
            context.save();
            try {
                context.rotate(this.imageAngle);
                context.scale(scale, scale);
                context.globalAlpha *= this.imageOpacity;
                this.renderContext2d_core(adapter);
            }
            finally {
                context.restore();
            }
        }
        else {
            this.renderContext2d_core(adapter);
        }
    }
    private renderContext2d_core(adapter: Context2dGraphicsAdapter) {
        if (!this.sprite || !this.sprite.src) adapter.renderEmptyObject(this.gameObject);
        else drawSprite(adapter.context!, this.resources, this.sprite, 0, 0, this.animationAge);
    }
}
