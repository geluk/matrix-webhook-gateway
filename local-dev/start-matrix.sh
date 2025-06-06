#!/bin/sh


if [ ! -d "synapse-data" ]; then
    echo "Creating synapse-data directory"
    mkdir synapse-data
fi
if [ ! -e "synapse-data/homeserver.db" ]; then
    echo "Copying homeserver.db from template"
    cp template/homeserver.db synapse-data/homeserver.db
fi
if [ ! -e "../gateway-config.yaml" ]; then
    echo "Copying gateway-config.yaml from template"
    cp template/gateway-config.yaml ../gateway-config.yaml
fi
export SYNAPSE_UID="$(id -u)"
export SYNAPSE_GID="$(id -g)"

docker compose up
