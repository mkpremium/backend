import t from 'tcomb'
import uuid from 'uuid/v4'
import { logger } from '../infrastructure/logger'
import { Owner } from '../owner/owner'
import { TypedContactInfo } from '../types/common'
import { OwnerStatus, OwnerStatusEnum, OwnerTypeEnum } from '../types/enums'

export const CreateOwnerCmd = t.struct({
  name: t.maybe(t.String),
  firstName: t.maybe(t.String),
  contacts: t.maybe(t.list(TypedContactInfo)),
  status: t.maybe(OwnerStatusEnum),
  buildingId: t.maybe(t.String),
  type: t.maybe(OwnerTypeEnum)
}, {
  defaultProps: {
    name: 'Owner Full Name',
    person: {
      name: 'Owner Full Name',
      firstName: 'Owner First Name',
      contacts: []
    },
    status: OwnerStatus.NON_VERIFIED,
    type: 'PRINCIPAL'
  }
})

CreateOwnerCmd.prototype.toOwner = function (id) {
  return {
    id,
    name: this.name,
    buildingId: this.buildingId,
    status: this.status,
    type: this.type,
    person: {
      name: this.name,
      firstName: this.firstName,
      contacts: this.contacts
    }
  }
}

export const createOwnerFactory = ownerRepository => cmd => {
  t.assert(CreateOwnerCmd.is(cmd))
  const owner = Owner(cmd.toOwner(uuid()))

  logger.error(`saving owner`, { owner })
  return ownerRepository.save(owner)
}
