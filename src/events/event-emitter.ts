

export class EventEmitter<T = void> {
    constructor() {
    }

    private _listeners: ((val: T) => void)[] = [];

    addListener(listener: (val: T) => void): () => void {
        if (!listener || typeof listener !== 'function') throw new Error(`Listener is not a function: ${listener}`);
        this._listeners.push(listener);
        return () => {
            let idx = this._listeners.indexOf(listener);
            if (idx !== -1) this._listeners.splice(idx, 1);
        }
    }

    private _isEmitting = false;
    emit(val: T) {
        if (this._isEmitting) throw new Error(`EventEmitter.emit was recursively invoked. New value: ${val}`);
        this._isEmitting = true;
        for (let listener of this._listeners) {
            listener(val);
        }
        this._isEmitting = false;
    }
}
