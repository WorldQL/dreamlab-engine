---
title: Coordinate System
author: charlotte
---

Pixels make for a bad global coordinate system. we should use centimeters or meters or something that is physically visualizable & makes sense with our physics engine. To get to screenspace we can scale in our camera implementation.

The downside here is that pixel art games that want to use integer scaling and nearest-neighbor filtering & align perfectly on the grid are going to have a rough time but we already have poor support for precise pixel rendering (even Discord is doing weird subpixel transforms all the time!!). And the large majority of games aren't pixel art games so it's chill really I think
