#!/usr/bin/env bash
# Pushes database.

. bin/inc/loader.sh
. bin/inc/arg_environment.sh

# Technically we shouldn't push to live but it happens. You can comment this out if needed.
if [ "$REMOTE_DOMAIN" == "$LIVE_DOMAIN" ]; then
	echo "No pushing to live";
	exit;
fi

set -x


$WP db export db.sql --exclude_tables=wp_users

rsync -chavzP --stats  db.sql "$REMOTE_SSH":db.sql

# Make a backup of the database in home folder
wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db export
# Import the local database

wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" db import db.sql
wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" search-replace "$LOCAL_DOMAIN" "$REMOTE_DOMAIN"

# Workaround for the autoload proxy saving fake urls on local
# wp --ssh="$REMOTE_SSH" --path="$REMOTE_PATH" search-replace "localhost:3000" "$REMOTE_DOMAIN"
rm db.sql
