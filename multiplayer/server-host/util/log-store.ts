export type LogLevel = "error" | "warn" | "info" | "debug" | "stdout" | "stderr";

type LogDetails = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  timestamp: number; // ms from unix epoch (Date#getTime)
  message: string;
  detail: LogDetails | undefined;
}

const LOG_SUBSCRIPTIONS = Symbol();

export class LogSubscription {
  #store: LogStore;
  #listeners: ((entry: LogEntry) => void)[] = [];

  constructor(store: LogStore) {
    this.#store = store;
    this.#store[LOG_SUBSCRIPTIONS].add(this);
  }

  publish(entry: LogEntry) {
    for (const listener of this.#listeners) {
      listener(entry);
    }
  }

  on(listener: (entry: LogEntry) => void) {
    this.#listeners.push(listener);
  }

  unsubscribe() {
    this.#store[LOG_SUBSCRIPTIONS].delete(this);
  }
}

export class LogStore {
  [LOG_SUBSCRIPTIONS]: Set<LogSubscription> = new Set();
  entries: LogEntry[] = [];

  publish(entry: LogEntry) {
    this.entries.push(entry);

    for (const listener of this[LOG_SUBSCRIPTIONS]) {
      listener.publish(entry);
    }
  }

  subscribe(): LogSubscription {
    return new LogSubscription(this);
  }

  log(level: LogLevel, message: string, detail?: LogDetails) {
    this.publish({ level, message, timestamp: Date.now(), detail });
  }

  debug(message: string, detail?: LogDetails) {
    this.log("debug", message, detail);
  }

  info(message: string, detail?: LogDetails) {
    this.log("info", message, detail);
  }

  warn(message: string, detail?: LogDetails) {
    this.log("warn", message, detail);
  }

  error(message: string, detail?: LogDetails) {
    this.log("error", message, detail);
  }
}
