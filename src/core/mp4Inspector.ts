/**
 * Pure TypeScript MP4 / QuickTime ISO Base Media File Format Inspector
 *
 * Inspects:
 * 1. Box structure (moov vs mdat order for FastStart)
 * 2. Video codec (avc1 / H.264, hvc1, etc.)
 * 3. H.264 Profile (Main / Baseline / High) & Level
 * 4. B-frames detection (ctts atom in stbl)
 * 5. Audio codec (mp4a / AAC check)
 * 6. Number of audio tracks (single audio track requirement)
 * 7. Resolution & Duration
 */

export interface Mp4InspectionResult {
  isMp4: boolean;
  majorBrand: string;
  hasFastStart: boolean; // moov is before mdat
  videoCodec?: string; // 'avc1' (H.264), 'hvc1' (HEVC), etc.
  h264Profile?: 'Baseline' | 'Main' | 'High' | 'Extended' | 'High 10' | 'High 4:2:2' | 'Unknown';
  h264ProfileIndication?: number;
  h264Level?: string; // e.g. '3.0', '3.1', '4.0', '4.1'
  hasBframes?: boolean; // presence of 'ctts' box in video track stbl
  audioCodec?: string; // 'mp4a' (AAC), etc.
  videoTracksCount: number;
  audioTracksCount: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
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
    let currentOffset = 0;
    let moovOffset = -1;
    let mdatOffset = -1;
    let moovBuffer: ArrayBuffer | null = null;

    // Traverse root boxes using sequential seek (reading 16-byte headers per box).
    // This scales to arbitrarily large files (20MB, 100MB, 2GB) in sub-millisecond time.
    while (currentOffset + 8 <= file.size) {
      const headerSlice = await file.slice(currentOffset, currentOffset + 16).arrayBuffer();
      if (headerSlice.byteLength < 8) break;
      const view = new DataView(headerSlice);

      let size = view.getUint32(0);
      const type = getString(view, 4, 4);

      if (size === 1) {
        // 64-bit large box size
        if (headerSlice.byteLength < 16) break;
        const high = view.getUint32(8);
        const low = view.getUint32(12);
        size = high * 4294967296 + low;
      } else if (size === 0) {
        // Extends to EOF
        size = file.size - currentOffset;
      }

      result.boxOrder.push(type);

      if (type === 'ftyp') {
        result.isMp4 = true;
        if (headerSlice.byteLength >= 12) {
          result.majorBrand = getString(view, 8, 4);
        }
      } else if (type === 'moov') {
        moovOffset = currentOffset;
        const moovSize = Math.min(size, file.size - currentOffset);
        moovBuffer = await file.slice(currentOffset, currentOffset + moovSize).arrayBuffer();
      } else if (type === 'mdat') {
        if (mdatOffset === -1) {
          mdatOffset = currentOffset;
        }
      }

      if (size <= 0) break;
      currentOffset += size;

      // If we found both moov and mdat, stop scanning further
      if (moovBuffer && mdatOffset !== -1) {
        break;
      }
    }

    // Secondary fallback: if moov wasn't found by forward seek (e.g. mdat size was 0 or corrupted),
    // scan the last 8MB for the byte signature 'moov' (0x6d 0x6f 0x6f 0x76)
    if (!moovBuffer && file.size > 8) {
      const tailSize = Math.min(file.size, 8 * 1024 * 1024);
      const tailOffset = file.size - tailSize;
      const tailBuffer = await file.slice(tailOffset, file.size).arrayBuffer();
      const tailBytes = new Uint8Array(tailBuffer);

      for (let i = 4; i + 8 <= tailBytes.length; i++) {
        if (
          tailBytes[i] === 0x6d &&
          tailBytes[i + 1] === 0x6f &&
          tailBytes[i + 2] === 0x6f &&
          tailBytes[i + 3] === 0x76
        ) {
          // Verify sub-box header at i + 8 is a valid moov child (mvhd or trak)
          const subType = String.fromCharCode(
            tailBytes[i + 8],
            tailBytes[i + 9],
            tailBytes[i + 10],
            tailBytes[i + 11]
          );
          if (subType === 'mvhd' || subType === 'trak' || subType === 'iods') {
            const boxSize =
              (tailBytes[i - 4] << 24) |
              (tailBytes[i - 3] << 16) |
              (tailBytes[i - 2] << 8) |
              tailBytes[i - 1];

            if (boxSize > 8) {
              const absMoovStart = tailOffset + i - 4;
              moovOffset = absMoovStart;
              const actualSize = Math.min(boxSize, file.size - absMoovStart);
              moovBuffer = await file.slice(absMoovStart, absMoovStart + actualSize).arrayBuffer();
              break;
            }
          }
        }
      }
    }

    // FastStart calculation: moov MUST appear before mdat
    if (moovOffset !== -1 && mdatOffset !== -1) {
      result.hasFastStart = moovOffset < mdatOffset;
    } else if (moovOffset !== -1 && mdatOffset === -1) {
      result.hasFastStart = true;
    } else {
      result.hasFastStart = false;
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
        const duration =
          version === 1
            ? view.getUint32(durationOffset) * 4294967296 + view.getUint32(durationOffset + 4)
            : view.getUint32(durationOffset);

        if (timeScale > 0) {
          result.durationSeconds = duration / timeScale;
        }
      } catch {
        // ignore malformed mvhd
      }
    } else if (type === 'trak') {
      // Parse individual track
      const trakBuffer = buffer.slice(offset, offset + size);
      parseTrakBox(trakBuffer, result);
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
        // tkhd contains track width and height
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
      let isVideoTrack = false;

      while (inner + 8 <= offset + size && inner + 8 <= len) {
        const innerSize = view.getUint32(inner);
        const innerType = getString(view, inner + 4, 4);

        if (innerType === 'hdlr') {
          // handler type at inner + 16
          const handler = getString(view, inner + 16, 4);
          if (handler === 'vide') {
            isVideo = true;
            isVideoTrack = true;
          } else if (handler === 'soun') {
            isAudio = true;
          }
        } else if (innerType === 'minf') {
          // Look inside minf -> stbl -> stsd for codec and B-frames
          parseMinfBox(view, inner, innerSize, result, isVideoTrack);
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
  result: Mp4InspectionResult,
  isVideoTrack: boolean
) {
  let offset = minfOffset + 8;
  const end = minfOffset + minfSize;

  while (offset + 8 <= end && offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    const type = getString(view, offset + 4, 4);

    if (type === 'stbl') {
      let stblOffset = offset + 8;
      const stblEnd = offset + size;
      let foundCtts = false;

      while (stblOffset + 8 <= stblEnd && stblOffset + 8 <= view.byteLength) {
        const stblChildSize = view.getUint32(stblOffset);
        const stblChildType = getString(view, stblOffset + 4, 4);

        // ctts (Composition Time to Sample Box) exists ONLY when B-frames are present!
        if (stblChildType === 'ctts') {
          foundCtts = true;
          result.hasBframes = true;
        }

        if (stblChildType === 'stsd') {
          // Sample description table
          if (stblOffset + 16 <= view.byteLength) {
            const entryCount = view.getUint32(stblOffset + 12);
            if (entryCount > 0) {
              const sampleEntryOffset = stblOffset + 16;
              const sampleEntrySize = view.getUint32(sampleEntryOffset);
              const entryFormat = getString(view, sampleEntryOffset + 4, 4);
              const isVideo = ['avc1', 'hvc1', 'hev1', 'vp09', 'av01', 'mp4v'].includes(entryFormat);

              if (isVideo && !result.videoCodec) {
                result.videoCodec = entryFormat;
              } else if (!isVideo && !result.audioCodec) {
                result.audioCodec = entryFormat;
              }

              // If H.264 (avc1), scan for avcC box to extract Profile & Level
              if (entryFormat === 'avc1') {
                parseAvcCBox(view, sampleEntryOffset, sampleEntrySize, result);
              }
            }
          }
        }

        if (stblChildSize <= 0) break;
        stblOffset += stblChildSize;
      }

      if ((isVideoTrack || result.videoCodec) && !foundCtts && result.hasBframes === undefined) {
        // No ctts box found in video track stbl -> video has NO B-frames
        result.hasBframes = false;
      }
    }

    if (size <= 0) break;
    offset += size;
  }
}

function parseAvcCBox(
  view: DataView,
  entryOffset: number,
  entrySize: number,
  result: Mp4InspectionResult
) {
  const end = Math.min(entryOffset + (entrySize > 8 ? entrySize : 1024), view.byteLength);

  // Scan through entry for 'avcC' atom
  for (let i = entryOffset + 8; i + 8 <= end; i++) {
    if (getString(view, i, 4) === 'avcC') {
      const avcCOffset = i - 4; // size starts 4 bytes before 'avcC'
      if (avcCOffset + 12 <= view.byteLength) {
        const profileId = view.getUint8(avcCOffset + 9);
        const levelId = view.getUint8(avcCOffset + 11);

        result.h264ProfileIndication = profileId;
        switch (profileId) {
          case 66:
            result.h264Profile = 'Baseline';
            break;
          case 77:
            result.h264Profile = 'Main';
            break;
          case 88:
            result.h264Profile = 'Extended';
            break;
          case 100:
            result.h264Profile = 'High';
            break;
          case 110:
            result.h264Profile = 'High 10';
            break;
          case 122:
            result.h264Profile = 'High 4:2:2';
            break;
          default:
            result.h264Profile = 'Unknown';
            break;
        }

        if (levelId > 0) {
          result.h264Level = (levelId / 10).toFixed(1);
        }
      }
      break;
    }
  }
}

function getString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}
