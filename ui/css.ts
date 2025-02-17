declare module "npm:csstype@3.1.3" {
  interface Properties {
    // allow any css custom properties
    [index: `--${string}`]: string;
  }
}

export type * from "npm:csstype@3.1.3";
