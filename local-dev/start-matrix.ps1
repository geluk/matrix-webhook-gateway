

if (-Not (Test-Path "synapse-data")) {
    Write-Output "Creating synapse-data directory"
    New-Item -Name "synapse-data" -ItemType "directory"
}

if (-Not (Test-Path "synapse-data/homeserver.db")) {
    Write-Output "Copying homeserver.db from template"
    Copy-Item "template/homeserver.db" "synapse-data/homeserver.db"
}

if (-Not (Test-Path "../gateway-config.yaml")) {
    Write-Output "Copying gateway-config.yaml from template"
    Copy-Item "template/gateway-config.yaml" "../gateway-config.yaml"
}

$env:SYNAPSE_UID = 1000
$env:SYNAPSE_GID = 1000

docker compose up
