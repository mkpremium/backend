import { EventEmitter } from 'events'

export const callEmitter = new EventEmitter()

export enum CallEvent {
    CALL_COMPLETED = 'CALL_COMPLETED'
}
