import { SpriteT, isSingleTileSprite, isAnimationSprite } from './sprite';
import { ResourceLoader } from '../../resource-loader';
import { fmod } from '../math';

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
