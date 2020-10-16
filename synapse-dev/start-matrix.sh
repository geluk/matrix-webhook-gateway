#!/bin/sh

if [ ! -e "synapse-data/homeserver.db" ]; then
    echo "Copying homeserver.db from template"
    cp template/homeserver.db synapse-data/homeserver.db
fi
if [ ! -e "../webhook-appservice.yaml" ]; then
    echo "Copying webhook-appservice.yaml from template"
    cp template/webhook-appservice.yaml ../webhook-appservice.yaml
fi
export SYNAPSE_UID="$(id -u)"
export SYNAPSE_GID="$(id -g)"

docker-compose up
