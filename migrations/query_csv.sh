#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

llamadas_propietarios() {
  local llamadas="/home/rkmax/Development/BIX/bitdistrict_backend_A0/csv/LLAMADAS.csv"
  local propietarios="/home/rkmax/Development/BIX/bitdistrict_backend_A0/csv/PROPIETARIOS.csv"
  local edificios="/home/rkmax/Development/BIX/bitdistrict_backend_A0/csv/EDIFICIOS.csv"
  q -H -d ";" "$(cat <<SQL
  SELECT
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
  FROM ${llamadas} llamadas
    JOIN ${propietarios} propietarios
      ON (propietarios.Id_Catastro = llamadas.Id_Catastro)
    JOIN ${edificios} edificios
      ON (llamadas.proprietari = edificios.PROPRIETARI)
  WHERE llamadas.visitare = 1
  COLLATE NOCASE
SQL
)"
}

#file=${DIR}/../csv/cross_table.csv
#echo 'id_chiamatafornitore;Id_Catastro;Id_Fornitore;ID;Verificato;proprietari;RagioneSociale;CodFis;ParIva' > ${file}
#llamadas_propietarios | tee -a ${file}
llamadas_propietarios

