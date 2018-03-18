/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { AudioSourceComponent } from '../audio-source-component';
import { MockGame } from '../../test/mock-game';
import { Game } from '../../game';
import { GameObject } from '../../game-object';
import { GameScene } from '../../game-scene';

describe('AudioSourceComponent', () => {
    it('should set shouldLoop to true based on passed in Options', () =>{
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: true });
        expect(audio.shouldLoop).to.be.true;
    });
    
    it('should set shouldLoop to false based on passed in Options', () => {
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: false });
        expect(audio.shouldLoop).to.be.false;
    });
    
    it('should call play on its audio on scene enter', () => {
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: false });
        let audioGobj = new GameObject({ components: [audio] });
        let game: Game = <any>(new MockGame(new GameScene()));
        game.scene!.addObject(audioGobj);
        audio.onSceneExit();
        let stub = sinon.stub(audio.myAudio, 'play');
        audio.onSceneEnter();
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should call pause on its audio on scene exit', () => {
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: false });
        let audioGobj = new GameObject({ components: [audio] });
        let game: Game = <any>(new MockGame(new GameScene()));
        game.scene!.addObject(audioGobj);
        let stub = sinon.stub(audio.myAudio, 'pause');
        audio.onSceneExit();
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should call play for a looping audio when it ends', () => {
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: true });
        let audioGobj = new GameObject({ components: [audio] });
        let game: Game = <any>(new MockGame(new GameScene()));
        game.scene!.addObject(audioGobj);
        
        let stub = sinon.stub(audio.myAudio, 'play');
        audio.myAudio.onended(<any>{});
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should remove a non-looping audio game object when it ends', () => {
        let audio = new AudioSourceComponent({ audio: { src: 'test audio' }, shouldLoop: false });
        let audioGobj = new GameObject({ components: [audio] });
        let game: Game = <any>(new MockGame(new GameScene()));
        game.scene!.addObject(audioGobj);
        
        let stub = sinon.stub(game.scene, 'removeObject');
        audio.myAudio.onended(<any>{});
        expect(stub).to.have.been.calledOnce.calledWith(sinon.match((x: any) => x == audioGobj));
    });
});
