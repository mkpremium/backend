#!/usr/bin/env bash

DOCKER_CMD='sudo docker'


_1_copy_backup_to_instance() {
  local container=${1}
  local backup_path=${2}
  local dest_path=$(mktemp)

  ${DOCKER_CMD} exec -it ${container} mkdir -p ${dest_path}
  ${DOCKER_CMD} cp ${backup_path}/* ${container}:${dest_path}/

  echo "${dest_path}"
}

_2_do_restore() {
local container=${1}
  local uri=${2}
  local user=${3}
  local pass=${4}
  local dest_path=${5}

  ${DOCKER_CMD} exec -it ${container} \
    /opt/couchbase/bin/cbrestore ${dest_path} ${uri} -x conflict_resolve=0 \
      -u ${user} -p ${pass}
}

restore() {
  local container=${1}
  local uri=${2}
  local user=${3}
  local pass=${4}
  local backup_path=${5}

  dest_path=$(_1_copy_backup_to_instance ${container} ${backup_path})
  _2_do_restore ${container} ${uri} ${user} ${pass} ${dest_path}
}

restore "$@"
