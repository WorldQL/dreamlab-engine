# Dreamlab – Cross-Platform Multiplayer 2D Game Engine


https://github.com/user-attachments/assets/a8a539ea-c39b-462c-835a-d1c906b4507e



## Features
- Built in multiplayer networking
- Singleplayer export support
- Tilemaps
- Rapier physics engine
- TypeScript scripting. Uses a Unity-style Behavior script system
- Graphical editor
- Real-time collaboration
- One-click deployment / bundling
- Built-in version control*
- In-browser script editor*

## Setup
We recommend [using Dreamlab in your browser with no setup required](https://app.dreamlab.gg/). This version has all the features, including built-in version control and an in-browser script editor. AI features are currently unavailable locally but we will include documentation on importing your own OpenAI/Anthropic key very soon.
However, you can run it locally with the following:

```bash
# clone the dreamlab engine repo
git clone https://github.com/WorldQL/dreamlab-engine
cd dreamlab-engine

# initialize local environment variables
# this only needs to be done once per clone
deno task init-local-env

# initialize a new dreamlab project
deno task init-project ~/my-project

# start the multiplayer server
# be sure to pass the path to your project
deno task run-server ~/my-project

# start the editor
# this needs to be run in a new terminal while the multiplayer server runs in the background
deno task run-editor
```

Then open http://localhost:5173/ and you'll see the editor! 

## **Need Help?**  
If you need any help, feel free to: 
- Open a **[GitHub issue](https://github.com/WorldQL/dreamlab-engine/issues)**  
- Join our **[Discord community](https://discord.gg/nwXFvtJ92g)** and ask questions in the help channel!


## Special Thanks
Finding bugs, suggesting features, testing etc:
- 42ultra
- Wolfer
