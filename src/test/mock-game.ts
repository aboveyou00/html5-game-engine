import { GameScene } from '../game-scene';
import { EventQueue } from '../events/event-queue';
import { ResourceLoader } from '../resource-loader';
import { AudioController } from '../audio/audio-controller';
import { GraphicsAdapter } from '../graphics/graphics-adapter';
import { EmptyGraphicsAdapter } from '../graphics/empty-graphics-adapter';

export class MockGame {
    constructor(scene: GameScene | null = null, private graphicsAdapter: GraphicsAdapter | null = null) {
        if (scene) this.changeScene(scene);
        this.graphicsAdapter = new EmptyGraphicsAdapter();
    }
    
    document = document;
    body = document.getElementsByTagName('body')[0];
    window = window;
    
    scene: GameScene | null = null;
    changeScene(scene: GameScene) {
        this.scene = scene;
        scene.game = <any>this;
    }
    
    resourceLoader = new ResourceLoader();
    eventQueue = new EventQueue();
    audioController = new AudioController();
    
    isRunning = true;
}
