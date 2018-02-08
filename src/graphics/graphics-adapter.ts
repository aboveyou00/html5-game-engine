import { Game } from '../game';
import { GameObject } from '../game-object';
import { GameScene } from '../game-scene';

export abstract class GraphicsAdapter {
    abstract init(game: Game): void;
    abstract readonly canvas: HTMLCanvasElement | null;
    
    abstract clear(color: string): void;
    abstract renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string): void;
    abstract renderScene(scene: GameScene): void;
    abstract renderObject(obj: GameObject): void;
    
    abstract renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void, key?: symbol): void;
}
