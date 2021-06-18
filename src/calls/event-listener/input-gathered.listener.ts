import { InputGathered, OwnerResponse } from '../service/owner-response-processor.service'
import { ScheduleCallService } from '../../scheduled-events/service/schedule-call.service'
import { ScheduledEventProps } from '../../scheduled-events/types'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { ChangeContactStatusService } from '../../owner/service/change-contact-status.service'

interface Deps {
  scheduleCall: ScheduleCallService;
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService;
  changeContactStatusService: ChangeContactStatusService,
  assignedCallerIdForVirtualCalls: string;
  virtualCallerQueueId: string;
  virtualCallerId: string;
}

export const createInputGatheredListener = ({
                                              scheduleCall,
                                              updateBuildingNegotiationStatusService,
                                              changeContactStatusService,
                                              virtualCallerId,
                                              virtualCallerQueueId,
                                              assignedCallerIdForVirtualCalls,
                                            }: Deps) => async (evt: InputGathered) => {
  switch (evt.ownerResponse) {
    case OwnerResponse.SALE:
      await scheduleCall.scheduleCall({
        userId: virtualCallerId,
        queueId: virtualCallerQueueId,
        event: {
          createdBy: virtualCallerId,
          eventDate: new Date(),
          notifyTo: assignedCallerIdForVirtualCalls,
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
        userId: virtualCallerId,
        sourceOwnerId: evt.ownerId,
      })
      break
    case OwnerResponse.NOT_OWNER:
      await changeContactStatusService.change(
        { ownerId: evt.ownerId, contactId: evt.contactId, status: 'BAD' },
        { id: virtualCallerId }
      )
      break
    default:
    // TODO log warning message?
  }
}
