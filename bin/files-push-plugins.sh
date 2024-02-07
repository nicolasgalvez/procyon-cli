#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

set -e
## This file pulls the uploads folder down from the remote server into localhost.

set -x
# Make sure paths exist
mkdir -p "$LOCAL_PATH"/../../.tmp/plugins-old
mkdir -p public/wp-content/plugins

# Check if single directory is targeted
SINGLE_DIR=""
for i in "$@"; do
  case $i in
    --single=*)
      # Extract the directory name from the argument
      SINGLE_DIR="${i#*=}"
      shift # past argument=value
      ;;
    *)
      # Unknown option
      ;;
  esac
done

if [ -n "$SINGLE_DIR" ]; then
  REMOTE_PLUGIN_PATH="$REMOTE_PATH/wp-content/plugins/$SINGLE_DIR"
  LOCAL_PLUGIN_PATH="$LOCAL_PATH/wp-content/plugins/$SINGLE_DIR"
else
  REMOTE_PLUGIN_PATH="$REMOTE_PATH/wp-content/plugins"
  LOCAL_PLUGIN_PATH="$LOCAL_PATH/wp-content/plugins"
fi
#echo $REMOTE_PLUGIN_PATH
#echo $LOCAL_PLUGIN_PATH
#

## Backup remote plugins
ssh $REMOTE_DOMAIN -C "zip -r plugins.tgz $REMOTE_PLUGIN_PATH"

#wp --ssh="$REMOTE_DOMAIN" --path="$REMOTE_PATH" core maintenance-mode activate

## Delete remote plugins
ssh $REMOTE_DOMAIN -C "rm -rf $REMOTE_PLUGIN_PATH/*"

## Push local plugins
rsync -chavP --stats "$LOCAL_PLUGIN_PATH/" $REMOTE_DOMAIN:$REMOTE_PLUGIN_PATH/

#wp --ssh="$REMOTE_DOMAIN" --path="$REMOTE_PATH" core maintenance-mode deactivate