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

export type SignRequest = {
  _id: string;
  action: Action;
  scope: string;
  key: string;
}[];

export type SignResponse = {
  _id: string;
  url: string;
  payload: string;
  sig: string;
}[];
