type Loading = {
  progress: number;
  element: HTMLDivElement;
  incr: () => void;
  remove: () => void;
};

const showLoading = ({ steps = 1 }: { steps?: number } = {}): Loading => {
  let progress = 0;

  const header = <h1>Loading...</h1>;
  header.style.margin = "0.8rem 0";

  const bar = <div></div>;
  bar.style.width = "100%";
  bar.style.maxWidth = "20rem";
  bar.style.height = "2rem";
  bar.style.outline = "2px solid rgb(255 255 255 / 80%)";
  bar.style.borderRadius = "5px";
  bar.style.setProperty("--fill-color", "white");

  const updateBar = () => {
    const percentage = progress / steps;
    if (percentage === 0) {
      bar.style.background = "transparent";
    } else if (percentage === 1) {
      bar.style.background = "var(--fill-color)";
    } else {
      bar.style.background = `linear-gradient(to right, var(--fill-color) 0%, var(--fill-color) ${percentage * 100}%, transparent ${percentage * 100 + 0.001}%, transparent 100%`;
    }
  };

  const container = (
    <div>
      {header}
      {bar}
    </div>
  );
  container.style.position = "absolute";
  container.style.top = "var(--top-bar)";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "calc(100dvh - var(--top-bar))";
  container.style.zIndex = "999999";
  container.style.backgroundColor = "rgb(var(--color-bg-0) / 1)";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  updateBar();
  document.body.appendChild(container);

  return {
    get progress() {
      return progress;
    },
    set progress(value) {
      progress = value;
      updateBar();
    },

    element: container as HTMLDivElement,
    incr: () => {
      progress += 1;
      updateBar();
    },
    remove: () => {
      container.remove();
    },
  };
};

export const init = async () => {
  const loading = showLoading({ steps: 4 });

  console.log("starting loading screen");

  // load scripts **after** showing loading
  const [
    { GameStatus, GameStatusChange },
    { urlToHTTP, urlToWebSocket },
    { auth, generateMigrateUrl },
    { DreamlabConnectFormElement, fetchInstances, spawnNewInstance },
    { startGame },
    { connectionDetails, setConnectionDetails },
    { icon, Server },
  ] = await Promise.all([
    import("@dreamlab/engine"),
    import("@dreamlab/util/url.ts"),
    import("./auth.ts"),
    import("./connect-form.tsx"),
    import("./start-game.ts"),
    import("./util/server-url.ts"),
    import("../../editor/client/_icons.tsx"),
  ]);
  loading.incr();

  const topbar = document.querySelector<HTMLDivElement>("div#topbar")!;
  const emojistatus = topbar.querySelector<HTMLSpanElement>("span#emoji-status")!;
  const textstatus = topbar.querySelector<HTMLSpanElement>("span#text-status")!;
  const signin = topbar.querySelector<HTMLDivElement>("div#sign-in")!;

  if (globalThis.env.DREAMLAB_CLIENT_DISABLE_TOP_BAR) {
    topbar.style.display = "none";
    topbar.parentElement!.style.setProperty("--top-bar", "0px");
  }

  let nickname =
    window.localStorage.getItem("dreamlab/nickname") ??
    "Player" + Math.floor(Math.random() * 999) + 1;

  if (connectionDetails.instanceId === "") {
    const searchParams = new URLSearchParams(window.location.search);
    const projectId = searchParams.get("projectId");
    if (projectId === null) {
      alert("Missing a projectId or a connect URL");
      throw new Error();
    }

    const instances = await fetchInstances(projectId);
    const connectForm = DreamlabConnectFormElement.create(projectId, instances);
    const instanceCount = Object.values(instances).length;
    if (instanceCount === 0) {
      const instance = await spawnNewInstance(projectId);
      setConnectionDetails({ instanceId: instance.id, serverUrl: instance.server });
    } else if (
      instanceCount === 1 ||
      new URLSearchParams(window.location.search).has("autojoin")
    ) {
      const instance = Object.values(instances)[0];
      setConnectionDetails({ instanceId: instance.id, serverUrl: instance.server });
    } else {
      document.body.prepend(connectForm.element);
      const { serverUrl, instanceId, nickname: nickname_ } = await connectForm.onConnect;
      setConnectionDetails({ instanceId, serverUrl: urlToHTTP(serverUrl).toString() });
      nickname = nickname_;
    }
  }

  const info = await auth(nickname);

  if (info.guest) {
    const span = document.createElement("span");
    span.textContent = "Guest User ";

    const a = document.createElement("a");
    a.href = generateMigrateUrl(info.playerId);
    a.textContent = "[Sign In]";

    signin.append(span, a);
  } else {
    const span = document.createElement("span");
    span.textContent = info.nickname === "Guest" ? "" : info.nickname;
    signin.append(span);
  }
  loading.incr();

  const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
  connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
  // TODO: connect with an auth token instead, if one is passed via search params
  connectUrl.searchParams.set("token", info.token);
  connectUrl.searchParams.set("player_id", info.playerId);
  connectUrl.searchParams.set("nickname", info.nickname);

  startGame(
    connectUrl,
    connectionDetails.instanceId,
    game => {
      loading.incr();
      game.on(GameStatusChange, () => {
        if (game.status === GameStatus.LoadingFinished) loading.incr();
        if (game.status === GameStatus.Running) loading.remove();
      });

      // success
      emojistatus.textContent = "🟢";
      textstatus.textContent = "Connected";

      const standalone = !!globalThis.env.DREAMLAB_MULTIPLAYER_STANDALONE;
      const disablePicker = !!globalThis.env.DREAMLAB_CLIENT_DISABLE_SERVER_PICKER;

      const serverButton =
        disablePicker || standalone ? undefined : (
          <button type="button" id="server-selector">
            {icon(Server)}
          </button>
        );

      const gameName = (
        <div id="game-info">
          <code data-instance={game.instanceId}>{game.worldId.split("/").at(1)}</code>{" "}
          {serverButton}
        </div>
      );

      serverButton?.addEventListener("click", async () => {
        const instances = await fetchInstances(game.worldId);
        const form = DreamlabConnectFormElement.create(game.worldId, instances, {
          auth: info,
          instance: game.instanceId,
        });

        document.body.append(form.element);
        const details = await form.onConnect;

        const url = new URL(window.location.href);
        for (const key of url.searchParams.keys()) {
          url.searchParams.delete(key);
        }

        url.searchParams.set("server", details.serverUrl);
        url.searchParams.set("instance", details.instanceId);

        window.location.href = url.toString();
      });

      signin.before(gameName);
    },
    () => {
      loading.remove();

      emojistatus.textContent = "🔴";
      textstatus.textContent = "Connection Failed";
      // error
    },
  );
};

await init();
