import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import {
  childrenSorted,
  ClientGame,
  Entity,
  EntityConstructor,
  EntityDefinition,
  type ITransform,
} from "@dreamlab/engine";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { BoxResizeGizmoResizeEnd, GizmoUpdateEnd } from "../../common/entities/mod.ts";
import { EditorFacadeComplexCollider } from "../../common/facades/complex-collider.ts";
import {
  EditorMetadataEntity,
  LocalRootFacade,
  PrefabRootFacade,
  ServerRootFacade,
  WorldRootFacade,
} from "../../common/mod.ts";
import { Check, Save } from "../_icons.tsx";
import { IconButton } from "../components/icon-button.ts";
import { createFile } from "../main.ts";
import type { UndoRedoOperation } from "../undo-redo.ts";
import { UndoRedoManager } from "../undo-redo.ts";
import { SelectedEntityService } from "./selected-entity.ts";

// Restores the entity constructor using its "typeName"
function entityReviver(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    (value as Record<string, unknown>).typeName &&
    !(value as Record<string, unknown>).type
  ) {
    (value as Record<string, unknown>).type = Entity.getEntityType(
      (value as Record<string, unknown>).typeName as string,
    );
  }
  return value;
}

export function isRoot(e: Entity): boolean {
  return (
    e instanceof WorldRootFacade ||
    e instanceof LocalRootFacade ||
    e instanceof ServerRootFacade ||
    e instanceof PrefabRootFacade
  );
}

// Remove child nodes that are descendants of other nodes scheduled for deletion.
function filterChildNodes(toDelete: Entity[]): void {
  const indicesToExclude: number[] = [];
  for (let i = 0; i < toDelete.length; i++) {
    if (isRoot(toDelete[i].parent!)) continue;
    let pointer = toDelete[i].parent!;
    while (true) {
      for (const other of toDelete) {
        if (other === pointer) {
          indicesToExclude.push(i);
          break;
        }
      }
      if (isRoot(pointer.parent!)) break;
      pointer = pointer.parent!;
    }
  }

  let acc = 0;
  for (const idx of indicesToExclude) {
    toDelete.splice(idx - acc, 1);
    acc--;
  }
}

// #region Cooldown
// spamming undo/redo results in loss of child entities.
class CooldownManager {
  private cooldowns: Map<string, number> = new Map();
  private readonly cooldownDuration: number = 200; // 200ms cooldown

  isOnCooldown(key: string): boolean {
    const now = Date.now();
    const lastUsed = this.cooldowns.get(key);
    if (lastUsed === undefined || now - lastUsed >= this.cooldownDuration) {
      this.cooldowns.set(key, now);
      return false;
    }
    return true;
  }
}
// #endregion

//#region Copy & Paste
export async function copyEntitiesToClipboard(
  selectedService: SelectedEntityService,
): Promise<void> {
  const entitiesToCopy = selectedService.entities.filter(e => !isRoot(e));
  if (entitiesToCopy.length === 0) return;
  const definitions = entitiesToCopy.map(e => {
    const def = { ...e.getDefinition() } as EntityDefinition & { typeName: string };
    delete def._ref;
    return def;
  });
  const jsonData = JSON.stringify(definitions);
  const prefix = "dreamlab clipboard";
  const output = `${prefix}\n${jsonData}`;
  try {
    await navigator.clipboard.writeText(output);
  } catch (err) {
    console.error("Failed to write to clipboard", err);
  }
}

function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Invalid data URL");
  }
  const mime = mimeMatch[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

async function addImageFromClipboard(imageData: string): Promise<void> {
  try {
    const blob = dataURLToBlob(imageData);
    const ext = getImageExtension(blob.type);
    const fileName = `assets/clipboard_${Date.now()}.${ext}`;
    const file = new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
    await createFile(fileName, file);
  } catch (err) {
    console.error("Error uploading image from clipboard", err);
  }
}

// so when repeatedly pasting we don't paste under the newly pasted result
let lastAutoselectedAfterPasteEntityRef: string | undefined = undefined;

export async function pasteEntitiesFromClipboard(
  game: ClientGame,
  selectedService: SelectedEntityService,
  pasteAtCursor = false,
): Promise<void> {
  const CLIPBOARD_PREFIX = "dreamlab clipboard";
  let text = "";

  try {
    text = await navigator.clipboard.readText();
  } catch (err) {
    console.error("Failed to read text from clipboard", err);
  }

  if (!text) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            text = await blobToDataURL(blob);
            break;
          }
        }
        if (text) break;
      }
      if (!text) return;
    } catch (err) {
      console.error("Failed to read clipboard items", err);
    }
  }

  const trimmed = text.trim();
  if (!trimmed.startsWith(CLIPBOARD_PREFIX)) {
    if (trimmed.startsWith("data:image/")) {
      await addImageFromClipboard(trimmed);
    } else {
      console.log("Clipboard data is not from Dreamlab. Aborting paste.");
    }
    return;
  }

  const jsonText = trimmed.slice(CLIPBOARD_PREFIX.length).trim();

  let definitions: unknown[];
  try {
    definitions = JSON.parse(jsonText, entityReviver);
    if (!Array.isArray(definitions)) {
      console.error("Clipboard data is not in the expected array format.");
      return;
    }
  } catch (err) {
    console.error("Failed to parse clipboard data as JSON", err);
    return;
  }

  // Compare a definition with an entity (by name and typeName)
  function isSameEntity(def: EntityDefinition & { typeName: string }, entity: Entity): boolean {
    return (
      def.name === entity.name &&
      def.typeName === Entity.getTypeName(entity.constructor as EntityConstructor)
    );
  }

  // Determine the target parent:
  let targetParent: Entity;
  if (selectedService.entities.length === 1) {
    const selected = selectedService.entities[0];
    // If only one definition was copied and it matches the selected entity,
    // then paste at its parent (if available).
    if (
      selected.parent &&
      ((definitions.length === 1 &&
        isSameEntity(definitions[0] as EntityDefinition & { typeName: string }, selected)) ||
        lastAutoselectedAfterPasteEntityRef === selected.ref)
    ) {
      targetParent = selected.parent;
    } else {
      targetParent = selected;
    }
  } else {
    const selected = selectedService.entities;
    const parents = selected
      .map(entity => entity.parent)
      .filter(parent => parent !== undefined);

    const allSameParent = parents.every(parent => parent === parents[0]);
    if (allSameParent) {
      targetParent = parents[0];
    } else {
      targetParent = game.world._.EditEntities._.world;
    }
  }

  const pastedEntities: Entity[] = [];

  // Recursively generate a mapping of old refs to new refs
  function generateRefMap(
    def: EntityDefinition & { typeName: string },
    map: Record<string, string> = {},
  ): Record<string, string> {
    if (def._ref) {
      map[def._ref] = Entity.createRef();
    }
    if (def.children && Array.isArray(def.children)) {
      for (const child of def.children as (EntityDefinition & { typeName: string })[]) {
        generateRefMap(child, map);
      }
    }
    return map;
  }

  // Recursively replace old refs with new ones in the definition tree
  function replaceRefsInDefinition(
    def: EntityDefinition & { typeName: string },
    map: Record<string, string>,
  ): EntityDefinition & { typeName: string } {
    const newDef = { ...def };
    if (newDef._ref && map[newDef._ref]) {
      newDef._ref = map[newDef._ref];
    }
    if (newDef.behaviors) {
      newDef.behaviors = newDef.behaviors.map(b => {
        const newB = { ...b };
        if (newB.values) {
          for (const key in newB.values) {
            const val = newB.values[key];
            if (typeof val === "string" && map[val]) {
              newB.values[key] = map[val];
            }
          }
        }
        return newB;
      });
    }
    if (newDef.children && Array.isArray(newDef.children)) {
      newDef.children = (newDef.children as (EntityDefinition & { typeName: string })[]).map(
        child => replaceRefsInDefinition(child, map),
      );
    }
    return newDef;
  }

  for (const def of definitions) {
    const definition = def as EntityDefinition & { typeName: string };
    if ("_ref" in definition) {
      delete definition._ref;
    }
    const refMap = generateRefMap(definition);
    const newDefinition = replaceRefsInDefinition(definition, refMap);
    if (!newDefinition.type) {
      console.error(
        "Entity definition missing constructor for typeName:",
        newDefinition.typeName,
      );
      continue;
    }

    // #region special case: complex collider
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    if (targetParent instanceof EditorFacadeComplexCollider) {
      const names = childrenSorted(targetParent).map(e => e.name);

      // only do special renaming if existing entity name is last child
      if (names.indexOf(newDefinition.name) !== names.length - 1) {
        const set = new Set<string>(names);

        const sourceName = newDefinition.name;
        let idx = 0;
        while (true) {
          if (idx >= alphabet.length) {
            // fall back to original logic if we run out of letters
            break;
          }

          const targetName = sourceName + alphabet[idx];
          if (set.has(targetName)) {
            idx++;
            continue;
          }

          newDefinition.name = targetName;
          break;
        }
      }
    }
    // #endregion

    const newEntity = targetParent.spawn(newDefinition);
    pastedEntities.push(newEntity);
  }
  const ops = pastedEntities.map(
    x =>
      ({
        t: "create-entity",
        parentRef: x.parent!.ref,
        def: x.getDefinition(),
      }) as UndoRedoOperation,
  );

  if (pastedEntities.length === 1) {
    selectedService.entities = [pastedEntities[0]];
    lastAutoselectedAfterPasteEntityRef = pastedEntities[0].ref;

    if (pasteAtCursor && game.inputs.cursor.world) {
      pastedEntities[0].pos = game.inputs.cursor.world;
    }
  }
  UndoRedoManager._.push({ t: "compound", ops } as unknown as UndoRedoOperation);
}
//#endregion

export function setupKeyboardShortcuts(
  game: ClientGame,
  selectedService: SelectedEntityService,
  editMode: boolean,
): void {
  if (!editMode) return;
  const cooldownManager = new CooldownManager();

  // Save project
  const saveProject = async (): Promise<void> => {
    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/save-edit-session/${game.instanceId}`;

    const saveButton = document.getElementById("save-button") as IconButton;
    if (!saveButton) return;

    const button = saveButton.querySelector("button")!;
    try {
      button.disabled = true;
      await fetch(url, { method: "POST" });

      button.style.backgroundColor = "rgb(var(--color-green) / 1)";
      saveButton.setIcon(Check);

      setTimeout(() => {
        button.style.backgroundColor = "";
        saveButton.setIcon(Save);
      }, 3000);
    } finally {
      button.disabled = false;
      if (game.instanceId !== NIL_UUID)
        window.parent.postMessage({ action: "reloadProject" }, "*");
    }
  };

  // #region Signal Listeners
  game.on(GizmoUpdateEnd, ({ entities }) => {
    UndoRedoManager._.push({
      t: "compound",
      ops: entities.map(({ entity, transform, previous }) => ({
        t: "transform-change",
        entityRef: entity.ref,
        transform,
        previous,
      })),
    } as unknown as UndoRedoOperation);
  });

  game.on(BoxResizeGizmoResizeEnd, ({ entity, previous: prev }) => {
    const transform = entity.globalTransform.bare();
    const previous = {
      ...transform,
      position: prev.position.bare(),
      scale: prev.scale.bare(),
    } satisfies ITransform;
    UndoRedoManager._.push({
      t: "transform-change",
      entityRef: entity.ref,
      transform,
      previous,
    } as unknown as UndoRedoOperation);
  });
  // #endregion

  // #region Key Events
  document.addEventListener("keydown", async (event: KeyboardEvent) => {
    if (document.activeElement instanceof HTMLInputElement) return;
    if (
      document.activeElement instanceof HTMLSpanElement &&
      document.activeElement.isContentEditable
    ) {
      return;
    }
    if ((window.getSelection()?.toString().length ?? 0) > 0) return;

    // Toggle entity enable/disable
    if (event.key === "e" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      for (const e of selectedService.entities) {
        if (isRoot(e)) continue;
        e.enabled = !e.enabled;
      }
      return;
    }

    // Copy
    if (event.key === "c" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      await copyEntitiesToClipboard(selectedService);
      return;
    }

    // Paste
    if (event.key.toLowerCase() === "v" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      await pasteEntitiesFromClipboard(game, selectedService, event.shiftKey);
      return;
    }

    // Duplicate
    if (event.key.toLowerCase() === "d" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      await copyEntitiesToClipboard(selectedService);
      await pasteEntitiesFromClipboard(game, selectedService);
      return;
    }

    // Cut
    if (event.key.toLowerCase() === "x" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const toCut = [...selectedService.entities].filter(it => !it.protected);
      filterChildNodes(toCut);
      await copyEntitiesToClipboard(selectedService);
      UndoRedoManager._.push({
        t: "compound",
        ops: toCut.map(e => ({
          t: "destroy-entity",
          def: e.getDefinition(),
          parentRef: e.parent?.ref!,
        })),
      });
      for (const entity of toCut) entity.destroy();
      return;
    }

    // Delete
    if (event.key === "Backspace" || event.key === "Delete") {
      const toDelete: Entity[] = [...selectedService.entities];
      filterChildNodes(toDelete);
      const ops = toDelete.map(
        x =>
          ({
            t: "destroy-entity",
            parentRef: x.parent!.ref,
            def: x.getDefinition(),
          }) as UndoRedoOperation,
      );

      for (const entity of toDelete) {
        entity.destroy();
      }
      UndoRedoManager._.push({ t: "compound", ops } as unknown as UndoRedoOperation);
      selectedService.entities = [];
      return;
    }

    // Undo
    if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
      if (
        !(
          document.activeElement &&
          ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (cooldownManager.isOnCooldown("undo")) return;

      const op = UndoRedoManager._.undo();
      const selectedEntityRefs = selectedService.entities.map(e => e.ref);
      if (op?.t === "create-entity" && selectedEntityRefs.includes(op.def._ref ?? ""))
        selectedService.entities = [];

      return;
    }

    // Redo
    if (event.key === "y" && (event.ctrlKey || event.metaKey)) {
      if (
        !(
          document.activeElement &&
          ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (cooldownManager.isOnCooldown("redo")) return;

      const op = UndoRedoManager._.redo();
      const selectedEntityRefs = selectedService.entities.map(e => e.ref);
      if (
        op?.t === "compound" &&
        op.ops.some(
          op => op.t === "destroy-entity" && selectedEntityRefs.includes(op.def._ref ?? ""),
        )
      )
        selectedService.entities = [];
      return;
    }

    // Save Project
    if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveProject();
      return;
    }

    // Up and Down Arrow Navigation
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (selectedService.entities.length === 0) return;

      event.preventDefault();
      const entries = Array.from(
        document.querySelectorAll(
          ":is(#scene-graph-tree, details[open]) > details[data-entity]",
        ),
      ) as HTMLElement[];
      if (entries.length === 0) return;

      const currentSelected = entries.find(entry => entry.classList.contains("selected"));
      let newIndex = 0;
      if (currentSelected) {
        const currentIndex = entries.indexOf(currentSelected);
        newIndex =
          event.key === "ArrowUp"
            ? Math.max(0, currentIndex - 1)
            : Math.min(entries.length - 1, currentIndex + 1);
      }
      const newSelected = entries[newIndex] as HTMLDetailsElement;
      const entityRef = newSelected.dataset.entity!;
      const entity = game.entities.lookupByRef(entityRef);

      if (entity) {
        const wasOpen = newSelected.open;
        const isRootEntity = isRoot(entity);

        selectedService.entities = [entity];

        if (isRootEntity) {
          setTimeout(() => {
            newSelected.open = wasOpen;
          }, 0);
        }
      }

      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (selectedService.entities.length !== 1) return;

      event.preventDefault();
      const entity = selectedService.entities[0];
      const entries = Array.from(
        document.querySelectorAll("details[data-entity]"),
      ) as HTMLDetailsElement[];
      const entryElement = entries.find(entry => entry.dataset.entity === entity.ref);
      if (!entryElement) return;

      if (event.key === "ArrowLeft") {
        entryElement.open = false;
      } else {
        entryElement.open = true;
      }

      return;
    }

    // Toggle locked state
    if (event.key === "L" && event.shiftKey && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const lockedEntities = selectedService.entities.filter(
        entity => EditorMetadataEntity.getInstanceFor(entity)?.locked,
      );
      const unlock = lockedEntities.length > 0;
      selectedService.entities.forEach(entity => {
        const metadata = EditorMetadataEntity.getInstanceFor(entity);
        if (!metadata) return;

        const prevLocked = metadata.locked;
        metadata.locked = !unlock;
        UndoRedoManager._.push({
          t: "modify-entity-locked",
          entityRef: entity.ref,
          locked: !unlock,
          previous: prevLocked,
        });
      });
      return;
    }

    if (event.key === "Escape") {
      selectedService.entities = [];
    }

    // Reset position (Alt+0)
    if (event.key === "0" && event.altKey) {
      event.preventDefault();
      const entitiesToReset = selectedService.entities.filter(e => !isRoot(e));
      if (entitiesToReset.length === 0) return;

      const ops = entitiesToReset.map(entity => {
        const previous = entity.globalTransform.bare();
        entity.transform.position.x = 0;
        entity.transform.position.y = 0;
        const transform = entity.globalTransform.bare();
        return {
          t: "transform-change",
          entityRef: entity.ref,
          transform,
          previous,
        } as UndoRedoOperation;
      });

      UndoRedoManager._.push({ t: "compound", ops } as unknown as UndoRedoOperation);
      return;
    }

    if (event.key === "t") {
      if (selectedService.entities.length === 1 && selectedService.entities[0].parent) {
        selectedService.entities = [selectedService.entities[0].parent];
      }
    }

    if (event.key === "a" && event.altKey) {
      event.preventDefault();

      // @ts-ignore using globals correctly to save time and energy
      globalThis.bottomBarSwitchTab("assistant");
      document.getElementById("assistant-viewer-content")?.focus();

      return;
    }

    if (event.key === "p" && event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      document.getElementById("play-button")?.click();
      return;
    }

    if (event.key === "o" && event.altKey) {
      event.preventDefault();
      event.stopPropagation();

      document.getElementById("stop-button")?.click();
      return;
    }
  });
  // #endregion
}
