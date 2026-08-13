import { parseDicom as parseDicomBytes, readEncapsulatedImageFrame, DataSet, Element } from 'dicom-parser';

const UNCOMPRESSED_TRANSFER_SYNTAXES = [
  '1.2.840.10008.1.2', // Implicit VR Little Endian
  '1.2.840.10008.1.2.1', // Explicit VR Little Endian
];

const JPEG_LOSSLESS_TRANSFER_SYNTAXES = [
  '1.2.840.10008.1.2.4.57', // JPEG Lossless, Nonhierarchical, Process 14
  '1.2.840.10008.1.2.4.70', // JPEG Lossless, Nonhierarchical, Process 14 [Selection Value 1]
];

const SUPPORTED_BITS_ALLOCATED = [8, 16, 32];

// Raw per-frame sample data, typed according to BitsAllocated/PixelRepresentation.
export type TypedSampleArray = Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array;

export type DicomVolumeMetadata = {
  rows: number;
  columns: number;
  numFrames: number;
  samplesPerPixel: number;
  bitsAllocated: number;
  // 0 = unsigned, 1 = signed (two's complement), per DICOM (0028,0103).
  pixelRepresentation: number;
  photometricInterpretation: string;
  transferSyntaxUID: string;
  // [row spacing, column spacing] in mm, per DICOM (0028,0030) ordering
  pixelSpacing: [number, number];
  spacingBetweenSlices: number;
  rescaleSlope: number;
  rescaleIntercept: number;
  // DICOM-suggested display window (0028,1050 / 0028,1051), first value only if multi-valued.
  windowCenter: number | null;
  windowWidth: number | null;
};

export type ParsedDicom = {
  dataSet: DataSet;
  pixelDataElement: Element;
  metadata: DicomVolumeMetadata;
};

export function isJpegLosslessTransferSyntax(transferSyntaxUID: string): boolean {
  return JPEG_LOSSLESS_TRANSFER_SYNTAXES.includes(transferSyntaxUID);
}

function firstMultiValue(value: string | undefined): number | null {
  if (value === undefined) return null;
  const first = parseFloat(value.split('\\')[0]);
  return Number.isNaN(first) ? null : first;
}

export function parseDicomVolume(byteArray: Uint8Array): ParsedDicom {
  const dataSet = parseDicomBytes(byteArray);

  const rows = dataSet.uint16('x00280010');
  const columns = dataSet.uint16('x00280011');
  const numFrames = dataSet.intString('x00280008') ?? 1;
  const samplesPerPixel = dataSet.uint16('x00280002') ?? 1;
  const bitsAllocated = dataSet.uint16('x00280100');
  const pixelRepresentation = dataSet.uint16('x00280103') ?? 0;
  const photometricInterpretation = dataSet.string('x00280004') ?? '';
  const transferSyntaxUID = dataSet.string('x00020010') ?? '';
  const pixelSpacingString = dataSet.string('x00280030');
  const [rowSpacing, columnSpacing] = (pixelSpacingString ?? '1\\1').split('\\').map(Number);
  const spacingBetweenSlices =
    dataSet.floatString('x00180088') ?? dataSet.floatString('x00180050') ?? 1;
  const rescaleSlope = dataSet.floatString('x00281053') ?? 1;
  const rescaleIntercept = dataSet.floatString('x00281052') ?? 0;
  const windowCenter = firstMultiValue(dataSet.string('x00281050'));
  const windowWidth = firstMultiValue(dataSet.string('x00281051'));

  if (rows === undefined || columns === undefined || bitsAllocated === undefined) {
    throw new Error('DICOM file is missing required pixel geometry tags (Rows/Columns/BitsAllocated).');
  }

  const isJpegLossless = JPEG_LOSSLESS_TRANSFER_SYNTAXES.includes(transferSyntaxUID);

  if (!SUPPORTED_BITS_ALLOCATED.includes(bitsAllocated)) {
    throw new Error(`Unsupported BitsAllocated: ${bitsAllocated}. Only 8/16/32-bit volumes are supported.`);
  }

  // jpeg-lossless-decoder-js caps sample precision at 16 bits (its `mask`/`outputData` handling
  // treats any >1-byte sample as 16-bit) — 32-bit + JPEG Lossless would silently truncate/corrupt
  // data rather than decode it correctly, so reject it explicitly instead.
  if (bitsAllocated === 32 && isJpegLossless) {
    throw new Error(
      'Unsupported combination: 32-bit BitsAllocated with JPEG Lossless transfer syntax ' +
        `(${transferSyntaxUID}). 32-bit volumes are only supported with an uncompressed transfer syntax.`
    );
  }

  if (samplesPerPixel !== 1) {
    throw new Error(
      `Unsupported SamplesPerPixel: ${samplesPerPixel}. Only single-channel (grayscale) volumes are currently supported.`
    );
  }

  if (!UNCOMPRESSED_TRANSFER_SYNTAXES.includes(transferSyntaxUID) && !isJpegLossless) {
    throw new Error(
      `Unsupported Transfer Syntax UID: ${transferSyntaxUID}. Supported: uncompressed Explicit/Implicit VR ` +
        'Little Endian, and JPEG Lossless (1.2.840.10008.1.2.4.57 / .70).'
    );
  }

  const pixelDataElement = dataSet.elements.x7fe00010;
  if (!pixelDataElement) {
    throw new Error('DICOM file has no pixel data (7FE0,0010).');
  }

  return {
    dataSet,
    pixelDataElement,
    metadata: {
      rows,
      columns,
      numFrames,
      samplesPerPixel,
      bitsAllocated,
      pixelRepresentation,
      photometricInterpretation,
      transferSyntaxUID,
      pixelSpacing: [rowSpacing, columnSpacing],
      spacingBetweenSlices,
      rescaleSlope,
      rescaleIntercept,
      windowCenter,
      windowWidth,
    },
  };
}

// Uncompressed pixel data is one contiguous buffer; slice out the frame directly, typed according
// to BitsAllocated/PixelRepresentation.
export function getRawFrame(parsed: ParsedDicom, frameIndex: number): TypedSampleArray {
  const { rows, columns, samplesPerPixel, bitsAllocated, pixelRepresentation } = parsed.metadata;
  const samplesPerFrame = rows * columns * samplesPerPixel;
  const bytesPerSample = bitsAllocated / 8;
  const frameOffsetInArray = parsed.pixelDataElement.dataOffset + frameIndex * samplesPerFrame * bytesPerSample;
  const frameByteLength = samplesPerFrame * bytesPerSample;
  const byteArray = parsed.dataSet.byteArray;

  if (bitsAllocated === 8) {
    return byteArray.subarray(frameOffsetInArray, frameOffsetInArray + frameByteLength);
  }

  // Typed array views require a byteOffset aligned to their element size. DICOM doesn't formally
  // guarantee that a given frame lands on such a boundary within the file's backing buffer (even
  // though it holds in every real file seen so far), so fall back to a copy when it doesn't.
  const absoluteByteOffset = byteArray.byteOffset + frameOffsetInArray;
  const aligned = absoluteByteOffset % bytesPerSample === 0;
  const sourceBuffer = aligned
    ? byteArray.buffer
    : byteArray.slice(frameOffsetInArray, frameOffsetInArray + frameByteLength).buffer;
  const sourceByteOffset = aligned ? absoluteByteOffset : 0;

  if (bitsAllocated === 16) {
    return pixelRepresentation === 1
      ? new Int16Array(sourceBuffer, sourceByteOffset, samplesPerFrame)
      : new Uint16Array(sourceBuffer, sourceByteOffset, samplesPerFrame);
  }

  return pixelRepresentation === 1
    ? new Int32Array(sourceBuffer, sourceByteOffset, samplesPerFrame)
    : new Uint32Array(sourceBuffer, sourceByteOffset, samplesPerFrame);
}

// Compressed (encapsulated) pixel data is stored as one fragment per frame with an offset table;
// dicom-parser resolves the fragment boundaries for us.
export function getEncapsulatedFrameFragment(parsed: ParsedDicom, frameIndex: number): Uint8Array {
  return readEncapsulatedImageFrame(parsed.dataSet, parsed.pixelDataElement, frameIndex);
}
