import _ from 'lodash'
import { OwnerProps, PersonProps } from '../../owner/owner'

type OwnerRelevantToSelectionProps = Pick<OwnerProps, 'id'> & Pick<PersonProps, 'contacts'>

export function selectBuildingOwner<T extends OwnerRelevantToSelectionProps> (
  owners: OwnerRelevantToSelectionProps[],
  featuredOwnerId?: string,
  lastMeeting?: { ownerId?: string }
): T | undefined {
  if (!owners) {
    return
  }
  if (featuredOwnerId) {
    const featuredOwner = ownerOfId(owners, featuredOwnerId)
    if (featuredOwner) {
      return featuredOwner as T
    }
  }

  const lastMeetingOwner = lastMeeting?.ownerId ?
    ownerOfId(owners, lastMeeting?.ownerId) : undefined
  if (lastMeetingOwner) {
    return lastMeetingOwner as T
  }

  const validatedOwners = getValidatedOwners(owners) as T[]
  const nonDiscardedOwners = getNonDiscardedOwners(owners) as T[]

  return validatedOwners[ 0 ] ?? nonDiscardedOwners[ 0 ] ?? undefined
}

function ownerOfId (owners: OwnerRelevantToSelectionProps[], ownerId: string) {
  return owners.find(o => o.id === ownerId)
}

function getValidatedOwners (owners: OwnerRelevantToSelectionProps[]) {
  return (owners || []).filter(({ contacts }) => (contacts || []).find(({ status }) => status === 'GOOD'))
}

function getNonDiscardedOwners (owners: OwnerRelevantToSelectionProps[]) {
  return owners.filter(o => _.some(o.contacts || [], c => c.status !== 'BAD'))
}
