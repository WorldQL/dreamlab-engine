# Dreamlab – Cross-Platform Multiplayer 2D Game Engine
![ezgif-386f81fca4019](https://github.com/user-attachments/assets/a6772d27-1915-43c3-bfc3-e7040984d540)

**[Try it in your browser now](https://app.dreamlab.gg/)**

## Features
- Singleplayer and multiplayer games
- Rapier physics engine
- TypeScript scripting
- In-browser code editor
- Graphical editor and Behavior system
- Real-time collaboration
- One-click deployment / bundling
- Built-in version control

## Setup
We recommend [using Dreamlab in your browser with no setup required](https://app.dreamlab.gg/). However, you can run it locally with the following:
```bash
git clone https://github.com/WorldQL/dreamlab-engine
cd dreamlab-engine/multiplayer
# start server
deno task start

# open new terminal window
# start editor
cd dreamlab-engine
echo "SERVER_URL="http://localhost:8002" > client/.env.local
cd editor/
deno task watch
```

If you need any help please open a GitHub issue and we'll respond to it ASAP!

## Special Thanks
Finding bugs, suggesting features, testing etc:
- 42ultra
- Wolfer
