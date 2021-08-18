FROM node:16-buster AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npx ttsc --outDir out

FROM node:16-buster
WORKDIR /app

ENV GATEWAY_CONFIG /config/gateway-config.yaml
ENV APPSERVICE_CONFIG /data/appservice-webhook-gateway.yaml

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
CMD ["--config", \
    "/config/gateway-config.yaml", \
    "--appservice-config", \
    "/data/appservice-webhook-gateway.yaml"]
