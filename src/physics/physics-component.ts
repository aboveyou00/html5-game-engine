import { degToRad, fmod, pointDirection } from '../utils/math';
import { Component, ComponentOptions } from '../component';
import { GameScene } from '../game-scene';
import { CollisionMask } from '../physics/collision-mask';
import merge = require('lodash.merge');

export type PhysicsComponentOptions = ComponentOptions & {
    direction?: number,
    speed?: number,
    hspeed?: number,
    vspeed?: number,
    
    mask?: CollisionMask
};

export class PhysicsComponent extends Component {
    constructor(opts: PhysicsComponentOptions = {}) {
        super(merge({ shouldTick: true }, opts));
        
        if (typeof opts.direction != 'undefined') this.direction = opts.direction;
        if (typeof opts.speed != 'undefined') this.speed = opts.speed;
        if (typeof opts.hspeed != 'undefined') this.hspeed = opts.hspeed;
        if (typeof opts.vspeed != 'undefined') this.vspeed = opts.vspeed;
        
        if (typeof opts.mask != 'undefined') this.mask = opts.mask;
    }
    
    private DEBUG_MOVEMENT = false;
    
    private _dir = 0;
    private _speed = 0;
    private _hspeed = 0;
    private _vspeed = 0;
    
    get direction() {
        return this._dir;
    }
    set direction(val) {
        if (this.DEBUG_MOVEMENT) console.log(`setting direction: ${val}`);
        val = fmod(val, 360);
        if (this._dir == val) return;
        this._dir = val;
        this.updateHVSpeed();
    }
    get speed() {
        return this._speed;
    }
    set speed(val) {
        if (this.DEBUG_MOVEMENT) console.log(`setting speed: ${val}`);
        if (val < 0) throw new Error(`Invalid speed: ${val}. Must be >= 0`);
        if (this._speed == val) return;
        this._speed = val;
        this.updateHVSpeed();
    }
    
    get hspeed() {
        return this._hspeed;
    }
    set hspeed(val) {
        if (this.DEBUG_MOVEMENT) console.log(`setting hspeed: ${val}`);
        if (this._hspeed == val) return;
        this._hspeed = val;
        this.updateDirectionAndSpeed();
    }
    get vspeed() {
        return this._vspeed;
    }
    set vspeed(val) {
        if (this.DEBUG_MOVEMENT) console.log(`setting vspeed: ${val}`);
        if (this._vspeed == val) return;
        this._vspeed = val;
        this.updateDirectionAndSpeed();
    }
    
    private updateHVSpeed() {
        let radians = degToRad(this._dir);
        this._vspeed = -Math.sin(radians) * this._speed;
        this._hspeed = Math.cos(radians) * this._speed;
        if (this.DEBUG_MOVEMENT) console.log(`  hspeed: ${this._hspeed}; vspeed: ${this._vspeed}`);
    }
    private updateDirectionAndSpeed() {
        this._speed = Math.sqrt(this._hspeed * this._hspeed + this._vspeed * this._vspeed);
        if (this._speed == 0) return;
        this._dir = pointDirection(0, 0, this._hspeed, this._vspeed);
        if (this._dir < 0) this._dir += 360;
        if (this.DEBUG_MOVEMENT) console.log(`  speed: ${this._speed}; direction: ${this._dir}`);
    }
    
    private _mask: CollisionMask;
    get mask() {
        return this._mask;
    }
    set mask(val: CollisionMask) {
        if (val === this._mask) return;
        if (this._mask && this.scene) this.scene.removeCollider(this._mask);
        this._mask = val;
        if (this._mask && this.scene) this.scene.addCollider(this._mask);
    }
    
    onAddToScene() {
        super.onAddToScene();
        if (this.mask) this.scene.addCollider(this.mask);
    }
    onRemoveFromScene(scene: GameScene) {
        super.onRemoveFromScene(scene);
        if (this.mask) this.scene.removeCollider(this.mask);
    }
    
    tick(delta: number) {
        super.tick(delta);
        
        this.gameObject.x += this.hspeed * delta;
        this.gameObject.y += this.vspeed * delta;
    }
}
