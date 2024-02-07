#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.





# echo "Pulling plugins"
#rsync -chavzP --stats $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ "$LOCAL_PATH/wp-content/plugins/"
# echo "Pulling themes"
#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/ "$LOCAL_PATH/wp-content/themes/"
#
echo "Pulling uploads"
rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_SSH:$REMOTE_PATH/wp-content/uploads/ "$LOCAL_PATH/wp-content/uploads/"
