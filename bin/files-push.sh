#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.



set -x

rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude"  "$LOCAL_PATH/wp-content/uploads/" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/
#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ "$LOCAL_PATH/wp-content/plugins/"
#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/mu-plugins/ public/wp-content/mu-plugins/
