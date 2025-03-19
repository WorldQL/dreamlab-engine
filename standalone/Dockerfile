FROM denoland/deno:2.2.2 AS builder
WORKDIR /app
COPY ./out .

# Create non-root user
RUN adduser --disabled-password --gecos "" rivet

RUN mkdir -p /deno-dir && chown -R rivet:rivet /deno-dir
RUN chown -R rivet:rivet /app
# Set DENO_DIR environment variable to use our custom cache directory
ENV DENO_DIR=/deno-dir

USER rivet

RUN deno cache ./server.js
CMD ["deno", "run", "-A", "/app/server.js"]
