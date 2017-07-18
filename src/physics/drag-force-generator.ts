import { CollisionMask } from './collision-mask';
import { ForceGenerator } from './force-generator';

export class DragForceGenerator implements ForceGenerator {
    constructor(public k1: number, public k2: number) { }
    
    enabled = true;
    
    updateCollider(collider: CollisionMask, delta: number) {
        if (!this.enabled) return;
        if (!collider.gameObject.speed) return;
        let speed = collider.gameObject.speed;
        let dragCoeff = this.k1 * speed + this.k2 * Math.pow(speed, 2);
        let [hspeed, vspeed] = [collider.gameObject.hspeed, collider.gameObject.vspeed];
        let [nhspeed, nvspeed] = [hspeed / speed, vspeed / speed];
        let [hdrag, vdrag] = [-nhspeed * dragCoeff, -nvspeed * dragCoeff];
        collider.addForce(hdrag * delta, vdrag * delta);
    }
}
