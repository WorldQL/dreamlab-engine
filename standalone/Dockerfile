FROM denoland/deno:latest
WORKDIR /app
COPY ./out .
RUN deno cache ./server.js
EXPOSE 8001
CMD ["deno", "run", "-A", "server.js"]
