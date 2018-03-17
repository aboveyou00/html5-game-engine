import { GraphicsAdapter } from './graphics-adapter';
import { Game } from '../game';
import { GameScene } from '../game-scene';
import { GameObject } from '../game-object';
import { CollisionMask } from '../physics/collision-mask';
import { ForceGenerator } from '../physics/force-generator';
import { Component } from '../component';

export class EmptyGraphicsAdapter extends GraphicsAdapter {
    constructor() {
        super();
    }
    
    private _initialized = false;
    init(game: Game): void {
        if (this._initialized) throw new Error(`Cannot initialize EmptyGraphicsAdapter twice.`);
        this._initialized = true;
        this._game = game;
        
        this._size = [640, 480];
        this._game.eventQueue.enqueue({
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
    
    private _game: Game;
    get game() {
        return this._game;
    }
    
    private _size: [number, number] = [0, 0];
    get canvasSize(): [number, number] {
        return [this._size[0], this._size[1]];
    }
    
    updateCursor(fallbacks: string[]): boolean {
        return true;
    }
    
    clear(color: string): void { }
    
    renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string | undefined): void { }
    renderScene(scene: GameScene): void { }
    renderEmptyObject(obj: GameObject) { }
    renderComponent(comp: Component) { }
    renderCollisionMask(mask: CollisionMask) { }
    renderForceGenerator(collider: CollisionMask, generator: ForceGenerator) { }
    
    renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void, key?: symbol | undefined): void { }
}
