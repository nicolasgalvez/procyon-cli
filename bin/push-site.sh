#!/usr/bin/env bash

set -e

# Sync to staging by default
SITE_ENV=$STAGING_SSH


if [ $1 ]; then
  SITE=$1
else
  echo "What site to sync?"
  exit 1
fi

while getopts dae flag
do
    case "${flag}" in
        d) dry=true;;
        a) all=true;;
        e) SITE_ENV="$OPTARG";;
        *) echo "invalid flag" && exit 1
    esac
done
echo pushing site

# Push entire WP site to staging
rsync -chavzP --stats --exclude-from='rsync-exclude' "sites/$SITE" "$SITE_ENV:$SITE"