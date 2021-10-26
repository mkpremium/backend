import { InputGathered, OwnerResponse } from '../service/owner-response-processor.service'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { ChangeContactStatusService } from '../../owner/service/change-contact-status.service'
import { Logger } from 'winston'
import { pipe } from 'fp-ts/function'
import { isRight } from 'fp-ts/Either'
import { LeadRecorderService } from '../../building/service/lead-recorder.service'

interface Deps {
  leadRecorder: LeadRecorderService
  updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService
  changeContactStatusService: ChangeContactStatusService
  logger: Pick<Logger, 'info'>
}

export const createInputGatheredListener = ({
                                              leadRecorder,
                                              updateBuildingNegotiationStatusService,
                                              changeContactStatusService,
                                              logger,
                                            }: Deps) => async (evt: InputGathered) => {
  switch (evt.ownerResponse) {
    case OwnerResponse.SALE:
      const result = await pipe(
        leadRecorder.recordLead({
          buildingId: evt.buildingId,
          worksheetId: evt.worksheetId,
          ownerId: evt.ownerId,
          contactId: evt.contactId,
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
