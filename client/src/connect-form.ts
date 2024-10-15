import "@dreamlab/util/polyfills/with-resolvers.ts";

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

const InstanceInfoSchema = z.object({
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

export const createInstancePicker = async (worldId: string) => {
  const APIInstancesSchema = z.record(InstanceInfoSchema);

  const url = urlWithParams(new URL("/api/v1/instances", import.meta.env.SERVER_URL), {
    world: worldId,
  });
  const instances = await fetch(url)
    .then(r => r.json())
    .then(APIInstancesSchema.parse);

  const instanceListings: HTMLElement[] = [];
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

export const createConnectForm = async (worldId: string): Promise<DreamlabConnectForm> => {
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
  const instancePicker = await createInstancePicker(worldId);

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
    elem("section", {}, [elem("button", { className: "green" }, ["New Instance"])]),
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
        const instancePromise = fetch(
          new URL("/api/v1/start-play-world", import.meta.env.SERVER_URL),
          {
            method: "POST",
            body: JSON.stringify({ world_id: worldId }),
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
          .then(r => r.json())
          .then(InstanceInfoSchema.parse);

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
