import { GameObject, GameObjectOptions } from '../game-object';
import { GameScene } from '../game-scene';
import { AudioT } from '../utils/audio';
import merge = require('lodash.merge');

export interface AudioSourceObjectOptions extends GameObjectOptions {
    shouldLoop?: boolean,
    sceneIndependent?: boolean,
    beginPlay?: boolean
}

export class AudioSourceObject extends GameObject {
    constructor(name: string, private audio: AudioT, opts: AudioSourceObjectOptions = {}) {
        super(name, merge({
            shouldRender: false
        }, opts));

        if (typeof opts.shouldLoop !== 'undefined') this._shouldLoop = opts.shouldLoop;
        if (typeof opts.sceneIndependent !== 'undefined') this._sceneIndependent = opts.sceneIndependent;
        if (typeof opts.beginPlay !== 'undefined') this._beginPlay = opts.beginPlay;
    }

    private _shouldLoop = false;
    get shouldLoop() {
        return this._shouldLoop;
    }

    private _sceneIndependent = false;
    get sceneIndependent() {
        return this._sceneIndependent;
    }
    
    private _beginPlay = true;

    addToScene(scene: GameScene) {
        super.addToScene(scene);

        let theirAudio = this.resources.loadAudio(this.audio.src);
        this._myAudio = document.createElement('audio');
        this._myAudio.src = theirAudio.src;
        this._myAudio.onended = () => {
            if (this._shouldLoop) this._myAudio.play();
            else this.scene.removeObject(this);
        };
        if ((this.game.scene == scene || this.sceneIndependent) && this._beginPlay) this._myAudio.play();
    }

    private _myAudio: HTMLAudioElement;
    get myAudio() {
        return this._myAudio;
    }

    onSceneEnter() {
        if (this.myAudio.paused) this._myAudio.play();
    }
    onSceneExit() {
        if (!this.myAudio.paused && !this.sceneIndependent) this._myAudio.pause();
    }
}
