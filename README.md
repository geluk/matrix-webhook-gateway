# Installation

The recommended way to run the application service is using Docker.
Alternatively, it is possible to install a release directly.

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
