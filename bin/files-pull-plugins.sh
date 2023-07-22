#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.

. bin/inc/loader.sh
. bin/inc/arg_environment.sh

set -x
mkdir -p .tmp/plugins-old
mkdir -p public/wp-content/plugins

#rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/ public/wp-content/themes/
rsync -havzP public/wp-content/plugins/ .tmp/plugins-old/
rsync -havzP --stats $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ public/wp-content/plugins/
#rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/ public/wp-content/uploads/
