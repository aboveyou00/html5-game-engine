import { GameScene } from '../game-scene';
import { EventQueue } from '../events/event-queue';
import { ResourceLoader } from '../resource-loader';
import { AudioController } from '../audio/audio-controller';

export class MockGame {
    constructor(scene: GameScene | null = null) {
        if (scene) this.changeScene(scene);
    }

    scene: GameScene | null = null;
    changeScene(scene: GameScene) {
        this.scene = scene;
        scene.game = <any>this;
    }

    resourceLoader = new ResourceLoader();
    eventQueue = new EventQueue();
    audioController = new AudioController();

    isRunning = true;

    canvasSize = [640, 480];
}
