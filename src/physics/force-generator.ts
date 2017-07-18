import { CollisionMask } from './collision-mask';

export interface ForceGenerator {
    updateCollider(collider: CollisionMask, delta: number);
}
