#!/bin/bash

set -e

echo "Initializing git submodule..."
git submodule update --init

cd dnt/

echo "Building dnt's Rust code into a WASM library..."
deno task build

cd ..

echo "Running build_npm.ts"
deno run -A ./build_npm.ts

echo "Completed!"
