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
    
    private isCheckingCollisions = false;
    checkForCollisions(other: CollisionMask): CollisionT[] | null {
        if (this.isCheckingCollisions) throw new Error(`Already checking collisions!`);
        this.isCheckingCollisions = true;
        try {
            if (other instanceof CircleCollisionMask) {
                let [x, y] = [this.gameObject.x + this._offset[0], this.gameObject.y + this._offset[1]];
                let [otherx, othery] = [other.gameObject.x + other._offset[0], other.gameObject.y + other._offset[1]];
                let dist2 = pointDistance2(x, y, otherx, othery);
                let threshold = Math.pow(this.radius + other.radius, 2);
                if (dist2 <= 0 || dist2 >= threshold) return null;
                
                if (this.isTrigger || other.isTrigger) {
                    other.triggers.push(this);
                    this.triggers.push(other);
                    return null;
                }
                else {
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
                    return [collision];
                }
            }
            else {
                return other.checkForCollisions(this);
            }
        }
        finally { this.isCheckingCollisions = false; }
    }
    resolveCollisions() {
        for (let q = 0; q < this.contacts.length; q++) {
            let contact = this.contacts[q];
            if (contact.first !== this) continue;
            let other = contact.second;
            if (this.isFixed && other.isFixed) return;
            let relativeMass = this.mass / (this.mass + other.mass);
            if (isNaN(relativeMass)) throw new Error(`relativeMass is not a number`);
            if (this.isFixed) relativeMass = 1;
            else if (other.isFixed) relativeMass = 0;
            let eAbsorb = 1 - relativeMass;
            if (this.updatePositions !== false && (!this.isFixed || !other.isFixed)) {
                if (!this.isFixed) {
                    if (isNaN(contact.contactNormal[0]) || isNaN(eAbsorb) || isNaN(contact.penetration)) throw new Error(`No bueno!`);
                    this.collisionImpulseX -= contact.contactNormal[0] * eAbsorb * contact.penetration;
                    this.collisionImpulseY -= contact.contactNormal[1] * eAbsorb * contact.penetration;
                    this.impulseCount++;
                }
                if (!other.isFixed) {
                    if (isNaN(contact.contactNormal[0]) || isNaN(eAbsorb) || isNaN(contact.penetration)) throw new Error(`No bueno!`);
                    other.collisionImpulseX += contact.contactNormal[0] * relativeMass * contact.penetration;
                    other.collisionImpulseY += contact.contactNormal[1] * relativeMass * contact.penetration;
                    other.impulseCount++;
                }
                
                let a1 = (contact.contactNormal[0] * this.gameObject.hspeed) + ((contact.contactNormal[1] * this.gameObject.vspeed));
                let a2 = (contact.contactNormal[0] * other.gameObject.hspeed) + ((contact.contactNormal[1] * other.gameObject.vspeed));
                let optimizedP = (2 * (a1 - a2)) / (this.mass + other.mass);
                
                if (!this.isFixed) {
                    [this.gameObject.hspeed, this.gameObject.vspeed] = [
                        this.gameObject.hspeed - optimizedP * other.mass * contact.contactNormal[0],
                        this.gameObject.vspeed - optimizedP * other.mass * contact.contactNormal[1]
                    ];
                }
                if (!other.isFixed) {
                    [other.gameObject.hspeed, other.gameObject.vspeed] = [
                        other.gameObject.hspeed + optimizedP * this.mass * contact.contactNormal[0],
                        other.gameObject.vspeed + optimizedP * this.mass * contact.contactNormal[1]
                    ];
                }
            }
        }
        if (this.updatePositions === 'once') this.updatePositions = false;
    }
    
    renderImplContext2d(context: CanvasRenderingContext2D) {
        let camera = this.gameObject.renderCamera === 'default' ? this.gameObject.scene.camera :
                        this.gameObject.renderCamera !== 'none' ? this.gameObject.renderCamera :
                                                                  null;
        let zoomScale = !!camera ? 1 / camera.zoomScale : 1;
        
        context.strokeStyle = this.contacts.length ? 'red' : 'green';
        context.lineWidth = zoomScale;
        context.beginPath();
        context.ellipse(this._offset[0], this._offset[1], this.radius, this.radius, 0, 0, 2 * Math.PI);
        context.stroke();
        
        context.fillStyle = 'red';
        context.fillRect(this._offset[0] - 3 * zoomScale, this._offset[1] - 3 * zoomScale, 6 * zoomScale, 6 * zoomScale);
        
        context.strokeStyle = 'purple';
        for (let q = 0; q < this.contacts.length; q++) {
            let contact = this.contacts[q];
            if (contact.first !== this) continue;
            context.fillRect(contact.contactPoint[0] - this.gameObject.x - 1 * zoomScale, contact.contactPoint[1] - this.gameObject.y - 1 * zoomScale, 2 * zoomScale, 2 * zoomScale);
            context.beginPath();
            context.moveTo(contact.contactPoint[0] - this.gameObject.x - contact.contactNormal[0] * contact.penetration / 2, contact.contactPoint[1] - this.gameObject.y - contact.contactNormal[1] * contact.penetration / 2);
            context.lineTo(contact.contactPoint[0] - this.gameObject.x + contact.contactNormal[0] * contact.penetration / 2, contact.contactPoint[1] - this.gameObject.y + contact.contactNormal[1] * contact.penetration / 2);
            context.stroke();
        }
    }
}
