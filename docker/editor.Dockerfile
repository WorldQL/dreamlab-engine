# syntax=docker/dockerfile:1
FROM denoland/deno:alpine AS build

WORKDIR /app
USER deno

COPY --chown=deno ./util /app/util
COPY --chown=deno ./scene-graph /app/scene-graph
COPY --chown=deno ./build-system /app/build-system
COPY --chown=deno ./proto /app/proto
COPY --chown=deno ./engine /app/engine
COPY --chown=deno ./client /app/client
COPY --chown=deno ./editor /app/editor

WORKDIR /app/util
RUN deno install

WORKDIR /app/scene-graph
RUN deno install --entrypoint mod.ts

COPY --chown=deno ./ui /app/ui
WORKDIR /app/ui
RUN deno install --entrypoint mod.ts

WORKDIR /app/build-system
RUN deno install --entrypoint mod.ts

WORKDIR /app/engine
RUN deno install --entrypoint mod.ts

WORKDIR /app/editor
RUN deno task build && deno run -A /app/build-system/postprocess-html.ts web

FROM nginx:alpine
COPY --from=build /app/editor/web /usr/share/nginx/html
