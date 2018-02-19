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

// TODO: Use real status from Numintec API
t.CallStatus = t.enums({
  INICIADA: 'INICIADA',
  EN_PROGRESO: 'EN_PROGRESO',
  FINALIZADA: 'FINALIZADA'
}, 'CallStatus');

t.EventType = t.enums({
  add: 'add',
  update: 'update',
  remove: 'revome',
  read: 'read',
  custom: 'custom'
});

t.RecordAction = t.enums.of([
  'Actualiza',
  'Crea',
  'Obtiene',
  'Abre',
  'Lista'
]);

t.RecordContext = t.enums({
  OWNER: 'Propietario',
  OWNERS: 'Propietarios',
  OWNER_CONTACT: 'Contacto de propietario',
  WORKSHEET: 'Ficha de trabajo',
  WORKSHEETS: 'Fichas de trabajo',
  OPERATOR: 'Operador',
  OPERATORS: 'Operadores',
  WORKSHEET_QUEUE: 'Cola de fichas de trabajo',
  SYSTEM_QUEUE: 'Colas del sistema'
});

t.getEnumMap = function(enumStruct) {
  return enumStruct.meta.map;
};
