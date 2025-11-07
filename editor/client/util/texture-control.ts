import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import * as z from "@dreamlab/vendor/zod.ts";
import { ChevronDown, icon } from "../_icons.tsx";
import { createInputFieldWithDefault } from "./easy-input.ts";

interface TextureControlOptions {
  default?: string;
  get: () => string | undefined;
  set: (value: string | undefined) => void;
}

export function createTextureControl(
  game: ClientGame,
  opts: TextureControlOptions,
): [control: HTMLElement, refresh: () => void] {
  const container = elem("div", { className: "texture-control" });
  const imgPreview = elem("img", { className: "texture-preview hidden" });
  const dropdownButton = elem(
    "button",
    {
      type: "button",
      className: "texture-dropdown-button",
      title: "Select texture from files",
    },
    [icon(ChevronDown)],
  );

  const loadMediaFiles = async () => {
    try {
      const filesURL = new URL(connectionDetails.serverUrl);
      filesURL.pathname = `/api/v1/edit/${game.instanceId}/files`;
      const response = await fetch(filesURL);
      const data = await response.json();
      const files = data.files || data;
      return files.filter((file: string) =>
        [".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext =>
          file.toLowerCase().endsWith(ext),
        ),
      );
    } catch (error) {
      console.error("Failed to load media files:", error);
      return [];
    }
  };

  const selectFile = async (file: string) => {
    const resourceUrl = `res://${file}`;
    opts.set(resourceUrl);
    await updateImagePreview(resourceUrl);
  };

  let cachedFiles: string[] | null = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION = 5000;

  const openFileMenu = async (x: number, y: number) => {
    const now = Date.now();
    if (!cachedFiles || now - cacheTimestamp > CACHE_DURATION) {
      cachedFiles = await loadMediaFiles();
      cacheTimestamp = now;
    }

    const allFiles = cachedFiles || [];

    const textureMenu = elem("div", {
      className: "texture-file-menu",
      style: {
        left: `${x}px`,
        top: `${y}px`,
      },
    });

    if (allFiles.length === 0) {
      const noFilesItem = elem(
        "div",
        {
          className: "texture-file-item",
          ariaDisabled: "true",
        },
        ["No image files found"],
      );
      textureMenu.appendChild(noFilesItem);
    } else {
      const sortedFiles = [...allFiles].sort((a, b) => a.localeCompare(b));
      sortedFiles.forEach((file: string) => {
        const fileName = file.split("/").pop() || file;
        const fileItem = elem("div", { className: "texture-file-item" }, [fileName]);

        fileItem.addEventListener("click", () => {
          selectFile(file);
          textureMenu.remove();
        });

        textureMenu.appendChild(fileItem);
      });
    }

    document.body.appendChild(textureMenu);
    const rect = textureMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + rect.width > viewportWidth) {
      textureMenu.style.left = `${viewportWidth - rect.width - 10}px`;
    }
    if (y + rect.height > viewportHeight) {
      textureMenu.style.top = `${viewportHeight - rect.height - 10}px`;
    }

    const closeMenu = (event: Event) => {
      if (!textureMenu.contains(event.target as Node)) {
        textureMenu.remove();
        document.removeEventListener("click", closeMenu, true);
      }
    };
    setTimeout(() => document.addEventListener("click", closeMenu, true), 0);
  };

  const updateImagePreview = async (url: string) => {
    const hasTexture = !!url;
    imgPreview.classList.toggle("hidden", !hasTexture);
    container.classList.toggle("no-texture", !hasTexture);
    dropdownButton.classList.toggle("hidden", hasTexture);

    if (!hasTexture) {
      imgPreview.src = "";
      return;
    }

    try {
      const resolvedUrl = game.resolveResource(url);
      const texture = await PIXI.Assets.load(resolvedUrl);
      if (!(texture instanceof PIXI.Texture)) throw new TypeError("Not a texture");
      imgPreview.src = resolvedUrl;
    } catch {
      imgPreview.classList.add("hidden");
      container.classList.add("no-texture");
      imgPreview.src = "";
      dropdownButton.classList.remove("hidden");
    }
  };

  const [control, refreshInput] = createInputFieldWithDefault({
    default: opts.default,
    title: "Drag & drop an asset here, or enter a valid resource path (e.g., res://image.png)",
    get: opts.get,
    set: async v => {
      opts.set(v ?? "");
      await updateImagePreview(v ?? "");
    },
    convert: async value => {
      const url = z.literal("").or(z.url()).parse(value);
      await updateImagePreview(url);
      return url;
    },
  });

  const showFileMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as Element).getBoundingClientRect();
    openFileMenu(rect.left, rect.bottom + 4);
  };

  dropdownButton.addEventListener("click", showFileMenu);
  imgPreview.addEventListener("click", showFileMenu);
  imgPreview.style.cursor = "pointer";
  imgPreview.title = "Click to select a different texture";

  const getDraggedFile = (): string | undefined => {
    const dragTarget = document.querySelector(
      "[data-file][data-dragging]",
    ) as HTMLElement | null;
    return dragTarget?.dataset.file ? `res://${dragTarget.dataset.file}` : undefined;
  };

  container.addEventListener("dragover", ev => {
    if (getDraggedFile()) ev.preventDefault();
  });

  container.addEventListener("drop", async () => {
    container.dispatchEvent(new CustomEvent("input-begin"));
    const url = getDraggedFile();
    if (url) {
      opts.set(url);
      await updateImagePreview(url);
    }
    container.dispatchEvent(new CustomEvent("input-finalize"));
  });

  const refresh = () => {
    refreshInput();
    updateImagePreview(opts.get() ?? "");
  };

  updateImagePreview(opts.get() ?? "");
  container.append(imgPreview, dropdownButton, control);

  return [container, refresh];
}
