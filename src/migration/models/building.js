import t from 'tcomb';

const Address = t.struct({
  type: t.Str,
  street: t.Str,
  number: t.Str,
  fullName: t.maybe(t.Str),
  postalCode: t.maybe(t.Str)
});

export const BuildingDTO = t.struct(
  {
    _documentType: t.Str,
    id: t.Str,
    address: Address
  },
  {
    defaultProps: {_documentType: 'building'}
  }
);

export const BuildingInputDTO = t.struct({
  id: t.Str,
  type: t.maybe(t.Str),
  street: t.maybe(t.Str),
  number: t.maybe(t.Str),
  carrer: t.maybe(t.Str),
  numbero: t.maybe(t.Str),
  postcode: t.maybe(t.Str),
  build: t.maybe(t.Str),
  reference: t.maybe(t.Str),
  location: t.maybe(t.Str),
  postcode2: t.maybe(t.Str),
  classe: t.maybe(t.Str),
  surfacebuilded: t.maybe(t.Str),
  surfaceterrain: t.maybe(t.Str),
  coefficent: t.maybe(t.Str),
  use: t.maybe(t.Str),
  propertytype: t.maybe(t.Str),
  yearconstruction: t.maybe(t.Str),
  owner: t.maybe(t.Str),
  phone: t.maybe(t.Str),
  elementsnumber: t.maybe(t.Str),
  elementsaverage: t.maybe(t.Str),
  commonselements: t.maybe(t.Str),
  municipality: t.maybe(t.Str),
  province: t.maybe(t.Str),
  proprietari: t.maybe(t.Str),
  domicili: t.maybe(t.Str),
  poblacio: t.maybe(t.Str),
  numero_pb: t.maybe(t.Str),
  numero_ib: t.maybe(t.Str),
  numero_bd: t.maybe(t.Str),
  numero_abc: t.maybe(t.Str),
  numero_1: t.maybe(t.Str),
  numero_2: t.maybe(t.Str),
  numero_3: t.maybe(t.Str),
  surfaceroof: t.maybe(t.Str),
  filter: t.maybe(t.Str)
});

function map() {

}

BuildingDTO.prototype.map = map;
