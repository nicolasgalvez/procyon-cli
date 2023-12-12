#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local



set -x

EXCLUDED_TABLES=(wp_actionscheduler_actions wp_commentmeta wp_comments wp_users wp_usermeta)
EXPORT_PATH=''


# Check for WordPRess Engine, which doesn't persist the user directory. In this case, we have to export the db to the public folder.
if [[ $REMOTE_PATH == *"wpe-user"* ]]; then
  echo "The string 'wpe-user' was found in the \$REMOTE_PATH"
  EXPORT_PATH=$REMOTE_PATH/wp-content/uploads/
fi

#OPTION_ID=$(wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db query "SELECT option_id FROM wp_options WHERE option_name = 'active_plugins'" --skip-column-names)
wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db export "$EXPORT_PATH"db.sql
#--exclude_tables=`printf '%s,' "${EXCLUDED_TABLES[@]}"`
#ssh $REMOTE_SSH "sed -i '/^INSERT INTO \`wp_options\` VALUES ($OPTION_ID,/d' db.sql"


rsync -chavzP --stats $REMOTE_SSH:"$EXPORT_PATH"db.sql db.sql

mkdir -p .tmp
cd .tmp
$WP db export db.sql
cd ..
$WP db import db.sql
$WP search-replace --all-tables $REMOTE_DOMAIN $LOCAL_DOMAIN
$WP transient delete --all
rm db.sql
