FROM node:alpine as build
WORKDIR /app
RUN npm i -g npm

COPY package.json /app/
RUN npm i

COPY tsconfig.json /app/
COPY src /app/src
RUN npx tsc


FROM node:alpine
WORKDIR /app
RUN npm i -g npm

COPY package.json config.example.yml /app/
COPY --from=build /app/dist /app/dist
RUN npm i --only=production

USER node
ENTRYPOINT ["npm", "--update-notifier=false", "run"]
CMD ["start"]

LABEL org.opencontainers.image.source=https://github.com/jeremy-wolfe/frigate-ntfy
