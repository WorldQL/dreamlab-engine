# syntax=docker/dockerfile:1
FROM denoland/deno:2.2.5
WORKDIR /app

RUN \
  # create deno cache directory
  mkdir -p /deno-dir && chown -R deno:deno /deno-dir && \
  # chown app directory
  chown -R deno:deno /app

# set DENO_DIR environment variable to use our custom cache directory
USER deno
ENV DENO_DIR=/deno-dir

COPY ./out .
RUN \
  deno install --entrypoint ./server.js && \
  deno install --entrypoint ./.server-runtime.js && \
  deno install --entrypoint ./engine/engine.js

CMD ["deno", "run", "-A", "/app/server.js"]
