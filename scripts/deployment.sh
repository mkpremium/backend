#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bold=$(tput bold)
normal=$(tput sgr0)
name=$(basename $0)

validate_nvm() {
  local host=$1
  local remote_dir=$2

  local local_file=`readlink -f ${DIR}/../build/.nvmrc`
  local md5sum=`ssh ${host} "md5sum ${remote_dir}/.nvmrc" | awk '{print $1}'`
  local md5file=${DIR}/../build/MD5SUM

  echo "${local_file}  ${md5sum}" > ${md5file}

  md5sum -c --quiet ${md5file} &> /dev/null
}

summary() {
  cat <<EOH
${bold}NAME${normal}
  $name - Build and deploy the files to the <ssh-host>:${deploy_dir}

${bold}SYNOPSIS${normal}
  sh $name <ssh-host> <app-name>

${bold}DESCRIPTION${normal}
  Build and deploy the files to the ssh-host that pass as first argument
  should be a hostname that you have configure in your ~/.ssh/config that points to the correct instance
  and have the correct credentials to successfully connect.

  Example:

    sh $name bitdistrict-m1 app-name

  Exit Status:
  Returns 0 unless the instructions cannot be completed
EOH
}

deploy() {
  local dist_host=$1
  local app_name=$2

  local temp_dist_file=$(mktemp)
  local dist_file="${temp_dist_file}.tgz"
  local deploy_dir=/home/centos/apps/${app_name}

  echo -en "Checking node version         \t:"
  remove_node_modules=`validate_nvm ${dist_host} ${deploy_dir} || echo 'rm -rf node_modules; npm install -g pm2'`
  remove_node_modules_msg=`validate_nvm ${dist_host} ${deploy_dir} && echo OK || echo Reinstalling`
  echo -e "${bold}${remove_node_modules_msg}${normal}"

  echo "Deploying..."
  echo -e "Root project                  \t: ${bold}$(pwd)${normal}"

  echo -en "Generating distribution file \t: "
  tar czf ${dist_file} build
  echo -e "${bold}${dist_file}${normal}"

  echo -en "Uploading distribution file  \t: "
  rsync -arq ${dist_file} ${dist_host}:${dist_file}
  echo -e "${bold}OK${normal}"

  echo -e "Installing on remote          \t: "
  ssh ${dist_host} bash << EOF
source ~/.nvm/nvm.sh
mkdir -p ${deploy_dir}
tar xzf ${dist_file} -C ${deploy_dir} --strip-components=1 > /dev/null
cd ${deploy_dir}
nvm install
${remove_node_modules}
npm install
pm2 reload --update-env ${app_name}-pm2.json
EOF
}

if [ $# -ne 2 ]; then
    summary
    exit 1
fi

deploy "$@"
