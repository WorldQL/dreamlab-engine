import { element as elem } from "@dreamlab/ui";
import { validationError, ZodError } from "@dreamlab/vendor/zod.ts";

// TODO: there's a lot of code duplication here, but the differing types make it hard to reconcile

export function createInputField<T>({
  get,
  set,
  convert,
  convertBack = String,
  hook,
}: {
  get: () => T;
  set: (v: T) => void;
  convert: (s: string) => T | Promise<T>;
  convertBack?: (v: T) => string;
  hook?: (input: HTMLInputElement) => void;
}): [input: HTMLInputElement, refresh: () => void] {
  const input = elem("input", {
    type: "text",
    value: convertBack(get()),
  });

  input.addEventListener("input", async () => {
    let val: T;
    try {
      val = await convert(input.value);
      input.setCustomValidity("");
      set(val);
    } catch (err) {
      if (err instanceof Error) {
        let message = err.message;
        if (err instanceof ZodError) {
          message = validationError.fromError(err).message;
        }
        input.setCustomValidity(message);
      } else {
        input.setCustomValidity("Unknown error");
      }
    }
    input.reportValidity();
  });

  hook?.(input);

  return [
    input,
    () => {
      if (document.activeElement !== input) {
        input.value = convertBack(get());
      }
    },
  ];
}

export function createInputFieldWithDefault<T>({
  default: defaultValue,
  get,
  set,
  convert,
  convertBack = String,
}: {
  default: T | undefined;
  get: () => T | undefined;
  set: (v: T | undefined) => void;
  convert: (s: string) => T | Promise<T>;
  convertBack?: (v: T) => string;
}): [input: HTMLInputElement, refresh: () => void] {
  const input = elem("input", {
    type: "text",
    placeholder: defaultValue !== undefined ? convertBack(defaultValue) : "undefined",
  });

  input.addEventListener("input", async () => {
    if (input.value === "") {
      input.setCustomValidity("");
      set(undefined);
    } else {
      try {
        const val = await convert(input.value);
        input.setCustomValidity("");
        set(val);
      } catch (err) {
        if (err instanceof Error) {
          let message = err.message;
          if (err instanceof ZodError) message = validationError.fromError(err).message;
          input.setCustomValidity(message);
        } else {
          input.setCustomValidity("Unknown error");
        }
      }
    }

    input.reportValidity();
  });

  const refresh = () => {
    const currValue = get();
    if (currValue !== undefined) input.value = convertBack(currValue);
    else input.value = "";
    input.setCustomValidity("");
    input.reportValidity();
  };
  refresh();

  return [
    input,
    () => {
      if (document.activeElement !== input) refresh();
    },
  ];
}

export function createBooleanField({
  default: defaultValue,
  get,
  set,
}: {
  default: boolean;
  get: () => boolean | undefined;
  set: (v: boolean) => void;
}): [input: HTMLDivElement, refresh: () => void] {
  const getLabel = () => (get() ?? defaultValue ? "true" : "false");

  const label = elem("code", {}, [getLabel()]);
  const checkbox = elem("input", {
    type: "checkbox",
    checked: get() ?? defaultValue,
  });

  const container = elem("div", { className: "checkbox-input" }, [checkbox, label]);

  checkbox.addEventListener("input", () => {
    set(checkbox.checked);
    label.textContent = getLabel();
  });

  return [
    container,
    () => {
      checkbox.checked = get() ?? defaultValue;
      label.textContent = getLabel();
    },
  ];
}
