import { GameObject } from '../game-object';
import { Game } from '../game';

export abstract class GraphicsAdapter {
    abstract init(game: Game);
    abstract readonly canvas: HTMLCanvasElement;
    
    abstract clear(color: string);
    abstract renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string);
    abstract renderObject(obj: GameObject);
    
    abstract renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void);
}
