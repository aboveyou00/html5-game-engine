import { CollisionMask } from './collision-mask';
import { ForceGenerator } from './force-generator';
import { pointDistance } from '../utils/math';

export class GravityForceGenerator extends ForceGenerator {
    constructor();
    constructor(gravityAmount: number);
    constructor(hgravity: number, vgravity: number);
    constructor(towards: CollisionMask);
    constructor(hgravity?: number | CollisionMask, vgravity?: number) {
        super();
        if (hgravity instanceof CollisionMask) this._towards = hgravity;
        else if (typeof hgravity === 'number') {
            if (typeof vgravity === 'number') {
                this._hgravity = hgravity;
                this._vgravity = vgravity;
            }
            else {
                this._hgravity = 0;
                this._vgravity = hgravity;
            }
        }
        else {
            this._hgravity = 0;
            this._vgravity = 98;
        }
    }
    
    enabled = true;
    
    private _towards: CollisionMask | null;
    private _hgravity: number | null;
    private _vgravity: number | null;
    
    updateCollider(collider: CollisionMask, delta: number) {
        if (!this.enabled) return;
        let hgrav = this._hgravity,
            vgrav = this._vgravity;
        if (this._towards) {
            let dist = pointDistance(collider.gameObject.x, collider.gameObject.y, this._towards.gameObject.x, this._towards.gameObject.y);
            let gravityCoeff = ((collider.mass * this._towards.mass) / dist) * .00001;
            [hgrav, vgrav] = [gravityCoeff * (this._towards.gameObject.x - collider.gameObject.x), gravityCoeff * (this._towards.gameObject.y - collider.gameObject.y)];
        }
        collider.addForce(hgrav * delta, vgrav * delta);
    }
}
