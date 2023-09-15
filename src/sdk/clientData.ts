export interface ClientData {
  readonly playerID: string
  readonly nickname: string

  readonly [key: string]: unknown
}
