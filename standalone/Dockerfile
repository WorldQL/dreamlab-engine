FROM denoland/deno:latest
WORKDIR /app
COPY ./out .
RUN deno cache ./server.js
CMD ["deno", "run", "-A", "/app/server.js"]
