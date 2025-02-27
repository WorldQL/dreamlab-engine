# syntax=docker/dockerfile:1
FROM denoland/deno:alpine AS repo

# Install git in the build stage
RUN apk add --no-cache git

WORKDIR /app
COPY --chown=deno ./util /app/util
COPY --chown=deno ./scene-graph /app/scene-graph
COPY --chown=deno ./ui /app/ui
COPY --chown=deno ./build-system /app/build-system
COPY --chown=deno ./proto /app/proto
COPY --chown=deno ./engine /app/engine
COPY --chown=deno ./multiplayer /app/multiplayer
RUN sh -c "rm /app/**/deno.lock"

FROM denoland/deno:alpine
WORKDIR /app
USER deno

COPY --from=repo --chown=deno /app/ /app/
WORKDIR /app/multiplayer
RUN deno install --entrypoint server-host/main.ts && deno install --entrypoint server-runtime/main.ts

EXPOSE 8001
VOLUME ["/app/multiplayer/worlds"]

CMD ["task", "start"]
