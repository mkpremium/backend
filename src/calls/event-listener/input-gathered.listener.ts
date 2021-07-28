import { InputGathered, OwnerResponse } from '../service/owner-response-processor.service'
import { ScheduleCallService } from '../../scheduled-events/service/schedule-call.service'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { ChangeContactStatusService } from '../../owner/service/change-contact-status.service'
import { Logger } from 'winston'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

interface Deps {
  scheduleCall: ScheduleCallService
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService
  changeContactStatusService: ChangeContactStatusService
  logger: Pick<Logger, 'info'>
  virtualCallersRepository: VirtualCallersRepository
}

export const createInputGatheredListener = ({
                                              scheduleCall,
                                              updateBuildingNegotiationStatusService,
                                              changeContactStatusService,
                                              logger,
                                              virtualCallersRepository,
                                            }: Deps) => async (evt: InputGathered) => {
  switch (evt.ownerResponse) {
    case OwnerResponse.SALE:
      const virtualCaller = await virtualCallersRepository.get(evt.callerId)
      await scheduleCall.scheduleCall({
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
      })
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
