import { fillText } from '../utils/render';
import { GraphicsAdapter } from './graphics-adapter';
import { Game } from '../game';
import { GameScene } from '../game-scene';
import { GameObject } from '../game-object';
import { ResourceLoader } from '../resource-loader';
import { EventEmitter } from '../events/event-emitter';
import { SpriteT, isSingleTileSprite, isAnimationSprite } from '../utils/sprite';
import { fmod } from '../utils/math';
import { CollisionMask } from '../physics/collision-mask';
import { ForceGenerator } from '../physics/force-generator';

export interface Context2dGraphicsAdapterOptions {
    canvas?: HTMLCanvasElement,
    moveCanvas?: boolean,
    cleanupCanvas?: boolean
}

export class Context2dGraphicsAdapter extends GraphicsAdapter {
    constructor();
    constructor(canvas: HTMLCanvasElement);
    constructor(opts: Context2dGraphicsAdapterOptions);
    constructor(opts: HTMLCanvasElement | Context2dGraphicsAdapterOptions | null = null) {
        super();
        if (opts) {
            if (opts instanceof HTMLCanvasElement) opts = { canvas: opts };
            if (opts.canvas) {
                this._canvas = opts.canvas;
                this._moveCanvas = false;
                this._cleanupCanvas = false;
            }
            if (typeof opts.moveCanvas === 'boolean') this._moveCanvas = opts.moveCanvas;
            if (typeof opts.cleanupCanvas === 'boolean') this._cleanupCanvas = opts.cleanupCanvas;
            if (!this._canvas && !this._moveCanvas) throw new Error(`Invalid option combination. If you do not provide a canvas, you cannot set moveCanvas to false`);
        }
    }
    
    private _cleanupCanvas = true;
    private _moveCanvas = true;
    
    private _initialized = false;
    init(game: Game) {
        if (this._initialized) throw new Error(`Cannot initialize Context2dGraphicsAdapter twice.`);
        this._initialized = true;
        
        this._game = game;
        
        let document = this.game.document;
        if (!this.canvas) this._canvas = document.createElement('canvas');
        if (this._moveCanvas) document.currentScript!.parentElement!.insertBefore(this.canvas!, document.currentScript);
        this._context = this.canvas!.getContext("2d")!;
        
        let body = game.body;
        this.initResize(body);
    }
    cleanUp() {
        if (!this._initialized) return;
        this._initialized = false;
        
        if (this._cleanupCanvas) {
            this._context = null;
            if (this._canvas && this._canvas.parentElement) this._canvas.parentElement.removeChild(this._canvas);
            this._canvas = null;
        }
        
        this.cleanUpResize();
    }
    
    private bodyResized = new EventEmitter<void>();
    private cleanupBodyResized: (() => void) | null = null;
    private initResize(body: HTMLBodyElement) {
        let window = this.game.window;
        
        let resizeEventHandler = () => {
            this.canvasSize = [window.innerWidth, window.innerHeight];
        };
        resizeEventHandler();
        
        window.addEventListener('resize', resizeEventHandler);
        this.cleanupBodyResized = () => {
            window.removeEventListener('resize', resizeEventHandler);
        };
    }
    private cleanUpResize() {
        if (this.cleanupBodyResized) {
            this.cleanupBodyResized();
            this.cleanupBodyResized = null;
        }
    }
    
    private _game: Game;
    get game() {
        return this._game;
    }
    
    private _canvas: HTMLCanvasElement | null = null;
    get canvas() {
        return this._canvas;
    }
    private _context: CanvasRenderingContext2D | null = null;
    get context() {
        return this._context;
    }
    
    private _canvasSize: [number, number] = [0, 0];
    get canvasSize(): [number, number] {
        return [this._canvasSize[0], this._canvasSize[1]];
    }
    set canvasSize([newWidth, newHeight]: [number, number]) {
        if (newWidth == this._canvasSize[0] && newHeight == this._canvasSize[1]) return;
        let prevSize = this._canvasSize;
        this._canvasSize = [newWidth, newHeight];
        [this.canvas!.width, this.canvas!.height] = this._canvasSize;
        if (this._game) {
            this._game.eventQueue.enqueue({
                type: 'canvasResize',
                previousSize: prevSize,
                size: [newWidth, newHeight],
                adapter: this
            });
        }
    }
    
    updateCursor(fallbacks: string[]): boolean {
        if (!this.canvas || !this.canvas.style) return false;
        return this.updateCursorStyle(this.canvas, fallbacks);
    }
    
    clear(color: string) {
        let context = this.context!;
        context.fillStyle = color;
        context.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    }
    renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string) {
        let context = this.context!;
        
        context.fillStyle = 'grey';
        context.fillRect(0, 0, context.canvas.scrollWidth, context.canvas.scrollHeight);
        
        if (totalResources > 0) {
            context.fillStyle = 'white';
            context.fillRect(4, 4, 100, 4);
            context.fillStyle = 'black';
            context.fillRect(4, 4, 100 * (resourcesLoaded / totalResources), 4);
        }

        let msg = `${resourcesLoaded}/${totalResources}`;
        if (errors && errors.length) msg += '\n' + errors;
        context.textBaseline = 'top';
        context.textAlign = 'left';
        context.fillStyle = 'black';
        fillText(context, msg, 4, 12);
    }
    renderScene(scene: GameScene) {
        scene.render(this);
    }
    renderObject(obj: GameObject) {
        let context = this.context!;
        if (typeof (<any>obj).renderImplContext2d === 'function') {
            (<any>obj).renderImplContext2d(context);
        }
        else {
            if (obj.sprite) {
                this.drawSprite(obj.resources, obj.sprite, 0, 0, obj.animationAge);
            }
            else {
                context.fillStyle = 'red';
                context.fillRect(0, 0, 16, 16);
                
                context.fillStyle = 'white';
                context.font = '16px Consolas';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText('?', 0 + 8, 0 + 8);
            }
        }
    }
    renderCollisionMask(mask: CollisionMask) {
        let context = this.context!;
        if (typeof (<any>mask).renderImplContext2d === 'function') {
            (<any>mask).renderImplContext2d(context);
        }
        else throw new Error(`Not implemented! Cannot render collision mask ${mask}`);
    }
    renderForceGenerator(collider: CollisionMask, generator: ForceGenerator) {
        let context = this.context!;
        if (typeof (<any>generator).renderImplContext2d === 'function') {
            (<any>generator).renderImplContext2d(collider, context);
        }
        else throw new Error(`Not implemented! Cannot render force generator ${generator}`);
    }
    
    renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void) {
        let context = this.context!;
        context.save();
        try {
            context.translate(translateX, translateY);
            context.rotate(rotate);
            context.scale(scaleX, scaleY);
            act();
        }
        finally {
            context.restore();
        }
    }
    
    drawSprite(loader: ResourceLoader, sprite: SpriteT, x = 0, y = 0, imageIndex = 0, defaultFps = 30) {
        if (!loader || !loader.loadImage) throw new Error(`You must pass in a valid ResourceLoader to draw a sprite.`);
        if (!sprite || !sprite.src) throw new Error(`Invalid sprite. Cannot render ${sprite}.`);
        let img = loader.loadImage(sprite.src);
        let pivot = sprite.pivot || { x: 0, y: 0 };
        let context = this.context!;
        
        if (isAnimationSprite(sprite)) {
            let tileset = sprite.tileset;
            let frames = sprite.frames;
            let fps = sprite.framesPerSecond;
            if (typeof fps === 'undefined') fps = defaultFps;
            let frameIdx = fmod(Math.floor(imageIndex * fps), frames.length);
            let frame = frames[frameIdx];
            context.drawImage(img, frame.tilex * tileset.width, frame.tiley * tileset.height, tileset.width, tileset.height, x - pivot.x, y - pivot.y, tileset.width, tileset.height);
        }
        else if (isSingleTileSprite(sprite)) {
            let tileset = sprite.tileset;
            context.drawImage(img, tileset.tilex * tileset.width, tileset.tiley * tileset.height, tileset.width, tileset.height, x - pivot.x, y - pivot.y, tileset.width, tileset.height);
        }
        else {
            //This sprite is a SimpleSpriteT
            context.drawImage(img, x - pivot.x, y - pivot.y, img.width, img.height);
        }
    }
}
