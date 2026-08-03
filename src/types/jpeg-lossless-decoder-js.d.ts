// jpeg-lossless-decoder-js@2.1.2 declares a "types" field in package.json pointing at
// release/lossless.d.ts, but that file isn't actually published in the package. Minimal
// ambient declaration for the surface we use.
declare module 'jpeg-lossless-decoder-js' {
  export class Decoder {
    decompress(buffer: ArrayBuffer, offset?: number, length?: number): ArrayBuffer;
  }
}
