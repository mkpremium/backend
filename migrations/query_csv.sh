#!/usr/bin/env bash

BASE_CSV=${1}
llamadas="${BASE_CSV}/LLAMADAS.csv"
propietarios="${BASE_CSV}/PROPIETARIOS.csv"
edificios="${BASE_CSV}/EDIFICIOS.csv"

step_1_file=${BASE_CSV}/STEP_1.csv
outfile=${BASE_CSV}/CROSS_TABLE.csv

step_1_add_address() {
  q -O -H -d ";" "$(cat <<SQL
  SELECT llamadas.*, edificios.CARRER
  FROM ${llamadas} llamadas
    JOIN ${edificios} edificios
      ON (llamadas.id_catastro = edificios.ID)
SQL
)"
}

step_2_cross_owner() {
  q -O -H -d ";" "$(cat <<SQL
  SELECT
    llamadas.id_chiamatafornitore as id_chiamatafornitore,
    llamadas.Id_Catastro,
    propietarios.Id_Fornitore,
    propietarios.Verificato,
    llamadas.proprietari as proprietari,
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
  FROM ${step_1_file} llamadas
    LEFT JOIN ${propietarios} propietarios
      ON (
        llamadas.proprietari = propietarios.PROPRIETARI
        AND (
          llamadas.Id_Catastro = propietarios.Id_Catastro
          OR propietarios.Indirizzo = llamadas.CARRER
        )
      )
  ORDER BY llamadas.Id_Catastro, llamadas.proprietari
SQL
)"
}


step_1_add_address > ${step_1_file}
step_2_cross_owner > ${outfile}
