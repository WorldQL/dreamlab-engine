/**
 * Resolve a `world://` URL to a world's `public` directory
 *
 * @param url - `world://` URL
 */
export const resolve = (url: string): string => {
  // eslint-disable-next-line n/prefer-global/url
  const uri = new URL(url)
  if (uri.protocol !== 'world') return url

  // TODO: Grab base URL of world
  return ''
}
