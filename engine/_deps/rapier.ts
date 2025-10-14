import RAPIER from "npm:@dimforge/rapier2d-compat@0.19.1";
export * from "npm:@dimforge/rapier2d-compat@0.19.1";
export { default } from "npm:@dimforge/rapier2d-compat@0.19.1";

let initializing = false;
let initialized = false;

export async function initRapier(): Promise<void> {
  if (initializing) return;
  if (initialized) return;

  initializing = true;
  try {
    await RAPIER.init();
    initialized = true;
  } finally {
    initializing = false;
  }
}
