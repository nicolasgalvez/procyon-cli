#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.



# Default theme
PLUGIN="lb-blocks"

set -x
# Remove old copy of plugin and replace with new one.
ssh $REMOTE_DOMAIN "rm -rf $REMOTE_PATH/wp-content/plugins/$PLUGIN/"
rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" "$LOCAL_PATH/wp-content/plugins/"$PLUGIN/ $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/$PLUGIN/
