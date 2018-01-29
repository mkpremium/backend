import t from 'tcomb';

t.Cadastre = t.struct({
  reference: t.String,
  address: t.String
}, 'Cadastre');

t.Location = t.struct({
  lat: t.Number,
  lng: t.Number
}, 'Location');

t.Elements = t.struct({
  number: t.Number,
  average: t.Number,
  commons: t.Number
}, 'Elements');

t.Owner = t.struct(
  {
    name: t.String,
    address: t.SimpleAddress,
    phones: t.list(t.SimplePhoneNumber)
  },
  {
    defaultProps: {
      phones: []
    }
  }
);

t.Building = t.struct(
  {
    id: t.String,
    address: t.Address,
    buildingType: t.BuildingType,
    cadastre: t.maybe(t.Cadastre),
    floorArea: t.Number,
    landArea: t.Number,
    roofArea: t.Number,
    coefficient: t.Number,
    use: t.maybe(t.String), // FIXME: define this as a t.enums
    propertyType: t.maybe(t.String), // FIXME: define this as a t.enums
    buildingDate: t.Number,
    location: t.Location,
    elements: t.Elements,
    owner: t.Owner, // TODO: move to owners collection
    state: t.BuildingState,

    _migrateId: t.String,

    _documentType: t.String
  },
  {
    name: 'Building',
    defaultProps: {
      floorArea: 0,
      landArea: 0,
      roofArea: 0,
      coefficient: 0,
      buildingDate: 0,

      _documentType: 'building'
    }
  }
);
