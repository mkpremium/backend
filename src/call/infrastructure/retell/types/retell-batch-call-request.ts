import { RetellTaskCall } from './retell-task-call'

export interface RetellBatchCallRequest{
    originTelf: string;
    tasks:RetellTaskCall[];
    timeWindow?: TimeWindowMinutes
    timeStamp?: number;
}

export interface TimeWindowMinutes {
  startTime: number;
  endTime: number;
}
