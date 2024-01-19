import { OwnerProps, PersonProps } from '../../owner/owner'
import _ from 'lodash'

export function toOwnerInBuildingRead (owner: Pick<OwnerProps, 'id'> & Pick<PersonProps, 'contacts'>) {
  if (!owner) {
    return undefined
  }

  const contacts = owner ? owner.contacts : []
  return {
    id: owner.id,
    firstName: _.get(owner, 'firstName'),
    name: _.get(owner, 'fullName') || _.get(owner, 'name'),
    contacts: contacts.map(({ id, status, type, value }) => ({
      id,
      status,
      type,
      value
    })),
    featuredContact: _.get(owner, 'featuredContact') ?? undefined
  }
}
