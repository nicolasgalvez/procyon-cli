#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.

. bin/inc/loader.sh
. bin/inc/arg_environment.sh

set -x

rsync -chavzP --stats --exclude-from='bin/rsync-exclude'  public/wp-content/uploads/ $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/
#rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ public/wp-content/plugins/
#rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/mu-plugins/ public/wp-content/mu-plugins/
