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
We recommend [using Dreamlab in your browser with no setup required](https://app.dreamlab.gg/). **AI features are currently unavailable locally but we will include documentation on importing your own OpenAI key very soon.**
However, you can run it locally with the following:

```bash
git clone https://github.com/WorldQL/dreamlab-engine
cd dreamlab-engine/multiplayer
# create project and start server
PROJECT_NAME=my-new-project

cp -r multiplayer/worlds/dreamlab/template-project "multiplayer/worlds/dreamlab/$PROJECT_NAME" \
&& cd multiplayer \
&& deno task start --spawn "dreamlab/$PROJECT_NAME"


# open new terminal window
# start editor
cd dreamlab-engine
cd editor/
deno task watch
```

Then open http://localhost:5173/?instance=00000000-0000-0000-0000-000000000000&server=ws%3A%2F%2Flocalhost%3A8001 and you'll see the editor! 

## **Need Help?**  
If you need any help, feel free to:  
- Open a **[GitHub issue](https://github.com/WorldQL/dreamlab-engine/issues)**  
- Join our **[Discord community](https://discord.gg/nwXFvtJ92g)** and ask questions in the help channel!


## Special Thanks
Finding bugs, suggesting features, testing etc:
- 42ultra
- Wolfer
