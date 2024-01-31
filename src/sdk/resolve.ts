import type { LiteralUnion } from 'type-fest'

/**
 * Resolve a `world://` URL to a world's `public` directory
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
