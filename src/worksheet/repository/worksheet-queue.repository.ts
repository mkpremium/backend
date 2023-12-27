import { WorksheetQueueProps } from '../domain/queue'
import { Repository } from '../../db/repository'

export interface WorksheetQueueRepository extends Repository<WorksheetQueueProps> {
  findQueueWithScheduledCallOfId (scheduledCallId: string): Promise<WorksheetQueueProps>

  list(): Promise<WorksheetQueueProps[]>
}

export class ScheduledCallInMultipleQueues extends Error {
  constructor (readonly scheduledCallId: string) {
    super('Scheduled called added to more than one queue')
  }
}
