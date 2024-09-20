import {
  checkDataUrl,
  checkExtension,
  extensions,
  ExtensionType,
  LoaderParserPriority,
  type LoaderParser,
} from "npm:pixi.js@8.2.6";

const validAudioExtensions = [".mp3", ".wav", ".ogg"];
const validAudioMIMEs = ["audio/mpeg", "audio/wav", "audio/ogg"];

export const audioLoader = {
  name: "loadAudio",

  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadAudio",
  },

  test(url) {
    return checkDataUrl(url, validAudioMIMEs) || checkExtension(url, validAudioExtensions);
  },

  load(url) {
    return new Promise<string>((resolve, reject) => {
      const _howl = new Howl({
        src: [url],
        onload: () => {
          _howl.unload();
          resolve(url);
        },
        onloaderror: (_, err) => reject(err),
      });
    });
  },
} satisfies LoaderParser<string>;

extensions.add(audioLoader);

// TODO: Code split this?
export * from "npm:pixi.js@8.2.6";
