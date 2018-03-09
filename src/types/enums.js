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
  MOVIL: 'MOVIL',
  EMAIL: 'EMAIL',
  SITIO_WEB: 'SITIO_WEB'
}, 'TypeContact');

t.OwnerType = t.enums({
  NINGUNO: 'NINGUNO',
  PRINCIPAL: 'PRINCIPAL',
  SECUNDARIO: 'SECUNDARIO',
  VECINO: 'VECINO'
}, 'OwnerType');

t.OwnerStatus = t.enums.of(['NO_VERIFICADO', 'VERIFICADO', 'ERRONEO'], 'OwnerStatus');

t.Gender = t.enums({
  NINGUNO: 'NINGUNO',
  FEMENINO: 'FEMENINO',
  MASCULINO: 'MASCULINO'
});

t.PersonType = t.enums({
  NATURAL: 'NATURAL',
  JURIDICA: 'JURIDICA'
});

t.EventType = t.enums({
  add: 'add',
  update: 'update',
  remove: 'revome',
  read: 'read',
  custom: 'custom'
});

t.RecordAction = t.enums.of([
  'UPDATE',
  'CREATE',
  'GET',
  'OPEN',
  'LIST',
  'RELEASE',
  'TAKE',
  'ERROR'
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

export const CallStatus = {
  early: 'INICIADA',
  confirmed: 'EN_PROGRESO',
  terminated: 'FINALIZADA',
  unknown: 'DESCONOCIDO'
};

t.CallStatus = t.enums.of(Object.values(CallStatus), 'CallStatus');
