/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { AudioSourceObject } from '../audio-source-object';
import { MockGame } from '../../test/mock-game';
import { Game } from '../../game';
import { GameScene } from '../../game-scene';

describe('AudioSourceObject', () => {
    it('should set shouldLoop to true based on passed in Options', () =>{
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: true });
        expect(audio.shouldLoop).to.be.true;
    });
    
    it('should set shouldLoop to false based on passed in Options', () => {
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: false });
        expect(audio.shouldLoop).to.be.false;
    });
    
    it('should call play on its audio on scene enter', () => {
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: false });
        let game: Game = <any>(new MockGame(new GameScene()));
        audio.addToScene(game.scene!);
        audio.onSceneExit();
        let stub = sinon.stub(audio.myAudio, 'play');
        audio.onSceneEnter();
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should call pause on its audio on scene enter', () => {
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: false });
        let game: Game = <any>(new MockGame(new GameScene()));
        audio.addToScene(game.scene!);
        audio.onSceneEnter();
        let stub = sinon.stub(audio.myAudio, 'pause');
        audio.onSceneExit();
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should call play for a looping audio when it ends', () => {
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: true });
        let game: Game = <any>(new MockGame(new GameScene()));
        audio.addToScene(game.scene!);
        
        let stub = sinon.stub(audio.myAudio, 'play');
        audio.myAudio.onended(<any>{});
        expect(stub).to.have.been.calledOnce;
    });
    
    it('should remove a non-looping audio game object when it ends', () => {
        let audio: AudioSourceObject = new AudioSourceObject('test audio', { src: 'test audio' }, { shouldLoop: false });
        let game: Game = <any>(new MockGame(new GameScene()));
        audio.addToScene(game.scene!);
        
        let stub = sinon.stub(game.scene, 'removeObject');
        audio.myAudio.onended(<any>{});
        expect(stub).to.have.been.calledOnce.calledWith(sinon.match((x: any) => x == audio));
    });
});
