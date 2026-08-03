import { parseDicom as parseDicomBytes, readEncapsulatedImageFrame, DataSet, Element } from 'dicom-parser';

// v1 only supports the transfer syntaxes needed by our reference file (example_files/fish.dcm)
// plus uncompressed. See VOLUME_PLAN.md for what's explicitly out of scope.
const UNCOMPRESSED_TRANSFER_SYNTAXES = [
  '1.2.840.10008.1.2', // Implicit VR Little Endian
  '1.2.840.10008.1.2.1', // Explicit VR Little Endian
];

const JPEG_LOSSLESS_TRANSFER_SYNTAXES = [
  '1.2.840.10008.1.2.4.57', // JPEG Lossless, Nonhierarchical, Process 14
  '1.2.840.10008.1.2.4.70', // JPEG Lossless, Nonhierarchical, Process 14 [Selection Value 1]
];

export type DicomVolumeMetadata = {
  rows: number;
  columns: number;
  numFrames: number;
  samplesPerPixel: number;
  bitsAllocated: number;
  photometricInterpretation: string;
  transferSyntaxUID: string;
  // [row spacing, column spacing] in mm, per DICOM (0028,0030) ordering
  pixelSpacing: [number, number];
  spacingBetweenSlices: number;
  rescaleSlope: number;
  rescaleIntercept: number;
};

export type ParsedDicom = {
  dataSet: DataSet;
  pixelDataElement: Element;
  metadata: DicomVolumeMetadata;
};

export function isJpegLosslessTransferSyntax(transferSyntaxUID: string): boolean {
  return JPEG_LOSSLESS_TRANSFER_SYNTAXES.includes(transferSyntaxUID);
}

export function parseDicomVolume(byteArray: Uint8Array): ParsedDicom {
  const dataSet = parseDicomBytes(byteArray);

  const rows = dataSet.uint16('x00280010');
  const columns = dataSet.uint16('x00280011');
  const numFrames = dataSet.intString('x00280008') ?? 1;
  const samplesPerPixel = dataSet.uint16('x00280002') ?? 1;
  const bitsAllocated = dataSet.uint16('x00280100');
  const photometricInterpretation = dataSet.string('x00280004') ?? '';
  const transferSyntaxUID = dataSet.string('x00020010') ?? '';
  const pixelSpacingString = dataSet.string('x00280030');
  const [rowSpacing, columnSpacing] = (pixelSpacingString ?? '1\\1').split('\\').map(Number);
  const spacingBetweenSlices =
    dataSet.floatString('x00180088') ?? dataSet.floatString('x00180050') ?? 1;
  const rescaleSlope = dataSet.floatString('x00281053') ?? 1;
  const rescaleIntercept = dataSet.floatString('x00281052') ?? 0;

  if (rows === undefined || columns === undefined || bitsAllocated === undefined) {
    throw new Error('DICOM file is missing required pixel geometry tags (Rows/Columns/BitsAllocated).');
  }

  if (bitsAllocated !== 8) {
    throw new Error(`Unsupported BitsAllocated: ${bitsAllocated}. Only 8-bit volumes are currently supported.`);
  }

  if (samplesPerPixel !== 1) {
    throw new Error(
      `Unsupported SamplesPerPixel: ${samplesPerPixel}. Only single-channel (grayscale) volumes are currently supported.`
    );
  }

  if (
    !UNCOMPRESSED_TRANSFER_SYNTAXES.includes(transferSyntaxUID) &&
    !JPEG_LOSSLESS_TRANSFER_SYNTAXES.includes(transferSyntaxUID)
  ) {
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
      photometricInterpretation,
      transferSyntaxUID,
      pixelSpacing: [rowSpacing, columnSpacing],
      spacingBetweenSlices,
      rescaleSlope,
      rescaleIntercept,
    },
  };
}

// Uncompressed pixel data is one contiguous buffer; slice out the frame directly.
export function getRawFrame(parsed: ParsedDicom, frameIndex: number): Uint8Array {
  const { rows, columns, samplesPerPixel } = parsed.metadata;
  const frameSize = rows * columns * samplesPerPixel;
  const start = parsed.pixelDataElement.dataOffset + frameIndex * frameSize;
  return parsed.dataSet.byteArray.subarray(start, start + frameSize);
}

// Compressed (encapsulated) pixel data is stored as one fragment per frame with an offset table;
// dicom-parser resolves the fragment boundaries for us.
export function getEncapsulatedFrameFragment(parsed: ParsedDicom, frameIndex: number): Uint8Array {
  return readEncapsulatedImageFrame(parsed.dataSet, parsed.pixelDataElement, frameIndex);
}
