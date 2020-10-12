#!/bin/sh

export SYNAPSE_UID="$(id -u)"
export SYNAPSE_GID="$(id -g)"

docker-compose up