import { TaskCall } from './task-call'

export interface BatchCallRequest{
    originTelf: string;
    tasks:TaskCall[];
    timeWindow?: TimeWindowMinutes
    timeStamp?: number;
}

export interface TimeWindowMinutes {
  startTime: number;
  endTime: number;
}
