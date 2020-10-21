FROM node:14-buster
WORKDIR /app
RUN chown 953:953 /app
COPY --chown=953:953 package.json package-lock.json ./
RUN npm ci
COPY --chown=953:953 . ./

EXPOSE 8020
EXPOSE 8023

USER 953:953

ENTRYPOINT [ "/usr/local/bin/npx", "ts-node", "--compiler", "ttypescript", "entry.ts" ]
CMD [ "--config", "/config/gateway-config.yaml" ]
