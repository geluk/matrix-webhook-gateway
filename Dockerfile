FROM node:14-buster
WORKDIR /app
RUN mkdir /data
RUN mkdir /config
RUN chown 953:953 /app /data /config
COPY --chown=953:953 package.json package-lock.json ./
RUN npm ci
COPY --chown=953:953 . ./

EXPOSE 8020
EXPOSE 8023

USER 953:953

ENTRYPOINT [ "/usr/local/bin/npx", "ts-node", "--compiler", "ttypescript", "entry.ts" ]
CMD [ "--config", "/config/gateway-config.yaml", "--appservice-config", "/data/appservice-webhook-gateway.yaml" ]
