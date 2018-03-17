import { Game } from '../game';
import { GameObject } from '../game-object';
import { GameScene } from '../game-scene';
import { CollisionMask } from '../physics/collision-mask';
import { ForceGenerator } from '../physics/force-generator';
import { Component } from '../component';

export abstract class GraphicsAdapter {
    abstract init(game: Game): void;
    abstract cleanUp(): void;
    
    abstract readonly game: Game;
    abstract readonly canvasSize: [number, number];
    
    abstract updateCursor(fallbacks: string[]): boolean;
    updateCursorStyle(canvas: HTMLElement, fallbacks: string[]): boolean {
        for (let q = 0; q < fallbacks.length; q++) {
            let cursor = fallbacks[q];
            canvas.style.cursor = cursor;
            if (canvas.style.cursor === cursor) return true;
        }
        return false;
    }
    
    abstract clear(color: string): void;
    
    abstract renderResourceLoader(resourcesLoaded: number, totalResources: number, errors?: string): void;
    abstract renderScene(scene: GameScene): void;
    abstract renderEmptyObject(obj: GameObject): void;
    abstract renderComponent(comp: Component): void;
    abstract renderCollisionMask(mask: CollisionMask): void;
    abstract renderForceGenerator(collider: CollisionMask, generator: ForceGenerator): void;
    
    abstract renderTransformed(translateX: number, translateY: number, rotate: number, scaleX: number, scaleY: number, act: () => void, key?: symbol): void;
}
