#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.




SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

#echo $SCRIPT_DIR;
# echo "Pulling plugins"
#rsync -chavzP --stats $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ "$LOCAL_PATH/wp-content/plugins/"
echo "Pushing themes"
rsync -chavzP --stats --exclude-from="$SCRIPT_DIR/../bin/rsync-exclude"  "$LOCAL_PATH/wp-content/themes/" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/
#
#echo "Pulling uploads"
#rsync -chavzP --stats --exclude-from="$ROOT_PATH/bin/rsync-exclude" $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/ "$LOCAL_PATH/wp-content/uploads/"
