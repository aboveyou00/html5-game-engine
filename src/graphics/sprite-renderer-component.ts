import { Component, ComponentOptions } from '../component';
import { SpriteT } from '../utils/render/sprite';
import { drawSprite } from '../utils/render/draw-sprite';
import merge = require('lodash.merge');
import { Context2dGraphicsAdapter } from '.';

export type SpriteRendererComponentOptions = ComponentOptions & {
    sprite?: SpriteT,
    animationAge?: number,
    animationSpeed?: number,
    imageAngle?: number,
    imageScale?: number
};

export class SpriteRendererComponent extends Component {
    constructor(opts: SpriteRendererComponentOptions = {}) {
        super(merge({ shouldRender: true }, opts));
        
        if (typeof opts.sprite != 'undefined') this.sprite = opts.sprite;
        if (typeof opts.animationAge != 'undefined') this.animationAge = opts.animationAge;
        if (typeof opts.animationSpeed != 'undefined') this.animationSpeed = opts.animationSpeed;
        if (typeof opts.imageAngle != 'undefined') this.imageAngle = opts.imageAngle;
        if (typeof opts.imageScale != 'undefined') this.imageScale = opts.imageScale;
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
    
    tick(delta: number) {
        super.tick(delta);
        
        this.animationAge += this.animationSpeed * delta;
    }
    
    renderContext2d(adapter: Context2dGraphicsAdapter) {
        let context = adapter.context!;
        if (this.imageScale !== 1 || this.imageAngle !== 0) {
            context.save();
            try {
                context.rotate(this.imageAngle);
                context.scale(this.imageScale, this.imageScale);
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
