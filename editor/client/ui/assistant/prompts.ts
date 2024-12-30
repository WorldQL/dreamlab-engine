export const fileContents: Record<string, string> = {
  "Handling Input":
    "import { Behavior, Vector2 } from '@dreamlab/engine'\nimport PlayerBehavior from './player.ts'\n\n/*\n  Handling Inputs in a Behavior:\n\n  This example demonstrates how to set up and handle various inputs within a behavior using the `Inputs` class.\n  Inputs are created for specific actions (e.g., movement or firing), and these actions are then checked and handled\n  during the behavior's update cycle (`onTick`).\n\n  Key Concepts:\n  - **Input Creation:**\n    Inputs are created using `this.inputs.create(...)`, binding a specific action to a key or mouse button.\n    These inputs are stored in private fields and can be checked every frame to determine if the corresponding\n    action should be executed.\n\n  - **Input Handling:**\n    Each frame, the behavior checks whether an input (e.g., a key or mouse button) is held down and executes\n    the appropriate logic, such as moving an entity or firing a weapon.\n\n  - **Cursor Tracking:**\n    The `Inputs` class also provides cursor tracking, which allows the entity to rotate or aim based on the cursor's\n    position in the game world.\n\n  Below is the implementation of the `Movement` behavior that handles player movement and firing based on input.\n\n  If you are using this.entity.transform.position.lookAt(this.inputs.cursor.world) you should ALWAYS do this before updating the transform position for the next frame.\n\n  This is correct:\n  const world = this.inputs.cursor.world;\n  if (!world) return;\n  // EXTREMELY IMPORTANT: Use the value of this.inputs.cursor.world before applying newPosition to the transform\n  const rotation = this.entity.transform.position.lookAt(world);\n  this.entity.transform.rotation = rotation;\n\n  // Apply the new position to the entity\n  this.entity.transform.position = newPosition;\n\n  This is wrong:\n  // Apply the new position to the entity\n  this.entity.transform.position = newPosition;\n\n  const world = this.inputs.cursor.world;\n  if (!world) return;\n  // EXTREMELY IMPORTANT: Use the value of this.inputs.cursor.world before applying newPosition to the transform\n  const rotation = this.entity.transform.position.lookAt(world);\n  this.entity.transform.rotation = rotation;\n\n  Please pay careful attention to this. It's tricky and important to remember when using cursor.world while also moving the entity and making it look at the cursor.\n\n*/\n\nexport default class Movement extends Behavior {\n  speed = 5.0\n\n  // Input bindings for movement\n  #up = this.inputs.create('@movement/up', 'Move Up', 'KeyW')\n  #down = this.inputs.create('@movement/down', 'Move Down', 'KeyS')\n  #left = this.inputs.create('@movement/left', 'Move Left', 'KeyA')\n  #right = this.inputs.create('@movement/right', 'Move Right', 'KeyD')\n\n  // Input binding for firing\n  #fire = this.inputs.create('@clickFire/fire', 'Fire', 'MouseLeft')\n\n  // Cooldown management for firing\n  readonly #cooldown = 0\n  #lastFired = 0\n\n  velocity = Vector2.ZERO\n\n  setup() {\n    this.defineValues(Movement, 'speed')\n  }\n\n  onTick(): void {\n    const movement = new Vector2(0, 0)\n    const currentSpeed = this.speed\n\n    // Handle movement inputs\n    if (this.#up.held) movement.y += 1\n    if (this.#down.held) movement.y -= 1\n    if (this.#right.held) movement.x += 1\n    if (this.#left.held) movement.x -= 1\n\n    // Calculate the velocity based on movement input and speed\n    this.velocity = movement.normalize().mul((this.game.physics.tickDelta / 100) * currentSpeed)\n\n    // Update entity's position\n    const newPosition = this.entity.transform.position.add(this.velocity)\n\n    // Boundary checks can be added here to restrict movement within certain limits\n\n    // Handle firing input with cooldown management\n    if (this.#lastFired > 0) {\n      this.#lastFired -= 1\n    } else {\n      if (this.#fire.held) {\n        const playerBehavior = this.entity.getBehavior(PlayerBehavior)\n        const fireRateMultiplier = playerBehavior.fireRateMultiplier\n\n        this.#lastFired = this.#cooldown / fireRateMultiplier\n\n        // Trigger the shooting pattern defined in PlayerBehavior\n        playerBehavior.shootingPattern()\n      }\n    }\n\n    // Rotate the entity to face the cursor's position\n\n    const world = this.inputs.cursor.world\n    if (!world) return\n    // EXTREMELY IMPORTANT: Use the value of this.inputs.cursor.world before applying newPosition to the transform\n    const rotation = this.entity.transform.position.lookAt(world)\n    this.entity.transform.rotation = rotation\n\n    // Apply the new position to the entity\n    this.entity.transform.position = newPosition\n  }\n}\n",
  "Looking Up and Referencing Entities":
    "import { Behavior } from '@dreamlab/engine'\n/*\n  You can look up entities by their ID using the various roots (prefabs, local, world, & server).\n  Each root contains a collection of entities, and you can access a specific entity by its ID\n  using the following syntax: `this.game.root._.MyEntityID`.\n\n  Example:\n  Suppose you have an entity with the ID \"Player\" in the prefabs root and another with the ID \"MainCamera\" in the local root.\n\n  - To retrieve the Player entity from the prefabs root:\n    const playerEntity = this.game.prefabs._.Player;\n\n  - To retrieve the MainCamera entity from the local root:\n    const cameraEntity = this.game.local._.MainCamera;\n\n  These entities can then be manipulated directly. For example:\n  playerEntity.transform.position.assign({ x: 10, y: 5 });\n  cameraEntity.transform.scale.assign({ x: 1.5, y: 1.5 });\n*/\n\nexport default class PlayerSpawner extends Behavior {\n  onInitialize(): void {\n    if (!this.game.isClient()) return\n\n    this.game.prefabs._.Player.cloneInto(this.game.world, {\n      name: 'Player.' + this.game.network.self,\n      transform: { position: { x: 0, y: 0 } },\n      authority: this.game.network.self,\n    })\n\n    this.game.local._.Camera.transform.scale.assign({ x: 2, y: 2 })\n  }\n}\n",
  "Detecting Collisions":
    "import { Behavior, Entity, EntityCollision } from '@dreamlab/engine'\nimport HealthBar from './health-bar.ts'\nimport PlayerBehavior from './player.ts'\n\n/*\n  Handling Collisions in Game Entities:\n\n  The `EntityCollision` signal in \"@dreamlab/engine\"\n  helps detect when two entities collide. This signal provides details like whether the collision\n  has just started and the other entity involved.\n\n  Key Points:\n  - **Listening for Collisions:** Use the `listen` method to react to collision events.\n  - **Collision Filtering:** Handle collisions only with specific entities by checking their properties.\n  - **Responding to Collisions:** For example, decrease health or destroy an entity when a collision occurs.\n\n  Below is an `EnemyBehavior` that reduces health when hit by a bullet and increases the player's score if the enemy is destroyed.\n*/\n\nexport default class EnemyBehavior extends Behavior {\n  private healthBar!: HealthBar\n\n  onInitialize(): void {\n    const health = Math.floor(Math.random() * 3) + 3\n    this.healthBar = this.entity.addBehavior({\n      type: HealthBar,\n      values: { maxHealth: health, currentHealth: health },\n    })\n\n    // Listen for collision event\n    this.listen(this.entity, EntityCollision, e => {\n      if (e.started) this.onCollide(e.other)\n    })\n  }\n\n  // Example of collision usage. We only want this entity to collide with the \"Bullet\" entity\n  onCollide(other: Entity) {\n    if (!other.name.startsWith('Bullet')) return\n\n    other.destroy()\n    this.healthBar.takeDamage(1)\n    if (this.healthBar.currentHealth <= 0) {\n      const player = this.entity.game.world._.Player\n      player.getBehavior(PlayerBehavior).score += 100\n    }\n  }\n}\n",
  "Handling Values":
    "import { Behavior, Vector2 } from '@dreamlab/engine'\n\n/*\n  Handling Values in Behaviors:\n\n  In \"@dreamlab/engine\", values within behaviors are critical for maintaining and synchronizing\n  the state across the network. Values can represent anything from simple properties like speed\n  or health to more complex game states.\n\n  Key Points:\n  - **Defining Values:**\n    Values are defined using the `defineValues` or `defineValue` method, which binds a property\n    to the behavior, ensuring it is properly managed and optionally synchronized across the network.\n\n  - **Value Synchronization:**\n    By default, values are local to the behavior, but they can be set to replicate across\n    the network by configuring the `opts.replicated` option when defining a value.\n\n  - **Accessing Values:**\n    Once defined, values can be accessed and modified like any other property. However,\n    they are wrapped in a `Value` object that manages synchronization, type checking,\n    and default values.\n\n  Below is an example demonstrating how to define and use values within a behavior.\n*/\n\nexport default class PlayerMovement extends Behavior {\n  // Define a synced value for the player's speed\n  speed = 5.0\n\n  #up = this.inputs.create('@movement/up', 'Move Up', 'KeyW')\n  #down = this.inputs.create('@movement/down', 'Move Down', 'KeyS')\n  #left = this.inputs.create('@movement/left', 'Move Left', 'KeyA')\n  #right = this.inputs.create('@movement/right', 'Move Right', 'KeyD')\n  #boost = this.inputs.create('@movement/boost', 'Speed Boost', 'ShiftLeft')\n\n  setup() {\n    /*\n      Defining the `speed` value to be managed by the behavior.\n      - The `defineValues` method is used to specify which properties should be treated as values.\n      - Once defined, `speed` will be managed by the internal value system, allowing it to be\n        synchronized across the network if needed.\n    */\n    this.defineValues(PlayerMovement, 'speed')\n  }\n\n  onTick(): void {\n    // Ensure that only the entity's owner can control it\n    if (this.entity.authority !== this.game.network.self) return\n\n    const movement = new Vector2(0, 0)\n\n    if (this.#up.held) movement.y += 1\n    if (this.#down.held) movement.y -= 1\n    if (this.#right.held) movement.x += 1\n    if (this.#left.held) movement.x -= 1\n\n    // Adjust speed if boost is held\n    let currentSpeed = this.speed\n    if (this.#boost.held) currentSpeed *= 2\n\n    const velocity = movement.normalize().mul((this.game.physics.tickDelta / 100) * currentSpeed)\n\n    this.entity.transform.position = this.entity.transform.position.add(velocity)\n  }\n}\n",
  "_basic-structure":
    "import { Behavior, syncedValue, Vector2, Vector2Adapter } from '@dreamlab/engine'\n/*\n  In \"@dreamlab/engine\", a `Behavior` represents a modular piece of logic that can be attached to an entity.\n  This allows you to encapsulate functionality, such as movement, health management, or AI, in reusable components.\n\n  Key Components:\n  - **Lifecycle Methods:**\n    - `onInitialize`: Called once when the behavior is first attached to an entity, used for setup tasks.\n    - `onTick`: Called on every game tick, ideal for updating logic like movement or state changes.\n    - `onPreTick`, `onPostTick`, `onFrame`: Additional lifecycle hooks for more granular control over update timing.\n\n  - **Values:** Behaviors can have properties (values) that are synchronized across the network or exposed to\n    an inspector GUI. These values are defined using `@syncedValue` decorator and can be of various\n    types, including primitives and complex types with adapters.\n\n  - **Signals:** Behaviors can listen for signals (events) from the game or other entities and respond accordingly.\n    This is done using the `listen` method for subscribing to signals, and `fire` to emit them.\n\n  The `Behavior` class is highly flexible, supporting complex game mechanics through a combination of values, signals,\n  and lifecycle hooks. It serves as the foundation for defining how entities behave in the game world.\n\n  If you want to get the width or height of the screen, you can use this.game.renderer.app.canvas.width / height.\n\n  this.game.renderer.app is a Pixi application. When making calls to pixi, you must import it as:\n  import * as PIXI from \"@dreamlab/vendor/pixi.ts\";\n\n  onTick() is called 60 times per second.\n\n*/\n\n// example Behavior that allows for WASD movement as well as a pattern for firing projectiles.\n// this serves as an example for the general structure of a behavior\nexport class Movement extends Behavior {\n  // the speed of the player\n  @syncedValue()\n  speed = 5.0\n  // example value\n  @syncedValue(Vector2Adapter)\n  anotherValue = 42.0\n  // the current velocity of the player\n  velocity = Vector2.ZERO\n\n  #up = this.inputs.create('@movement/up', 'Move Up', 'KeyW')\n  #down = this.inputs.create('@movement/down', 'Move Down', 'KeyS')\n  #left = this.inputs.create('@movement/left', 'Move Left', 'KeyA')\n  #right = this.inputs.create('@movement/right', 'Move Right', 'KeyD')\n\n  onTickClient(): void {\n    // make sure our client has authority to move this\n    if (!this.hasAuthority()) return;\n    const movement = new Vector2(0, 0)\n    const currentSpeed = this.speed\n\n    if (this.#up.held) movement.y += 1\n    if (this.#down.held) movement.y -= 1\n    if (this.#right.held) movement.x += 1\n    if (this.#left.held) movement.x -= 1\n\n    this.velocity = movement.normalize().mul((this.game.physics.tickDelta / 100) * currentSpeed)\n\n    this.entity.transform.position = this.entity.transform.position.add(this.velocity)\n  }\n\n  onTickServer(): void {\n    // tick something only on the server\n  }\n\n  // initialize only on client or server:\n  onInitializeClient(): void {\n    \n  }\n\n  onInitializeServer(): void {\n    \n  }\n}\n",
  "Handling Transforms":
    "// Example of changing an entities position through a behavior. This one is more basic.\nimport { Behavior, Vector2 } from '@dreamlab/engine'\n\n/*\n  Key Points:\n  - **Basic Movement:** Calculate the new position by adding a direction vector to the current position.\n  - **Transform Properties:** Use properties like `position`, `rotation`, and `scale` to control entity movement and appearance.\n\n  This example moves an asteroid in a random direction at a constant speed.\n*/\nexport default class AsteroidMovement extends Behavior {\n  readonly #direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()\n\n  speed = 0.2\n\n  setup() {\n    this.defineValue(AsteroidMovement, 'speed')\n  }\n\n  /*\n  Properties available under entity.transform are:\n  - scale.x, scale.y\n  - position.x, position.y\n  - entity.transform.z (used for zIndex ordering)\n  - entity.transform.rotation (radians)\n  */\n\n  onTick(): void {\n    this.entity.transform.position = this.entity.transform.position.add(this.#direction.mul((this.time.delta / 100) * this.speed))\n  }\n}\n\n// Example of moving an entity based on another entities position. A more advanced example\nimport { Behavior, RectCollider, Sprite } from '@dreamlab/engine'\nimport BulletBehavior from './bullet.ts'\n\nexport default class EnemyMovement extends Behavior {\n  speed = Math.random() * 0.5 + 0.5\n  minDistance = 5\n  shootDistance = 10\n  lastShootTime = 0\n  shootCooldown = Math.random() * 2000 + 1000\n\n  onTick(): void {\n    // Find the player entity\n    const player = this.entity.game.world.children.get('Player')\n    const playerPos = player?.globalTransform.position\n    if (!playerPos) return\n\n    const direction = playerPos.sub(this.entity.transform.position).normalize()\n    const distance = playerPos.sub(this.entity.transform.position).magnitude()\n\n    // In this example we only move the entity towards the player if they are outside a certain distance\n    if (distance > this.minDistance + 5) {\n      let speedFactor = 1\n      if (distance < this.minDistance + 10) {\n        speedFactor = (distance - this.minDistance) / 10\n      }\n      this.entity.transform.position = this.entity.transform.position.add(direction.mul((this.time.delta / 100) * this.speed * speedFactor))\n    }\n\n    // Adjust rotation of entity so its facing the correct direction\n    const rotation = Math.atan2(direction.y, direction.x)\n    this.entity.transform.rotation = rotation - Math.PI / 2\n\n    if (distance <= this.shootDistance) {\n      const now = Date.now()\n      if (now - this.lastShootTime > this.shootCooldown) {\n        this.lastShootTime = now\n        this.shootAtPlayer()\n      }\n    }\n  }\n\n  shootAtPlayer(): void {\n    const rotation = this.entity.transform.rotation + Math.PI / 2\n\n    this.entity.game.world.spawn({\n      type: RectCollider,\n      name: 'EnemyBullet',\n      transform: {\n        position: this.entity.transform.position.clone(),\n        rotation,\n        scale: { x: 0.25, y: 0.25 },\n      },\n      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n      children: [\n        {\n          type: Sprite,\n          name: 'BulletSprite',\n          transform: {\n            scale: { x: 0.75, y: 0.75 },\n          },\n        },\n      ],\n    })\n  }\n}\n",
  "Spawning Entities":
    "import { Behavior, RectCollider, Sprite } from '@dreamlab/engine'\nimport BulletBehavior from './bullet.ts'\n\n/*\n  Spawning Entities Overview:\n\n  There are multiple ways to spawn entities in the game using the \"@dreamlab/engine\" package.\n  Each method is suitable for different scenarios, depending on your needs.\n\n  1. **Cloning a Prefab:**\n     - This method is ideal for spawning predefined entities, such as players or enemies, that have been set up as prefabs.\n     - You can clone a prefab into the world and customize its properties (e.g., name, position, authority).\n\n     Example:\n     this.game.prefabs._.Player.cloneInto(this.game.world, {\n       name: \"Player.\" + this.game.network.self,\n       transform: { position: { x: 0, y: 0 } },\n       authority: this.game.network.self,\n     });\n\n\n  2. **Spawning from Scratch:**\n     - For more complex entities that may not have a predefined prefab, you can spawn them directly by defining their components and behaviors in the spawn call.\n     - This method allows you to create fully customized entities on the fly.\n\n     Example:\n     this.entity.game.world.spawn({\n       type: RectCollider,\n       name: \"EnemyBullet\",\n       transform: {\n         position: this.entity.transform.position.clone(),\n         rotation,\n         scale: { x: 0.25, y: 0.25 },\n       },\n       behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n       children: [\n         {\n           type: Sprite,\n           name: \"BulletSprite\",\n           transform: {\n             scale: { x: 0.75, y: 0.75 },\n           },\n         },\n       ],\n     });\n\n*/\n\nexport default class PlayerSpawner extends Behavior {\n  onInitialize(): void {\n    // Cloning a prefab to spawn a player entity.\n    if (!this.game.isClient()) return\n\n    this.game.prefabs._.Player.cloneInto(this.game.world, {\n      name: 'Player.' + this.game.network.self,\n      transform: { position: { x: 0, y: 0 } },\n      authority: this.game.network.self,\n    })\n\n    // Modify the local camera entity's scale after spawning the player.\n    this.game.local._.Camera.transform.scale.assign({ x: 2, y: 2 })\n  }\n}\n\nexport default class EnemyMovement extends Behavior {\n  speed = Math.random() * 0.5 + 0.5\n  minDistance = 5\n  shootDistance = 10\n  lastShootTime = 0\n  shootCooldown = Math.random() * 2000 + 1000\n\n  onTick(): void {\n    const player = this.entity.game.world.children.get('Player')\n    const playerPos = player?.globalTransform.position\n    if (!playerPos) return\n\n    const direction = playerPos.sub(this.entity.transform.position).normalize()\n    const distance = playerPos.sub(this.entity.transform.position).magnitude()\n\n    if (distance > this.minDistance + 5) {\n      let speedFactor = 1\n      if (distance < this.minDistance + 10) {\n        speedFactor = (distance - this.minDistance) / 10\n      }\n      this.entity.transform.position = this.entity.transform.position.add(direction.mul((this.time.delta / 100) * this.speed * speedFactor))\n    }\n\n    const rotation = Math.atan2(direction.y, direction.x)\n    this.entity.transform.rotation = rotation - Math.PI / 2\n\n    if (distance <= this.shootDistance) {\n      const now = Date.now()\n      if (now - this.lastShootTime > this.shootCooldown) {\n        this.lastShootTime = now\n        this.shootAtPlayer()\n      }\n    }\n  }\n\n  shootAtPlayer(): void {\n    const rotation = this.entity.transform.rotation + Math.PI / 2\n\n    // Spawning a bullet entity with custom components and behaviors\n    this.entity.game.world.spawn({\n      type: RectCollider,\n      name: 'EnemyBullet',\n      transform: {\n        position: this.entity.transform.position.clone(),\n        rotation,\n        scale: { x: 0.25, y: 0.25 },\n      },\n      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],\n      children: [\n        {\n          type: Sprite,\n          name: 'BulletSprite',\n          transform: {\n            scale: { x: 0.75, y: 0.75 },\n          },\n        },\n      ],\n    })\n  }\n}\n",
  "Vector2 API":
    "// The following code demonstrates the `Vector2` class, which is part of the `@dreamlab/engine` package.\n// This class provides a 2D vector with a variety of utility methods for vector operations,\n// such as addition, subtraction, normalization, and more.\n// You can import and use this class in your project to handle 2D vector mathematics efficiently.\n\nimport { Vector2 } from '@dreamlab/engine'\n\n// Creating vectors\nconst v1 = new Vector2(3, 4)\nconst v2 = new Vector2({ x: 1, y: 2 })\n\n// Using static constants\nconst zeroVector = Vector2.ZERO\nconst unitX = Vector2.X\n\n// Vector operations\nconst sum = v1.add(v2) // Adds v1 and v2\nconst difference = v1.sub(v2) // Subtracts v2 from v1\nconst scaled = v1.mul(2) // Multiplies v1 by 2\nconst normalized = v1.normalize() // Normalizes v1\nconst magnitude = v1.magnitude() // Gets the magnitude of v1\n\n// Comparing vectors\nconst isEqual = v1.eq(v2) // Checks if v1 and v2 are equal\n\n// Distance between vectors\nconst distance = v1.distance(v2)\n\n// Linear interpolation\nconst midpoint = Vector2.lerp(v1, v2, 0.5)\n",
  "Character Controller":
    "// This is an example of how to implement a platformer controller using the KinematicCharacterController\n\nimport { Behavior, EntityDestroyed, RectCollider, Vector2 } from '@dreamlab/engine'\nimport { KinematicCharacterController } from '@dreamlab/vendor/rapier.ts'\n\nexport default class PlatformMovement extends Behavior {\n  #collider: RectCollider = this.entity.cast(RectCollider)\n  #controller: KinematicCharacterController | undefined\n\n  speed = 10.0\n  jumpForce = 20.0\n  jumpAcceleration = 40\n  gravity = 90.0\n  maxJumpTime = 1 // Maximum duration the jump key affects the jump\n\n  #verticalVelocity = 0\n  #isGrounded = false\n  #jumpTimeCounter = 0\n\n  #up = this.inputs.create('@movement/up', 'Move Up', 'KeyW')\n  #down = this.inputs.create('@movement/down', 'Move Down', 'KeyS')\n  #left = this.inputs.create('@movement/left', 'Move Left', 'KeyA')\n  #right = this.inputs.create('@movement/right', 'Move Right', 'KeyD')\n  #jump = this.inputs.create('@movement/jump', 'Jump', 'Space')\n\n  setup() {\n    this.defineValues(PlatformMovement, 'speed', 'jumpForce', 'jumpAcceleration', 'gravity', 'maxJumpTime')\n  }\n\n  onInitialize(): void {\n    if (this.game.isClient()) {\n      this.#controller = this.game.physics.world.createCharacterController(0.01)\n    }\n\n    this.listen(this.entity, EntityDestroyed, () => {\n      if (this.#controller) this.game.physics.world.removeCharacterController(this.#controller)\n    })\n  }\n\n  onTick(): void {\n    if (!this.#controller) return\n\n    const deltaTime = this.game.physics.tickDelta / 1000 // Convert to seconds\n\n    let horizontalInput = 0\n    if (this.#right.held) horizontalInput += 1\n    if (this.#left.held) horizontalInput -= 1\n\n    const horizontalVelocity = horizontalInput * this.speed\n\n    // Jumping logic\n    if (this.#jump.pressed && this.#isGrounded) {\n      this.#verticalVelocity = this.jumpForce\n      this.#jumpTimeCounter = 0\n    }\n\n    if (this.#jump.held && this.#jumpTimeCounter < this.maxJumpTime) {\n      // Apply upward acceleration while the jump key is held\n      this.#verticalVelocity += this.jumpAcceleration * deltaTime\n      this.#jumpTimeCounter += deltaTime\n    }\n\n    // Create movement vector\n    const movement = new Vector2(horizontalVelocity * deltaTime, this.#verticalVelocity * deltaTime)\n\n    this.#controller.computeColliderMovement(this.#collider.collider, movement)\n    const corrected = this.#controller.computedMovement()\n\n    this.#isGrounded = this.#controller.computedGrounded()\n    if (!this.#isGrounded) this.#verticalVelocity -= this.gravity * deltaTime\n\n    this.entity.pos = this.entity.pos.add(corrected)\n  }\n}\n",
  "User Interfaces":
    "import { Behavior, UILayer } from '@dreamlab/engine'\nimport { element } from '@dreamlab/ui'\n\n/*\n  UI System Overview:\n\n  The UI system in this project allows you to create and manage user interface elements\n  dynamically within the game using the `element` method from the \"@dreamlab/ui\" package.\n\n  - **Creating Elements:**\n    You can create HTML elements by calling the `element` function, which takes the\n    element's tag name, an object with properties/attributes, and an array of child elements or text.\n\n  - **Appending to the UI Layer:**\n    Once created, elements are appended to the UI layer of an entity, making them visible\n    in the game's UI. This is typically done by accessing the `UILayer` component\n    of the current entity and using `appendChild` to add elements.\n\n  - **Event Handling:**\n    You can attach event listeners to UI elements, such as buttons, to handle user interactions.\n    This allows you to create responsive and interactive UIs within the game.\n\n  - **Example Usage:**\n    In the example below, a \"Death Screen\" UI is created, which displays a game over message,\n    the player's final score, and a button to respawn the player. The UI is dynamically created\n    when the player dies and removed when they respawn.\n\n    - The `element` method is used to create the UI elements.\n    - CSS styling is applied by creating a `<style>` element.\n    - The UI is integrated into the game's UI layer, ensuring it appears on the screen.\n\n  - **Best Practices:**\n    - Ensure to clean up any UI elements when they are no longer needed to avoid memory leaks.\n    - Use descriptive IDs and class names to maintain clarity in your UI components.\n    - Keep UI logic modular by separating the creation and management of UI elements into different methods.\n\n  Below is an example implementation of a death screen using this UI system.\n*/\n\nexport default class DeathScreen extends Behavior {\n  // Reference to the UI layer associated with the entity\n  #ui = this.entity.cast(UILayer)\n  #element!: HTMLDivElement\n  score: number = 0\n\n  setup() {\n    this.defineValues(DeathScreen, 'score')\n  }\n\n  onInitialize() {\n    // CSS for the death screen UI element\n    const css = `\n    #death-screen {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      color: white;\n      background: rgb(0 0 0 / 85%);\n      font-family: \"Inter\", sans-serif;\n    }\n\n    h1 {\n      font-size: 3rem;\n      font-weight: bold;\n      margin-bottom: 0;\n    }\n\n    p {\n      font-size: 1.5rem;\n      margin-bottom: 1rem;\n    }\n\n    button {\n      padding: 1rem 2rem;\n      font-size: 1.5rem;\n      cursor: pointer;\n      border: none;\n      border-radius: 0.4rem;\n      color: white;\n      background-color: #ff6600;\n      transition: background-color 0.3s ease;\n    }\n\n    button:hover {\n      background-color: #e65c00;\n    }\n    `\n\n    // Create a <style> element and add the CSS to it\n    const style = element('style', { textContent: css })\n    this.#ui.dom.appendChild(style)\n\n    // Create a \"Respawn\" button using the new `element` method\n    const button = element('button', { type: 'button' }, ['Respawn'])\n    button.addEventListener('click', () => this.#respawnPlayer())\n\n    // Create the main death screen UI container\n    this.#element = element(\n      'div',\n      {\n        id: 'death-screen', // Set the ID for the main container\n      },\n      [\n        // Add an <h1> element for the \"Game Over\" title\n        element('h1', { className: 'example-classname' }, ['Game Over']),\n\n        // Add a <p> element to display the player's final score\n        element('p', {}, [`Final Score: ${this.score.toLocaleString()}`]),\n\n        // Add the \"Respawn\" button created earlier\n        button,\n      ],\n    )\n\n    // Append the death screen UI container to the UI layer\n    this.#ui.element.appendChild(this.#element)\n  }\n\n  #respawnPlayer() {\n    // spawnPlayer(this.game)\n\n    // Destroy the current entity, removing the death screen from the UI\n    this.entity.destroy()\n  }\n}\n",
  "Interacting with Behaviors":
    "import { Behavior, Entity, EntityCollision } from '@dreamlab/engine'\nimport PlayerBehavior from './player.ts'\n\n/*\n  Example: Using `getBehavior()` to Access Behaviors\n\n  The `getBehavior()` method allows you to retrieve an existing behavior attached to an entity.\n  This is particularly useful when you need to interact with or update a behavior that has already been set up,\n  such as a health bar or UI component, without needing to instantiate it again.\n\n  In this example, `getBehavior()` is used to update the player's score when an asteroid is destroyed,\n  as well as to interact with the asteroid's health bar.\n\n  Benefits of `getBehavior()`:\n  - Prevents duplication of behavior instances.\n  - Allows direct access to existing behaviors for updates or interactions.\n  - Ensures that only one instance of the behavior is manipulated, maintaining consistency.\n*/\n\nexport default class AsteroidBehavior extends Behavior {\n  onInitialize(): void {\n    this.listen(this.entity, EntityCollision, e => {\n      if (e.started) this.onCollide(e.other)\n    })\n  }\n\n  onCollide(other: Entity) {\n    if (!other.name.startsWith('Bullet')) return\n    other.destroy()\n\n    // Retrieve the HealthBar behavior for this entity\n    const healthBar = this.entity.getBehavior(HealthBar)\n\n    // Reduce the asteroid's health by 1\n    healthBar.takeDamage(1)\n\n    // If health reaches zero, update the player's score and destroy the asteroid\n    if (healthBar.currentHealth <= 0) {\n      const player = this.game.world._.Player\n\n      // Use getBehavior to access the PlayerBehavior and update the score\n      player.getBehavior(PlayerBehavior).score += 50\n\n      // Destroy the asteroid entity (healthBar destruction is handled by takeDamage)\n      this.entity.destroy()\n    }\n  }\n}\n\n// Health bar behavior for reference\nimport { Behavior, BehaviorContext, Entity, GamePostTick, RectCollider, Sprite, Vector2 } from '@dreamlab/engine'\n\nexport default class HealthBar extends Behavior {\n  maxHealth: number = 100\n  currentHealth: number = 100\n  healthBarEntity!: Entity\n\n  constructor(ctx: BehaviorContext) {\n    super(ctx)\n    this.defineValues(HealthBar, 'maxHealth', 'currentHealth')\n  }\n\n  onInitialize(): void {\n    this.healthBarEntity = this.game.world.spawn({\n      type: Sprite,\n      name: 'HealthBar',\n      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },\n      values: { texture: 'res://assets/healthbar.png' },\n    })\n\n    this.game.on(GamePostTick, () => {\n      this.healthBarEntity.pos = this.entity.pos.add(new Vector2(0, 1))\n      this.updateHealthBar()\n    })\n  }\n\n  updateHealthBar(): void {\n    const healthRatio = this.currentHealth / this.maxHealth\n    this.healthBarEntity.transform.scale.x = healthRatio\n  }\n\n  takeDamage(damage: number): void {\n    this.currentHealth -= damage\n    if (this.currentHealth <= 0) {\n      this.currentHealth = 0\n      this.entity.destroy()\n      this.healthBarEntity.destroy()\n      this.spawnExplosionPieces()\n    }\n\n    this.updateHealthBar()\n  }\n\n  spawnExplosionPieces(): void {\n    const pieceCount = Math.random() * 5 + 3\n    const pieceSize = { x: 0.15, y: 0.15 }\n\n    for (let i = 0; i < pieceCount; i++) {\n      this.entity.game.world.spawn({\n        type: Sprite,\n        name: 'ExplosionPiece',\n        transform: {\n          position: this.entity.transform.position.clone(),\n          scale: pieceSize,\n        },\n        behaviors: [],\n        children: [\n          {\n            type: Sprite,\n            name: 'PieceSprite',\n            values: { texture: 'res://assets/asteroid.png' },\n          },\n        ],\n      })\n    }\n  }\n}\n",
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
Behavior Structure - Behavior classes are used to implement all game functionality.`;

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

export const step0 = `You are an AI assistant for the Dreamlab game engine. Here's what you need to know:

Available entity types: ${entityTypes.join(", ")}

Core features:
- Entities in world root (networked), local root (UI/camera), or prefabs root (templates)
- Behaviors with lifecycle methods (setup, onTick, etc)
- Transform properties: position, rotation, scale 
- Right-click workflow in Scene Graph for all entity creation but not transform or behavior changes. Those are done in the properties panel.

User Request:
{{USER_REQUEST}}

Format response exactly like:

Setup:
1. Right click on {{root}} root
   * Add {{entityType}} > Name "EntityName"`;

export const step1 = `
<documentation_topics>
${available_topics}
</documentation_topics>

Please follow these steps:

1. Carefully read and analyze the user's request to understand what they are trying to achieve in the Dreamlab game engine.
2. Review the list of available documentation topics.
3. Select the topics that are directly relevant to fulfilling the user's request. Consider the following:
   - Core functionality required to implement the request
   - Any additional features or components mentioned in the request
   - Potential dependencies or related systems that might be necessary
4. Do not include topics that are not directly related to the user's request, even if they might be generally useful.
5. If you're unsure about a topic's relevance, err on the side of inclusion.
6. Present your selected topics in a list format, enclosed in <selected_topics> tags. Each topic should be on a new line.

Here's an example of how your output should be formatted:

<selected_topics>
Topic 1
Topic 2
Topic 3
</selected_topics>

Only include the titles of the topics.

Remember, your goal is to provide a concise, relevant list of documentation topics that will be necessary to complete the user's request in the Dreamlab game engine. Do not provide any additional commentary or explanations in your output.
`;

export const step2 = `You are a programming assistant specializing in the Dreamlab game engine. Your task is to write a Behavior class in TypeScript based on a user's request and the provided documentation.

First, review the documentation for the relevant topics:

<topic_documentation>
{{TOPIC_DOCUMENTATION}}
</topic_documentation>

Now, here's an example of a Behavior class structure to guide you:

<example_behavior_code>
{{EXAMPLE_BEHAVIOR_CODE}}
</example_behavior_code>

The user has requested the following functionality:

<user_request>
{{USER_REQUEST}}
</user_request>

Analyze the provided documentation and the user's request carefully. Consider the following steps:

1. Identify the key components and functionalities required for the Behavior class.
2. Determine which parts of the documentation are most relevant to implementing these functionalities.
3. Plan out the structure of your Behavior class, including necessary properties, methods, and event handlers.

When writing the Behavior code, follow these guidelines:

1. Use TypeScript syntax and adhere to Dreamlab engine conventions as shown in the example code.
2. Implement all functionality requested by the user.
3. Use appropriate classes, methods, and properties from the Dreamlab engine as documented.
4. Include clear and concise comments to explain complex logic or non-obvious implementations.
5. Ensure your code is well-structured, readable, and follows best practices.

Provide your response in the following format:


[Briefly explain your approach to implementing the requested functionality, referencing key parts of the documentation you'll be using.]

[Write your TypeScript code for the Behavior class here.] Be sure to use the Markdown typescript block.

Remember to be thorough in your implementation while keeping the code efficient and relevant to the user's request. Your goal is to provide a working Behavior class that fulfills the requested functionality using the Dreamlab game engine.
`;

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

export const plan = `You are an AI assistant tasked with creating a plan to modify a game based on a user request. You will be given information about the game's source code structure, current prefabs, and a specific user request. Your job is to create a plan that outlines the necessary changes to implement the user's request.
First, review the source tree of the game:
<source_tree>
{{SOURCE_TREE}}
</source_tree>
Next, examine the current prefabs of the game world:
<prefab_tree>
{{PREFAB_TREE}}
</prefab_tree>
Children are nested under the entity in the markdown. Attached behavior scripts are also nested directly under.
Finally, consider the following documentation topics:
<documentation_topics>
{{DOCS_TOPICS}}
</documentation_topics>
To create your plan, you can use the following actions:
1. Modify an existing file
2. Create a new file
3. Create (or overwrite) a new prefab
Each action should be represented as a JSON object with the following structure:
- For modifying a file: {"action": "modifyFile", "target": "path/to/file.ts", "instructions": "Description of changes", "addToContext": ["src/path.ts"], "loadDocs": ["Topic Title"]}
- For creating a file: {"action": "createFile", "target": "path/to/newfile.ts", "instructions": "Description of file contents", "addToContext": ["src/path.ts"], "loadDocs": ["Some Topic"]}
- For creating a prefab: {
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
        "transform": { "position": { "x": 0, "y": 0 }, "rotation": 3.14, "z": 0, "scale": {"x": 1, "y": 1} }
        // rotation is in radians.
        // position is relative to the parent. To be down and to the left you'd do x:-1,y:-1.
        // z is z-index. Higher numbers render over lower numbers. Only include this if you need to.
      }
    ]
  }
}
- For editing a value on an existing entity: {"action": "editEntityValue", "target": "prefabName", "valueName": "foo", "newValue": "bar"}
- For editing a value on a script attached to an entity: {"action": "editBehaviorValue", "target": "prefabName", "script": "src/path.ts" "valueName": "foo", "newValue": "bar"}


When creating or modifying prefabs, you can use the following entities with the following values:
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
- Empty
- Camera
- AudioSource
- RawPixi
- UILayer
- UIPanel
- Text

You can also trust the prefab tree for information on what values entities have.
Most units are 1 unit wide and tall by default. When setting the scale of objects, the preferred way is to use transform.scale!

Create a plan that addresses the user's request by making appropriate changes to the game's code and prefabs. Your plan should be a series of steps, each represented by one of the action types described above.
Present your plan as a JSON array of strings, with each string containing a single JSON object representing an action. For example to answer the request "add a jump pad that springs the player up" would be:
<plan>
[
  {
    "desc": "Create script jump-pad.ts",
    "action": "createFile",
    "target": "src/jump-pad.ts",
    "instructions": "Spring the player upwards when they touch this. Consider player.ts for information on how the player controller works",
    "addToContext": ["src/player.ts"], // always addToContext any files you think might be relevant.
    "loadDocs": ["Detecting Collisions"]
  },
  {
    "desc": "Create prefab jumpPad",
    "action": "createPrefab",
    "definition": {
      "action": "createPrefab",
      "definition": {
        "type": "Collider",
        "name": "JumpPad",
        "behaviors": [
          {
            "script": "src/jump-pad.ts",
            "values": {
              "jumpAmount": 45
            }
          }
        ],
        "transform": { "scale": {"x": 2, "y": 0.5} } // make it wider than it is tall. Note that this transform is on the parent, not the child.
        "children": [
          {
            // ColoredSquare and Sprite are both good choices here. If you think the user wants to specify an image or asks for a Sprite, use that.
            "type": "ColoredSquare",
            "name": "JumpPadVisuals",
            "values": {
              "color": "#2b3233"
            }
          }
        ]
      }
    }
  }
]
</plan>
Make sure that a human readable and descriptive "desc" tag is included on every step of your plan.

Always use the correct entity name in the "type" field. List the entities you plan to use before building the structure.


createFile and createPrefab overwrite anything at the current path. addToContext should be used for if and only if you need to add one of the other files to the context so the coding agent can understand it.
The three commands in the example are all that are available.
Ensure that your plan is comprehensive and addresses all aspects of the user's request. If you need to make assumptions or have questions about the implementation, include these in comments within the "instructions" field of the relevant action.
Do not write code, just describe the functionality. If you are describing the addition of new class methods, you should always name those methods!
Format your answer like the following:
<thinking>
Reason about the problem here
</thinking>
<plan></plan>

If the user request is not detailed enough, do not return a <plan> tag.

Now, consider the user's request:
<user_request>
{{USER_REQUEST}}
</user_request>
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

6. Do not include any explanations or comments outside of the <thinking> and <code> tags. Your output should be structured as follows:

<thinking>
Your analysis and planning goes here.
Carefully consider whether you want your code running on the server or client.
If you want server authority, run in onTickServer. If it's client-only, run in onTickClient. If it has anything to do with player control, you probably want to tick on the client.
</thinking>

<code>
Your generated or modified code goes here
</code>


Remember, you are a part of the game engine, so focus solely on generating the requested code based on the provided inputs. Do not engage in dialogue or ask for clarifications outside of the specified tags.


<file_instructions>
{{FILE_INSTRUCTIONS}}
</file_instructions>
These are the user instructions to follow.`;
