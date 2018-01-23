import t from 'tcomb';
import {removeNullValues, cleanObjectKeys} from './models-helper';

export const HistoryDTO = t.struct({
  _documentType: t.Str,
  id: t.Str,

  worksheetId: t.maybe(t.Str),
  notes: t.maybe(t.Str),
  notesDate: t.maybe(t.Str),
  operatorId: t.maybe(t.Str),
  departmentId: t.maybe(t.Str),
  tmStmp: t.maybe(t.Str),
  owner: t.maybe(t.Str),
  street: t.maybe(t.Str),
  number: t.maybe(t.Str),
  action: t.maybe(t.Str)

}, {defaultProps: {_documentType: 'history'}});

export const HistoryInputDTO = t.struct({
  id_notachiamatafornitore: t.Str,
  id_chiamatafornitore: t.maybe(t.Str),
  data_nota: t.maybe(t.Str),
  note: t.maybe(t.Str),
  id_operatore: t.maybe(t.Str),
  id_dipartimento: t.maybe(t.Str),
  tmstmp: t.maybe(t.Str),
  proprietari: t.maybe(t.Str),
  street: t.maybe(t.Str),
  number: t.maybe(t.Str),
});

export default function toDatabase(data) {
  const input = HistoryInputDTO(removeNullValues(cleanObjectKeys(data)));
  return HistoryDTO({
    id: `history:${input.id_chiamatafornitore}`,
    worksheetId: input.id_chiamatafornitore,
    notes: input.note,
    notesDate: input.input_nota,
    operatorId: input.id_operatore,
    departmentId: input.id_dipartimento,
    tmStmp: input.tmStmp,
    owner: input.proprietari,
    street: input.street,
    number: input.number
  });
}

module.exports.HistoryInputDTO = HistoryInputDTO;
module.exports.HistoryDTO = HistoryDTO;
