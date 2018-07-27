#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

llamadas_propietarios() {
  local llamadas="//home/rkmax/Development/BIX/mkpremium-backend/csv/LLAMADAS.csv"
  local propietarios="/home/rkmax/Development/BIX/mkpremium-backend/csv/PROPIETARIOS.csv"
  local edificios="/home/rkmax/Development/BIX/mkpremium-backend/csv/EDIFICIOS.csv"
  q -O -H -d ";" "$(cat <<SQL
  SELECT
    llamadas.id_chiamatafornitore as id_chiamatafornitore,
    llamadas.Id_Catastro,
    propietarios.Id_Fornitore,
    edificios.ID,
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
  FROM ${llamadas} llamadas
    JOIN ${propietarios} propietarios
      ON (propietarios.Id_Catastro = llamadas.Id_Catastro)
    JOIN ${edificios} edificios
      ON (llamadas.proprietari = edificios.PROPRIETARI)
SQL
)"
}

file=${DIR}/../csv/cross_table.csv
llamadas_propietarios > ${file}
