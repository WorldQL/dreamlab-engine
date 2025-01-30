# singleplayer

Singleplayer runtime for Dreamlab engine.

## Setup

```shell
$ # clean up the webroot:
$ rm -r web/runtime web/worlds
$ # build a specific world (into web/worlds/<world id>)
$ # note: the world must exist in ../multiplayer/worlds
$ deno task build-world "dreamlab/test-world"
Building world dreamlab/test-world...
$ # set the world id that will be loaded by default:
$ export DEFAULT_WORLD_ID="dreamlab/test-world"
$ # build the singleplayer runtime (into web/runtime):
$ deno task build
$ # bundle into a zip file:
$ (cd web && zip -r ../my-game.zip .)
```
