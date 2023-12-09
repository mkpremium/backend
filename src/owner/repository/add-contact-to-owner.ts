import { TypedContactInfo } from '../contact'
import { FeaturedContact, Owner, OwnerProps, Person } from '../owner'
import t from 'tcomb'
import { AddContactCommand } from '../service/add-contact.service'

export function addContactToOwner (owner: OwnerProps, cmd: AddContactCommand): OwnerProps {
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
