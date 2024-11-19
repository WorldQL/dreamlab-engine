import type { Action } from "./_crypto.ts";

export type PresignRequest = {
  _id: string;
  action: Action;
  scope: string;
  key: string;
};

export type PresignResponse = {
  _id: string;
  url: string;
};
