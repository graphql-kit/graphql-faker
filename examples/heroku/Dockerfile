FROM node:12.16.0-alpine

WORKDIR /usr/src/app

COPY ./schema.sdl /usr/src/app

RUN npm install -g graphql-faker

EXPOSE 9002

CMD graphql-faker ./schema.sdl
