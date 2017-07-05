import { GameObject } from '../game-object';
import { CollisionMask } from './collision-mask';
import { CollisionT } from './collision';
import { pointDistance, pointDistance2 } from '../utils/math';

export class CircleCollisionMask extends CollisionMask {
    constructor(gobj: GameObject, private _radius: number, private _offset: [number, number] = [0, 0], mass: number = NaN) {
        super(gobj);
        this.mass = isNaN(mass) ? Math.PI * this.radius * this.radius : mass;
    }
    
    get radius() {
        return this._radius;
    }
    set radius(val: number) {
        this._radius = val;
    }
    
    get offset() {
        return [this._offset[0], this._offset[1]];
    }
    set offset(val: [number, number]) {
        this._offset = [val[0], val[1]];
    }
    
    updatePositions: boolean | 'once' = true;
    
    checkForCollision(other: CollisionMask) {
        if (other instanceof CircleCollisionMask) {
            let [x, y] = [this.gameObject.x + this._offset[0], this.gameObject.y + this._offset[1]];
            let [otherx, othery] = [other.gameObject.x + other._offset[0], other.gameObject.y + other._offset[1]];
            let dist2 = pointDistance2(x, y, otherx, othery);
            let threshold = Math.pow(this.radius + other.radius, 2);
            if (dist2 <= 0 || dist2 >= threshold) return null;
            
            let dist = Math.sqrt(dist2);
            let normal: [number, number] = [(otherx - x) / dist, (othery - y) / dist];
            let penetration = (this.radius + other.radius) - dist;
            let collision: CollisionT = {
                first: this,
                second: other,
                contactNormal: normal,
                contactPoint: [x + normal[0] * (this.radius - (penetration / 2)), y + normal[1] * (this.radius - (penetration / 2))],
                penetration: penetration + .01
            };
            this.contacts.push(collision);
            other.contacts.push(collision);
            return collision;
        }
        else throw new Error('Not implemented');
    }
    resolveCollisions() {
        for (let q = 0; q < this.contacts.length; q++) {
            let contact = this.contacts[q];
            if (contact.first !== this) continue;
            let other = contact.second;
            let relativeMass = this.mass / (this.mass + other.mass);
            let eAbsorb = 1 - relativeMass;
            if (this.updatePositions !== false) {
                this.impulsex -= contact.contactNormal[0] * eAbsorb * contact.penetration;
                this.impulsey -= contact.contactNormal[1] * eAbsorb * contact.penetration;
                other.impulsex += contact.contactNormal[0] * relativeMass * contact.penetration;
                other.impulsey += contact.contactNormal[1] * relativeMass * contact.penetration;
                this.impulseCount++;
                other.impulseCount++;
                
                // let newHspeed = this.speed * Math.cos();
                
                // this.gameObject.hspeed = newHspeed;
                // other.gameObject.hspeed = newHspeedOther;
                // this.gameObject.vspeed = newVspeed;
                // other.gameObject.vspeed = newVspeedOther;
            }
        }
        if (this.updatePositions === 'once') this.updatePositions = false;
    }
    
    renderImpl(context: CanvasRenderingContext2D) {
        context.strokeStyle = this.contacts.length ? 'red' : 'green';
        context.beginPath();
        context.ellipse(this._offset[0], this._offset[1], this.radius, this.radius, 0, 0, 2 * Math.PI);
        context.stroke();
        
        context.fillStyle = 'red';
        context.fillRect(this._offset[0] - 3, this._offset[1] - 3, 6, 6);
        
        context.strokeStyle = 'purple';
        for (let q = 0; q < this.contacts.length; q++) {
            let contact = this.contacts[q];
            if (contact.first !== this) continue;
            context.fillRect(contact.contactPoint[0] - this.gameObject.x - 1, contact.contactPoint[1] - this.gameObject.y - 1, 2, 2);
            context.beginPath();
            context.moveTo(contact.contactPoint[0] - this.gameObject.x - contact.contactNormal[0] * contact.penetration / 2, contact.contactPoint[1] - this.gameObject.y - contact.contactNormal[1] * contact.penetration / 2);
            context.lineTo(contact.contactPoint[0] - this.gameObject.x + contact.contactNormal[0] * contact.penetration / 2, contact.contactPoint[1] - this.gameObject.y + contact.contactNormal[1] * contact.penetration / 2);
            context.stroke();
        }
    }
}
