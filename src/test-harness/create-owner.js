import t from 'tcomb'
import uuid from 'uuid/v4'
import { TypedContactInfo } from '../owner/contact'
import { Owner } from '../owner/owner'
import { OwnerStatusEnum, OwnerTypeEnum } from '../types/enums'

export const CreateOwnerCmd = t.struct({
  name: t.maybe(t.String),
  firstName: t.maybe(t.String),
  contacts: t.maybe(t.list(TypedContactInfo)),
  status: t.maybe(OwnerStatusEnum),
  buildingId: t.maybe(t.String),
  type: t.maybe(OwnerTypeEnum)
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

  return ownerRepository.save(owner)
}
