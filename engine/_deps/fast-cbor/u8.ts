export function concat(arrays: Uint8Array[], size?: number): Uint8Array {
  let written = 0;

  const len = arrays.length;
  let idx: number;

  if (size === undefined) {
    for (idx = size = 0; idx < len; idx++) {
      const chunk = arrays[idx];
      size += chunk.byteLength;
    }
  }

  const buffer = new Uint8Array(size);

  for (idx = 0; idx < len; idx++) {
    const chunk = arrays[idx];

    buffer.set(chunk, written);
    written += chunk.byteLength;
  }

  return buffer;
}

const textEncoder = new TextEncoder();

export function encodeUtf8Into(
  to: Uint8Array,
  str: string,
  offset?: number,
  length?: number,
): number {
  // ascii fast path for small strings (likely object keys)
  if (str.length < 32) {
    outer: do {
      let i = 0;
      let j = offset ?? 0;
      for (; i < str.length; i++, j++) {
        const c = str.charCodeAt(i);
        if (c & 0x80) {
          break outer;
        }
        to[j] = c;
      }
      return i;
    } while (false);
  }

  let buffer: Uint8Array;

  if (offset === undefined) {
    buffer = to;
  } else if (length === undefined) {
    buffer = to.subarray(offset);
  } else {
    buffer = to.subarray(offset, offset + length);
  }

  const result = textEncoder.encodeInto(str, buffer);

  return result.written;
}
