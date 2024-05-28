# Old Experiments

This is a collection of older experiments worked on in free time, rewriting most of the base functionality of `dreamlab-core` while changing/fixing any glaring errors.

> This should not be treated as a base to work off of, it is provided as reference and should be used to cherry-pick good ideas and inspire the next version of Dreamlab.

## Running the Engine

This prototype has everything needed to run the engine interactively on the client (and the server but thats not implemented anywhere), all it does is render a simple physics demo with an interactive camera.

```sh
$ deno task build && deno task serve
```

Hold <kbd>SPACE</kbd> and drag to pan.
