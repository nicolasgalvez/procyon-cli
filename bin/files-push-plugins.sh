#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.

. bin/inc/loader.sh
. bin/inc/arg_environment.sh

set -x
mkdir -p .tmp/plugins-old
mkdir -p public/wp-content/plugins

#rsync -chavP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/ public/wp-content/themes/

## Backup remote plugins
ssh $REMOTE_DOMAIN -C "zip -r plugins.tgz $REMOTE_PATH/wp-content/plugins"

## Delete remote plugins
ssh $REMOTE_DOMAIN -C "rm -rf $REMOTE_PATH/wp-content/plugins/*"

## Push local plugins
rsync -chavP --stats public/wp-content/plugins/ $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/
