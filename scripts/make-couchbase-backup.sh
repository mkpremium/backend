#!/usr/bin/env bash

set -e

DATE=`date +%Y%m%d`
DOCKER_INSTANCE=${1:-compose_couchbase_1}
DOCKER_CMD="sudo /usr/bin/docker"

COUCHBASE_USER=${2:-mk_administrator}
COUCHBASE_PASS=${3:-oov,im3aish\\ei7uphac7EiR}
COUCHBASE_URI=${4:-http://127.0.0.1:8091}

RM_CMD="sudo rm -rf"

BACKUPS_DIR="/home/ubuntu/couchbase-backups"
BACKUPS_TO_KEEP=7

do_backup() {
  echo "Doing backup ${DATE}"
  ${DOCKER_CMD} exec -it ${DOCKER_INSTANCE} /opt/couchbase/bin/cbbackup ${COUCHBASE_URI} -m full /home/backup-${DATE} -u ${COUCHBASE_USER} -p ${COUCHBASE_PASS} -v
  ${DOCKER_CMD} cp ${DOCKER_INSTANCE}:/home/backup-${DATE} ${BACKUPS_DIR}/backup-${DATE}
  ${DOCKER_CMD} exec -it ${DOCKER_INSTANCE} sh -c "rm -rf /home/backup-${DATE}"
}


delete_old_backups() {
  echo "Removing old backups, just keeping last ${BACKUPS_TO_KEEP} backups"
  for backup in $(ls -t1 ${BACKUPS_DIR} | tail -n +$((${BACKUPS_TO_KEEP} + 1))); do
    echo "removing backup dir ${BACKUPS_DIR}/${backup}"
    ${RM_CMD} ${BACKUPS_DIR}/${backup}
  done
}

do_backup

[[ $(ls -t1 ${BACKUPS_DIR} | wc -l) -ge ${BACKUPS_TO_KEEP} ]] && delete_old_backups || echo "No need remove old backups"
