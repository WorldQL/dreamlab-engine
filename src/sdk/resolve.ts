import type { LiteralUnion } from 'type-fest'

/**
 * Resolve a `world://` URL for static assets
 *
 * `world://` URLs refer to files in the current world's repository.
 * If any other URL (eg: `https://`) is passed, they will be returned as-is.
 *
 * @param url - `world://` URL
 */
export const resolve = (url: LiteralUnion<'world://', string>): string => {
  const prefix = 'world://'
  if (!url.startsWith(prefix)) return url

  const filename = url.slice(prefix.length)
  // @ts-expect-error Global
  return `${window.dreamlab_world_script_url_base}/${filename}`
}
