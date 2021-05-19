import { OwnerStatusChangedEvent } from '../../owner/service/change-contact-status.service'

export class UpdateWorksheetStatusOnOwnerChangeService {
  updateWorksheet (evt: OwnerStatusChangedEvent) {
    return Promise.reject(new Error('Not implemented'))
  }
}
