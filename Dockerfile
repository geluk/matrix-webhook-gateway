FROM node:lts AS build
WORKDIR /build
COPY package.json package-lock.json ./
# This is necessary to get @vscode/sqlite3 to build.
RUN npm ci --python=/usr/bin/python3
COPY . ./
RUN npx tsc --outDir out

FROM node:lts
WORKDIR /app

ENV WEBHOOK_CONFIG /config/gateway-config.yaml
ENV WEBHOOK_APPSERVICE_CONFIG /data/appservice-webhook-gateway.yaml
ENV WEBHOOK_AUTO_MIGRATE true

RUN mkdir /data
RUN mkdir /config
RUN chown 953:953 /app /data /config
COPY --from=build /build/out /app
COPY --from=build /build/node_modules /app/node_modules
COPY --from=build /build/templates /app/templates

EXPOSE 8020
EXPOSE 8023
USER 953:953

ENTRYPOINT ["/usr/local/bin/node", "entry.js"]
CMD []
