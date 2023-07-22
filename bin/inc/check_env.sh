#!/usr/bin/env bash

# check .env file for all values
env_vars=(
"SITE_NAME"
"STAGING_SSH"
"STAGING_DOMAIN"
"LIVE_SSH"
"LIVE_DOMAIN"
"REMOTE_PATH"
"LOCAL_DOMAIN"
)

for each in "${env_vars[@]}"; do
  if [ -z "${!each+x}" ]; then
    echo "$each is not defined"
    exit 1
  fi
done
