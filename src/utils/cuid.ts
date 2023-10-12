import { createId } from '@paralleldrive/cuid2'

// don't think we need all of the id types
export enum IDType {
  // AnimationTask = 'a',
  // Character = 'c',
  // GuestUser = 'g',
  // HandlePoint = 'h',
  // ImageTask = 'i',
  // Notification = 'n',
  Object = 'o',
  // User = 'u',
}

export const generateCUID = <T extends IDType>(type: T): `${T}_${string}` => {
  const id = createId()
  return `${type}_${id}`
}
