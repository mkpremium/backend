import { TypedContactInfo } from '../contact'
import { FeaturedContact, Owner, OwnerProps, Person } from '../owner'
import { AddContactCmd } from './owner.repository'
import t from 'tcomb'

export function addContactToOwner (owner: OwnerProps, cmd: AddContactCmd): OwnerProps {
  let featuredContact = owner.featuredContact
  const newContact = TypedContactInfo(cmd as any)

  const { isFeatured } = cmd
  if (isFeatured) {
    featuredContact = FeaturedContact.update(featuredContact || FeaturedContact({}), {
      [ cmd.type === 'EMAIL' ? 'emailId' : 'phoneId' ]: {
        $set: newContact.id
      }
    })
  }

  return Owner.update(owner, {
    featuredContact: { $set: featuredContact },
    $merge: {
      person: Person.update(owner.person, {
        $merge: {
          contacts: t.update(owner.person.contacts, {
            $push: [ newContact ]
          })
        }
      })
    }
  })
}
