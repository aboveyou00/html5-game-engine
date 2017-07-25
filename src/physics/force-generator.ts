import { CollisionMask } from './collision-mask';

export class ForceGenerator {
    updateCollider(collider: CollisionMask, delta: number);
    render(collider: CollisionMask, context: CanvasRenderingContext2D) { }
}
