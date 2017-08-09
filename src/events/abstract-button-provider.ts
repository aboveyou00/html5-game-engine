import { GameEvent } from './events';

export interface AbstractButtonProvider {
    transformEvent(e: GameEvent): GameEvent | null;
    isAbstractButtonDown(name: string): boolean;
}
