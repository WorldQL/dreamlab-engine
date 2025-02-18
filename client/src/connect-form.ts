import { element as elem } from "@dreamlab/ui";
import { urlWithParams } from "@dreamlab/util/url.ts";
import { z } from "@dreamlab/vendor/zod.ts";

class DreamlabConnectFormElement extends HTMLElement {}
customElements.define("dreamlab-connect-form", DreamlabConnectFormElement);

type ConnectDetails = { nickname: string; serverUrl: string; instanceId: string };
export interface DreamlabConnectForm {
  form: HTMLElement;
  onConnect: Promise<ConnectDetails>;
}

export const InstanceInfoSchema = z.object({
  id: z.string().uuid(),
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
type InstanceInfo = z.infer<typeof InstanceInfoSchema>;
const APIInstancesSchema = z.record(InstanceInfoSchema);
type APIInstancesResponse = z.infer<typeof APIInstancesSchema>;

export const fetchInstances = async (worldId: string): Promise<APIInstancesResponse> => {
  const base = globalThis.env.DREAMLAB_MULTIPLAYER_PUBLIC_URL;
  const url = urlWithParams(new URL("/api/v1/instances", base), {
    world: worldId,
  });
  const instances = await fetch(url)
    .then(r => r.json())
    .then(APIInstancesSchema.parse);

  return instances;
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

export const createInstancePicker = (instances: APIInstancesResponse) => {
  const instanceListings: HTMLElement[] = [];

  // TODO: periodic refresh of instance listings

  for (const instance of Object.values(instances)) {
    const instanceListing = elem("article", {}, [
      elem("span", {}, [
        elem("strong", {}, ["Players:"]),
        " ",
        elem("data", {}, [`${instance.rich_status?.player_count ?? 0}`]),
      ]),
      elem("small", {}, [instance.id]),
      elem("button", {}, ["Connect"]),
    ]);
    instanceListing.dataset.instance = instance.id;
    instanceListing.dataset.server = instance.server;

    instanceListings.push(instanceListing);
  }

  return elem("section", { className: "instances" }, instanceListings);
};

export const createConnectForm = (
  worldId: string,
  instances: APIInstancesResponse,
): DreamlabConnectForm => {
  const nicknameInput = elem(
    "input",
    {
      type: "text",
      id: "nickname",
      name: "nickname",
      placeholder: "MyEpicUsername123",
      required: true,
      maxLength: 250,
      autocomplete: "off",
    },
    [],
  );
  const instancePicker = createInstancePicker(instances);

  const savedNickname = window.localStorage.getItem("dreamlab/nickname");
  if (savedNickname) {
    nicknameInput.value = savedNickname;
  }

  const form = elem("form", {}, [
    elem("section", { className: "nickname-input" }, [
      elem("label", { htmlFor: nicknameInput.id }, ["Nickname"]),
      nicknameInput,
    ]),
    instancePicker,
    elem("section", {}, [
      elem("button", { id: "new-instance", className: "green" }, ["New Instance"]),
    ]),
  ]);

  const onConnect = Promise.withResolvers<ConnectDetails>();

  const connectForm = new DreamlabConnectFormElement();
  connectForm.append(form);

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (form.checkValidity()) {
      const nickname = nicknameInput.value;
      window.localStorage.setItem("dreamlab/nickname", nickname);

      const instanceSection = e.submitter?.closest("[data-instance]") as
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
  return { form: connectForm, onConnect: onConnect.promise };
};
