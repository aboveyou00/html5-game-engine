import { GraphicsAdapter } from './graphics-adapter';
import { Game } from '../game';
import { GameScene } from '../game-scene';
import { GameObject } from '../game-object';
import { CollisionMask } from '../physics/collision-mask';
import { ForceGenerator } from '../physics/force-generator';

export class EmptyGraphicsAdapter extends GraphicsAdapter {
    constructor() {
        super();
    }
    
    private _initialized = false;
    private game: Game;
    init(game: Game): void {
        if (this._initialized) throw new Error(`Cannot initialize EmptyGraphicsAdapter twice.`);
        this._initialized = true;
        this.game = game;
        
        this.game.eventQueue.enqueue({
            type: 'canvasResize',
            previousSize: [0, 0],
            size: this.canvasSize,
            adapter: this
        });
    }
    cleanUp(): void {
        if (!this._initialized) return;
        this._initialized = false;
    }
    
    private _size: [number, number] = [640, 480];
    get canvasSize(): [number, number] {
        return [this._size[0], this._size[1]];
    }
    
    updateCursor(fallbacks: string[]): boolean {
        return true;
    }
    
    clear(color: string): void { }
    
    renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string | undefined): void { }
    renderScene(scene: GameScene): void { }
    renderObject(obj: GameObject): void { }
    renderCollisionMask(mask: CollisionMask) { }
    renderForceGenerator(collider: CollisionMask, generator: ForceGenerator) { }
    
    renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void, key?: symbol | undefined): void { }
}
