FROM node:alpine

WORKDIR /app
RUN npm i -g npm

COPY package.json /app/
RUN npm i

COPY src tsconfig.json /app/
RUN npm i

ENTRYPOINT ["npm", "run"]
CMD ["start"]

LABEL org.opencontainers.image.source=https://github.com/jeremy-wolfe/frigate-ntfy
