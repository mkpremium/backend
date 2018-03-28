import t from 'tcomb';

t.OwnerCompactView = t.struct(
  {
    id: t.String,
    type: t.OwnerType,
    status: t.OwnerStatus,
    buildingId: t.String,
    verified: t.Boolean,
    person: t.struct({
      id: t.String,
      name: t.String
    }, 'person'),
    contact: t.TypedContactInfo
  },
  {
    name: 'OwnerView'
  }
);

export function ownerContactsView(owner) {
  return owner.person.contacts
    .map((contact) => t.OwnerCompactView(Object.assign({}, owner, {
      person: owner.person,
      contact
    })));
}

export default t;
