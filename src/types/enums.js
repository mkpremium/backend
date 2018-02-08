import t from 'tcomb';

t.BuildingType = t.enums({
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal'
}, 'BuildingType');

t.BuildingState = t.enums({
  BUENO: 'bueno',
  MALO: 'malo'
}, 'BuildingState');

t.TypeContact = t.enums({
  TELEFONO: 'telefono',
  FAX: 'fax',
  CELULAR: 'celular',
  EMAIL: 'email',
  SITIO_WEB: 'sitio web'
}, 'TypeContact');

t.OwnerType = t.enums({
  NINGUNO: 'NINGUNO',
  PRINCIPAL: 'PRINCIPAL',
  SECUNDARIO: 'SECUNDARIO',
  VECINO: 'VECINO'
}, 'OwnerType');

t.Gender = t.enums({
  NINGUNO: 'NINGUNO',
  FEMENINO: 'FEMENINO',
  MASCULINO: 'MASCULINO'
});

t.PersonType = t.enums({
  NATURAL: 'NATURAL',
  JURIDICA: 'JURIDICA'
});
