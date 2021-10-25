import * as TE from 'fp-ts/TaskEither'
import { ScheduledCallsService } from '../../scheduled-events/service/scheduled-calls.service'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import { map } from 'fp-ts/TaskEither'
import { BuildingProps } from '../../building/building'
import { OwnerProps } from '../../owner/owner'

export interface LeadsForCommand {
  flipperId: string,
}

interface Lead {
  createdAt: Date
  worksheetId: string
  building: BuildingProps
  owner: Omit<OwnerProps, 'type' | 'status' | 'buildingId'>
  contactId: string
}

export class FlipperLeadsService {
  constructor (private scheduledCallsService: ScheduledCallsService) {
  }

  leadsFor (cmd: LeadsForCommand): TE.TaskEither<Error, Lead[]> {
    return pipe(
      fromPromise(this.scheduledCallsService.scheduledCallsFor(cmd.flipperId)),
      map(scheduledCalls => {
        if (!scheduledCalls) {
          return []
        }

        return scheduledCalls
          .filter(({ createdBy }) => createdBy !== cmd.flipperId)
          .map(sc => {
            return {
              createdAt: sc.eventDate,
              worksheetId: sc.event.worksheetId,
              contactId: sc.event.contactId,
              building: sc.event.owner.building as BuildingProps,
              owner: {
                ...sc.event.owner,
                name: sc.event.owner.person.name,
              } as Omit<OwnerProps, 'type' | 'status' | 'buildingId'>,
            }
          })
      })
    )
  }
}
