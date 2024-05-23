---
title: Coordinate System
author: charlotte
---

Pixels make for a bad global coordinate system. we should use centimeters or meters or something that is physically visualizable & makes sense with our physics engine. To get to screenspace we can scale in our camera implementation.

The downside here is that pixel art games that want to use integer scaling and nearest-neighbor filtering & align perfectly on the grid are going to have a rough time but we already have poor support for precise pixel rendering (even Discord is doing weird subpixel transforms all the time!!). And the large majority of games aren't pixel art games so it's chill really I think

> we already have poor support for precise pixel rendering
>> No we don't. It works flawlessly unless Discord is fucking us up with their nonsense.
>> Also pixel art rendering isn't mutually exclusive with having a global coordinate system that's not based on pixels. See [this](https://docs.unity3d.com/Packages/com.unity.2d.pixel-perfect@1.0/manual/index.html)
