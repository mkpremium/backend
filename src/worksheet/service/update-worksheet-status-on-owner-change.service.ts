import { OwnerStatusChangedEvent } from '../../owner/service/change-contact-status.service'
import { WorksheetRepository } from '../repository/worksheet.repository'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { some } from 'lodash'
import { setStatus } from '../domain/worksheet'

const discardedOwnerStatus = ['ERRONEO', 'ENTE_PUBLICO', 'WITHOUT_CONTACT']

export class UpdateWorksheetStatusOnOwnerChangeService {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private ownersRepository: OwnerRepository
  ) {
  }

  async updateWorksheet (evt: OwnerStatusChangedEvent) {
    const owners = await this.ownersRepository.buildingOwners(evt.buildingId)
    const otherOwners = owners.filter(({ id }) => id !== evt.ownerId)
    const areOtherNonDiscardedOwners = otherOwners.length > 0 && some(otherOwners, o => !discardedOwnerStatus.includes(o.status))
    const worksheet = await this.worksheetRepository.ofBuildingId(evt.buildingId)

    if (discardedOwnerStatus.includes(evt.newStatus) && !areOtherNonDiscardedOwners) {
      const updatedWorksheet = setStatus(worksheet, 'INVALID')
      return this.worksheetRepository.save(updatedWorksheet)
    }
  }
}
