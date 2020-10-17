#!/bin/bash

version="$1"


function print_version {
    if [[ -z "$1" ]]; then
        echo -n 0
    else
        echo -n $1
    fi
}

tag="$(git describe --tags)"
tag_regex='^([[:digit:]]+)(.([[:digit:]]+))?(.([[:digit:]]+))?(-[1-9][[:digit:]]*-g[a-f0-9]{6})?.?$'

if [[ $tag =~ $tag_regex ]]; then
    case $version in
    "--major")
        print_version "${BASH_REMATCH[1]}"
        ;;
    esac
    case $version in
    "--minor")
        print_version "${BASH_REMATCH[1]}"
        echo -n '.'
        print_version "${BASH_REMATCH[3]}"
        ;;
    esac
    case $version in
    "--patch")
        print_version "${BASH_REMATCH[1]}"
        echo -n '.'
        print_version "${BASH_REMATCH[3]}"
        echo -n '.'
        print_version "${BASH_REMATCH[5]}"
        ;;
    esac
else
    >&2 echo "Could not retrieve tag"
    exit 1
fi
