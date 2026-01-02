export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsArrayBuffer(file);
  });
}

function getPngDpi(buf: ArrayBuffer): number | null {
  const u8 = new Uint8Array(buf);
  // PNG signature
  if (
    u8.length < 8 ||
    u8[0] !== 0x89 ||
    u8[1] !== 0x50 ||
    u8[2] !== 0x4e ||
    u8[3] !== 0x47 ||
    u8[4] !== 0x0d ||
    u8[5] !== 0x0a ||
    u8[6] !== 0x1a ||
    u8[7] !== 0x0a
  )
    return null;

  let off = 8;
  const dv = new DataView(buf);
  while (off + 8 <= u8.length) {
    const len = dv.getUint32(off, false);
    const type =
      String.fromCharCode(u8[off + 4], u8[off + 5], u8[off + 6], u8[off + 7]) ||
      "";
    const dataStart = off + 8;
    if (type === "pHYs" && dataStart + 9 <= u8.length) {
      const xPpu = dv.getUint32(dataStart, false);
      const yPpu = dv.getUint32(dataStart + 4, false);
      const unit = u8[dataStart + 8]; // 1 = meter
      // unit: 1 = meter, 0 = unspecified(종종 meter로 써두고 unit만 0으로 저장되는 케이스가 있음)
      if (unit !== 1 && unit !== 0) return null;
      if (!xPpu || !yPpu) return null;
      const toDpi = (ppu: number) => ppu / 39.37007874015748;
      const xDpi = toDpi(xPpu);
      const yDpi = toDpi(yPpu);
      const dpi = Math.round((xDpi + yDpi) / 2);
      // unit=0일 땐 보수적으로 "그럴듯한" 값만 인정
      if (unit === 0 && (dpi < 30 || dpi > 1200)) return null;
      return dpi;
    }
    off = dataStart + len + 4; // +CRC
  }
  return null;
}

function getJpegDpi(buf: ArrayBuffer): number | null {
  const u8 = new Uint8Array(buf);
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null; // SOI

  let off = 2;
  const dv = new DataView(buf);

  const readAscii = (start: number, len: number) =>
    String.fromCharCode(...u8.slice(start, start + len));

  const readPhotoshopDpi = (segStart: number, segLen: number): number | null => {
    // APP13: "Photoshop 3.0\0" + Image Resource Blocks
    const end = segStart + (segLen - 2);
    if (end > u8.length) return null;
    const header = "Photoshop 3.0\u0000";
    if (segStart + header.length > end) return null;
    if (readAscii(segStart, header.length) !== header) return null;

    let p = segStart + header.length;
    const readU16BE = (pos: number) => dv.getUint16(pos, false);
    const readU32BE = (pos: number) => dv.getUint32(pos, false);
    const readFixed16_16BE = (pos: number) => {
      const v = readU32BE(pos);
      return v / 65536;
    };

    while (p + 4 <= end) {
      // signature '8BIM'
      if (p + 4 > end) break;
      const sig = readAscii(p, 4);
      if (sig !== "8BIM") break;
      p += 4;
      if (p + 2 > end) break;
      const resourceId = readU16BE(p);
      p += 2;

      // Pascal string name (padded to even)
      if (p + 1 > end) break;
      const nameLen = u8[p];
      p += 1;
      p += nameLen;
      if ((1 + nameLen) % 2 === 1) p += 1;

      if (p + 4 > end) break;
      const size = readU32BE(p);
      p += 4;
      const dataStart = p;
      const dataEnd = dataStart + size;
      if (dataEnd > end) break;

      // Resource ID 0x03ED = ResolutionInfo
      if (resourceId === 0x03ed && size >= 16) {
        // Structure (big-endian):
        // hRes (Fixed 16.16), hResUnit (U16), widthUnit (U16),
        // vRes (Fixed 16.16), vResUnit (U16), heightUnit (U16)
        const hRes = readFixed16_16BE(dataStart);
        const hResUnit = readU16BE(dataStart + 4); // 1=ppi, 2=ppcm
        const vRes = readFixed16_16BE(dataStart + 8);
        const vResUnit = readU16BE(dataStart + 12);
        const avg = (hRes + vRes) / 2;
        if (avg > 0) {
          if (hResUnit === 1 && vResUnit === 1) return Math.round(avg);
          if (hResUnit === 2 && vResUnit === 2) return Math.round(avg * 2.54);
          // mixed units -> still try inch assumption if values look like dpi
          const dpi = Math.round(avg);
          if (dpi >= 30 && dpi <= 1200) return dpi;
        }
      }

      // move to next resource (padded to even)
      p = dataEnd;
      if (size % 2 === 1) p += 1;
    }

    return null;
  };

  const readExifDpi = (start: number): number | null => {
    // start points to TIFF header (after "Exif\0\0")
    const little = dv.getUint16(start, false) === 0x4949; // "II"
    const getU16 = (p: number) => dv.getUint16(p, little);
    const getU32 = (p: number) => dv.getUint32(p, little);
    const tiffMagic = getU16(start + 2);
    if (tiffMagic !== 0x002a) return null;
    const ifd0Offset = getU32(start + 4);
    const ifd0 = start + ifd0Offset;
    if (ifd0 + 2 > u8.length) return null;
    const entryCount = getU16(ifd0);
    let xRes: { num: number; den: number } | null = null;
    let yRes: { num: number; den: number } | null = null;
    let unit: number | null = null; // 2=inches, 3=cm

    const readRational = (p: number) => {
      if (p < 0 || p + 8 > u8.length) return { num: 0, den: 1 };
      const num = getU32(p);
      const den = getU32(p + 4);
      return { num, den: den || 1 };
    };

    for (let i = 0; i < entryCount; i++) {
      const e = ifd0 + 2 + i * 12;
      if (e + 12 > u8.length) break;
      const tag = getU16(e);
      const type = getU16(e + 2);
      const count = getU32(e + 4);
      const valueOffset = getU32(e + 8);

      // type 5 = RATIONAL (8 bytes)
      const valuePtr = type === 5 && count === 1 ? start + valueOffset : e + 8;

      if (tag === 0x011a && type === 5 && count === 1) xRes = readRational(valuePtr);
      if (tag === 0x011b && type === 5 && count === 1) yRes = readRational(valuePtr);
      if (tag === 0x0128 && (type === 3 || type === 4) && count === 1)
        unit = type === 3 ? getU16(e + 8) : valueOffset;
    }

    const toNumber = (r: { num: number; den: number } | null) =>
      r ? r.num / (r.den || 1) : null;
    const x = toNumber(xRes);
    const y = toNumber(yRes);
    if (!x || !y || !unit) return null;
    if (unit === 2) return Math.round((x + y) / 2); // already DPI
    if (unit === 3) return Math.round(((x + y) / 2) * 2.54); // DPCM -> DPI
    return null;
  };

  while (off + 4 <= u8.length) {
    if (u8[off] !== 0xff) break;
    const marker = u8[off + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS
    const segLen = dv.getUint16(off + 2, false);
    const segStart = off + 4;
    if (segLen < 2 || segStart + (segLen - 2) > u8.length) break;

    // APP0 (JFIF)
    if (marker === 0xe0 && segLen >= 16) {
      const id = readAscii(segStart, 5);
      if (id === "JFIF\u0000") {
        const units = u8[segStart + 7]; // 0: aspect, 1: dpi, 2: dpcm
        const xDen = dv.getUint16(segStart + 8, false);
        const yDen = dv.getUint16(segStart + 10, false);
        if (units === 1 && xDen && yDen) return Math.round((xDen + yDen) / 2);
        if (units === 2 && xDen && yDen) return Math.round(((xDen + yDen) / 2) * 2.54);
        // units=0(aspect ratio)인데도 density에 숫자를 넣어두는 파일들이 있어서, 보수적으로 허용
        if (units === 0 && xDen && yDen) {
          const dpi = Math.round((xDen + yDen) / 2);
          if (dpi >= 30 && dpi <= 1200) return dpi;
        }
      }
    }

    // APP1 (EXIF)
    if (marker === 0xe1 && segLen >= 14) {
      const id = readAscii(segStart, 6);
      if (id === "Exif\u0000\u0000") {
        const dpi = readExifDpi(segStart + 6);
        if (dpi) return dpi;
      }
    }

    // APP13 (Photoshop)
    if (marker === 0xed && segLen >= 16) {
      const dpi = readPhotoshopDpi(segStart, segLen);
      if (dpi) return dpi;
    }

    off = segStart + (segLen - 2);
  }
  return null;
}

export async function getImageDpi(file: File): Promise<number | null> {
  try {
    const buf = await readFileAsArrayBuffer(file);
    if (file.type === "image/png") return getPngDpi(buf);
    if (file.type === "image/jpeg") return getJpegDpi(buf);
    return null;
  } catch {
    return null;
  }
}

export async function getImageDpiFromBlob(
  blob: Blob,
  mimeType?: string
): Promise<number | null> {
  try {
    const buf = await blob.arrayBuffer();
    const type = mimeType || (blob as any)?.type || "";
    if (type === "image/png") return getPngDpi(buf);
    if (type === "image/jpeg") return getJpegDpi(buf);
    return null;
  } catch {
    return null;
  }
}

// --- PNG DPI writer (pHYs chunk) ---
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildPngPhysChunk(dpi: number): Uint8Array {
  const safeDpi = Math.max(1, Math.min(1200, Math.round(dpi)));
  const ppm = Math.round(safeDpi * 39.37007874015748); // pixels per meter

  // Data: x_ppu(4) + y_ppu(4) + unit(1) => 9 bytes
  const data = new Uint8Array(9);
  const dvData = new DataView(data.buffer);
  dvData.setUint32(0, ppm, false);
  dvData.setUint32(4, ppm, false);
  data[8] = 1; // unit = meter

  const type = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // "pHYs"

  const len = 9;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, len, false);
  chunk.set(type, 4);
  chunk.set(data, 8);

  const crcInput = new Uint8Array(4 + len);
  crcInput.set(type, 0);
  crcInput.set(data, 4);
  const crc = crc32(crcInput);
  dv.setUint32(8 + len, crc, false);
  return chunk;
}

function stripExistingPhys(png: Uint8Array): Uint8Array {
  // Removes existing pHYs chunk(s) if present
  if (png.length < 8) return png;
  const out: number[] = [];
  // signature
  for (let i = 0; i < 8 && i < png.length; i++) out.push(png[i]);
  let off = 8;
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);

  while (off + 8 <= png.length) {
    const len = dv.getUint32(off, false);
    const type = String.fromCharCode(
      png[off + 4],
      png[off + 5],
      png[off + 6],
      png[off + 7]
    );
    const chunkTotal = 12 + len;
    if (off + chunkTotal > png.length) break;
    if (type !== "pHYs") {
      for (let i = off; i < off + chunkTotal; i++) out.push(png[i]);
    }
    off += chunkTotal;
  }
  return new Uint8Array(out);
}

export async function setPngDpiOnPngBlob(
  pngBlob: Blob,
  dpi: number
): Promise<Blob> {
  try {
    const buf = await pngBlob.arrayBuffer();
    const u8 = new Uint8Array(buf);
    // Basic PNG signature check
    if (
      u8.length < 8 ||
      u8[0] !== 0x89 ||
      u8[1] !== 0x50 ||
      u8[2] !== 0x4e ||
      u8[3] !== 0x47
    ) {
      return pngBlob;
    }

    const stripped = stripExistingPhys(u8);
    const phys = buildPngPhysChunk(dpi);

    // Insert after IHDR (first chunk). PNG structure: signature + IHDR chunk (25 bytes total chunk incl crc) typically.
    // We'll parse the first chunk boundary safely.
    if (stripped.length < 8 + 12) return pngBlob;
    const dv = new DataView(stripped.buffer, stripped.byteOffset, stripped.byteLength);
    const firstLen = dv.getUint32(8, false);
    const firstTotal = 12 + firstLen;
    const insertPos = 8 + firstTotal;
    if (insertPos > stripped.length) return pngBlob;

    const out = new Uint8Array(stripped.length + phys.length);
    out.set(stripped.slice(0, insertPos), 0);
    out.set(phys, insertPos);
    out.set(stripped.slice(insertPos), insertPos + phys.length);
    return new Blob([out], { type: "image/png" });
  } catch {
    return pngBlob;
  }
}

export async function canvasToPngBlobWithSourceDpi(
  canvas: HTMLCanvasElement,
  sourceDpi: number | null
): Promise<Blob> {
  const baseBlob: Blob =
    (await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
    })) || new Blob();
  if (!sourceDpi || !Number.isFinite(sourceDpi)) return baseBlob;
  return await setPngDpiOnPngBlob(baseBlob, sourceDpi);
}


