#!/usr/bin/env bash

set -e
# Load .env file
set -o allexport
#source .env
set +o allexport

. bin/inc/check_env.sh
