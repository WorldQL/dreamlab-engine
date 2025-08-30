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
const textDecoder = new TextDecoder();

export function encodeUtf8Into(
  to: Uint8Array,
  str: string,
  offset?: number,
  length?: number,
): number {
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

export function decodeUtf8From(from: Uint8Array, offset?: number, length?: number) {
  let buffer: Uint8Array;

  if (offset === undefined) {
    buffer = from;
  } else if (length === undefined) {
    buffer = from.subarray(offset);
  } else {
    buffer = from.subarray(offset, offset + length);
  }

  return textDecoder.decode(buffer);
}
