#!/bin/bash


. bin/inc/loader.sh

set -e
set -x

# Get a list of active plugins
plugins=$($WP plugin list --field=name --status=active)

# Generate a timestamp
timestamp=$(date +%Y%m%d%H%M%S)

# Backup the existing composer.json file with the current timestamp
cp composer.json composer.json.bak.$timestamp

# Add composer.json backups to the .gitignore file, if not already present
if ! grep -q "composer.json.bak.*" "/path/to/your/.gitignore"; then
    echo "composer.json.bak.*" >> .gitignore
fi

# Iterate over each active plugin
for plugin in $plugins
do
    # Get the current version of the plugin
    version=$($WP plugin get $plugin --field=version)

    # Add the plugin with the specific version to the composer.json using composer require
    composer require wpackagist-plugin/$plugin:$version
done
