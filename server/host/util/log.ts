import * as log from "@std/log";
import * as colors from "@std/fmt/colors";

export const info = (data: unknown, ...args: unknown[]) => {
  const logger = log.getLogger();
  logger.info(data, ...args);
};

export const debug = (data: unknown, ...args: unknown[]) => {
  const logger = log.getLogger();
  logger.debug(data, ...args);
};

export const warn = (data: unknown, ...args: unknown[]) => {
  const logger = log.getLogger();
  logger.warn(data, ...args);
};

export const error = (data: unknown, ...args: unknown[]) => {
  const logger = log.getLogger();
  logger.error(data, ...args);
};

export const setup = () => {
  try {
    Deno.mkdirSync("./logs");
  } catch {
    // ignore
  }

  const consoleFormatter = (record: log.LogRecord): string => {
    const separator = colors.black("|");

    let levelDisplay = `[${record.levelName.toLowerCase()}]`;

    switch (record.level) {
      case log.LogLevels.DEBUG:
        levelDisplay = colors.gray(levelDisplay);
        break;
      case log.LogLevels.INFO:
        levelDisplay = colors.green(levelDisplay);
        break;
      case log.LogLevels.WARN:
        levelDisplay = colors.yellow(levelDisplay);
        break;
      case log.LogLevels.ERROR:
        levelDisplay = colors.red(levelDisplay);
        break;
      case log.LogLevels.CRITICAL:
        levelDisplay = colors.bold(colors.red(levelDisplay));
        break;
      default:
        break;
    }

    let out = levelDisplay;
    if (record.msg) {
      out += " ";
      out += colors.brightWhite(record.msg);
    }

    if (record.args.length) {
      out += " ";
      if (record.msg) {
        out += separator;
        out += " ";
      }

      out += record.args
        .map(arg => {
          if (typeof arg === "object" && arg) {
            return Object.entries(arg)
              .map(
                ([k, v]) =>
                  colors.dim(colors.italic(k) + "=") +
                  Deno.inspect(v, {
                    colors: true,
                    compact: true,
                    breakLength: Infinity,
                  }),
              )
              .join(" ");
          } else {
            return Deno.inspect(arg, {
              colors: true,
              compact: true,
              breakLength: Infinity,
            });
          }
        })
        .join(" ");
    }

    return out;
  };

  log.setup({
    handlers: {
      console: new log.ConsoleHandler("DEBUG", {
        formatter: consoleFormatter,
      }),
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["console"],
      },
    },
  });
};
