import { element as elem } from "@dreamlab/ui";
import { validationError, ZodError } from "@dreamlab/vendor/zod.ts";

export function createInputField<T>({
  get,
  set,
  convert,
  convertBack = String,
}: {
  get: () => T;
  set: (v: T) => void;
  convert: (s: string) => T;
  convertBack?: (v: T) => string;
}): [input: HTMLInputElement, refresh: () => void] {
  const input = elem("input", {
    type: "text",
    value: convertBack(get()),
  });

  input.addEventListener("input", () => {
    let val: T;
    try {
      val = convert(input.value);
      input.setCustomValidity("");
      set(val);
    } catch (err) {
      if (err instanceof Error) {
        console.log(err);
        let message = err.message;
        if (err instanceof ZodError) {
          message = validationError.fromError(err).message;
        }
        input.setCustomValidity(message);
      } else {
        console.log(err);
        input.setCustomValidity("Unknown error");
      }
    }
    input.reportValidity();
  });

  return [
    input,
    () => {
      if (document.activeElement !== input) {
        input.value = convertBack(get());
      }
    },
  ];
}
