import { GraphicsAdapter } from './graphics-adapter';

export class DefaultGraphicsAdapter extends GraphicsAdapter {
    constructor();
    constructor(context: CanvasRenderingContext2D);
    constructor(private _context: CanvasRenderingContext2D | null = null) {
        super();
    }
    
    private _initialized = false;
    init() {
        if (this._initialized) throw new Error(`Cannot initialize DefaultGraphicsAdapter twice.`);
        this._initialized = true;
        
        if (this._context) throw new Error(`This DefaultGraphicsAdapter was created with a context`);
        
        if (!this.canvas) this._canvas = <HTMLCanvasElement>document.getElementById('gameCanvas');
        this._context = this.canvas.getContext("2d");
    }
    private _canvas: HTMLCanvasElement | null;
    get canvas() {
        return this._canvas;
    }
    get context() {
        return this._context;
    }
}
