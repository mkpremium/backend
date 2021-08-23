import { SmsReceived } from '../../calls/service/sms-webhook.processor'
import { BuildingNotesRepository } from '../repository/building-notes.repository'

export function addSmsNoteListener ({ buildingNotesRepository }: { buildingNotesRepository: BuildingNotesRepository }) {
  return async function (evt: SmsReceived): Promise<void> {
    await buildingNotesRepository.save({
      note: `${evt.message}[SMS del propietario]`,
      createdBy: evt.ownerId,
      context: {
        buildingId: evt.buildingId,
      },
    })
  }
}
