#!/usr/bin/env bash
# setup remote git repo

set -e
# Load .env file
set -o allexport
source .env
set +o allexport

if [ $1 ]; then
  SITE=$1
else
  echo "What site to sync?"
  exit 1
fi

REMOTE_HOME=$(ssh $LIVE_SSH -C 'echo $HOME')
echo $REMOTE_HOME
