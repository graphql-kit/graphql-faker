FROM node:8.8.1-alpine

MAINTAINER James Kyburz "james.kyburz@gmail.com"

RUN apk --no-cache add --virtual native-deps \
  git && \
  npm install graphql-faker -g &&\
  npm cache clean --force &&\
  apk del native-deps

ENTRYPOINT ["node", "/usr/local/bin/graphql-faker"]
CMD []

EXPOSE 9002
