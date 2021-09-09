import { InputGathered, OwnerResponse } from '../service/owner-response-processor.service'
import { ScheduleCallService } from '../../scheduled-events/service/schedule-call.service'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { ChangeContactStatusService } from '../../owner/service/change-contact-status.service'
import { Logger } from 'winston'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'
import { ScheduledCallsRepository } from '../../scheduled-events/repository/scheduled-calls.repository'
import { constVoid, pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { fromPromise } from '../../infrastructure/fp-utils'
import { isRight } from 'fp-ts/Either'

interface Deps {
  scheduleCall: ScheduleCallService
  scheduledCallsRepository: ScheduledCallsRepository
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService
  changeContactStatusService: ChangeContactStatusService
  logger: Pick<Logger, 'info'>
  virtualCallersRepository: VirtualCallersRepository
}

export const createInputGatheredListener = ({
                                              scheduleCall,
                                              scheduledCallsRepository,
                                              updateBuildingNegotiationStatusService,
                                              changeContactStatusService,
                                              logger,
                                              virtualCallersRepository,
                                            }: Deps) => async (evt: InputGathered) => {
  switch (evt.ownerResponse) {
    case OwnerResponse.SALE:
      const virtualCaller = await virtualCallersRepository.get(evt.callerId)
      const result = await pipe(
        scheduledCallsRepository.forBuilding(evt.buildingId),
        TE.chain(scheduledCall => {
          if (scheduledCall) {
            return TE.of(constVoid())
          }
          return fromPromise(scheduleCall.scheduleCall({
            userId: evt.callerId,
            queueId: virtualCaller.queueId,
            event: {
              createdBy: evt.callerId,
              eventDate: new Date(),
              notifyTo: virtualCaller.assignCallsTo,
              type: 'CALLS',
              note: 'Creada por caller virtual',
              event: {
                buildingId: evt.buildingId,
                contactId: evt.contactId,
                worksheetId: evt.worksheetId,
                ownerId: evt.ownerId,
              }
            } as ScheduledEventProps & { note: string }
          }))
        })
      )()
      if (!isRight(result)) {
        throw result.left
      }
      break
    case OwnerResponse.NO_SALE:
      await updateBuildingNegotiationStatusService.updateBuildingStatus(evt.buildingId, {
        status: 'NO VENDE',
        userId: evt.callerId,
        sourceOwnerId: evt.ownerId,
      })
      break
    case OwnerResponse.NOT_OWNER:
      await changeContactStatusService.change(
        { ownerId: evt.ownerId, contactId: evt.contactId, status: 'BAD' },
        { id: evt.callerId }
      )
      break
    default:
      logger.info('Unknown owner input gathered', {
        ownerId: evt.ownerId,
        contactId: evt.contactId,
        input: evt.ownerResponse
      })
  }
}
