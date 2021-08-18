#!/bin/sh

fail() {
    echo "${1}" 1>&2
    exit 1
}

stat out/webhook-gateway > /dev/null 2>&1 || \
    fail "No build artifacts. Please build the application first."

stat out/dist 2> /dev/null && rm -r out/dist 
mkdir out/dist

cp -r templates node_modules out/webhook-gateway/* out/dist
