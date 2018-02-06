#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bold=$(tput bold)
normal=$(tput sgr0)
name=$(basename $0)

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

if [ $# -ne 2 ]; then
    summary
    exit 1
fi

dist_file=$(mktemp --suffix=.tgz)
dist_host=$1
app_name=$2
deploy_dir=/home/centos/apps/${app_name}

echo -e "Building                     \t:"
${DIR}/build.sh

echo "Deploying..."
echo -e "Root project                 \t: ${bold}$(pwd)${normal}"

echo -en "Generating distribution file\t: "
tar czf ${dist_file} build
echo -e "${bold}${dist_file}${normal}"

echo -en "Uploading distribution file  \t: "
rsync -arq ${dist_file} ${dist_host}:${dist_file}
echo -e "${bold}OK${normal}"

echo -e "Installing                   \t: "
ssh ${dist_host} bash << EOF
source ~/.nvm/nvm.sh
mkdir -p ${deploy_dir}
tar xzf ${dist_file} -C ${deploy_dir} --strip-components=1 > dev/null
cd ${deploy_dir}
nvm use
npm install
pm2 restart ${app_name}
EOF
