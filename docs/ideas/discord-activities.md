---
title: being "the engine for discord activities"
author: charlotte
---

we want low-config discord activities. assigning prefixes is not too bad but ideally you would just forward ONE URL to discord's proxy. we can do this by having the server instance _also_ host the client and world files just via static file hosting.

## an origin per game

if we give each game its own domain (e.g. a dreamlabusercontent subdomain) we can just match on the `Host` header and present a really nice path structure on top of the work we've already done without needing a complex proxy setup (e.g. nginx or caddy or traefik or something).

PLUS this gives us the chance to give different games different versions of dreamlab-core without running into caching issues, because the client then exists at multiple URLs
