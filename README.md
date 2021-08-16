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
      - 8020:8020
      - 8023:8023
    restart: unless-stopped
```

## Without Docker
It is also possible to run the application directly. In the future, releases will be provided to simplify this, but for now, the best option is to clone the repository, and run the application (`npm ci && npm run start`). Commandline options can be used to alter the default configuration file location.
Run `npm run start -- <options>` to add them. For a list of available options, try `npm run start -- --help`.

# Configuration
A new configuration file (`/config/gateway-config.yaml` in Docker, or `./gateway-config.yaml` outside Docker) is generated on first startup.
The webhook gateway will use the settings in this file to automatically generate an appservice registration file (default location: `/data/appservice-webhook-gateway.yaml` in Docker, `./appservice.yaml` outside). You should copy this file to your Matrix server, and add it to your Synapse configuration:
```yaml
 app_service_config_files:
 - "./appservices/appservice-webhook-gateway.yaml"
```
If your webhook and Matrix server live on the same host, you can also choose to directly point Matrix to the generated appservice file.

# Usage

## Set up a webhook
Invite the bot to a new channel:
```
/invite @_webhook:yourmatrixserver.tld
```

To create a webhook in the channel, enter the following command:
```
-hook create <webhook_name>
```

The bot will create a new user for this webhook, invite it, and send you the webhook URL in a private message.

To list all enabled webhooks in a channel, use:
```
-hook list
```

To delete a webhook, use:
```
-hook delete <id>
```
Where `<id>` is the numeric ID of a webhook as returned by `-hook list`.

## Call the webhook

To call the webhook, send a `POST` request with a JSON body to the webhook URL. 
Several formats are supported, such as Slack:
```json
{
  "text": "I am a webhook message",
  "username": "Webhook",
  "icon_url": "https://example.com/hook.png"
}
```
Discord:
```json
{
  "content": "I am a webhook message",
  "username": "Webhook",
  "icon_url": "https://example.com/hook.png"
}
```
Apprise:
```json
{
  "version": "1.0",
  "title": "A new message",
  "message": "I am a webhook message"
}
```
As well as the format exposed by [turt2live/matrix-appservice-webhooks](https://github.com/turt2live/matrix-appservice-webhooks)
```
{
  "text": "Hello world!",
  "format": "plain",
  "displayName": "My Cool Webhook",
  "avatarUrl": "http://i.imgur.com/IDOBtEJ.png"
}
```
Other formats can be supported by writing a custom plugin, see below.

# Plugins

To support arbitrary JSON POSTs, you can write a custom plugin to interpret the message body and format it into something the webhook gateway understands.

A plugin is a Typescript file dropped into `/data/plugins`, which needs to conform to a specific format.

A sample plugin can be found [here](https://github.com/geluk/matrix-webhook-gateway/blob/master/plugins/sample.ts).

[this plugin](https://github.com/geluk/matrix-webhook-gateway/blob/master/plugins/prometheus.ts) may also be interesting to look at. It generates a message from an alert notification as sent by Prometheus [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/).

To execute a plugin, you must append its name (as specified by the `format` key in your plugin definition) to the webhook URL. For instance, to execute the sample plugin, send a POST to `https://your-webhook-gateway-url/hook/your-webhook/sample`

## Writing plugins

If you're just looking to write a simple plugin, the easiest way to get started
is by copying the sample plugin, adapting it to your needs, and installing it
in the right directory.

For more complicated plugins, I recommend cloning the repository and developing
your plugin in the `./plugins/develop` directory.

## Plugin loading process

The loading process of plugins is a bit involved, and not necessarily optimal.
In other words, I'm open to suggestions! If you know of a way to streamline it,
please do create an issue or a pull request.

Here's how it currently works:

On startup, the directory specified in the configuration file
(`webhooks.plugin_directory`) is scanned recursively, and the plugins in it are
loaded one by one. The loading process of a plugin looks like this:

1. The contents of the plugin file are hashed.
2. `webhooks.plugin_cache_directory` is checked for a file with a matching hash.
   If a file is found, the cached plugin is loaded immediately (see step 5).
3. If no file is found, the plugin is copied to `./plugins/__workdir` and
   compiled. This path needs to be within the working directory of the
   application, otherwise type resolutions during compilation will fail.
4. The compiled plugin is written to `webhooks.plugin_cache_directory`.
5. The cached plugin is copied to `./plugins/__workdir` to ensure any imports
   are resolved correctly during the loading process.
6. The plugin is `require()`d and some basic integrity checks are performed
   against the resulting object to validate that it is correctly formed.
7. The `init()` function is executed, and the plugin is added to the list of
   active plugins.

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

Invite the webhook management user using the following Matrix command:
```
/invite @webhook:matrix.local
```


# References

- [apprise](https://github.com/caronc/apprise/), a platform-independent notification framework.
- [turt2live](https://github.com/turt2live/matrix-appservice-webhooks), whose project inspired me to develop this application.
