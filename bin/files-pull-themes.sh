#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.

. bin/inc/loader.sh
. bin/inc/arg_environment.sh



# echo "Pulling plugins"
#rsync -chavzP --stats $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/plugins/ public/wp-content/plugins/
# echo "Pulling themes"
rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/themes/ public/wp-content/themes/
#
#echo "Pulling uploads"
#rsync -chavzP --stats --exclude-from='bin/rsync-exclude' $REMOTE_DOMAIN:$REMOTE_PATH/wp-content/uploads/ public/wp-content/uploads/
