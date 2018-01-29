/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { AudioController } from '../audio-controller';

describe('AudioController', () => {
    let controller: AudioController;
    beforeEach(() => {
        controller = new AudioController();
    });
    
    describe('.getVolume', () => {
        it('should fail to get volume if the channel is not a string', () =>{
            expect(() => controller.getVolume(<string><any>25)).to.throw(/invalid audio channel/i);
        });
        it('should return 1 for channels that have no volume set', () =>{
            let expected = 1;
            let result = controller.getVolume('music');
            expect(result).to.eql(expected);
        });
        it('should return the channel volume for channels that have a set volume', () =>{
            let expected = .64;
            controller.setVolume('music', expected);
            let result = controller.getVolume('music');
            expect(result).to.eql(expected);
        });
        it('should return different volumes for different channels', () =>{
            controller.setVolume('music', .25);
            controller.setVolume('sfx', .75);
            let musicVol = controller.getVolume('music');
            let sfxVol = controller.getVolume('sfx');
            expect(musicVol).not.to.eql(sfxVol);
        });
    });
    
    describe('.setVolume', () => {
        it('should fail to set volume if set to anything but a number', () =>{
            expect(() => controller.setVolume('music', <number><any>undefined)).to.throw(/invalid volume/i);
            expect(() => controller.setVolume('music', <number><any>'not a number')).to.throw(/invalid volume/i);
            expect(() => controller.setVolume('music', <number><any>'.5')).to.throw(/invalid volume/i);
            expect(() => controller.setVolume('music', <number><any>{})).to.throw(/invalid volume/i);
        });
        it('should fail to set volume if the channel is not a string', () =>{
            expect(() => controller.setVolume(<string><any>25, .5)).to.throw(/invalid audio channel/i);
        });
        it('should clamp the volume between 0 and 1', () =>{
            controller.setVolume('music', -1);
            expect(controller.getVolume('music')).to.eql(0);
            controller.setVolume('music', 2);
            expect(controller.getVolume('music')).to.eql(1);
        });
        it('should emit a volumeChanged event when a channel volume changes', () =>{
            let obj = { listener: () => { } };
            sinon.stub(obj, 'listener');
            controller.volumeChanged.addListener(obj.listener);
            controller.setVolume('music', .5);
            expect(obj.listener).to.have.been.calledOnce;
        });
        it('should not emit a volumeChanged event if the new channel volume is the same as the old', () =>{
            let obj = { listener: () => { } };
            sinon.stub(obj, 'listener');
            controller.volumeChanged.addListener(obj.listener);
            controller.setVolume('music', 1);
            expect(obj.listener).not.to.have.been.called;
        });
    });
});
