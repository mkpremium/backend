#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bold=$(tput bold)
normal=$(tput sgr0)
name=$(basename $0)

deploy() {
  local dist_host=$1
  local app_name=mkpremium
  local user=ubuntu

  local deploy_id=`date +"%Y-%m-%d_%H-%M-%ST%Z"`
  local dist_file="build_${deploy_id}.tgz"
  local deploy_dir=/home/${user}/${app_name}/${deploy_id}

  echo -e "Replacing config files for       \t: ${bold}${dist_host}${normal}"
  cp -r conf/${dist_host}/. build/

  echo "Deploying..."
  echo -e "Root project                  \t: ${bold}$(pwd)${normal}"

  echo -en "Generating distribution file \t: "
  tar czf ${dist_file} build
  echo -e "${bold}${dist_file}${normal}"

  echo -en "Uploading distribution file  \t:"
  echo -en "${dist_file} ${dist_host}:${dist_file}"

  scp ${dist_file} ${dist_host}:${dist_file}
  echo -e "${bold}OK${normal}"

  echo -e "Installing on remote          \t: "
  ssh ${dist_host} bash << EOF
source ~/.nvm/nvm.sh
mkdir -p ${deploy_dir}
tar xzf ${dist_file} -C ${deploy_dir} --strip-components=1 > /dev/null
rm ${dist_file}
cd ${deploy_dir}
nvm install
npm install
unlink ~/${app_name}/current || true
ln -s ${deploy_dir} ~/${app_name}/current
echo "`date` deployed version ${deploy_id}" >> ~/${app_name}/deploy_history

pm2 stop all
pm2 start --time ~/${app_name}/current/${app_name}-pm2.json
EOF
}

deploy "$@"
