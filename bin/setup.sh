#!/usr/bin/env bash

set -e

if [ -f ".env" ]; then
  echo "Create .env file"
  procyon config create
fi 

# if lando.yml exists then exit
if [ -f "lando.yml" ]; then
  echo "lando.yml already exists. Exiting..."
  exit 1
fi 

# make sure PROJECT_NAME exists
if [ -z "$PROJECT_NAME" ]; then
  echo "PROJECT_NAME is not set. Exiting..."
  exit 1
fi

echo "Setting up Lando..."
lando init --name=$PROJECT_NAME --recipe=wordpress --webroot=public --source=cwd -y

# Start it up
lando start

echo "Create a WordPress config file..."
# Create a WordPress config file
$WP config create \
  --dbname=wordpress \
  --dbuser=wordpress \
  --dbpass=wordpress \
  --dbhost=database \
  --path=public

echo "Download WordPress core..."
# Download WordPress core
$WP core download --force --locale=en_US --skip-content

$WP core install \
  --admin_user=procyon \
  --admin_password=password \