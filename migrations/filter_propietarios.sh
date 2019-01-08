#!/usr/bin/env bash

BASE_CSV=${1}
llamadas="${BASE_CSV}/LLAMADAS.csv"
propietarios="${BASE_CSV}/PROPIETARIOS.csv"
edificios="${BASE_CSV}/EDIFICIOS.csv"

step_2_file=${BASE_CSV}/CROSS_TABLE.csv
output_file=${BASE_CSV}/FILTERED_PROPIETARIOS.csv

filter_propietarios() {
  local propietarios=${1}
  local edificios=${2}
  q -O -H -d ";" "$(cat <<SQL
  SELECT
    propietarios.*
    FROM ${propietarios} propietarios
    WHERE propietarios.Id_Fornitore IN (
      SELECT Id_Fornitore FROM ${step_2_file}
    )
SQL
)"
}
head -n1 ${propietarios} > ${output_file}
filter_propietarios ${propietarios} ${edificios} > ${output_file}

