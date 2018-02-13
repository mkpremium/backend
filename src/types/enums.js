import t from 'tcomb';

t.BuildingType = t.enums({
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal'
}, 'BuildingType');

t.BuildingState = t.enums({
  BUENO: 'BUENO',
  MALO: 'MALO'
}, 'BuildingState');

t.TypeContact = t.enums({
  TELEFONO: 'TELEFONO',
  FAX: 'FAX',
  CELULAR: 'CELULAR',
  EMAIL: 'EMAIL',
  SITIO_WEB: 'SITIO WEB'
}, 'TypeContact');

t.OwnerType = t.enums({
  NINGUNO: 'NINGUNO',
  PRINCIPAL: 'PRINCIPAL',
  SECUNDARIO: 'SECUNDARIO',
  VECINO: 'VECINO'
}, 'OwnerType');

t.OwnerStatus = t.enums.of(['BUENO', 'MALO'], 'OwnerStatus');

t.Gender = t.enums({
  NINGUNO: 'NINGUNO',
  FEMENINO: 'FEMENINO',
  MASCULINO: 'MASCULINO'
});

t.PersonType = t.enums({
  NATURAL: 'NATURAL',
  JURIDICA: 'JURIDICA'
});
