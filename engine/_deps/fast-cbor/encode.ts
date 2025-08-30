import { concat, encodeUtf8Into } from "./u8.ts";

const MAX_TYPE_ARG_LEN = 9;
const CHUNK_SIZE = 1024;

interface Context {
  chunks: Uint8Array[];
  buf: Uint8Array;
  view: DataView | undefined;
  pos: number;
  len: number;
}

function resizeIfNeeded(ctx: Context, needed: number): void {
  if (ctx.pos + needed <= ctx.buf.byteLength) return;

  ctx.chunks.push(ctx.buf.subarray(0, ctx.pos));
  ctx.len += ctx.pos;

  ctx.buf = new Uint8Array(needed < CHUNK_SIZE ? CHUNK_SIZE : needed);
  ctx.view = undefined;
  ctx.pos = 0;
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

  const hi = (val / 0x100000000) | 0;
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

// prettier-ignore
function getHeaderSize(arg: number): number {
  return arg < 24 ? 1
    : arg < 0x100 ? 2
    : arg < 0x10000 ? 3
    : arg < 0x100000000 ? 5
    : 9;
}

function writeString(ctx: Context, val: string): void {
  const strLength = val.length;

  // ascii fast path for small strings (likely object keys)
  if (strLength < 24 && ctx.buf.byteLength >= ctx.pos + strLength + 1) {
    outer: do {
      for (let i = 0, j = ctx.pos + 1; i < strLength; i++, j++) {
        const c = val.charCodeAt(i);
        if (c & 0x80) {
          break outer;
        }
        ctx.buf[j] = c;
      }

      ctx.buf[ctx.pos] = 0x60 | strLength; // === writeTypeAndArg(ctx, 3, strLength)
      ctx.pos += strLength + 1;
      return;
    } while (false);
  }

  resizeIfNeeded(ctx, strLength * 3 + MAX_TYPE_ARG_LEN);

  // assume strLength is approximately equal to realLen, relocate to after true header size otherwise

  const estimatedHeaderSize = getHeaderSize(strLength);
  const estimatedPosition = ctx.pos + estimatedHeaderSize;
  const realLen = encodeUtf8Into(ctx.buf, val, estimatedPosition);

  const headerSize = getHeaderSize(realLen);
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

function writeValue(ctx: Context, root: unknown): void {
  // deno-lint-ignore no-explicit-any
  const stack: any[] = [root];
  let sp: number = 1;

  while (sp > 0) {
    const val = stack[--sp];

    switch (typeof val) {
      case "boolean": {
        resizeIfNeeded(ctx, 1);
        // @ts-expect-error boolean coercion
        writeU8(ctx, 0xf4 + (val & 1));
        break;
      }
      case "number": {
        if (Number.isSafeInteger(val)) writeInt(ctx, val);
        else writeFloat(ctx, val);
        break;
      }
      case "string": {
        writeString(ctx, val);
        break;
      }
      case "undefined": {
        resizeIfNeeded(ctx, 1);
        writeU8(ctx, 0xf7);
        break;
      }
      // deno-lint-ignore no-fallthrough
      case "object": {
        if (val === null) {
          resizeIfNeeded(ctx, 1);
          writeU8(ctx, 0xf6);
          break;
        }

        if (Array.isArray(val)) {
          const len = val.length;
          resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);
          writeTypeAndArg(ctx, 4, len);

          // push backwards, so array pops in-order
          for (let idx = len - 1; idx >= 0; idx--) {
            stack[sp++] = val[idx];
          }

          break;
        }

        if (val.constructor === Object) {
          let len = 0;

          const keys = Object.keys(val);
          for (let i = keys.length - 1; i >= 0; i--) {
            const k = keys[i];
            const v = val[k];
            if (v !== undefined) {
              stack[sp++] = v;
              stack[sp++] = k;

              len++;
            }
          }

          resizeIfNeeded(ctx, MAX_TYPE_ARG_LEN);
          writeTypeAndArg(ctx, 5, len);

          break;
        }

        if (val.constructor === Uint8Array) {
          writeBytes(ctx, val);
          break;
        }

        if ("toCBOR" in val) {
          stack[sp++] = val.toCBOR();
          break;
        }

        if ("toJSON" in val) {
          stack[sp++] = val.toJSON();
          break;
        }
      }
      default: {
        throw new TypeError(`unsupported type: ${typeof val} (${val?.constructor?.name})`);
      }
    }
  }
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
