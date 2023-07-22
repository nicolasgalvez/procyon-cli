#!/usr/bin/env bash
# Pulls database from staging to local and converts the URLs for local

. bin/inc/loader.sh
. bin/inc/arg_environment.sh

set -x

EXCLUDED_TABLES=(wp_actionscheduler_actions wp_commentmeta wp_comments wp_users wp_usermeta)

#OPTION_ID=$(wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db query "SELECT option_id FROM wp_options WHERE option_name = 'active_plugins'" --skip-column-names)
wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db export db.sql 
#--exclude_tables=`printf '%s,' "${EXCLUDED_TABLES[@]}"`
#ssh $REMOTE_SSH "sed -i '/^INSERT INTO \`wp_options\` VALUES ($OPTION_ID,/d' db.sql"


rsync -chavzP --stats $REMOTE_SSH:db.sql db.sql

lando wp db import db.sql
lando wp search-replace $REMOTE_DOMAIN $LOCAL_DOMAIN
rm db.sql