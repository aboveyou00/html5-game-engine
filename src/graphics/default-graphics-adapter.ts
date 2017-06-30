import { fillText } from '../utils/render';
import { GraphicsAdapter } from './graphics-adapter';
import { GameObject } from '../game-object';
import { ResourceLoader } from '../resource-loader';
import { SpriteT, isSingleTileSprite, isAnimationSprite } from '../utils/sprite';
import { fmod } from '../utils/math';

export class DefaultGraphicsAdapter extends GraphicsAdapter {
    constructor();
    constructor(context: CanvasRenderingContext2D);
    constructor(private _context: CanvasRenderingContext2D | null = null) {
        super();
    }
    
    private _initialized = false;
    init() {
        if (this._initialized) throw new Error(`Cannot initialize DefaultGraphicsAdapter twice.`);
        this._initialized = true;
        
        if (this._context) throw new Error(`This DefaultGraphicsAdapter was created with a context`);
        
        if (!this.canvas) this._canvas = <HTMLCanvasElement>document.getElementById('gameCanvas');
        this._context = this.canvas.getContext("2d");
    }
    private _canvas: HTMLCanvasElement | null;
    get canvas() {
        return this._canvas;
    }
    get context() {
        return this._context;
    }
    
    clear(color: string) {
        let context = this.context;
        context.fillStyle = color;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string) {
        let context = this.context;
        
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
    renderObject(obj: GameObject) {
        let context = this.context;
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
    
    renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void) {
        let context = this.context;
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
        let context = this.context;

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
            context.drawImage(img, x - pivot.x, y - pivot.y);
        }
    }
}
