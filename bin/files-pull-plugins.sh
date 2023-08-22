#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.



set -x
mkdir -p $LOCAL_PATH/.tmp/plugins-old
mkdir -p "$LOCAL_PATH/wp-content/plugins/"

#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/ "$LOCAL_PATH/wp-content/themes/"
rsync -havzP "$LOCAL_PATH/wp-content/plugins/" $LOCAL_PATH/.tmp/plugins-old/
rsync -havzP --stats $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ "$LOCAL_PATH/wp-content/plugins/"
#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/ "$LOCAL_PATH/wp-content/uploads/"
