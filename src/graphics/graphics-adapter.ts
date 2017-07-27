import { Game } from '../game';
import { GameObject } from '../game-object';
import { GameScene } from '../game-scene';

export abstract class GraphicsAdapter {
    abstract init(game: Game);
    abstract readonly canvas: HTMLCanvasElement;
    
    abstract clear(color: string);
    abstract renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string);
    abstract renderScene(scene: GameScene);
    abstract renderObject(obj: GameObject);
    
    abstract renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void, key?: symbol);
}
