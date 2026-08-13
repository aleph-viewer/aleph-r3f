import { Decoder } from 'jpeg-lossless-decoder-js';
import {
  getEncapsulatedFrameFragment,
  getRawFrame,
  isJpegLosslessTransferSyntax,
  ParsedDicom,
  TypedSampleArray,
} from './parse-dicom';

export function decodeFrame(parsed: ParsedDicom, frameIndex: number): TypedSampleArray {
  const { bitsAllocated, pixelRepresentation } = parsed.metadata;

  if (isJpegLosslessTransferSyntax(parsed.metadata.transferSyntaxUID)) {
    const fragment = getEncapsulatedFrameFragment(parsed, frameIndex);
    const decoded = new Decoder().decompress(
      fragment.buffer as ArrayBuffer,
      fragment.byteOffset,
      fragment.length
    );

    if (bitsAllocated === 8) {
      return new Uint8Array(decoded);
    }

    // The codec has no notion of DICOM signedness and always outputs unsigned 16-bit samples;
    // reinterpret as signed here if PixelRepresentation says so.
    return pixelRepresentation === 1 ? new Int16Array(decoded) : new Uint16Array(decoded);
  }

  return getRawFrame(parsed, frameIndex);
}
