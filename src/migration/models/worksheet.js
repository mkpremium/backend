import t from 'tcomb'
import { cleanObjectKeys, removeNullValues } from './models-helper'
import uuid from 'uuid/v4'

const WorksheetInputDTO = t.struct({
  id_chiamatafornitore: t.maybe(t.String),
  id_catastro: t.maybe(t.String),
  id_fornitore: t.maybe(t.String),
  cognome: t.maybe(t.String),
  nome: t.maybe(t.String),
  telefono: t.maybe(t.String),
  cellulare: t.maybe(t.String),
  id_operatorelivello1: t.maybe(t.String),
  data_livello1: t.maybe(t.String),
  id_operatorelivello2: t.maybe(t.String),
  data_livello2: t.maybe(t.String),
  visitare: t.maybe(t.String),
  data_visita: t.maybe(t.String),
  ora_visita: t.maybe(t.String),
  richiamare: t.maybe(t.String),
  data_richiamo: t.maybe(t.String),
  ora_richiamo: t.maybe(t.String),
  verificato: t.maybe(t.String),
  errore: t.maybe(t.String),
  tmstmp: t.maybe(t.String),
  vende: t.maybe(t.String),
  novende: t.maybe(t.String),
  id_errore: t.maybe(t.String),
  prezzo: t.maybe(t.String),
  proposta: t.maybe(t.String),
  proprietari: t.maybe(t.String),
  street: t.maybe(t.String),
  number: t.maybe(t.String),
  filter: t.maybe(t.String),
  venduto: t.maybe(t.String),
  telefonoerrato: t.maybe(t.String),
  nonrisponde: t.maybe(t.String),
  entepubblico: t.maybe(t.String),
  proprietario2: t.maybe(t.String),
  famiglia: t.maybe(t.String),
  fratelli: t.maybe(t.String),
  figli: t.maybe(t.String),
  elemento: t.maybe(t.String),
  situacion: t.maybe(t.String),
  calificacion: t.maybe(t.String),
  precio: t.maybe(t.String),
  codpla: t.maybe(t.String),
  qualificacion: t.maybe(t.String),
  urlimg: t.maybe(t.String),
  urlmap: t.maybe(t.String),
  urlpic: t.maybe(t.String),
  id_negoziazione: t.maybe(t.String),
  id_commerciale: t.maybe(t.String),
  id_contatto: t.maybe(t.String),
  nomecontatto: t.maybe(t.String),
  telefonocontatto: t.maybe(t.String),
  datacontatto: t.maybe(t.String),
  prezzomax: t.maybe(t.String),
  prezzorichiesto: t.maybe(t.String),
  differenzialeprezzi: t.maybe(t.String)
})

export default function migrateFromCsv (data) {
  const input = WorksheetInputDTO(removeNullValues(cleanObjectKeys(data)))

  return t.WorkSheet({
    id: uuid(),
    _migrateId: input.id_chiamatafornitore,
    price: {
      maximumToPay: parseFloat(input.prezzomax || 0),
      askedByOwner: parseFloat(input.prezzorichiesto || 0)
    }
  })
}
