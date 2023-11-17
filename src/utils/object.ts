import rfdc from 'rfdc'

export const clone = rfdc()

export {
  deepKeys,
  deleteProperty,
  escapePath,
  getProperty,
  hasProperty,
  setProperty,
} from 'dot-prop'

export { default as onChange } from 'on-change'
