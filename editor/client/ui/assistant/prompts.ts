export const fileContents: Record<string, string> = {
  "Handling Input":
    'import { Behavior, Vector2, syncedValue } from "@dreamlab/engine";\n/*\n  Handling Inputs in a Behavior:\n\n  This example demonstrates how to set up and handle various inputs within a behavior using the `Inputs` class.\n  Inputs are created for specific actions (e.g., movement or firing), and these actions are then checked and handled\n  during the behavior\'s update cycle (`onTick`).\n\n  Key Concepts:\n  - **Input Creation:**\n    Inputs are created using `this.inputs.create(...)`, binding a specific action to a key or mouse button.\n    These inputs are stored in private fields and can be checked every frame to determine if the corresponding\n    action should be executed.\n\n  - **Input Handling:**\n    Each frame, the behavior checks whether an input (e.g., a key or mouse button) is held down and executes\n    the appropriate logic, such as moving an entity or firing a weapon.\n\n  - **Cursor Tracking:**\n    The `Inputs` class also provides cursor tracking, which allows the entity to rotate or aim based on the cursor\'s\n    position in the game world.\n\n  Below is the implementation of the `Movement` behavior that handles player movement and firing based on input.\n\n*/\n\nexport default class Movement extends Behavior {\n  @syncedValue()\n  speed = 5.0;\n\n  // Input bindings for movement\n  // (method) Inputs.create(name: string, label: string, defaultBinding: Input): Action\n  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");\n  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");\n  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");\n  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");\n\n  // Input binding for firing\n  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");\n\n  // Cooldown management for firing\n  readonly #cooldown = 0;\n  #lastFired = 0;\n\n  velocity = Vector2.ZERO;\n\n  onTick(): void {\n    const movement = new Vector2(0, 0);\n    const currentSpeed = this.speed;\n\n    // Handle movement inputs\n    if (this.#up.held) movement.y += 1;\n    if (this.#down.held) movement.y -= 1;\n    if (this.#right.held) movement.x += 1;\n    if (this.#left.held) movement.x -= 1;\n\n    // Calculate the velocity based on movement input and speed\n    this.velocity = movement\n      .normalize()\n      .mul((this.game.physics.tickDelta / 100) * currentSpeed);\n\n    // Update entity\'s position based on the input\n    const newPosition = this.entity.transform.position.add(this.velocity);\n\n    if (this.#fire.pressed) {\n      // create a bullet\n    }\n\n\n    // look at cursor\n    const cursorPosition = this.inputs.cursor.world;\n    if (!cursorPosition) return;\n    // EXTREMELY IMPORTANT: Use the value of this.inputs.cursor.world before applying newPosition to the transform\n    const rotation = this.entity.transform.position.lookAt(cursorPosition);\n    this.entity.transform.rotation = rotation;\n\n    // Apply the new position to the entity\n    this.entity.transform.position = newPosition;\n  }\n}\n',
  "Looking Up and Referencing Entities":
    'import { Behavior, ColoredSquare } from "@dreamlab/engine";\n/*\n  You can look up entities by their ID using the various roots (prefabs, local, world, & server).\n  Each root contains a collection of entities, and you can access a specific entity by its ID\n  using the following syntax: `this.game.root._.MyEntityID`.\n\n  Example:\n  Suppose you have an entity with the ID "Player" in the prefabs root and another with the ID "MainCamera" in the local root.\n\n  - To retrieve the Player entity from the prefabs root:\n    const playerEntity = this.game.prefabs._.Player;\n\n  - To retrieve the MainCamera entity from the local root:\n    const cameraEntity = this.game.local._.MainCamera;\n\n  These entities can then be manipulated directly. For example:\n  playerEntity.transform.position.assign({ x: 10, y: 5 });\n  cameraEntity.transform.scale.assign({ x: 1.5, y: 1.5 });\n\n  Accessing entity children:\n  Use `this.entity._.ChildName` to access a child entity directly. \n  For example: `this.entity._.ColoredSquare` will work if the entity has a child named \'ColoredSquare\'.\n\n  If the child\'s name contains a space, use bracket notation: `this.entity._["My_Entity"]`.\n\n  You can also access children of children by chaining: \n  `this.entity.myChild.myOtherChild`.\n\n  Important: \n  Do NOT use `this.entity.children.find(child => child.name === "ChildName")` as it is inefficient and unnecessary. \n  The `children` property provides a `ReadonlyMap` for reference but should not be used for lookups.\n\n    Accessing synced values in Dreamlab:\n\n  1. **Entity synced values**:\n     To access a synced value from an entity, use the `cast` method to cast the entity\'s child to its specific type.\n     Example:\n     private onCollide(e: EntityCollision): void {\n       // Change the wall\'s color to match the ball\'s color\n       // Color is a HEX value only in a String\n       const wallSolidColor = e.other._.ColoredSquare;\n       wallSolidColor.cast(ColoredSquare).color =\n         this.entity._.ColoredSquare.cast(ColoredSquare).color;\n     }\n     \n\n     - `cast` ensures you access the correct type, allowing you to manipulate its synced values safely.\n     - This is essential when interacting with child entities or components that expose synced values.\n\n  2. **Behavior synced values**:\n     To access synced values within a behavior, use the `getBehavior` method to retrieve the behavior instance attached to an entity.\n     Example:\n     onCollide(other: Entity) {\n       if (!other.name.startsWith("Bullet")) return;\n\n       other.destroy();\n       this.healthBar.takeDamage(1);\n       if (this.healthBar.currentHealth <= 0) {\n         const player = this.entity.game.world._.Player;\n         player.getBehavior(PlayerBehavior).score += 100;\n       }\n     }\n     \n\n     - `getBehavior` retrieves the behavior instance where the synced value is defined, allowing direct access to it.\n     - Use this method for behaviors instead of `getComponent`.\n\n  **Important**:\n  - Do NOT use `getComponent` for accessing synced values. It is less efficient and not recommended.\n  - Ensure type safety by using `cast` for entity properties and `getBehavior` for behavior-specific values.\n*/\n\nexport default class PlayerSpawner extends Behavior {\n  onInitialize(): void {\n    if (!this.game.isClient()) return;\n\n    this.game.prefabs._.Player.cloneInto(this.game.world, {\n      name: "Player." + this.game.network.self,\n      transform: { position: { x: 0, y: 0 } },\n      authority: this.game.network.self,\n    });\n\n    this.game.local._.Camera.transform.scale.assign({ x: 2, y: 2 });\n  }\n}\n',
  "Detecting Collisions":
    'import {\n  Behavior,\n  Entity,\n  EntityCollision,\n  ColoredSquare,\n} from "@dreamlab/engine";\nimport HealthBar from "./health-bar.ts"; // this import is not an api, the user will have to have or create a healthbar behavior for this example.\nimport PlayerBehavior from "./player.ts"; // this import is not an api, the user will have to have or create a player behavior for this example.\n\n/*\n  Handling Collisions in Game Entities:\n\n  The `EntityCollision` signal in "@dreamlab/engine"\n  helps detect when two entities collide. This signal provides details like whether the collision\n  has just started and the other entity involved.\n\n  Key Points:\n  - **Listening for Collisions:** Use the `listen` method to react to collision events.\n  - **Collision Filtering:** Handle collisions only with specific entities by checking their properties.\n  - **Responding to Collisions:** For example, decrease health or destroy an entity when a collision occurs.\n\n  Below is an `EnemyBehavior` that reduces health when hit by a bullet and increases the player\'s score if the enemy is destroyed.\n*/\n\nexport default class EnemyBehavior extends Behavior {\n  private healthBar!: HealthBar;\n\n  onInitialize(): void {\n    const health = Math.floor(Math.random() * 3) + 3;\n    this.healthBar = this.entity.addBehavior({\n      type: HealthBar,\n      values: { maxHealth: health, currentHealth: health },\n    });\n\n    // Listen for collision event\n    // EntityCollision only has: (public started: boolean, public other: Entity)\n    this.listen(this.entity, EntityCollision, (e: EntityCollision) => {\n      if (e.started) this.onCollide(e.other);\n    });\n  }\n\n  // Example of collision usage. We only want this entity to collide with the "Bullet" entity\n  onCollide(other: Entity) {\n    if (!other.name.startsWith("Bullet")) return;\n\n    other.destroy();\n    this.healthBar.takeDamage(1);\n    if (this.healthBar.currentHealth <= 0) {\n      const player = this.entity.game.world._.Player;\n      player.getBehavior(PlayerBehavior).score += 100;\n    }\n  }\n\n  // Another example of collision, in this example we change the color of its children ColoredSquare. This also works for ColoredPolygon\n  // private onCollide(e: EntityCollision): void {\n  //   // change wall color to balls color\n  //   const wallSolidColor = e.other._.ColoredSquare;\n  //   wallSolidColor.cast(ColoredSquare).color =\n  //     this.entity._.ColoredSquare.cast(ColoredSquare).color;\n  // }\n}\n',
  "Handling Values":
    'import {\n  Behavior,\n  Vector2,\n  Vector2Adapter,\n  syncedValue,\n} from "@dreamlab/engine";\n\n/*\n  Handling Values in Behaviors:\n\n  In "@dreamlab/engine", values within behaviors are critical for maintaining and synchronizing\n  the state across the network. Values can represent anything from simple properties like speed\n  or health to more complex game states.\n\n  Key Points:\n  - **Defining Values:**\n    Values are defined using the `defineValues` decorator, which binds a property\n    to the behavior, ensuring it is properly managed and optionally synchronized across the network.\n\n  - **Value Synchronization:**\n    By default, values are local to the behavior, but they can be set to replicate across\n    the network by configuring the `opts.replicated` option when defining a value.\n\n  - **Accessing Values:**\n    Once defined, values can be accessed and modified like any other property. However,\n    they are wrapped in a `Value` object that manages synchronization, type checking,\n    and default values.\n\n  - **Using Adapters for Complex Values:**\n    If your synced value requires additional processing or conversion, you must use an adapter.\n    Below are examples of adapters and their usage:\n\n    - **Vector2Adapter:** For vector data, like positions or velocities.\n      @syncedValue(Vector2Adapter)\n      velocity = Vector2.ZERO;\n      \n\n    - **TextureAdapter:** For textures that need preloading.\n      @syncedValue(TextureAdapter)\n      texture = "path/to/texture.png";\n      \n\n    - **SpritesheetAdapter:** For spritesheets requiring preloading.\n      @syncedValue(SpritesheetAdapter)\n      spritesheet = "path/to/spritesheet.json";\n      \n\n    - **ObjectAdapter:** For synchronizing plain objects with mutation detection.\n      @syncedValue(ObjectAdapter)\n      config = { key: "value" };\n      \n\n    - **EntityByRefAdapter:** For referencing game entities.\n      @syncedValue(EntityByRefAdapter)\n      targetEntity = undefined;\n      \n\n    - **ColorAdapter:** For color values.\n      @syncedValue(ColorAdapter)\n      color = "#FFFFFF";\n      \n\n    - **AudioAdapter:** For preloading audio resources.\n      @syncedValue(AudioAdapter)\n      audio = "path/to/sound.mp3";\n      \n\n  Below is an example demonstrating how to define and use values within a behavior.\n*/\n\nexport default class PlayerMovement extends Behavior {\n  /*\n    Define a synced value for the player\'s speed\n    - The `defineValues` method is used to specify which properties should be treated as values.\n    - Once defined, `speed` will be managed by the internal value system, allowing it to be\n      synchronized across the network if needed.\n  */\n  @syncedValue()\n  speed = 5.0;\n\n  /*\n    Define a synced value for velocity using the Vector2Adapter\n    - This ensures that the `velocity` property can handle vector data correctly\n      and synchronize it across the network if needed.\n  */\n  @syncedValue(Vector2Adapter)\n  velocity = Vector2.ZERO;\n\n  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");\n  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");\n  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");\n  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");\n  #boost = this.inputs.create("@movement/boost", "Speed Boost", "ShiftLeft");\n\n  onTick(): void {\n    // Ensure that only the entity\'s owner can control it\n    if (this.hasAuthority()) return;\n\n    const movement = new Vector2(0, 0);\n\n    if (this.#up.held) movement.y += 1;\n    if (this.#down.held) movement.y -= 1;\n    if (this.#right.held) movement.x += 1;\n    if (this.#left.held) movement.x -= 1;\n\n    // Adjust speed if boost is held\n    let currentSpeed = this.speed;\n    if (this.#boost.held) currentSpeed *= 2;\n\n    const velocity = movement\n      .normalize()\n      .mul((this.game.physics.tickDelta / 100) * currentSpeed);\n\n    this.entity.transform.position =\n      this.entity.transform.position.add(velocity);\n  }\n}\n',
  "Message Channels and Key Value Database":
    'import { Behavior, ClickableEntity, MouseDown, Sprite } from "@dreamlab/engine";\n\n/*\n  Custom Messages and Synced Values:\n\n  In multiplayer game development, behaviors often need to communicate with each other to maintain\n  consistency across the network. This can be achieved using custom messages or synced values.\n\n  Key Points:\n  - **Custom Messages:**\n    Custom messages are event-driven and useful for sending specific data or triggering actions\n    between behaviors. These messages are handled explicitly in the code, providing flexibility\n    for dynamic interactions.\n\n  - **Synced Values:**\n    Synced values automatically synchronize data between the server and clients. They are ideal\n    for maintaining shared states like scores, health, or leaderboard information. Using synced\n    values reduces the complexity of managing data consistency manually.\n\n  - **When to Use:**\n    Use custom messages for one-time events or interactions, such as button clicks or attacks.\n    Use synced values for persistent or frequently updated data that needs to remain consistent\n    across the network.\n*/\n\nexport default class ClickableColorChanger extends Behavior {\n  #clickable: ClickableEntity;\n  private isClicked = false;\n  private effectTimer = 0;\n  private originalScale = { x: 1, y: 1 };\n\n  onInitialize(): void {\n    this.#clickable = this.entity.cast(ClickableEntity);\n\n    this.listen(this.#clickable, MouseDown, ({ button }) => {\n      if (button !== "left") return;\n\n      const player = this.game.network.connections.find(\n        (conn) => conn.id === this.game.network.self\n      );\n\n      if (!player) return;\n\n      this.game.network.sendCustomMessage("server", "@cookie/click", {\n        playerId: player.playerId,\n        nickname: player.nickname || "Unknown",\n      });\n\n      if (!this.isClicked) this.startClickEffect();\n    });\n  }\n\n  private startClickEffect(): void {\n    const sprite = this.entity._.Sprite.cast(Sprite);\n    if (!sprite) return;\n\n    this.isClicked = true;\n    this.effectTimer = 150;\n\n    this.originalScale = this.entity.transform.scale;\n    sprite.alpha = 0.5;\n    this.entity.transform.scale = {\n      x: this.originalScale.x * 0.8,\n      y: this.originalScale.y * 0.8,\n    };\n  }\n\n  onTick(): void {\n    if (this.isClicked) {\n      const sprite = this.entity._.Sprite.cast(Sprite);\n      if (!sprite) return;\n\n      this.effectTimer -= this.time.delta;\n      if (this.effectTimer <= 0) {\n        sprite.alpha = 1;\n        this.entity.transform.scale = this.originalScale;\n        this.isClicked = false;\n      }\n    }\n  }\n}\n\nimport {\n  Behavior,\n  ObjectAdapter,\n  PlayerJoined,\n  syncedValue,\n} from "@dreamlab/engine";\nimport { z } from "@dreamlab/vendor/zod.ts";\n\nexport default class GlobalStats extends Behavior {\n  @syncedValue(ObjectAdapter)\n  leaderboard: Record<string, { nickname: string; clicks: number }> = {};\n\n  @syncedValue()\n  totalClicks = 0;\n\n  private playerClicks = new Map<\n    string,\n    { nickname: string; clicks: number }\n  >();\n  private playerIds = new Set<string>();\n\n  async onInitialize() {\n    if (!this.game.isServer()) return;\n\n    const totalClicks = await this.game.kv.server.get("totalClicks");\n    if (typeof totalClicks === "number") this.totalClicks = totalClicks;\n\n    const savedPlayers = await this.game.kv.server.get("allPlayers");\n    if (Array.isArray(savedPlayers)) {\n      for (const { playerId, nickname } of savedPlayers) {\n        const storedClicks = await this.game.kv.server.get(\n          `playerClicks:${playerId}`\n        );\n        const clicks = typeof storedClicks === "number" ? storedClicks : 0;\n        this.playerClicks.set(playerId, { nickname, clicks });\n        this.playerIds.add(playerId);\n      }\n    }\n\n    this.updateLeaderboard();\n\n    this.listen(this.game, PlayerJoined, async (player) => {\n      if (!this.game.isServer()) return;\n\n      const playerId = player.connection.playerId;\n      const nickname = player.connection.nickname || "Unknown";\n\n      if (!this.playerIds.has(playerId)) {\n        this.playerIds.add(playerId);\n        await this.persistPlayer(playerId, nickname);\n      }\n\n      const storedClicks = await this.game.kv.server.get(\n        `playerClicks:${playerId}`\n      );\n      const clicks = typeof storedClicks === "number" ? storedClicks : 0;\n\n      this.playerClicks.set(playerId, { nickname, clicks });\n      this.updateLeaderboard();\n    });\n\n    this.game.network.onReceiveCustomMessage((from, channel, data) => {\n      if (channel !== "@cookie/click" || !this.game.isServer()) return;\n\n      const ClickSchema = z.object({\n        playerId: z.string(),\n        nickname: z.string(),\n      });\n      const packet = ClickSchema.safeParse(data);\n      if (!packet.success) return;\n\n      const { playerId, nickname } = packet.data;\n\n      this.totalClicks += 1;\n      this.game.kv.server.set("totalClicks", this.totalClicks);\n\n      const playerData = this.playerClicks.get(playerId) || {\n        nickname,\n        clicks: 0,\n      };\n      playerData.clicks += 1;\n      this.playerClicks.set(playerId, playerData);\n\n      this.game.kv.server.set(`playerClicks:${playerId}`, playerData.clicks);\n      this.persistPlayer(playerId, nickname);\n\n      this.updateLeaderboard();\n    });\n  }\n\n  private async persistPlayer(playerId: string, nickname: string) {\n    if (!this.game.isServer()) return;\n\n    const allPlayersRaw = await this.game.kv.server.get("allPlayers");\n    const allPlayers = Array.isArray(allPlayersRaw) ? allPlayersRaw : [];\n\n    const updatedPlayers = [\n      ...allPlayers.filter(\n        (player) => typeof player === "object" && player.playerId !== playerId\n      ),\n      { playerId, nickname },\n    ];\n\n    await this.game.kv.server.set("allPlayers", updatedPlayers);\n  }\n\n  private updateLeaderboard() {\n    this.leaderboard = Object.fromEntries(this.playerClicks.entries());\n  }\n}\n',
  "Handling Transforms":
    '// Example of changing an entities position through a behavior. This one is more basic.\nimport { Behavior, Vector2, syncedValue } from "@dreamlab/engine";\n\n/*\n  Key Points:\n  - **Basic Movement:** Calculate the new position by adding a direction vector to the current position.\n  - **Transform Properties:** Use properties like `position`, `rotation`, and `scale` to control entity movement and appearance.\n\n  This example moves an asteroid in a random direction at a constant speed.\n*/\nexport default class AsteroidMovement extends Behavior {\n  readonly #direction = new Vector2(\n    Math.random() * 2 - 1,\n    Math.random() * 2 - 1\n  ).normalize();\n\n  @syncedValue()\n  speed = 0.2;\n\n  /*\n  Properties available under entity.transform are:\n  - scale.x, scale.y\n  - position.x, position.y\n  - entity.transform.z (used for zIndex ordering)\n  - entity.transform.rotation (radians)\n  */\n\n  onTick(): void {\n    this.entity.transform.position = this.entity.transform.position.add(\n      this.#direction.mul((this.time.delta / 100) * this.speed)\n    );\n  }\n}\n\n// Example of moving an entity based on another entities position. A more advanced example\nimport { Behavior, Collider, Sprite } from "@dreamlab/engine";\nimport BulletBehavior from "./bullet.ts"; // this import is not an api, the user will have to make this behavior for this example\n\nexport default class EnemyMovement extends Behavior {\n  speed = Math.random() * 0.5 + 0.5;\n  minDistance = 5;\n  shootDistance = 10;\n  lastShootTime = 0;\n  shootCooldown = Math.random() * 2000 + 1000;\n\n  onTick(): void {\n    // Find the player entity\n    const player = this.entity.game.world.children.get("Player");\n    const playerPos = player?.globalTransform.position;\n    if (!playerPos) return;\n\n    const direction = playerPos.sub(this.entity.transform.position).normalize();\n    const distance = playerPos.sub(this.entity.transform.position).magnitude();\n\n    // In this example we only move the entity towards the player if they are outside a certain distance\n    if (distance > this.minDistance + 5) {\n      let speedFactor = 1;\n      if (distance < this.minDistance + 10) {\n        speedFactor = (distance - this.minDistance) / 10;\n      }\n      this.entity.transform.position = this.entity.transform.position.add(\n        direction.mul((this.time.delta / 100) * this.speed * speedFactor)\n      );\n    }\n\n    // Adjust rotation of entity so its facing the correct direction\n    const rotation = Math.atan2(direction.y, direction.x);\n    this.entity.transform.rotation = rotation - Math.PI / 2;\n\n    if (distance <= this.shootDistance) {\n      const now = Date.now();\n      if (now - this.lastShootTime > this.shootCooldown) {\n        this.lastShootTime = now;\n        this.shootAtPlayer();\n      }\n    }\n  }\n\n  shootAtPlayer(): void {\n    const rotation = this.entity.transform.rotation + Math.PI / 2;\n\n    this.entity.game.world.spawn({\n      type: Collider,\n      name: "EnemyBullet",\n      transform: {\n        position: this.entity.transform.position.clone(),\n        rotation,\n        scale: { x: 0.25, y: 0.25 },\n      },\n      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n      children: [\n        {\n          type: Sprite,\n          name: "BulletSprite",\n          transform: {\n            scale: { x: 0.75, y: 0.75 },\n          },\n        },\n      ],\n    });\n  }\n}\n',
  "Spawning Entities":
    'import { Behavior, Collider, Sprite } from "@dreamlab/engine";\nimport BulletBehavior from "./bullet.ts"; // this import is not an API, the user will need to make this behavior\n\n/*\n  Spawning Entities Overview:\n\n  There are multiple ways to spawn entities in the game using the "@dreamlab/engine" package.\n  Each method is suitable for different scenarios, depending on your needs.\n\n  1. **Cloning a Prefab:**\n     - This method is ideal for spawning predefined entities, such as players or enemies, that have been set up as prefabs.\n     - You can clone a prefab into the world and customize its properties (e.g., name, position, authority).\n\n     Example:\n     this.game.prefabs._.Player.cloneInto(this.game.world, {\n       name: "Player." + this.game.network.self,\n       transform: { position: { x: 0, y: 0 } },\n       authority: this.game.network.self,\n     });\n\n\n  2. **Spawning from Scratch:**\n     - For more complex entities that may not have a predefined prefab, you can spawn them directly by defining their components and behaviors in the spawn call.\n     - This method allows you to create fully customized entities on the fly.\n\n     Example:\n     this.entity.game.world.spawn({\n       type: RectCollider,\n       name: "EnemyBullet",\n       transform: {\n         position: this.entity.transform.position.clone(),\n         rotation,\n         scale: { x: 0.25, y: 0.25 },\n       },\n       behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n       children: [\n         {\n           type: Sprite,\n           name: "BulletSprite",\n           transform: {\n             scale: { x: 0.75, y: 0.75 },\n           },\n         },\n       ],\n     });\n\n*/\n\nexport default class PlayerSpawner extends Behavior {\n  onInitialize(): void {\n    // Cloning a prefab to spawn a player entity.\n    if (!this.game.isClient()) return;\n\n    this.game.prefabs._.Player.cloneInto(this.game.world, {\n      name: "Player." + this.game.network.self,\n      transform: { position: { x: 0, y: 0 } },\n      authority: this.game.network.self,\n    });\n\n    // Modify the local camera entity\'s scale after spawning the player.\n    this.game.local._.Camera.transform.scale.assign({ x: 2, y: 2 });\n  }\n}\n\nexport default class EnemyMovement extends Behavior {\n  speed = Math.random() * 0.5 + 0.5;\n  minDistance = 5;\n  shootDistance = 10;\n  lastShootTime = 0;\n  shootCooldown = Math.random() * 2000 + 1000;\n\n  onTick(): void {\n    const player = this.entity.game.world.children.get("Player");\n    const playerPos = player?.globalTransform.position;\n    if (!playerPos) return;\n\n    const direction = playerPos.sub(this.entity.transform.position).normalize();\n    const distance = playerPos.sub(this.entity.transform.position).magnitude();\n\n    if (distance > this.minDistance + 5) {\n      let speedFactor = 1;\n      if (distance < this.minDistance + 10) {\n        speedFactor = (distance - this.minDistance) / 10;\n      }\n      this.entity.transform.position = this.entity.transform.position.add(\n        direction.mul((this.time.delta / 100) * this.speed * speedFactor)\n      );\n    }\n\n    const rotation = Math.atan2(direction.y, direction.x);\n    this.entity.transform.rotation = rotation - Math.PI / 2;\n\n    if (distance <= this.shootDistance) {\n      const now = Date.now();\n      if (now - this.lastShootTime > this.shootCooldown) {\n        this.lastShootTime = now;\n        this.shootAtPlayer();\n      }\n    }\n  }\n\n  shootAtPlayer(): void {\n    const rotation = this.entity.transform.rotation + Math.PI / 2;\n\n    // Spawning a bullet entity with custom transform, behaviors, and children entities\n    this.entity.game.world.spawn({\n      type: Collider,\n      name: "EnemyBullet",\n      transform: {\n        position: this.entity.transform.position.clone(),\n        rotation,\n        scale: { x: 0.25, y: 0.25 },\n      },\n      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n      children: [\n        {\n          type: Sprite,\n          name: "BulletSprite",\n          transform: {\n            scale: { x: 0.75, y: 0.75 },\n          },\n        },\n      ],\n    });\n  }\n}\n',
  "Vector2 API":
    '// Vector2 is a common class in Dreamlab\nimport { Vector2, IVector2 } from "@dreamlab/engine";\n\n// example use\nconst v: IVector2 = {x:0, y:0}\nconst myVector: Vector2 = new Vector2(v)\n\n\ninterface IVector2 {\n  x: number;\n  y: number;\n}\n\n// It has the following methods.\nclass Vector2 {\n  // Constants\n  static ZERO: Vector2    // (0, 0)\n  static ONE: Vector2     // (1, 1) \n  static NEG_ONE: Vector2 // (-1, -1)\n  static X: Vector2       // (1, 0)\n  static Y: Vector2       // (0, 1)\n  static NEG_X: Vector2   // (-1, 0)\n  static NEG_Y: Vector2   // (0, -1)\n\n  // Properties\n  x: number\n  y: number\n\n  // Constructors\n  constructor(x: number, y: number)\n  constructor(vector: IVector2)\n  \n  // Static Methods\n  static splat(value: number): Vector2                    // Creates vector with all elements set to value\n  static eq(a: IVector2, b: IVector2): boolean           // Compare equality\n  static abs(vector: IVector2): Vector2                  // Absolute values\n  static neg(vector: IVector2): Vector2                  // Negate values\n  static inverse(vector: IVector2): Vector2              // 1/value for each component\n  static add(a: IVector2, b: IVector2): Vector2         // Add vectors\n  static sub(a: IVector2, b: IVector2): Vector2         // Subtract vectors\n  static mul(a: IVector2, b: IVector2|number): Vector2  // Multiply by vector or scalar\n  static div(a: IVector2, b: IVector2|number): Vector2  // Divide by vector or scalar\n  static magnitude(vector: IVector2): number            // Length of vector\n  static magnitudeSquared(vector: IVector2): number     // Squared length\n  static normalize(vector: IVector2): Vector2           // Convert to unit vector\n  static lookAt(vector: IVector2, target: IVector2): number  // Get angle to target\n  static lerp(a: IVector2, b: IVector2, t: number): Vector2 // Linear interpolation\n  static smoothLerp(current: IVector2, target: IVector2, decay: number, deltaTime: number, epsilon?: number): Vector2\n  static distance(a: IVector2, b: IVector2): number     // Distance between vectors\n  static distanceSquared(a: IVector2, b: IVector2): number  // Squared distance\n  static max(a: IVector2, b: IVector2): Vector2        // Component-wise maximum\n  static min(a: IVector2, b: IVector2): Vector2        // Component-wise minimum\n  static rotate(vector: IVector2, angle: number): Vector2    // Rotate vector\n  static rotateAbout(vector: IVector2, angle: number, point: IVector2): Vector2  // Rotate around point\n  static dot(a: IVector2, b: IVector2): number         // Dot product\n\n  // Instance Methods\n  clone(): Vector2                    // Create copy\n  bare(): IVector2                    // Get raw x,y object\n  assign(value: Partial<IVector2>): boolean  // Update components\n  eq(other: IVector2): boolean\n  abs(): Vector2\n  neg(): Vector2\n  inverse(): Vector2\n  add(other: IVector2): Vector2\n  sub(other: IVector2): Vector2\n  mul(other: IVector2|number): Vector2\n  div(other: IVector2|number): Vector2\n  magnitude(): number\n  magnitudeSquared(): number\n  normalize(): Vector2\n  lookAt(target: IVector2): number\n  distance(other: IVector2): number\n  distanceSquared(other: IVector2): number\n  max(other: IVector2): Vector2\n  min(other: IVector2): Vector2\n  rotate(angle: number): Vector2\n  rotateAbout(angle: number, point: IVector2): Vector2\n  dot(other: IVector2): number\n}',
  "Character Controller":
    '// This is an example of how to implement a platformer controller using the CharacterController\nimport {\n  Behavior,\n  CharacterController,\n  RichText,\n  Vector2,\n  syncedValue,\n} from "@dreamlab/engine";\n\n// A very simple platformer controller\n\nexport default class PlayerController extends Behavior {\n  #controller = this.entity.cast(CharacterController);\n\n  @syncedValue() speed = 10;\n  @syncedValue() jumpForce = 20;\n  @syncedValue() jumpAcceleration = 40;\n  @syncedValue() gravity = 90;\n  @syncedValue() maxJumpTime = 1; // Maximum duration the jump key affects the jump\n\n  @syncedValue() points = 0;\n\n  #verticalVelocity = 0;\n  #jumpTimeCounter = 0;\n\n  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");\n  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");\n  #jump = this.inputs.create("@movement/jump", "Jump", "Space");\n\n  onInitializeClient() {\n    if (!this.hasAuthority()) return;\n    this.values.get("points")?.onChanged((newPoints: number) => {\n      this.game.local!._.CoinCounter.cast(RichText).text = "Coins: " + newPoints;\n    });\n  }\n\n  onTickClient(): void {\n    if (!this.hasAuthority()) return;\n\n    const deltaTime = this.game.physics.tickDelta / 1_000; // Convert to seconds\n\n    let horizontalInput = 0;\n    if (this.#right.held) horizontalInput += 1;\n    if (this.#left.held) horizontalInput -= 1;\n\n    const horizontalVelocity = horizontalInput * this.speed;\n\n    // Jumping logic\n    if (this.#jump.pressed && this.#controller.isGrounded) {\n      this.#verticalVelocity = this.jumpForce;\n      this.#jumpTimeCounter = 0;\n    }\n\n    if (this.#jump.held && this.#jumpTimeCounter < this.maxJumpTime) {\n      // Apply upward acceleration while the jump key is held\n      this.#verticalVelocity += this.jumpAcceleration * deltaTime;\n      this.#jumpTimeCounter += deltaTime;\n    }\n\n    // Create movement vector\n    const movement = new Vector2(\n      horizontalVelocity * deltaTime,\n      this.#verticalVelocity * deltaTime,\n    );\n\n    if (!this.#controller.isGrounded) this.#verticalVelocity -= this.gravity * deltaTime;\n\n    this.entity.pos = this.entity.pos.add(movement);\n  }\n}\n',
  "User Interfaces":
    'import { Behavior, UILayer, syncedValue } from "@dreamlab/engine";\nimport { element } from "@dreamlab/ui";\n\n/*\n  UI System Overview:\n\n  The UI system in this project allows you to create and manage user interface elements\n  dynamically within the game using the `element` method from the "@dreamlab/ui" package.\n\n  - **Creating Elements:**\n    You can create HTML elements by calling the `element` function, which takes the\n    element\'s tag name, an object with properties/attributes, and an array of child elements or text.\n\n  - **Appending to the UI Layer:**\n    Once created, elements are appended to the UI layer of an entity, making them visible\n    in the game\'s UI. This is typically done by accessing the `UILayer` component\n    of the current entity and using `appendChild` to add elements.\n\n  - **Event Handling:**\n    You can attach event listeners to UI elements, such as buttons, to handle user interactions.\n    This allows you to create responsive and interactive UIs within the game.\n\n  - **Example Usage:**\n    In the example below, a "Death Screen" UI is created, which displays a game over message,\n    the player\'s final score, and a button to respawn the player. The UI is dynamically created\n    when the player dies and removed when they respawn.\n\n    - The `element` method is used to create the UI elements.\n    - CSS styling is applied by creating a `<style>` element.\n    - The UI is integrated into the game\'s UI layer, ensuring it appears on the screen.\n\n  - **Best Practices:**\n    - Ensure to clean up any UI elements when they are no longer needed to avoid memory leaks.\n    - Use descriptive IDs and class names to maintain clarity in your UI components.\n    - Keep UI logic modular by separating the creation and management of UI elements into different methods.\n\n  Below is an example implementation of a death screen using this UI system.\n*/\n\nexport default class DeathScreen extends Behavior {\n  // Reference to the UI layer associated with the entity\n  #ui = this.entity.cast(UILayer);\n  #element!: HTMLDivElement;\n\n  @syncedValue()\n  score = 0;\n\n  onInitialize() {\n    // CSS for the death screen UI element\n    const css = `\n    #death-screen {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      color: white;\n      background: rgb(0 0 0 / 85%);\n      font-family: "Inter", sans-serif;\n    }\n\n    h1 {\n      font-size: 3rem;\n      font-weight: bold;\n      margin-bottom: 0;\n    }\n\n    p {\n      font-size: 1.5rem;\n      margin-bottom: 1rem;\n    }\n\n    button {\n      padding: 1rem 2rem;\n      font-size: 1.5rem;\n      cursor: pointer;\n      border: none;\n      border-radius: 0.4rem;\n      color: white;\n      background-color: #ff6600;\n      transition: background-color 0.3s ease;\n    }\n\n    button:hover {\n      background-color: #e65c00;\n    }\n    `;\n\n    // Create a <style> element and add the CSS to it\n    const style = element("style", { textContent: css });\n    this.#ui.dom.appendChild(style);\n\n    // Create a "Respawn" button using the new `element` method\n    const button = element("button", { type: "button" }, ["Respawn"]);\n    button.addEventListener("click", () => this.#respawnPlayer());\n\n    // Create the main death screen UI container\n    this.#element = element(\n      "div",\n      {\n        id: "death-screen", // Set the ID for the main container\n      },\n      [\n        // Add an <h1> element for the "Game Over" title\n        element("h1", { className: "example-classname" }, ["Game Over"]),\n\n        // Add a <p> element to display the player\'s final score\n        element("p", {}, [`Final Score: ${this.score.toLocaleString()}`]),\n\n        // Add the "Respawn" button created earlier\n        button,\n      ]\n    );\n\n    // Append the death screen UI container to the UI layer\n    this.#ui.element.appendChild(this.#element);\n  }\n\n  #respawnPlayer() {\n    // spawnPlayer(this.game)\n\n    // Destroy the current entity, removing the death screen from the UI\n    this.entity.destroy();\n  }\n}\n',
  "Interacting with Behaviors":
    'import {\n  Behavior,\n  Entity,\n  EntityCollision,\n  ColoredSquare,\n} from "@dreamlab/engine";\nimport PlayerBehavior from "./player.ts"; // this import is not an api, the user will have to have or create a player behavior for this example.\n\n/*\n  Example: Using `getBehavior()` to Access Behaviors\n\n  The `getBehavior()` method allows you to retrieve an existing behavior attached to an entity.\n  This is particularly useful when you need to interact with or update a behavior that has already been set up,\n  such as a health bar or UI component, without needing to instantiate it again.\n\n  In this example, `getBehavior()` is used to update the player\'s score when an asteroid is destroyed,\n  as well as to interact with the asteroid\'s health bar.\n\n  Accessing entity children:\n  Use `this.entity._.ChildName` to access a child entity directly. \n  For example: `this.entity._.ColoredSquare` will work if the entity has a child named \'ColoredSquare\'.\n\n  If the child\'s name contains a space, use bracket notation: `this.entity._["My_Entity"]`.\n\n  You can also access children of children by chaining: \n  `this.entity.myChild.myOtherChild`.\n\n  Important: \n  Do NOT use `this.entity.children.find(child => child.name === "ChildName")` as it is inefficient and unnecessary. \n  The `children` property provides a `ReadonlyMap` for reference but should not be used for lookups.\n\n  Benefits of `getBehavior()`:\n  - Prevents duplication of behavior instances.\n  - Allows direct access to existing behaviors for updates or interactions.\n  - Ensures that only one instance of the behavior is manipulated, maintaining consistency.\n*/\n\nexport default class AsteroidBehavior extends Behavior {\n  onInitialize(): void {\n    this.listen(this.entity, EntityCollision, (e) => {\n      if (e.started) this.onCollide(e.other);\n    });\n  }\n\n  onCollide(other: Entity) {\n    if (!other.name.startsWith("Bullet")) return;\n    other.destroy();\n\n    // Retrieve the HealthBar behavior for this entity\n    const healthBar = this.entity.getBehavior(HealthBar);\n\n    // Reduce the asteroid\'s health by 1\n    healthBar.takeDamage(1);\n\n    // If health reaches zero, update the player\'s score and destroy the asteroid\n    if (healthBar.currentHealth <= 0) {\n      const player = this.game.world._.Player;\n\n      // Use getBehavior to access the PlayerBehavior and update the score\n      player.getBehavior(PlayerBehavior).score += 50;\n\n      // Destroy the asteroid entity (healthBar destruction is handled by takeDamage)\n      this.entity.destroy();\n    }\n  }\n}\n\n// Health bar behavior for reference\nimport {\n  GamePostTick,\n  Sprite,\n  Vector2,\n  syncedValue,\n} from "@dreamlab/engine";\n\nexport default class HealthBar extends Behavior {\n  @syncedValue()\n  maxHealth = 100;\n\n  @syncedValue()\n  currentHealth = 100;\n\n  healthBarEntity!: Entity;\n\n  onInitialize(): void {\n    this.healthBarEntity = this.game.world.spawn({\n      type: Sprite,\n      name: "HealthBar",\n      transform: { position: { x: 0, y: 1, }, scale: { x: 1, y: 0.1 } },\n      values: { texture: "res://assets/healthbar.png" },\n    });\n\n    this.game.on(GamePostTick, () => {\n      this.healthBarEntity.pos = this.entity.pos.add(new Vector2(0, 1));\n      this.updateHealthBar();\n    });\n  }\n\n  updateHealthBar(): void {\n    const healthRatio = this.currentHealth / this.maxHealth;\n    this.healthBarEntity.transform.scale.x = healthRatio;\n  }\n\n  takeDamage(damage: number): void {\n    this.currentHealth -= damage;\n    if (this.currentHealth <= 0) {\n      this.currentHealth = 0;\n      this.entity.destroy();\n      this.healthBarEntity.destroy();\n      this.spawnExplosionPieces();\n    }\n\n    this.updateHealthBar();\n  }\n\n  spawnExplosionPieces(): void {\n    const pieceCount = Math.random() * 5 + 3;\n    const pieceSize = { x: 0.15, y: 0.15 };\n\n    for (let i = 0; i < pieceCount; i++) {\n      this.entity.game.world.spawn({\n        type: Sprite,\n        name: "ExplosionPiece",\n        transform: {\n          position: this.entity.transform.position.clone(),\n          scale: pieceSize,\n        },\n        behaviors: [],\n        children: [\n          {\n            type: Sprite,\n            name: "PieceSprite",\n            values: { texture: "res://assets/asteroid.png" },\n          },\n        ],\n      });\n    }\n  }\n}\n',
  "Basic Structure":
    'import {\n  Behavior,\n  Vector2,\n  Vector2Adapter,\n  syncedValue,\n  ColoredSquare,\n} from "@dreamlab/engine";\n/*\n  In "@dreamlab/engine", a `Behavior` represents a modular piece of logic that can be attached to an entity.\n  This allows you to encapsulate functionality, such as movement, health management, or AI, in reusable components.\n\n  Key Components:\n  - **Lifecycle Methods:**\n    - `onInitialize`: Called once when the behavior is first attached to an entity, used for setup tasks.\n    - `onTick`: Called on every game tick, ideal for updating logic like movement or state changes.\n    - `onPreTick`, `onPostTick`, `onFrame`: Additional lifecycle hooks for more granular control over update timing.\n\n  - **Values:** Behaviors can have properties (values) that are synchronized across the network or exposed to\n    an inspector GUI. These values are defined using `defineValue` or `defineValues` methods and can be of various\n    types, including primitives and complex types with adapters.\n\n  - **Signals:** Behaviors can listen for signals (events) from the game or other entities and respond accordingly.\n    This is done using the `listen` method for subscribing to signals, and `fire` to emit them.\n\n  - **Destruction:** Behaviors can be destroyed manually using `destroy()` or automatically via the entity lifecycle.\n    This cleanup process ensures all listeners and values are properly disposed of.\n\n  The `Behavior` class is highly flexible, supporting complex game mechanics through a combination of values, signals,\n  and lifecycle hooks. It serves as the foundation for defining how entities behave in the game world.\n\n  Accessing entity children:\n  Use `this.entity._.ChildName` to access a child entity directly. \n  For example: `this.entity._.ColoredSquare` will work if the entity has a child named \'ColoredSquare\'.\n\n  If the child\'s name contains a space, use bracket notation: `this.entity._["My_Entity"]`.\n\n  You can also access children of children by chaining: \n  `this.entity.myChild.myOtherChild`.\n\n  Important: \n  Do NOT use `this.entity.children.find(child => child.name === "ChildName")` as it is inefficient and unnecessary. \n  The `children` property provides a `ReadonlyMap` for reference but should not be used for lookups.\n\n  Important Notes:\n  - **Do Not Use Renderer for Game Screen Dimensions:**\n    The game screen is defined by the camera(s) in the game scene, not by the renderer or app.\n    Attempting to access `this.game.renderer.app.screen.width` or `this.game.renderer.app.screen.height` is incorrect.\n    To limit game space or define boundaries, use colliders (e.g., walls) in the world.\n    Avoid relying on renderer properties as they do not exist on `game` and are unrelated to defining game space.\n\n*/\n\n// example Behavior that allows for WASD movement as well as a pattern for firing projectiles.\n// this serves as an example for the general structure of a behavior\nexport default class Movement extends Behavior {\n  // the speed of the player\n  @syncedValue()\n  speed = 5.0;\n\n  // example value\n  @syncedValue()\n  anotherValue = 42.0;\n\n  // the current velocity of the player\n  @syncedValue(Vector2Adapter)\n  velocity = Vector2.ZERO;\n\n  // Input bindings for movement\n  // (method) Inputs.create(name: string, label: string, defaultBinding: Input): Action\n  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");\n  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");\n  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");\n  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");\n\n  onInitialize(): void {\n    // if you want to disable/enable an entity (useful for hiding and showing things), simply use\n    this.entity.enabled = false;\n  }\n\n  onTick(): void {\n    const movement = new Vector2(0, 0);\n    const currentSpeed = this.speed;\n\n    if (this.#up.held) movement.y += 1;\n    if (this.#down.held) movement.y -= 1;\n    if (this.#right.held) movement.x += 1;\n    if (this.#left.held) movement.x -= 1;\n\n    this.velocity = movement\n      .normalize()\n      .mul((this.game.physics.tickDelta / 100) * currentSpeed);\n\n    const newPosition = this.entity.transform.position.add(this.velocity);\n  }\n}\n',
};
export const available_topics = `Detecting Collisions - Running code when one entity collides with another
Handling Input - Handling user input, keypresses and mouse input
Handling Transforms - Moving, scaling, and rotating objects
Handling Values - Updating the public variables associated with behaviors. These should be used to store state that can be inspected in the editor.
Interacting with Behaviors - Fetching other behaviors attached to an entity.
Looking Up and Referencing Entities - Getting entities by ID or keeping track of entities associated with a behavior.
Vector2 API - Essential vector operations like addition, subtraction, and normalization using Vector2.
User Interfaces - Creating GUIs (HUDs, health bars, etc)
Spawning Entities - Spawning new entities into the world and attaching behaviors.
Character Controller - Using the built-in character controller which handles collision detection. Great for any movement style.
Basic Structure - Behavior classes are used to implement all game functionality.
Message Channels and Key Value Database - Facilitating communication between behaviors using custom messages and synced values to synchronize state or trigger actions.`;

export const entityTypes = [
  "Sprite",
  "AnimatedSprite",
  "TilingSprite",
  "SolidColor",
  "ColoredPolygon",
  "ColoredSquare",
  "VectorSprite",
  "Clickable",
  "Collider",
  "Empty",
  "Camera",
  "AudioSource",
  "BoxResize",
  "Gizmo",
  "RawPixi",
  "UILayer",
  "UIPanel",
  "Text",
];

const topicList = available_topics
  .split("\n")
  .map(topic => topic.split(" - ")[0])
  .filter(e => {
    return e !== "";
  });

const fileKeys = Object.keys(fileContents).filter(e => {
  return e !== "" && e !== "_basic-structure";
});

topicList.forEach(key => {
  if (!fileKeys.includes(key)) {
    console.warn(`Warning: Missing key in fileContents: ${key}`);
  }
});

fileKeys.forEach(key => {
  if (!topicList.includes(key)) {
    console.warn(`Warning: Extra key in fileContents: ${key}`);
  }
});

export const summarize = `You will be provided with a TypeScript source file from a game engine. Your task is to analyze this file and produce a concise summary of its functionality and how it works. This summary will be used to determine whether the file is relevant for implementing specific use cases in the game.

You are part of an AI agent which helps a user create a game. Your summaries will be used to give the agent context about the codebase.

Here is the TypeScript file content:

<typescript_file>
{{TYPESCRIPT_FILE}}
</typescript_file>

Analyze the file carefully, focusing on the following aspects:
1. The main purpose of the file
2. Key classes, functions, or methods defined
3. Important game engine-specific concepts or features utilized
4. Any notable algorithms or patterns implemented
5. How this file might interact with other parts of the game engine

When summarizing the file's functionality, keep in mind:
- The summary is for an AI agent that already understands the structure of Behavior classes and the general context of a game engine.
- Focus on the core functionality and avoid redundant information about basic game engine concepts.
- Only talk about what the file specifically does. Do not include generic information or speculate.
- Highlight any unique or specialized features implemented in this file.
- Keep the summary concise but informative, aiming for 2-3 sentences.

Provide your summary in a single <summary> tag. The summary should be clear, concise, and focused on how this file contributes to the game's functionality. Do not start with "this file" as it becomes very redundant in a list.`;

export const plan = `<examples>
<example>
<PREFAB_TREE>
...
</PREFAB_TREE>
<SOURCE_TREE>
- src/
    - player.ts
</SOURCE_TREE>
<USER_REQUEST>
add a jump pad that springs the player up
</USER_REQUEST>
<ideal_output>
<analysis>
Task breakdown:
1. Create a new script for the jump pad functionality
2. Create a new prefab for the jump pad

Relevant files and prefabs:
- src/player.ts (existing file, for reference on player controller)
- New file: src/jump-pad.ts
- New prefab: JumpPad

Potential challenges:
- Ensuring proper interaction between the jump pad and the player
- Balancing the jump force for good gameplay

Implementation strategy:
1. Create a new script (jump-pad.ts) to handle the jump pad logic
2. Create a new prefab (JumpPad) using the Collider entity type
3. Attach the jump-pad script to the JumpPad prefab
4. Add a visual representation as a child of the JumpPad prefab

Considering client/server ticking:
- The jump pad functionality should be implemented on the server side to ensure consistency in multiplayer scenarios and prevent cheating.
- The visual representation can be handled on the client side for better performance.
</analysis>

<plan>
[
  {
    "desc": "Create script jump-pad.ts",
    "action": "createFile",
    "target": "src/jump-pad.ts",
    "instructions": "Create a script to handle jump pad logic. Include the following:\n- @syncedValue() jumpForce: number\n- onTriggerEnter method to apply upward force to the player\n- Implement server-side ticking for consistent multiplayer behavior\n- Reference player.ts for interaction with the player controller",
    "addToContext": ["src/player.ts"]
  },
  {
    "desc": "Create prefab JumpPad",
    "action": "createPrefab",
    "definition": {
      "type": "Collider",
      "name": "JumpPad",
      "behaviors": [
        {
          "script": "src/jump-pad.ts",
          "values": {
            "jumpForce": 45
          }
        }
      ],
      "transform": { "scale": {"x": 2, "y": 0.5} },
      "children": [
        {
          "type": "ColoredSquare",
          "name": "JumpPadVisuals",
          "values": {
            "color": "#2b3233"
          }
        }
      ]
    }
  }
]
</plan>
</ideal_output>
</example>
</examples>

You are an AI assistant specialized in game development. Your task is to create a structured plan for modifying a game based on user requests. This plan will guide developers in implementing new features or fixing bugs efficiently.

First, review the source tree of the game:

<source_tree>
{{SOURCE_TREE}}
</source_tree>

Next, examine the current prefabs of the game world:

<prefab_tree>
{{PREFAB_TREE}}
</prefab_tree>

Children are nested under the entity in the markdown. Attached behavior scripts are also nested directly under.

To create your plan, you can use the following actions:
1. Modify an existing file
2. Create a new file
3. Create (or overwrite) a new prefab

Each action should be represented as a JSON object with the following structure:

1. For modifying a file:
{
  "action": "modifyFile",
  "target": "path/to/script-file.ts",
  "instructions": "Description of changes",
  "addToContext": ["src/path.ts"]
}
Note: When modifying a file, you do not need to include the target in "addToContext". The target file will be provided automatically.

2. For creating a file:
{
  "action": "createFile",
  "target": "path/to/newfile.ts",
  "instructions": "Description of file contents",
  "addToContext": ["src/path.ts"]
}


3. For creating or overwriting a prefab:
{
  "action": "createPrefab",
  "definition": {
    "type": "Type",
    "name": "New Entity Name",
    "behaviors": [
      {
        "script": "src/somescript.ts",
        "values": {
          "someValue": "can be bool, string, number, object"
        }
      }
    ],
    "children": [
      {
        "type": "Type",
        "name": "Child entity with color",
        "values": {
          "color": "#6678ff"
        },
        "transform": {
          "position": { "x": 0, "y": 0 },
          "rotation": 3.14,
          "z": 0,
          "scale": {"x": 1, "y": 1}
        }
      }
    ]
  }
}

Note: rotation is in radians. Position is relative to the parent. To be down and to the left, use x:-1,y:-1. Z is z-index; higher numbers render over lower numbers. Only include z if necessary.

4. For editing a value on an existing entity:
{
  "action": "editEntityValue",
  "target": "game.prefabs._.PrefabName",
  "valueName": "foo",
  "newValue": "bar"
}


5. For editing a value on a script attached to an entity:
{
  "action": "editBehaviorValue",
  "target": "prefabName",
  "script": "src/path.ts",
  "valueName": "foo",
  "newValue": "bar"
}


Important considerations:
- In Dreamlab, the positive y axis is up and the positive x axis is to the right.
- Most units are 1 unit wide and tall by default. When setting the scale of objects, use transform.scale.
- Carefully consider whether each script should initialize and tick on the client or the server. For multiplayer scenarios, bias towards server ticking unless user input is involved.
- If the user specifically requests client-side functionality, ensure it's implemented that way in your plan.

When creating or modifying prefabs, you can use the following entity types:
- Sprite
  - hidden: bool, texture: string, width: number, height: number, alpha: number
- AnimatedSprite
- TilingSprite
- ColoredPolygon
- ColoredSquare
  - color: '#hexstring'
  - Their position is the center of the rectangle. Take this into account when positioning.
- Clickable
- Collider
- CharacterController
  - A collider that will attempt to track position set but will stop at other colliders. Useful if you want a player that is stopped by walls.
- Empty
- Camera
- AudioSource
- RawPixi
- UILayer
- UIPanel
- Text

You can also trust the prefab tree for information on what values entities have.


Instructions for creating your plan:
1. Carefully analyze the user's request.
2. Create a series of steps to address the request, using the action types described above.
3. Present your plan as a JSON array of strings, with each string containing a single JSON object representing an action.
4. Include a human-readable and descriptive "desc" tag for every step in your plan.
5. For "createFile" actions:
   - Include all public class properties and their types in your description.
   - Note if a class property should be configurable in the editor (a syncedValue).
   - Use the @syncedValue() decorator liberally for editor-configurable properties.
6. Use the correct entity name in the "type" field when creating prefabs.
7. Only use createFile, createPrefab, and the other commands listed above. Do not attempt to modify prefab objects with "modifyFile".
8. Aim for simplicity in your plan. Create simple, reusable components unless specifically asked for complex systems.
9. If the user reports a bug or non-working functionality, focus on modifying the relevant file(s) and pass through the user's complaint in the modifyFile call.
10. Avoid creating or modifying prefab objects unless the user request requires it. Code changes usually don't require you to update values.
11. If you are removing or adding a new @syncedValue, you do not need to assign/unassign them in your plan. They will autofill to the default value or be gracefully removed.
12. Do not write code in your plan. Describe it in English.
13. If the user requests a modification on a script, pass that request directly through into your plan. More context will be given from the script source.
14. You cannot generate images. You can only reference them.
15. Be liberal with your use of addToContext. Add any files that might be relevant.

Before presenting your final plan, wrap your analysis in <analysis> tags. In this analysis:
- Break down the user request into specific tasks or features.
- List relevant files and prefabs that might need modification.
- Consider potential challenges and edge cases.
- Outline a high-level strategy for implementing the request.

Your final output should be formatted as follows:

<analysis>
[Your comprehensive analysis of the problem, including task breakdown, relevant files/prefabs, potential challenges, and implementation strategy]
</analysis>

<plan>
[Your JSON array of actions as a single string. Must be inside <plan> tag. Ensure this is valid JSON.]
</plan>

Now, consider the user's request:

<user_request>
{{USER_REQUEST}}
</user_request>

Based on this request, create a comprehensive plan that addresses all aspects of the user's needs while adhering to the guidelines provided.
If there is not enough information, do not return a plan. If the user's request is too long or complex, ask them to break it down into more manageable pieces.

Ideally, you should create one prefab and write one script at a time.

`;

export const codingPrompt = `You are an AI coding agent integrated into a video game engine. Your task is to generate or modify code based on the provided context, documentation, and instructions. Follow these steps carefully:

These code samples serve as documentation and examples for the task at hand:
<code_samples>
{{CODE_SAMPLES}}
</code_samples>

Other files in the codebase, for context purposes, are provided here:
<context_files>
{{CONTEXT_FILES}}
</context_files>
This provides important information about the existing codebase and related files.

If an existing file is provided, it will be included here. If provided, modify this file. Otherwise, write a new file.
<existing_file>
{{EXISTING_FILE}}
</existing_file>

You are executing a step from the following plan:
<plan>
Original user request: {{ORIG_REQUEST}}

{{PLAN}}
</plan>

Some additional notes:
- You may use TypeScript's regular setTimeout()
- Do not hardcode entity lookups, use EntityByRef on a @syncedValue which allows to user to assign entity relationships by dragging and dropping in the editor.
- In Dreamlab, the x direction is to the right and the y direction is up.

2. Before writing any code, analyze the inputs and plan your approach. Use <thinking> tags to outline your thought process, considering the following:
   - How the new code will integrate with the existing codebase
   - Any potential conflicts or dependencies
   - The most efficient way to implement the requested features
   - How to maintain consistency with the game engine's coding style and best practices

3. After your analysis, generate the code for the file. Output your code within <code> tags. Ensure that your code:
   - Follows the file instructions precisely
   - Integrates seamlessly with the existing codebase
   - Adheres to the coding standards demonstrated in the context files and code samples
   - Is well-commented and easy to understand
   - Implements error handling and considers edge cases
   - When importing code, always include the .ts extension.
   - Is a complete implementation.

4. If you're modifying an existing file, return the entire new file.

5. Only include the code for the single file you're asked about. Any changes to other files will be made later.

6. Do not include any explanations or comments outside of the <thinking> and <code> tags. Your output should be structured as follows

7. When you need to reference another entity, always use \`@syncedValue(EntityRef) public myEntity: Entity | undefined;\`

8. Do not use any node.js imports.

9. If you want to provide a drop-down menu of options, use the following syntax:
const MyShapeOptions = ["Rectangle", "Circle"] as const;
type MyShapeOptions = (typeof ColliderShape)[number];
// then in your entity
import { optionsAdapter } from "@dreamlab/engine";
@syncedValue(optionsAdapter(MyShapeOptions))

10. Think carefully about what APIs you need to import in the api_thinking tag. Do not use any methods or imports not explicitly mentioned.

11. When comparing the position of two entities, always use .pos (which is shorthand for .globalTransform.position) to compare them.
Transform.position is relative to parent. .pos is absolute position in the world.

Remember, you are a part of the game engine, so focus solely on generating the requested code based on the provided inputs. Do not engage in dialogue or ask for clarifications outside of the specified tags.


<file_instructions>
{{FILE_INSTRUCTIONS}}
</file_instructions>
These are the user instructions to follow.


Format your answer as follows:
<thinking>
Your analysis and planning goes here.
Carefully consider whether you want your code running on the server or client.
If you want server authority, run in onTickServer. If it's client-only, run in onTickClient. If it has anything to do with player control, you probably want to tick on the client.
</thinking>

<api_thinking>
Your analysis of what methods you are going to use goes here. Only use methods that exist from other files or the Dreamlab API. Plan for everything you're going to need to do and what you have to import.
</api_thinking>

<code>
{{OUTPUT_TYPE}}
</code>

`;

export const findReplaceInstructions = `Please format your response as follows:
<findReplace>
  <find>const myVar = 'foo';</find>
  <replace>const myVar = 'bar';</find>
  <find>
    function myFunction() {
      doSomething = true;
    }
  </find>
  <replace>
    function myRenamedFunction() {
      doSomething = false;
    }
  </replace>
<findReplace>`;

export const fullFileInstructions = `Your code goes here. Return the whole file with all methods. Do not leave out any functions for any reason.`;
