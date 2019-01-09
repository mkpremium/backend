#!/usr/bin/env bash

BASE_CSV=${1}
INPUT_CSV=${2}
llamadas="${BASE_CSV}/LLAMADAS.csv"
propietarios="${BASE_CSV}/PROPIETARIOS.csv"
edificios="${BASE_CSV}/EDIFICIOS.csv"

output_file=${BASE_CSV}//BUILDING_NOTES.csv

filter_notes() {
  local edificios=${1}
  local all_notes=${2}

  q -O -H -d ";" "$(cat <<SQL
  SELECT
    notas.*
    FROM ${all_notes} notas
    WHERE notas.ID_CATASTRO IN (
      SELECT ID FROM ${edificios}
    )
    ORDER BY notas.ID_CATASTRO
SQL
)"
}

head -n1 ${INPUT_CSV} > ${output_file}
filter_notes ${edificios} ${INPUT_CSV} > ${output_file}
