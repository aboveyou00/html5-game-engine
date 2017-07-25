import { CollisionMask } from './collision-mask';

export abstract class ForceGenerator {
    abstract updateCollider(collider: CollisionMask, delta: number);
    render(collider: CollisionMask, context: CanvasRenderingContext2D) { }
}
