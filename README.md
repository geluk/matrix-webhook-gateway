`matrix-webhook-gateway` lets you create and manage webhooks for Matrix channels. The application is configured with a simple and clearly documented configuration file, and webhooks can be added and removed directly in Matrix. A powerful plugin system is available (including several examples), allowing you to easily add handlers for various types of webhooks.

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
    # Default settings shown here for reference:
    # environment:
    #   WEBHOOK_CONFIG: /config/gateway-config.yaml
    #   WEBHOOK_APPSERVICE_CONFIG: /data/appservice-webhook-gateway.yaml
    volumes:
      # Dynamic data, the application will write to this directory
      - ./data:/data
      # Static configuration, can be mounted read-only
      - ./config:/config:ro
    ports:
        # This port is used to listen for incoming webhooks.
      - 8020:8020
        # This port is used for communication with your homeserver.
      - 8023:8023
    restart: unless-stopped
    # Defaults shown below, these can be uncommented and edited if required:
    #user: 953:953
```

## Without Docker
It is also possible to run the application directly. Download the
[latest release](https://github.com/geluk/matrix-webhook-gateway/releases)
and extract it. Start the application by running `node entry.js`
Commandline options can be used to alter the default configuration file
location. For a list of available options, try `node entry.js --help`.

# Configuration
A new configuration file (`/config/gateway-config.yaml` in Docker, or
`./gateway-config.yaml` outside Docker) is generated on first startup. The
webhook gateway will use the settings in this file to automatically generate an
appservice registration file (default location:
`/data/appservice-webhook-gateway.yaml` in Docker, `./appservice.yaml` outside).
You should copy this file to your Matrix server, and add it to your Synapse
configuration:
```yaml
 app_service_config_files:
 - "./appservices/appservice-webhook-gateway.yaml"
```
If your webhook and Matrix server live on the same host, you can also choose to
directly point Matrix to the generated appservice file.

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

The bot will create a new user for this webhook, invite it, and send you the
webhook URL in a private message.

To list all enabled webhooks in a channel, use:
```
-hook list
```

To delete a webhook, use:
```
-hook delete <id>
```
Where `<id>` is the numeric ID of a webhook as returned by `-hook list`.

A webhook user will automatically update its username and avatar if the relevant
fields in the webhook are set. Alternatively, you can use commands to set
the profile details of a user.
```
-hook set name <id> <username>
```
or:
```
-hook set avatar <id> <url>
```

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
As well as the format exposed by
[turt2live/matrix-appservice-webhooks](https://github.com/turt2live/matrix-appservice-webhooks):
```
{
  "text": "Hello world!",
  "format": "plain",
  "displayName": "My Cool Webhook",
  "avatarUrl": "http://i.imgur.com/IDOBtEJ.png"
}
```
Other formats can be supported by writing a custom plugin, see below.

# Webhook user management

When a new webhook is created, the gateway will generate an ID for the webhook
user using the pattern specified in `app_service.user_pattern` in the
configuration file.

It is possible to create multiple separate webhooks with the same name in the
same channel. Those webhooks will all be handled by the same user.

If you remove the `{room}` variable from the `user_pattern`, webhooks with the
same name will map to the same user everywhere, which may lead to a single
webhook user being active in multiple rooms at once. Despite this, webhooks
will still only be posted to the room in which they were created.

# Plugins

To support arbitrary JSON POSTs, you can write a custom plugin to interpret the
message body and format it into something the webhook gateway understands.

A plugin is a Typescript file dropped into `/data/plugins`, which needs to
conform to a specific format.

A sample plugin can be found
[here](https://github.com/geluk/matrix-webhook-gateway/blob/master/plugins/develop/sample.ts).

[this plugin](https://github.com/geluk/matrix-webhook-gateway/blob/master/plugins/develop/prometheus.ts)
may also be interesting to look at. It generates a message from an alert notification
as sent by Prometheus
[Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/).

To execute a plugin, you must append its name (as specified by the `format` key
in your plugin definition) to the webhook URL. For instance, to execute the 
sample plugin, send a POST to
`https://your-webhook-gateway-url/hook/your-webhook/sample`

## Writing plugins

If you're just looking to write a simple plugin, the easiest way to get started
is by copying the sample plugin, adapting it to your needs, and installing it
in the right directory.

If you're writing a more complicated plugin and would like to have access to
code analysis, you can clone the repository and write your plugin in the 
`./plugins/develop` directory.

### Formatting API

To simplify the process of generating messages with both HTML and plaintext
content, a formatting API is available. This lets you build messages that will
be rendered both in plaintext and as HTML.

For example, creating an ordered list:
```js
ol([a('https://example.com', 'first'), 'second', 'third'])
```
This generates the following plaintext:
```
1. first (https://example.com)
2. second
3. third
```
While generating the following HTML content:
1. [first](https://example.com)
2. second
3. third

Various convenience functions are available. Take a look at the sample plugins
to see how the formatting API can be used, and see
[here](https://github.com/geluk/matrix-webhook-gateway/blob/master/src/formatting/formatting.ts)
for a complete list of all available formatting functions.

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
7. The plugin class is instantiated, the `init()` function is executed, 
  and the plugin is added to the list of active plugins.

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

## Useful documentation
- https://matrix.org/docs/spec/client_server/r0.6.1
- https://matrix.org/docs/spec/application_service/r0.1.2
