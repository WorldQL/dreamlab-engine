import { urlWithParams } from "@dreamlab/util/url.ts";
import * as z from "@dreamlab/vendor/zod.ts";
import type { AuthToken } from "./auth.ts";
import { icon, X } from "../../editor/client/_icons.tsx";

type ConnectDetails = {
  readonly nickname: string;
  readonly serverUrl: string;
  readonly instanceId: string;
};

export type DreamlabConnectForm = {
  readonly element: DreamlabConnectFormElement;
  readonly onConnect: Promise<ConnectDetails>;
};

export class DreamlabConnectFormElement extends HTMLElement {
  static {
    customElements.define("dreamlab-connect-form", this);
  }

  static create(
    worldId: string,
    instances: APIInstancesResponse,
    current?: { auth: AuthToken; instance: string },
  ): DreamlabConnectForm {
    const nicknameInput = (
      <input
        type="text"
        id="nickname"
        name="nickname"
        placeholder="MyEpicUsername123"
        required
        maxLength={250}
        autocomplete="off"
      />
    ) as HTMLInputElement;

    const savedNickname = window.localStorage.getItem("dreamlab/nickname");
    if (savedNickname) {
      nicknameInput.value = savedNickname;
    }

    const instancePicker = this.#createInstancePicker(instances, current?.instance);
    const form = (
      <form>
        <section id="title">
          <h1>Select Server</h1>
          {current !== undefined && (
            <button formMethod="dialog" type="submit">
              {icon(X)}
            </button>
          )}
        </section>

        {current === undefined && (
          <section className="nickname-input">
            <label htmlFor={nicknameInput.id}>Nickname</label>
            {nicknameInput}
          </section>
        )}

        {instancePicker}
        <section>
          <button type="submit" id="new-instance">
            New Instance
          </button>
        </section>
      </form>
    ) as HTMLFormElement;

    const onConnect = Promise.withResolvers<ConnectDetails>();

    const dialog = document.createElement("dialog");
    // prevent dialog from being closed with ESC if not already connected to a game
    if (current === undefined) {
      document.addEventListener("keydown", ev => {
        if (!dialog.open) return;
        if (ev.key !== "Escape") return;
        ev.preventDefault();
      });

      dialog.addEventListener("cancel", ev => {
        ev.preventDefault();
      });
    }

    dialog.append(form);
    const connectForm = new DreamlabConnectFormElement(dialog);

    form.addEventListener("submit", e => {
      const { submitter } = e;
      if (submitter instanceof HTMLButtonElement && submitter.formMethod === "dialog") {
        return;
      }

      e.preventDefault();
      const valid = current === undefined ? form.checkValidity() : true;
      if (valid) {
        const nickname = current?.auth.nickname ?? nicknameInput.value;
        window.localStorage.setItem("dreamlab/nickname", nickname);

        const instanceSection = submitter?.closest("[data-instance]") as
          | HTMLElement
          | undefined;

        if (instanceSection) {
          const instance = instanceSection.dataset.instance!;
          const server = instanceSection.dataset.server!;
          connectForm.remove();
          onConnect.resolve({
            nickname,
            serverUrl: server,
            instanceId: instance,
          });
        } else {
          const instancePromise = spawnNewInstance(worldId);

          instancePromise.then(instance => {
            connectForm.remove();
            onConnect.resolve({
              nickname,
              serverUrl: instance.server,
              instanceId: instance.id,
            });
          });
        }
      }
    });

    // TODO: support custom element constructors in elem(..)
    return { element: connectForm, onConnect: onConnect.promise };
  }

  static #createInstancePicker(instances: APIInstancesResponse, current?: string): HTMLElement {
    // TODO: periodic refresh of instance listings
    return (
      <section className="instances">
        {Object.values(instances).map(instance => {
          const currentInstance = instance.id === current;
          return (
            <article data-instance={instance.id} data-server={instance.server}>
              <span>
                <strong>Players:</strong> <data>{instance.rich_status?.player_count ?? 0}</data>
              </span>
              <small>{instance.id}</small>
              <button type="submit" disabled={currentInstance}>
                {currentInstance ? "Connected" : "Connect"}
              </button>
            </article>
          );
        })}
      </section>
    ) as HTMLElement;
  }

  #dialog: HTMLDialogElement;
  constructor(dialog: HTMLDialogElement) {
    super();
    this.#dialog = dialog;
    this.append(dialog);
  }

  connectedCallback(): void {
    this.#dialog.showModal();
  }
}

type InstanceInfo = z.infer<typeof InstanceInfoSchema>;
export const InstanceInfoSchema = z.object({
  id: z.uuid(),
  server: z.string(),
  world: z.string(),
  status: z.string(),
  status_detail: z.string().nullable().optional(),
  started_by: z.string().nullable().optional(),
  edit_mode: z.boolean(),
  uptime_secs: z.number(),
  started_at: z.number().optional(),
  rich_status: z.any().optional(),
});

type APIInstancesResponse = z.infer<typeof APIInstancesSchema>;
const APIInstancesSchema = z.record(z.string(), InstanceInfoSchema);

export const fetchInstances = async (worldId: string): Promise<APIInstancesResponse> => {
  const base = globalThis.env.DREAMLAB_NEXT_PUBLIC_URL;
  const url = urlWithParams(new URL("/api/instances", base), {
    project: worldId,
  });
  const instances = await fetch(url)
    .then(r => r.json())
    .then(APIInstancesSchema.parse);

  const entries = Object.entries(instances);
  entries.sort((a, b) => {
    const playersA = a[1].rich_status?.player_count ?? 0;
    const playersB = b[1].rich_status?.player_count ?? 0;
    return playersB - playersA;
  });

  return Object.fromEntries(entries);
};

export const spawnNewInstance = async (worldId: string): Promise<InstanceInfo> => {
  const base = globalThis.env.DREAMLAB_MULTIPLAYER_PUBLIC_URL;
  return await fetch(new URL("/api/v1/start-play-world", base), {
    method: "POST",
    body: JSON.stringify({ world_id: worldId }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(r => r.json())
    .then(InstanceInfoSchema.parse);
};
