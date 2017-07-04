import { CollisionMask } from './collision-mask';

export type CollisionT = {
    first: CollisionMask,
    second: CollisionMask,
    contactNormal: [number, number],
    contactPoint: [number, number],
    penetration: number,
    friction?: number,
    restitutiom?: number
}
