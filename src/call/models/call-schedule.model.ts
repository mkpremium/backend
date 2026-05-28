import { TimeWindow } from '../types/call-batch-request-dto'
import t from 'tcomb'

export interface CallScheduleProps {
    city: string;
    limit: number;
    timeWindow: TimeWindow;
    days: string;
    daily_remaining_buildings?:number;
}

export const CallSchedule = t.struct<CallScheduleProps>({
  city: t.String,
  limit: t.Number,
  timeWindow: t.struct({
    startHour: t.String,
    endHour: t.String
  }),
  days: t.String
})
