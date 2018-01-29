import t from 'tcomb';

t.Owner = t.struct(
  {
    id: t.String,
    type: t.OwnerType,

    personId: t.String,

    note: t.maybe(t.String),

    _migrateId: t.list(t.String),
    _relatedTo: t.String,
    _documentType: t.String
  },
  {
    name: 'Owner',
    defaultProps: {
      type: t.OwnerType.NINGUNO,

      _documentType: 'owner',
      _migrateId: []
    }
  }
);

t.Person = t.struct(
  {
    id: t.String,
    name: t.String,
    firstName: t.maybe(t.String),
    firstSurname: t.maybe(t.String),
    secondSurname: t.maybe(t.String),
    documentNumber: t.maybe(t.String), // Note: unique

    contacts: t.list(t.TypedContactInfo),
    addresses: t.list(t.SimpleAddress),
    birthDate: t.maybe(t.Date),
    gender: t.Gender,

    personType: t.PersonType,

    _documentType: t.String
  },
  {
    name: 'Person',
    defaultProps: {
      contacts: [],
      addresses: [],
      gender: 'NINGUNO',
      _documentType: 'person'
    }
  }
);
