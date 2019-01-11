#!/usr/bin/env bash

DOCKER_CMD='sudo docker'

_1_do_backup() {
  local container=${1}
  local uri=${2}
  local user=${3}
  local pass=${4}
  local backup_path=${5}

  ${DOCKER_CMD} exec -it ${container} \
    /opt/couchbase/bin/cbbackup ${uri} -m full ${backup_path} \
    -u ${user} -p ${pass}
}

_2_copy_backup() {
  local container=${1}
  local backup_path=${2}
  local dest_path=${3}

  ${DOCKER_CMD} cp ${container}:${backup_path} ${dest_path}
}

_3_remove_tmp_backup() {
  local container=${1}
  local backup_path=${2}

  ${DOCKER_CMD} exec -it ${container} rm -rf ${backup_path}
}

_4_compress_backup() {
  local dest_path=${1}
  tar cf - ${dest_path} | gzip -9c > ${dest_path}.tar.gz
}

backup() {
  local container=${1}
  local uri=${2}
  local user=${3}
  local pass=${4}
  local backup_path=${5}
  local dest_path=${6}

  _1_do_backup ${container} ${uri} ${user} ${pass} ${backup_path}
  _2_copy_backup ${container} ${backup_path} ${dest_path}
  _3_remove_tmp_backup ${container} ${backup_path}
  _4_compress_backup ${dest_path}
}

backup "$@"
