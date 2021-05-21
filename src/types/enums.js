import t from 'tcomb'

export const OwnerType = {
  NONE: 'NINGUNO',
  PRINCIPAL: 'PRINCIPAL',
  SECONDARY: 'SECUNDARIO',
  NEIGHBOUR: 'VECINO',
  FAMILY: 'FAMILIAR',
  RELATED: 'HERMANOS',
  CHILDREN: 'HIJOS',
  SAME_HOUSE: 'MISMA CASA'
}

export const OwnerStatus = {
  NON_VERIFIED: 'NO_VERIFICADO',
  VERIFIED: 'VERIFICADO',
  ERROR: 'ERRONEO',
  PUBLIC: 'ENTE_PUBLICO',
  WITHOUT_CONTACT: 'WITHOUT_CONTACT'
}

export const OwnerBusinessStatus = {
  PENDING: 'PENDIENTE',
  PROPOSAL_REJECTED: 'PROPUESTA RECHAZADA',
  PROPOSAL_SENT: 'PROPUESTA ENVIADA',
  PROPOSAL_ACCEPTED: 'PRE-CIERRE',
  PURCHASED: 'COMPRADO',

  ALREADY_SOLD: 'VENDIDO',
  NO_SALE: 'NO VENDE',
  DISCARDED: 'DESCARTADO'
}

export const OwnerTypeEnum = t.enums.of(Object.values(OwnerType), 'OwnerType')
export const OwnerStatusEnum = t.enums.of(Object.values(OwnerStatus), 'OwnerStatus')
