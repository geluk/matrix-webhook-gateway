#!/bin/bash

version="$1"


function print_version {
    if [[ -z "$1" ]]; then
        echo -n 0
    else
        echo -n $1
    fi
}

function print_prerelease {
    if [[ -n "$1" ]]; then
        echo -n $1
    fi
}

tag="$(git describe --tags)"
tag_regex='^v?([[:digit:]]+)(.([[:digit:]]+))?(.([[:digit:]]+))?(-[a-z0-9-]+)?$'

if [[ $tag =~ $tag_regex ]]; then
    case $version in
    "--major")
        print_version "${BASH_REMATCH[1]}"
        print_prerelease "${BASH_REMATCH[6]}"
        ;;
    "--minor")
        print_version "${BASH_REMATCH[1]}"
        echo -n '.'
        print_version "${BASH_REMATCH[3]}"
        print_prerelease "${BASH_REMATCH[6]}"
        ;;
    "--patch")
        print_version "${BASH_REMATCH[1]}"
        echo -n '.'
        print_version "${BASH_REMATCH[3]}"
        echo -n '.'
        print_version "${BASH_REMATCH[5]}"
        print_prerelease "${BASH_REMATCH[6]}"
        ;;
    esac
else
    >&2 echo "Could not retrieve tag"
    exit 1
fi
