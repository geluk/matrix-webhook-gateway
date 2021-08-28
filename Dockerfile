FROM node:16-buster AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npx ttsc --outDir out

FROM node:16-buster
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
# Versions 0.12 and older only support Typescript migrations.
# For backwards compatibility, we copy the Typescript migration files
# into the image as well.
COPY --from=build /build/migrations /app/migrations

EXPOSE 8020
EXPOSE 8023
USER 953:953

ENTRYPOINT ["/usr/local/bin/node", "entry.js"]
CMD []
