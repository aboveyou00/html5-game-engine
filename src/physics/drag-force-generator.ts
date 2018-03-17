import { CollisionMask } from './collision-mask';
import { ForceGenerator } from './force-generator';

export class DragForceGenerator extends ForceGenerator {
    constructor(public k1: number, public k2: number) {
        super();
    }
    
    enabled = true;
    
    updateCollider(collider: CollisionMask, delta: number) {
        if (!this.enabled) return;
        let physics = collider.gameObject.physics;
        if (!physics || physics!.speed || collider.isFixed) return;
        
        let speed = physics.speed / 100;
        let dragCoeff = this.k1 * speed + this.k2 * Math.pow(speed, 2);
        if (dragCoeff > speed * 100) dragCoeff = speed * 100;
        
        let [hspeed, vspeed] = [physics.hspeed, physics.vspeed];
        let [nhspeed, nvspeed] = [hspeed / speed, vspeed / speed];
        let [hdrag, vdrag] = [-nhspeed * dragCoeff, -nvspeed * dragCoeff];
        collider.addForce(hdrag * delta, vdrag * delta);
    }
}
