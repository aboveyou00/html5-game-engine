import { CollisionMask } from './collision-mask';
import { ForceGenerator } from './force-generator';

export class GravityForceGenerator implements ForceGenerator {
    constructor();
    constructor(gravityAmount: number);
    constructor(hgravity: number, vgravity: number);
    constructor(towards: CollisionMask);
    constructor(hgravity?: number | CollisionMask, vgravity?: number) {
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
    
    private _towards: CollisionMask | null;
    private _hgravity: number | null;
    private _vgravity: number | null;
    
    updateCollider(collider: CollisionMask, delta: number) {
        let hgrav = this._hgravity,
            vgrav = this._vgravity;
        if (this._towards) {
            throw new Error('Not implemented');
        }
        collider.addForce(hgrav * delta, vgrav * delta);
    }
}
