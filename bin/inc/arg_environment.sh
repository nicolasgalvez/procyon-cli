#!/usr/bin/env bash

# The target of operations
TARGET_ENV=$1
if [ "$1" == 'live' ]; then
    REMOTE_SSH=$LIVE_SSH
    REMOTE_DOMAIN=$LIVE_DOMAIN

elif [ "$1" == 'staging' ]; then
    REMOTE_SSH=$STAGING_SSH
    REMOTE_DOMAIN=$STAGING_DOMAIN
    REMOTE_PATH=${STAGING_PATH:-REMOTE_PATH}
    echo "$REMOTE_PATH";
else
  echo "What site to download? [live|staging]"
  exit 1
fi
