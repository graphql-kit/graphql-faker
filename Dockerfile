FROM node:14.3.0-alpine

ENTRYPOINT ["node", "/usr/local/bin/graphql-faker"]
WORKDIR /workdir

EXPOSE 9002

RUN yarn global add graphql-faker && \
    yarn cache clean --force
