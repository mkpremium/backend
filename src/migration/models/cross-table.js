import t from 'tcomb'
import { cleanObjectKeys, removeNullValues } from './models-helper'

const CrossInputDTO = t.struct({
  id_chiamatafornitore: t.maybe(t.String),
  id_catastro: t.maybe(t.String),
  id_fornitore: t.maybe(t.String),
  id: t.maybe(t.String),
  verificato: t.maybe(t.String),
  proprietari: t.maybe(t.String),
  ragionesociale: t.maybe(t.String),
  codfis: t.maybe(t.String),
  pariva: t.maybe(t.String)
}, 'CrossInputDTO')

const CrossDTO = t.struct({
  ownerId: t.maybe(t.String),
  ownerType: t.maybe(t.String),
  ownerName: t.maybe(t.String),
  worksheetId: t.String,
  buildingId: t.String,
  verified: t.Boolean,
  contactName: t.maybe(t.String),
  contactDocument: t.maybe(t.String)
}, 'CrossDTO')

export default function migrateFromCsv (data) {
  const input = CrossInputDTO(removeNullValues(cleanObjectKeys(data)))

  const verified = () => {
    switch (input.verificato) {
      case '1':
        return true
      case '0':
        return false
      default:
        return Boolean(input.verificato)
    }
  }

  return CrossDTO({
    worksheetId: input.id_chiamatafornitore,
    buildingId: input.id_catastro,
    ownerId: input.id_fornitore,
    verified: verified(),
    ownerType: input.codfis,
    ownerName: input.proprietari,
    contactName: input.ragionesociale,
    contactDocument: input.pariva
  })
}
