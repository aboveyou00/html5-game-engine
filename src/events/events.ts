﻿import { GraphicsAdapter } from '../graphics/graphics-adapter';

export type InputTypeT = 'keyboard' | 'mouse' | 'gamepad';

export interface KeyTypedEvent {
    type: 'keyTyped',
    key: string
    code: string,
    altPressed: boolean,
    ctrlPressed: boolean,
    shiftPressed: boolean
}

export interface KeyPressedEvent {
    type: 'keyPressed',
    code: string,
    altPressed: boolean,
    ctrlPressed: boolean,
    shiftPressed: boolean
}

export interface KeyReleasedEvent {
    type: 'keyReleased',
    code: string,
    altPressed: boolean,
    ctrlPressed: boolean,
    shiftPressed: boolean
}

export interface MouseMovedEvent {
    type: 'mouseMoved',
    movementX: number,
    movementY: number,
    pageX: number,
    pageY: number
}

export interface MouseButtonPressedEvent {
    type: 'mouseButtonPressed',
    button: MouseButton,
    pageX: number,
    pageY: number
}

export interface MouseButtonReleasedEvent {
    type: 'mouseButtonReleased',
    button: MouseButton,
    pageX: number,
    pageY: number
}

export interface MouseWheelEvent {
    type: 'mouseWheel',
    delta: number,
    pageX: number,
    pageY: number
}

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    BrowserBack = 3,
    BrowserForward = 5
}

export interface CanvasResizeEvent {
    type: 'canvasResize',
    previousSize: [number, number],
    size: [number, number],
    adapter: GraphicsAdapter
}

export interface AbstractButtonPressedEvent {
    type: 'abstractButtonPressed',
    name: string,
    wrappedEvent?: GameEvent,
    sendWrappedEvent?: boolean
}
export interface AbstractButtonReleasedEvent {
    type: 'abstractButtonReleased',
    name: string,
    wrappedEvent?: GameEvent,
    sendWrappedEvent?: boolean
}
export interface AbstractButtonTypedEvent {
    type: 'abstractButtonTyped',
    name: string,
    wrappedEvent?: GameEvent,
    sendWrappedEvent?: boolean
}

export interface CurrentInputTypeChangedEvent {
    type: 'currentInputTypeChanged',
    current: InputTypeT,
    previous: InputTypeT
}

export type GamepadButtonT = 'A' | 'B' | 'X' | 'Y'
                           | 'TriggerLeft' | 'TriggerRight' | 'TriggerLeftAlt' | 'TriggerRightAlt'
                           | 'Back' | 'Start'
                           | 'LeftStick' | 'RightStick'
                           | 'DPadUp' | 'DPadDown' | 'DPadLeft' | 'DPadRight'
                           | 'Center'
                           
                           | 'LeftStickLeft' | 'LeftStickRight' | 'LeftStickUp' | 'LeftStickDown'
                           | 'RightStickLeft' | 'RightStickRight' | 'RightStickUp' | 'RightStickDown';

export const standardGamepadButtonNames: GamepadButtonT[] = [
    'A', 'B', 'X', 'Y',
    'TriggerLeft', 'TriggerRight', 'TriggerLeftAlt', 'TriggerRightAlt',
    'Back', 'Start',
    'LeftStick', 'RightStick',
    'DPadUp', 'DPadDown', 'DPadLeft', 'DPadRight',
    'Center'
];
export const standardGamepadAxisNames: [GamepadButtonT, GamepadButtonT][] = [
    ['LeftStickLeft', 'LeftStickRight'],
    ['LeftStickUp', 'LeftStickDown'],
    ['RightStickLeft', 'RightStickRight'],
    ['RightStickUp', 'RightStickDown'],
];

export interface GamepadButtonPressedEvent {
    type: 'gamepadButtonPressed',
    button: GamepadButtonT
}

export interface GamepadButtonReleasedEvent {
    type: 'gamepadButtonReleased',
    button: GamepadButtonT
}

export interface GamepadAxisChangedEvent {
    type: 'gamepadAxisChanged',
    idx: number,
    previousValue: number,
    value: number
}

export type GameEvent = KeyTypedEvent
                      | KeyPressedEvent
                      | KeyReleasedEvent
                      | MouseMovedEvent
                      | MouseButtonPressedEvent
                      | MouseButtonReleasedEvent
                      | MouseWheelEvent
                      | CanvasResizeEvent
                      | AbstractButtonPressedEvent
                      | AbstractButtonReleasedEvent
                      | AbstractButtonTypedEvent
                      | CurrentInputTypeChangedEvent
                      | GamepadButtonPressedEvent
                      | GamepadButtonReleasedEvent
                      | GamepadAxisChangedEvent;
