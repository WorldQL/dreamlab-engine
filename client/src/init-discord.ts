export const getClientId = () => {
  const idMatches = /^(?<id>\d+)\.discordsays\.com$/.exec(window.location.host);
  const clientId = idMatches?.groups?.id;
  if (!clientId) throw new Error("failed to grab client id from url");

  return clientId;
};

const init = async () => {
  const clientId = getClientId();

  // WIP
};
