import * as colors from "@std/fmt/colors";
import { LogSubscription } from "./log-store.ts";

const NO_COLOR = !!Deno.env.get("NO_COLOR");

export function printLogs(tag: string, sub: LogSubscription) {
  sub.on(entry => {
    if (entry.level === "stdout" || entry.level === "stderr") return; // already handled by worker stdio forwarding code

    const separator = colors.black("|");
    const formattedTag = colors.dim(`[${tag}]`);
    const levelColor = {
      debug: colors.gray,
      info: colors.green,
      warn: colors.yellow,
      error: colors.red,
    }[entry.level];
    const levelTag = levelColor(`${entry.level}`);

    let logMessage = `${formattedTag} ${levelTag} ${separator} ${colors.brightWhite(
      entry.message,
    )}`;
    if (entry.detail !== undefined) {
      logMessage += ` ${separator}`;
      for (const [key, value] of Object.entries(entry.detail)) {
        logMessage += colors.dim(colors.italic(` ${key}`) + "=");
        logMessage += Deno.inspect(value, {
          colors: !NO_COLOR,
          compact: true,
          breakLength: Infinity,
          strAbbreviateSize: Infinity,
        });
      }
    }
    console.log(logMessage);
  });
}
