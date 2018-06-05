import {dirname, resolve} from 'path';
import {exec} from 'child_process';
import {wrap} from '../../lib/workers';
import gearman from 'gearmanode';

import {gearmanConfig} from '../../../config';

const worker = gearman.worker(gearmanConfig);

function buildQuery({calls, owners, buildings}) {
  return `SELECT
    llamadas.id_chiamatafornitore,
    llamadas.Id_Catastro,
    propietarios.Id_Fornitore,
    edificios.ID,
    propietarios.Verificato,
    llamadas.proprietari,
    propietarios.RagioneSociale,
    propietarios.CodFis,
    propietarios.ParIva,

    llamadas.errore,
    llamadas.id_errore,

    llamadas.richiamare,
    llamadas.data_richiamo,

    llamadas.visitare,
    llamadas.data_visita,

    llamadas.novende,
    llamadas.venduto,
    llamadas.entepubblico,

    llamadas.cognome,
    llamadas.id_operatorelivello1,
    llamadas.data_livello1,
    llamadas.id_operatorelivello2,
    llamadas.data_livello2,
    llamadas.datacontatto
  FROM ${calls} llamadas
    JOIN ${owners} propietarios
      ON (propietarios.Id_Catastro = llamadas.Id_Catastro)
    JOIN ${buildings} edificios
      ON (llamadas.proprietari = edificios.PROPRIETARI)
  WHERE llamadas.visitare = 1
  COLLATE NOCASE`;
}

function buildHeaders() {
  return '"id_chiamatafornitore;Id_Catastro;Id_Fornitore;ID;Verificato;proprietari;RagioneSociale;CodFis;ParIva"';
}

async function cross(input) {
  const base = dirname(input.calls);
  const output = resolve(base, 'cross_table.csv');
  const query = buildQuery(input);

  const files = Object.assign({}, input, {cross: output});
  const writeHeaders = `echo ${buildHeaders()} > ${output}`;
  const writeFile = `q -H -d ";" "${query}" >> ${output}`;

  return new Promise((resolve, reject) => {
    exec(`${writeHeaders} && ${writeFile}`, err => {
      if (err && err.code) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

worker.addFunction('cross', wrap(cross));
