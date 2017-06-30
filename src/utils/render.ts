import { SpriteT, SimpleSpriteT, SingleTileSpriteT, AnimationSpriteT, isSingleTileSprite, isAnimationSprite } from './sprite';
import { ResourceLoader } from '../resource-loader';
import { fmod } from '../utils/math';

const LINE_HEIGHT = 12;

export function fillText(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
    let lines = text.split('\n');
    for (let line of lines) {
        context.fillText(line, x, y);
        y += LINE_HEIGHT;
    }
}

export function measureSprite(loader: ResourceLoader, sprite: SpriteT) {
    if (!sprite || !sprite.src) throw new Error(`Invalid sprite. Cannot measure ${sprite}.`);
    let img = loader && loader.loadImage(sprite.src);

    if (isAnimationSprite(sprite) || isSingleTileSprite(sprite)) {
        let { width, height } = sprite.tileset;
        return { width: width, height: height };
    }
    else {
        return { width: img.width || 0, height: img.height || 0 };
    }
}
