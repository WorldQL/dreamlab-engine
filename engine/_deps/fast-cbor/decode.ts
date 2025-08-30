import { decodeUtf8From } from "./u8.ts";

interface Context {
  buf: Uint8Array;
  view: DataView | undefined;
  pos: number;
}

function readU8(ctx: Context): number {
  return ctx.buf[ctx.pos++];
}
function readU16(ctx: Context): number {
  return (ctx.buf[ctx.pos++] << 8) | ctx.buf[ctx.pos++];
}
function readU32(ctx: Context): number {
  return (
    (ctx.buf[ctx.pos++] << 24) |
    (ctx.buf[ctx.pos++] << 16) |
    (ctx.buf[ctx.pos++] << 8) |
    ctx.buf[ctx.pos++]
  );
}
function readU53(ctx: Context): number {
  const hi =
    (ctx.buf[ctx.pos++] << 24) |
    (ctx.buf[ctx.pos++] << 16) |
    (ctx.buf[ctx.pos++] << 8) |
    ctx.buf[ctx.pos++];
  const lo =
    (ctx.buf[ctx.pos++] << 24) |
    (ctx.buf[ctx.pos++] << 16) |
    (ctx.buf[ctx.pos++] << 8) |
    ctx.buf[ctx.pos++];
  return (hi >>> 0) * 0x100000000 + (lo >>> 0);
}

function readArg(ctx: Context, info: number): number {
  if (info < 24) return info;

  switch (info) {
    case 24:
      return readU8(ctx);
    case 25:
      return readU16(ctx);
    case 26:
      return readU32(ctx);
    case 27:
      return readU53(ctx);
    default:
      throw new Error(`invalid argument encoding (${info})`);
  }
}

function readF64(ctx: Context): number {
  const view = (ctx.view ??= new DataView(
    ctx.buf.buffer,
    ctx.buf.byteOffset,
    ctx.buf.byteLength,
  ));
  const v = view.getFloat64(ctx.pos);
  ctx.pos += 8;
  return v;
}

function readString(ctx: Context, length: number): string {
  // fast path for short ascii strings
  if (length < 24) {
    outer: do {
      const codes = new Array(length);
      for (let i = 0; i < length; i++) {
        const v = ctx.buf[ctx.pos + i];
        if (v & 0x80) break outer;
        codes[i] = v;
      }

      ctx.pos += length;
      return String.fromCharCode(...codes);
    } while (false);
  }

  const str = decodeUtf8From(ctx.buf, ctx.pos, length);
  ctx.pos += length;
  return str;
}

function readBytes(ctx: Context, length: number): Uint8Array {
  return ctx.buf.subarray(ctx.pos, (ctx.pos += length));
}

function readValue(ctx: Context): unknown {
  const header = readU8(ctx);
  const type = header >> 5;
  const info = header & 0x1f;

  switch (type) {
    case 0:
      return readArg(ctx, info);
    case 1:
      return -1 - readArg(ctx, info);
    case 2:
      return readBytes(ctx, readArg(ctx, info));
    case 3:
      return readString(ctx, readArg(ctx, info));
    case 4: {
      const len = readArg(ctx, info);
      const arr = new Array(len);
      for (let i = 0; i < len; i++) arr[i] = readValue(ctx);
      return arr;
    }
    case 5: {
      const len = readArg(ctx, info);
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < len; i++) {
        const keyHeader = readU8(ctx);
        const keyType = keyHeader >> 5;
        const keyInfo = keyHeader & 0x1f;
        if (keyType !== 3) throw new TypeError(`invalid map key type (${keyType}, ${keyInfo})`);

        const keyLen = readArg(ctx, keyInfo);
        const k = readString(ctx, keyLen);
        const v = readValue(ctx);

        if (k === "__proto__") {
          Reflect.defineProperty(obj, "__proto__", {
            enumerable: true,
            configurable: true,
            writable: true,
          });
        }

        obj[k] = v;
      }
      return obj;
    }
    case 7: {
      switch (info) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return undefined;
        case 27:
          return readF64(ctx);
        default:
          throw new Error(`unknown simple value (${info})`);
      }
    }
    default: {
      throw new TypeError(`unknown type (${type}, ${info})`);
    }
  }
}

export function decodeCBOR(buf: Uint8Array): unknown {
  const ctx: Context = { buf, view: undefined, pos: 0 };
  return readValue(ctx);
}
