/**
 * Pure JavaScript ISO Base Media File Format (MP4 / 3GP) Inspector
 * Inspects:
 * 1. Box structure (moov vs mdat order for FastStart)
 * 2. Video codec (avc1 / H.264 check)
 * 3. Audio codec (mp4a / AAC check)
 * 4. Number of audio tracks (single audio track requirement)
 * 5. Resolution & Duration
 */

export interface Mp4InspectionResult {
  isMp4: boolean;
  majorBrand: string;
  hasFastStart: boolean; // moov is before mdat
  videoCodec?: string; // 'avc1' (H.264), 'hvc1' (HEVC), etc.
  audioCodec?: string; // 'mp4a' (AAC), etc.
  videoTracksCount: number;
  audioTracksCount: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  boxOrder: string[];
  rawDetails: string;
}

export async function inspectMp4(file: File): Promise<Mp4InspectionResult> {
  const result: Mp4InspectionResult = {
    isMp4: false,
    majorBrand: '',
    hasFastStart: false,
    videoTracksCount: 0,
    audioTracksCount: 0,
    boxOrder: [],
    rawDetails: '',
  };

  try {
    // Read up to 2MB to find top-level boxes
    const headerSize = Math.min(file.size, 2 * 1024 * 1024);
    const headerBuffer = await file.slice(0, headerSize).arrayBuffer();
    const dataView = new DataView(headerBuffer);

    let offset = 0;
    let moovOffset = -1;
    let mdatOffset = -1;
    let moovBuffer: ArrayBuffer | null = null;

    // Scan top-level boxes
    while (offset + 8 <= headerBuffer.byteLength) {
      let size = dataView.getUint32(offset);
      const type = getString(dataView, offset + 4, 4);

      if (size === 0) {
        // Extends to end of file
        size = file.size - offset;
      } else if (size === 1) {
        // 64-bit large size
        if (offset + 16 > headerBuffer.byteLength) break;
        const high = dataView.getUint32(offset + 8);
        const low = dataView.getUint32(offset + 12);
        size = high * 4294967296 + low;
      }

      result.boxOrder.push(type);

      if (type === 'ftyp') {
        result.isMp4 = true;
        result.majorBrand = getString(dataView, offset + 8, 4);
      } else if (type === 'moov') {
        moovOffset = offset;
        // If moov is within our header slice, capture it
        if (offset + size <= headerBuffer.byteLength) {
          moovBuffer = headerBuffer.slice(offset, offset + size);
        }
      } else if (type === 'mdat') {
        if (mdatOffset === -1) {
          mdatOffset = offset;
        }
      }

      if (size <= 0) break;
      offset += size;
    }

    // Check FastStart condition
    if (moovOffset !== -1 && mdatOffset !== -1) {
      result.hasFastStart = moovOffset < mdatOffset;
    } else if (moovOffset !== -1 && mdatOffset === -1) {
      // moov is in the first 2MB and mdat hasn't even started or is after
      result.hasFastStart = true;
    } else {
      // moov is likely at the end of the file (classic non-faststart MP4)
      result.hasFastStart = false;
    }

    // If moov was not in the first 2MB, fetch the moov from end of file if needed
    if (!moovBuffer && file.size > 2 * 1024 * 1024) {
      const tailSize = Math.min(file.size, 4 * 1024 * 1024);
      const tailBuffer = await file.slice(file.size - tailSize, file.size).arrayBuffer();
      const tailView = new DataView(tailBuffer);
      let tailOffset = 0;
      while (tailOffset + 8 <= tailBuffer.byteLength) {
        const size = tailView.getUint32(tailOffset);
        const type = getString(tailView, tailOffset + 4, 4);
        if (type === 'moov') {
          moovBuffer = tailBuffer.slice(tailOffset);
          break;
        }
        if (size <= 0) break;
        tailOffset += size;
      }
    }

    // Parse moov if available
    if (moovBuffer) {
      parseMoovBox(moovBuffer, result);
    }
  } catch (err) {
    console.warn('MP4 parsing warning:', err);
  }

  return result;
}

function parseMoovBox(buffer: ArrayBuffer, result: Mp4InspectionResult) {
  const view = new DataView(buffer);
  const len = buffer.byteLength;

  // Search for track boxes 'trak'
  let offset = 8; // skip 'moov' header
  while (offset + 8 <= len) {
    const size = view.getUint32(offset);
    const type = getString(view, offset + 4, 4);

    if (type === 'mvhd') {
      // movie header: extract duration
      try {
        const version = view.getUint8(offset + 8);
        const timeScaleOffset = version === 1 ? offset + 8 + 16 : offset + 8 + 8;
        const durationOffset = timeScaleOffset + 4;
        const timeScale = view.getUint32(timeScaleOffset);
        const duration = version === 1
          ? view.getUint32(durationOffset) * 4294967296 + view.getUint32(durationOffset + 4)
          : view.getUint32(durationOffset);
        if (timeScale > 0) {
          result.durationSeconds = Math.round((duration / timeScale) * 10) / 10;
        }
      } catch {
        // ignore
      }
    } else if (type === 'trak') {
      parseTrakBox(buffer.slice(offset, offset + (size > 0 ? size : len - offset)), result);
    }

    if (size <= 0) break;
    offset += size;
  }
}

function parseTrakBox(buffer: ArrayBuffer, result: Mp4InspectionResult) {
  const view = new DataView(buffer);
  const len = buffer.byteLength;

  // Scan through trak children
  let offset = 8;
  let isVideo = false;
  let isAudio = false;

  while (offset + 8 <= len) {
    const size = view.getUint32(offset);
    const type = getString(view, offset + 4, 4);

    if (type === 'tkhd') {
      try {
        // tkhd contains track width and height at offset 76/88
        const version = view.getUint8(offset + 8);
        const widthOffset = version === 1 ? offset + 8 + 80 : offset + 8 + 68;
        const w = view.getUint32(widthOffset) >> 16;
        const h = view.getUint32(widthOffset + 4) >> 16;
        if (w > 0 && h > 0) {
          result.width = w;
          result.height = h;
        }
      } catch {
        // ignore
      }
    } else if (type === 'mdia') {
      // Look inside mdia
      const mdiaOffset = offset + 8;
      let inner = mdiaOffset;
      while (inner + 8 <= offset + size && inner + 8 <= len) {
        const innerSize = view.getUint32(inner);
        const innerType = getString(view, inner + 4, 4);

        if (innerType === 'hdlr') {
          // handler type at inner + 16
          const handler = getString(view, inner + 16, 4);
          if (handler === 'vide') {
            isVideo = true;
          } else if (handler === 'soun') {
            isAudio = true;
          }
        } else if (innerType === 'minf') {
          // Look inside minf -> stbl -> stsd for codec
          parseMinfBox(view, inner, innerSize, (codec, isVid) => {
            if (isVid && !result.videoCodec) {
              result.videoCodec = codec;
            } else if (!isVid && !result.audioCodec) {
              result.audioCodec = codec;
            }
          });
        }

        if (innerSize <= 0) break;
        inner += innerSize;
      }
    }

    if (size <= 0) break;
    offset += size;
  }

  if (isVideo) result.videoTracksCount++;
  if (isAudio) result.audioTracksCount++;
}

function parseMinfBox(
  view: DataView,
  minfOffset: number,
  minfSize: number,
  onCodecFound: (codec: string, isVideo: boolean) => void
) {
  let offset = minfOffset + 8;
  const end = minfOffset + minfSize;

  while (offset + 8 <= end && offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    const type = getString(view, offset + 4, 4);

    if (type === 'stbl') {
      let stblOffset = offset + 8;
      const stblEnd = offset + size;
      while (stblOffset + 8 <= stblEnd && stblOffset + 8 <= view.byteLength) {
        const stblChildSize = view.getUint32(stblOffset);
        const stblChildType = getString(view, stblOffset + 4, 4);

        if (stblChildType === 'stsd') {
          // Sample description table
          // stsd box: 4 byte size, 4 byte 'stsd', 1 byte version, 3 byte flags, 4 byte entry_count
          if (stblOffset + 16 <= view.byteLength) {
            const entryCount = view.getUint32(stblOffset + 12);
            if (entryCount > 0) {
              // first sample entry starts at stblOffset + 16
              const entryFormat = getString(view, stblOffset + 20, 4);
              const isVideo = ['avc1', 'hvc1', 'hev1', 'vp09', 'av01', 'mp4v'].includes(entryFormat);
              onCodecFound(entryFormat, isVideo);
            }
          }
        }

        if (stblChildSize <= 0) break;
        stblOffset += stblChildSize;
      }
    }

    if (size <= 0) break;
    offset += size;
  }
}

function getString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    if (offset + i < view.byteLength) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
  }
  return str;
}
