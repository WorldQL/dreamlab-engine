You may want to do something like

```
deno run -A build_npm.ts && rm -rf ~/dreamlab/dreamlab-code-editor/public/dreamlab-engine-intellisense/* ; cp -r ./out/* ~/dreamlab/dreamlab-code-editor/public/dreamlab-engine-intellisense/
```
