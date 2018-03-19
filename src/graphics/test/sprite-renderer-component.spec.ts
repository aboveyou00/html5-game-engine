/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { SpriteRendererComponent } from '../sprite-renderer-component';
import { GameObject } from '../../game-object';
import { Game } from '../../game';
import { GameScene } from '../../game-scene';
import { MockGame } from '../../test/mock-game';
import { SpriteT } from '../../utils/render/sprite';
import { degToRad } from '../../utils/math';

describe('GameObject', () => {
    let spriteRenderer: SpriteRendererComponent;
    let gobj: GameObject;
    let scene: GameScene;
    let game: Game;
    beforeEach(() => {
        spriteRenderer = new SpriteRendererComponent();
        gobj = new GameObject({ spriteRenderer: spriteRenderer });
        game = <any>(new MockGame(scene = new GameScene()));
        scene.addObject(gobj);
    });
    
    describe('.constructor', () => {
        it('should set sprite, animationAge, animationSpeed, and imageAngle based on the options passed in', () => {
            let expectedSprite: SpriteT = <any>Symbol();
            let expectedAnimationAge = 23.6;
            let expectedAnimationSpeed = 1.24;
            let expectedImageAngle = degToRad(45);
            let spriteRenderer = new SpriteRendererComponent({
                sprite: expectedSprite,
                animationAge: expectedAnimationAge,
                animationSpeed: expectedAnimationSpeed,
                imageAngle: expectedImageAngle
            });
            expect(spriteRenderer.sprite).to.eq(expectedSprite);
            expect(spriteRenderer.animationAge).to.eq(expectedAnimationAge);
            expect(spriteRenderer.animationSpeed).to.eq(expectedAnimationSpeed);
            expect(spriteRenderer.imageAngle).to.eq(expectedImageAngle);
        });
    });
    
    describe('.tick', () => {
        it('should not modify the animation age if animationSpeed == 0', () => {
            Object.assign(spriteRenderer, { animationAge: 0, animationSpeed: 0 });
            gobj.tick(1);
            expect(spriteRenderer.animationAge).to.eq(0);
        });
        it('should increase the animation age by animationSpeed * delta', () => {
            Object.assign(spriteRenderer, { animationAge: 0, animationSpeed: .3 });
            gobj.tick(.5);
            expect(spriteRenderer.animationAge).to.eq(.5 * .3);
        });
    });
});
