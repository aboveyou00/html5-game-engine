import { GameObject } from '../game-object';

export abstract class GraphicsAdapter {
    abstract init();
    abstract readonly canvas: HTMLCanvasElement;
    
    abstract renderResourceLoader(resourcsLoaded: number, totalResources: number, errors?: string);
    abstract renderObject(obj: GameObject);
    
    abstract renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void);
}
