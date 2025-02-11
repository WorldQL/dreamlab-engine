# syntax=docker/dockerfile:1
FROM denoland/deno:alpine AS build

WORKDIR /app
USER deno

COPY --chown=deno ./util /app/util
WORKDIR /app/util
RUN deno install

COPY --chown=deno ./scene-graph /app/scene-graph
WORKDIR /app/scene-graph
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./ui /app/ui
WORKDIR /app/ui
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./build-system /app/build-system
WORKDIR /app/build-system
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./proto /app/proto
WORKDIR /app/proto
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./engine /app/engine
WORKDIR /app/engine
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./client /app/client
WORKDIR /app/client
RUN deno task build

FROM nginx:alpine
COPY --from=build /app/client/web /usr/share/nginx/html
