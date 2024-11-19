# typedef-gen

TypeScript type definition generation for the code editor via dnt

## Setup

```shell
$ # grab dnt if you didn't clone with submodules:
$ git submodule update --init
$ cd dnt/
dnt/ $ deno task build # build dnt's Rust code into a WASM lib
dnt/ $ # alternatively you can grab the `lib/pkg` from our Slack lol
dnt/ $ cd ..
$ deno run -A ./build_npm.ts
```
