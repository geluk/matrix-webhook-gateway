# Installation

## Docker
The recommended way to run the application service is using Docker.
All releases are published as Docker images on https://hub.docker.com/r/geluk/matrix-webhook-gateway.

To get started quickly, an example compose file is provided below:
```yaml
version: "3.6"
services:
  matrix-webhooks:
    image: geluk/matrix-webhook-gateway:latest
    volumes:
      - ./data:/data
      - ./config:/config
    ports:
      - {{ ports.matrix_webhook_geluk_web }}:8020
      - {{ ports.matrix_webhook_geluk_bridge }}:8023
    restart: unless-stopped
```

## Without Docker
It is also possible to run the application directly. In the future, releases will be provided to simplify this, but for now, the best option is to clone the repository, and run the application (`npm ci && npm run start`).

# Development setup

Run `start-matrix.sh` in `./local-dev` to set up a local appservice
development environment with Docker. This will start up a Synapse and an Element
instance, which you can use for testing the appservice.

```bash
cd local-dev
./start-matrix.sh
```

Go to http://localhost:8009 and log in using the following credentials:

Username: `dev`  
Password: `appservice-dev`

Start the app service:
```bash
npm ci
npm run start
```

# References

https://github.com/matrix-org/matrix-appservice-bridge

https://github.com/matrix-org/matrix-js-sdk

https://github.com/woutervh-/typescript-is
