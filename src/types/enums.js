import t from 'tcomb';

t.BuildingType = t.enums({
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal'
}, 'BuildingType');

export const BuildingState = {
  BUENO: 'BUENO',
  MALO: 'MALO'
};

t.BuildingState = t.enums(BuildingState, 'BuildingState');

t.TypeContact = t.enums({
  TELEFONO: 'TELEFONO',
  FAX: 'FAX',
  MOVIL: 'MOVIL',
  EMAIL: 'EMAIL',
  SITIO_WEB: 'SITIO_WEB'
}, 'TypeContact');

export const OwnerType = {
  NINGUNO: 'NINGUNO',
  PRINCIPAL: 'PRINCIPAL',
  SECUNDARIO: 'SECUNDARIO',
  VECINO: 'VECINO',
  FAMILIAR: 'FAMILIAR'
};

export const OwnerStatus = {
  NO_VERIFICADO: 'NO_VERIFICADO',
  VERIFICADO: 'VERIFICADO',
  NO_VENDE: 'NO_VENDE',
  ERRONEO: 'ERRONEO'
};

t.OwnerType = t.enums.of(Object.values(OwnerType), 'OwnerType');
t.OwnerStatus = t.enums.of(Object.values(OwnerStatus), 'OwnerStatus');

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
