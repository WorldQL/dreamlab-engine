const ensurePresent = (name: string, value: string | undefined): string => {
  if (value === undefined) {
    throw new Error(`'${name}' unset!`);
  }

  return value;
};

const optional = (_name: string, value: string | undefined) => value;
const defaultsTo =
  (defaultValue: string) =>
  (_name: string, value: string | undefined): string =>
    value ?? defaultValue;

const number = (name: string, value: string | undefined): number => {
  return Number(ensurePresent(name, value));
};

const numberOr = (defaultValue: number) => (name: string, value: string | undefined) =>
  value ? number(name, value) : defaultValue;

const socketAddress =
  (defaultAddress: string) =>
  (name: string, value: string | undefined): { hostname: string; port: number } => {
    const address = value ?? defaultAddress;

    let url: URL;
    try {
      url = new URL(`tcp://${address}/`);
    } catch {
      throw new Error(`'${name}': "${address}" is an invalid bind address!`);
    }

    const port = Number(url.port);
    if (Number.isNaN(port)) {
      throw new Error(`${name}: port was not properly defined in "${address}"!`);
    }

    return {
      hostname: url.hostname,
      port,
    };
  };

function env(variable: string): string;
function env<T>(variable: string, transform: (name: string, value: string | undefined) => T): T;
function env<T = string>(
  name: string,
  transform?: (name: string, value: string | undefined) => T,
) {
  if (transform !== undefined) {
    return transform(name, Deno.env.get(name));
  }
  return ensurePresent(name, Deno.env.get(name));
}

export default Object.assign(env, {
  optional,
  ensurePresent,
  number,
  numberOr,
  socketAddress,
  defaultsTo,
});
