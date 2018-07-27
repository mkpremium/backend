import t from 'tcomb';
import {cleanDataAndRemoveNullValues} from './models-helper';

const BuildingEntityDTO = t.struct({
  id_statoedificioentita: t.maybe(t.String),
  id_statoedificio: t.maybe(t.String),
  id_catastro: t.maybe(t.String),
  id_situazione: t.maybe(t.String),
  entita: t.maybe(t.String),
  data_limite: t.maybe(t.String),
  mensile: t.maybe(t.String),
  m2: t.maybe(t.String),
  prezzo_vendita: t.maybe(t.String),
  tmstmp: t.maybe(t.String),
  ordine: t.maybe(t.String),
  sigillato: t.maybe(t.String),
  note: t.maybe(t.String),
  chiave: t.maybe(t.String),
  chiaveoccupante: t.maybe(t.String),
  tipoentita: t.maybe(t.String),
  codiceallarme: t.maybe(t.String),
  inquilino: t.maybe(t.String),
  richiestauscita: t.maybe(t.String),
  m2t: t.maybe(t.String)
});

export default function migrateFromCsv(data) {
  const input = BuildingEntityDTO(cleanDataAndRemoveNullValues(data));

  const number = value => {
    if (value) {
      return Number(value.replace(',', '.'));
    }

    return 0;
  };

  return t.BuildingEntity({
    name: input.entita,
    type: input.tipoentita,
    surface: number(input.m2),
    rent: number(input.mensile),
    expiration: input.data_limite ? new Date(input.data_limite) : void 0,

    _migrateBuildingId: input.id_catastro,
    _migrateIdStatus: input.id_situazione
  });
}
