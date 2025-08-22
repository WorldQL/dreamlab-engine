import { concat, encodeUtf8Into } from "./u8.ts";

const MAX_TYPE_ARG_LEN = 9;
const CHUNK_SIZE = 512;

interface Context {
  chunks: Uint8Array[];
  buf: Uint8Array;
  view: DataView | undefined;
  pos: number;
  len: number;
}

function resizeIfNeeded(ctx: Context, needed: number): void {
  if (ctx.buf.byteLength < ctx.pos + needed) {
    ctx.chunks.push(ctx.buf.subarray(0, ctx.pos));
    ctx.len += ctx.pos;

    ctx.buf = new Uint8Array(Math.max(CHUNK_SIZE, needed));
    ctx.view = undefined;
    ctx.pos = 0;
  }
}

function writeU8(ctx: Context, val: number): void {
  ctx.buf[ctx.pos++] = val;
}

function writeU16(ctx: Context, val: number): void {
  let pos = ctx.pos;

  const buf = ctx.buf;

  buf[pos++] = val >>> 8;
  buf[pos++] = val & 0xff;

  ctx.pos = pos;
}

function writeU32(ctx: Context, val: number): void {
  let pos = ctx.pos;

  const buf = ctx.buf;

  buf[pos++] = val >>> 24;
  buf[pos++] = (val >>> 16) & 0xff;
  buf[pos++] = (val >>> 8) & 0xff;
  buf[pos++] = val & 0xff;

  ctx.pos = pos;
}

function writeU53(ctx: Context, val: number): void {
  let pos = ctx.pos;

  const buf = ctx.buf;

  const hi = (val / 2 ** 32) | 0;
  const lo = val >>> 0;

  buf[pos++] = hi >>> 24;
  buf[pos++] = (hi >>> 16) & 0xff;
  buf[pos++] = (hi >>> 8) & 0xff;
  buf[pos++] = hi & 0xff;

  buf[pos++] = lo >>> 24;
  buf[pos++] = (lo >>> 16) & 0xff;
  buf[pos++] = (lo >>> 8) & 0xff;
  buf[pos++] = lo & 0xff;

  ctx.pos = pos;
}

function writeF64(ctx: Context, val: number): void {
  const buf = ctx.buf;
  const view = (ctx.view ??= new DataView(buf.buffer, buf.byteOffset, buf.byteLength));

  view.setFloat64(ctx.pos, val);
  ctx.pos += 8;
}

function writeTypeAndArg(ctx: Context, type: number, arg: number): void {
  if (arg < 24) {
    writeU8(ctx, (type << 5) | arg);
  } else if (arg < 0x100) {
    writeU8(ctx, (type << 5) | 24);
    writeU8(ctx, arg);
  } else if (arg < 0x10000) {
    writeU8(ctx, (type << 5) | 25);
    writeU16(ctx, arg);
  } else if (arg < 0x100000000) {
    writeU8(ctx, (type << 5) | 26);
    writeU32(ctx, arg);
  } else {
    writeU8(ctx, (type << 5) | 27);
    writeU53(ctx, arg);
  }
}

function writeInt(ctx: Context, val: number): void {
  resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);

  if (val < 0) {
    writeTypeAndArg(ctx, 1, -val - 1);
  } else {
    writeTypeAndArg(ctx, 0, val);
  }
}

function writeFloat(ctx: Context, val: number): void {
  resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);

  writeU8(ctx, 0xe0 | 27);
  writeF64(ctx, val);
}

function writeNumber(ctx: Context, val: number): void {
  if (Number.isSafeInteger(val)) writeInt(ctx, val);
  else writeFloat(ctx, val);
}

function getHeaderLen(arg: number): number {
  return arg < 24 ? 1 : arg < 0x100 ? 2 : arg < 0x10000 ? 3 : arg < 0x100000000 ? 5 : 9;
}

function writeString(ctx: Context, val: string): void {
  const strLength = val.length;
  resizeIfNeeded(ctx, strLength * 3 + MAX_TYPE_ARG_LEN);

  // ascii fast-path: assume strLength === realLen, relocate header otherwise

  const estimatedHeaderSize = getHeaderLen(strLength);
  const estimatedPosition = ctx.pos + estimatedHeaderSize;
  const realLen = encodeUtf8Into(ctx.buf, val, estimatedPosition);

  const headerSize = getHeaderLen(realLen);
  if (estimatedHeaderSize !== headerSize) {
    ctx.buf.copyWithin(ctx.pos + headerSize, estimatedPosition, estimatedPosition + realLen);
  }

  writeTypeAndArg(ctx, 3, realLen);
  ctx.pos += realLen;
}

function writeBytes(ctx: Context, buf: Uint8Array): void {
  const len = buf.byteLength;

  resizeIfNeeded(ctx, len + MAX_TYPE_ARG_LEN);

  writeTypeAndArg(ctx, 2, len);
  ctx.buf.set(buf, ctx.pos);
  ctx.pos += len;
}

// deno-lint-ignore no-explicit-any
function writeValue(ctx: Context, val: any): void {
  switch (typeof val) {
    case "boolean": {
      resizeIfNeeded(ctx, 1);
      // @ts-expect-error boolean coercion
      writeU8(ctx, 0xf4 + (val & 1));
      return;
    }
    case "number": {
      writeNumber(ctx, val);
      return;
    }
    case "string": {
      writeString(ctx, val);
      return;
    }
    case "object": {
      if (val === null) {
        resizeIfNeeded(ctx, 1);
        writeU8(ctx, 0xf6);
        return;
      }

      if (Array.isArray(val)) {
        const len = val.length;
        resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);
        writeTypeAndArg(ctx, 4, len);

        for (let idx = 0; idx < len; idx++) {
          writeValue(ctx, val[idx]);
        }

        return;
      }

      if (val.constructor === Uint8Array) {
        writeBytes(ctx, val);
        return;
      }

      if (val.constructor === Object) {
        const keys = getObjectKeys(val);
        const len = keys.length;

        resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);
        writeTypeAndArg(ctx, 5, len);

        for (let idx = 0; idx < len; idx++) {
          const key = keys[idx];

          writeString(ctx, key);
          writeValue(ctx, val[key]);
        }

        return;
      }

      if ("toJSON" in val) {
        writeValue(ctx, val.toJSON());
        return;
      }
      if ("toCBOR" in val) {
        writeValue(ctx, val.toCBOR());
        return;
      }

      // TODO: support Map ?
    }
  }

  throw new TypeError(`unsupported type: ${typeof val} (${val?.constructor?.name})`);
}

function createContext(): Context {
  return {
    chunks: [],
    buf: new Uint8Array(CHUNK_SIZE),
    view: undefined,
    pos: 0,
    len: 0,
  };
}

export const encodeCBOR = (value: unknown): Uint8Array => {
  const ctx = createContext();

  writeValue(ctx, value);

  ctx.chunks.push(ctx.buf.subarray(0, ctx.pos));
  return concat(ctx.chunks, ctx.len + ctx.pos);
};

/** like object.keys but without undefined values */
const getObjectKeys = (obj: Record<string, unknown>): string[] => {
  const keys = Object.keys(obj);

  // in-place filter undefineds via read-ptr/write-ptr
  let w = 0;
  for (let r = 0; r < keys.length; r++) {
    const key = keys[r];
    if (obj[key] !== undefined) keys[w++] = key;
  }
  keys.length = w;

  return keys;
};
