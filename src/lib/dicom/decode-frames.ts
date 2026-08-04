import { Decoder } from 'jpeg-lossless-decoder-js';
import {
  getEncapsulatedFrameFragment,
  getRawFrame,
  isJpegLosslessTransferSyntax,
  ParsedDicom,
} from './parse-dicom';

export function decodeFrame(parsed: ParsedDicom, frameIndex: number): Uint8Array {
  if (isJpegLosslessTransferSyntax(parsed.metadata.transferSyntaxUID)) {
    const fragment = getEncapsulatedFrameFragment(parsed, frameIndex);
    const decoded = new Decoder().decompress(
      fragment.buffer as ArrayBuffer,
      fragment.byteOffset,
      fragment.length
    );
    return new Uint8Array(decoded);
  }

  return getRawFrame(parsed, frameIndex);
}
