import {OwnerBusinessStatus} from '../src/types/enums';
import {WorkSheetStatus} from "../src/types/worksheet";

export const Files = {
  BUILDINGS: 'EDIFICIOS.csv',
  OWNERS: 'PROPIETARIOS.csv',
  WORKSHEET_RELATIONS: 'CROSS_TABLE.csv'
};

export const DbIndexes = [
  {
    name: 'id',
    query: '(`id`)'
  },
  {
    name: 'building_id',
    query: '(`id`,`_documentType`)'
  },
  {
    name: 'worksheetIndex',
    query: '(`worksheetIndex`,`_documentType`) WHERE `_documentType` = "worksheet"'
  },
  {
    name: '_migratedId',
    query: '(`_migratedId`) '
  },
  {
    name: 'building_cadastre_migrate_id',
    query: '(_migrateId, _documentType, cadastre.reference) WHERE _documentType = \'building\''
  },
  {
    name: '_documentType_migratedId',
    query: '(`_documentType`,`_migratedId`)'
  },
  {
    name: '_documentType_id',
    query: '(`_documentType`,`id`)'
  },
  {
    name: '_documentType',
    query: '(`_documentType`)'
  },
  {
    name: 'operator_roles',
    query: '(ALL TOKENS(`roles`)) WHERE `_documentType` = "operator"'
  },
  {
    name: 'worksheet_status',
    query: '(`status`,`_documentType`) WHERE `_documentType` = "worksheet"'
  },
  {
    name: 'owner_business_status',
    query: '(`business`.`status`) WHERE `_documentType` = "owner" and `business`.`status` IS NOT MISSING'
  },
  {
    name: 'operator_stats_count',
    query: '(city, action, createdAt) WHERE _documentType = \'operator-stats\' AND city IS NOT MISSING'
  },
  {
    name: 'operator_stats_operator_count',
    query: '(operatorId ASC, action, createdAt ASC) WHERE _documentType = \'operator-stats\''
  },
  {
    name: 'owner_migrate_id',
    query: '(`_migrateId`, `_documentType`)'
  },
  {
    name: 'owner_relationships',
    query: '(_documentType, buildingId, personId) WHERE _documentType = \'owner\''
  },
  {
    name: 'person_name',
    query: '(_documentType, id, LOWER(firstSurname), LOWER(secondSurname)) WHERE _documentType = \'person\''
  },
  {
    name: 'person_address',
    query: '(DISTINCT ARRAY v.fullAddress FOR v in addresses END) WHERE (_documentType = \'person\')'
  },
  {
    name: 'owner_migration',
    query: '(_documentType, name, _relatedTo) WHERE _documentType = "owner"'
  },
  {
    name: 'owner_migration_related',
    query: '(_documentType, _relatedTo) WHERE _documentType = "owner"'
  },
  {
    name: 'person_migration',
    query: '(_documentType, name, _relatedTo) WHERE _documentType = "person"'
  },
  {
    name: 'person_migration_related',
    query: '(_documentType, _relatedTo) WHERE _documentType = "person"'
  },
  {
    name: 'note_migration',
    query: '(_documentType, context._migrateId) WHERE _documentType = "note"'
  },
  {
    name: 'note_migration_building',
    query: '(_documentType, context.buildingId, context._migrateId) WHERE _documentType = "note"'
  }
];

// Id;Estado
// 10;INICIO
// 15;
// 16;"PROP. ENVIADA"
// 17;"PROP. RECHAZADA"
// 18;"YA VENDIDO"
// 19;DESCARTADO
// 21;"NO VENDE"
// 28;"PRE CIERRE"
// 29;COMPRADO
const _MapBusinessStates = {
  10: OwnerBusinessStatus.PENDING,
  16: OwnerBusinessStatus.PROPOSAL_SENT,
  17: OwnerBusinessStatus.PROPOSAL_REJECTED,
  18: OwnerBusinessStatus.ALREADY_SOLD,
  19: OwnerBusinessStatus.DISCARDED,
  21: OwnerBusinessStatus.NO_SALE,
  28: OwnerBusinessStatus.PROPOSAL_ACCEPTED,
  29: OwnerBusinessStatus.PURCHASED
};

const worksheetToFirebaseBusiness = {
  [WorkSheetStatus.MEETING]: OwnerBusinessStatus.PENDING,
  [WorkSheetStatus.INVALID]: OwnerBusinessStatus.DISCARDED,
  [WorkSheetStatus.PUBLIC]: OwnerBusinessStatus.DISCARDED,
  [WorkSheetStatus.NO_SALE]: OwnerBusinessStatus.NO_SALE,
  [WorkSheetStatus.ALREADY_SOLD]: OwnerBusinessStatus.ALREADY_SOLD
};

export function mapBusinessStates(value) {
  return _MapBusinessStates[value] || OwnerBusinessStatus.PENDING;
}

export function onlyForBusiness(value) {
  return worksheetToFirebaseBusiness[value];
}
