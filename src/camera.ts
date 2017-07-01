import { Game } from './game';
import { GameScene } from './game-scene';
import { clamp } from './utils/math';
import { GraphicsAdapter } from './graphics/graphics-adapter';
import { DefaultGraphicsAdapter } from './graphics/default-graphics-adapter';

export class Camera {
    constructor(private readonly _scene: GameScene) {
        if (!this._scene) throw new Error(`You must pass in a valid Scene when you create a Camera.`);
    }

    get scene(): GameScene {
        return this._scene;
    }
    get game() {
        return this.scene.game;
    }

    private _clearColor: string | null = null;
    get clearColor() {
        return this._clearColor;
    }
    set clearColor(val: string | null) {
        this._clearColor = val;
    }
    
    private _center: [number, number] = [0, 0];
    get center(): [number, number] {
        return [this._center[0], this._center[1]];
    }
    set center([x, y]: [number, number]) {
        this._center = [x, y];
    }
    
    private _floorCenterPosition = true;
    get floorCenterPosition() {
        return this._floorCenterPosition;
    }
    set floorCenterPosition(val: boolean) {
        this._floorCenterPosition = val;
    }

    private _zoomScale = 1;
    get zoomScale() {
        return this._zoomScale;
    }
    set zoomScale(val) {
        if (val <= 0) throw new Error(`The zoom scale must be positive`);
        this._zoomScale = clamp(val, this.minZoomScale, this.maxZoomScale);
    }

    private _maxZoomScale = 4;
    get maxZoomScale() {
        return this._maxZoomScale;
    }
    set maxZoomScale(val) {
        if (val <= 0) throw new Error(`The max zoom scale must be positive`);
        if (val < this._minZoomScale) throw new Error(`The min zoom scale is greater than the max zoom scale.`);
        this._maxZoomScale = val;
        this.zoomScale = this.zoomScale;
    }

    private _minZoomScale = .25;
    get minZoomScale() {
        return this._minZoomScale;
    }
    set minZoomScale(val) {
        if (val <= 0) throw new Error(`The min zoom scale must be positive`);
        if (val > this._maxZoomScale) throw new Error(`The max zoom scale is less than the min zoom scale.`);
        this._minZoomScale = val;
        this.zoomScale = this.zoomScale;
    }

    get bounds() {
        return this.calculateBounds(this.center, this.zoomScale)
    }
    protected calculateBounds(center: [number, number], zoomScale: number) {
        let [cvWidth, cvHeight] = this.game.canvasSize;
        let [hoff, voff] = [(cvWidth / 2) / zoomScale, (cvHeight / 2) / zoomScale];
        return {
            left: center[0] - hoff,
            right: center[0] + hoff,
            top: center[1] + voff,
            bottom: center[1] - voff
        };
    }

    tick(delta: number) { }
    fixedTick() { }

    clear(adapter: GraphicsAdapter) {
        if (this._clearColor) adapter.clear(this._clearColor);
    }

    renderTransformed(adapter: GraphicsAdapter, act: () => void) {
        let [tx, ty] = this._center;
        if (this.floorCenterPosition) {
            tx = Math.floor(tx);
            ty = Math.floor(ty);
        }
        let [cvWidth, cvHeight] = this.game.canvasSize;
        tx = Math.floor(cvWidth / 2) - (tx * this._zoomScale);
        ty = Math.floor(cvHeight / 2) - (ty * this._zoomScale);
        adapter.renderTransformed(tx, ty, 0, this._zoomScale, this._zoomScale, act);
    }
    transformPixelCoordinates(x: number, y: number): [number, number];
    transformPixelCoordinates(coords: { x: number, y: number }): [number, number];
    transformPixelCoordinates(x: number | { x: number, y: number }, y?: number): [number, number] {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        let [tx, ty] = this._center;
        if (this.floorCenterPosition) {
            tx = Math.floor(tx);
            ty = Math.floor(ty);
        }
        let [cvWidth, cvHeight] = this.game.canvasSize;
        tx = Math.floor(cvWidth / 2) - (tx * this._zoomScale);
        ty = Math.floor(cvHeight / 2) - (ty * this._zoomScale);
        return [(x - tx) / this._zoomScale, (y - ty) / this._zoomScale];
    }
}
