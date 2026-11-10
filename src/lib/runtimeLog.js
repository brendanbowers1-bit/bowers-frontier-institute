const SERVICE = "br3n-web";

export function createRuntimeLog({ sink = console, service = SERVICE } = {}) {
  const emit = (level, event, error, extra = {}) => {
    const payload = {
      level,
      service,
      event,
      message: error instanceof Error ? error.message : String(error ?? event),
      researchOnly: true,
      noTradeExecution: true,
      ts: new Date().toISOString(),
    };
    if (extra.version) {
      payload.version = extra.version;
    }
    const line = JSON.stringify(payload);
    if (level === "error" && typeof sink.error === "function") {
      sink.error(line);
      return;
    }
    sink.log?.(line);
  };

  return {
    error(event, error, extra) {
      emit("error", event, error, extra);
    },
  };
}

export const runtimeLog = createRuntimeLog();

export function appVersion() {
  try {
    return import.meta.env?.VITE_APP_VERSION ?? "unknown";
  } catch {
    return "unknown";
  }
}
