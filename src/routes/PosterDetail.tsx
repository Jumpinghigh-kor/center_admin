import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import { installAutoCloseNativePickers, openInputDatePicker } from "../utils/commonUtils";
import { canvasToPngBlobWithSourceDpi, getImageDpi, getImageDpiFromBlob } from "../utils/printUtils";
import { useNavigate, useParams } from "react-router-dom";

declare const require: any;

type FontOption = {
  label: string;
  family: string;
  url: string;
};

const FONT_OPTIONS: FontOption[] = (() => {
  try {
    const ctx = require.context("../fonts", false, /\.(woff2?|woff|ttf|otf)$/i);
    return ctx.keys().map((key: string) => {
      const fileName = key.replace("./", "");
      const base = fileName.replace(/\.(woff2?|woff|ttf|otf)$/i, "");
      const mod = ctx(key);
      const url =
        (typeof mod === "string" ? mod : (mod?.default as string | undefined)) ||
        "";
      return { label: base, family: base, url };
    });
  } catch (e) {
    console.log(e);
    return [];
  }
})();

interface PosterDetailRow {
  poster_id: number;
  title: string;
  start_dt: string;
  end_dt: string;
  poster_image_id: number;
  poster_text_id?: number | null;
  poster_image_type: "WEB" | "PRINT";
  poster_text_type?: "CENTER" | "ADDRESS" | "PHONE" | null;
  use_yn?: "Y" | "N" | null;
  file_id: number;
  file_path: string;
  file_name: string;
  file_division: string;
  font_family: string;
  font_size: number;
  font_weight: number;
  color: string;
  x_px: number;
  y_px: number;
}
const PosterDetail: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const isAdmin = user?.usr_role === "admin";
  const navigate = useNavigate();
  const { posterId } = useParams();

  const posterIdNum = useMemo(() => Number(posterId || 0), [posterId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingWeb, setIsDownloadingWeb] = useState(false);
  const [isDownloadingPrint, setIsDownloadingPrint] = useState(false);
  const [centerInfo, setCenterInfo] = useState<any>(null);
  const [posterView, setPosterView] = useState<{ web: boolean; print: boolean }>({
    web: true,
    print: true,
  });

  const [webPoster, setWebPoster] = useState<PosterDetailRow | null>(null);
  const [printPoster, setPrintPoster] = useState<PosterDetailRow | null>(null);
  const [webTextIds, setWebTextIds] = useState<{
    CENTER?: number;
    ADDRESS?: number;
    PHONE?: number;
  }>({});
  const [webTextUseYn, setWebTextUseYn] = useState<{
    CENTER?: "Y" | "N";
    ADDRESS?: "Y" | "N";
    PHONE?: "Y" | "N";
  }>({});
  const [printTextIds, setPrintTextIds] = useState<{
    CENTER?: number;
    ADDRESS?: number;
    PHONE?: number;
  }>({});
  const [printTextUseYn, setPrintTextUseYn] = useState<{
    CENTER?: "Y" | "N";
    ADDRESS?: "Y" | "N";
    PHONE?: "Y" | "N";
  }>({});
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string | null>(
    null
  );
  const [printTemplateFile, setPrintTemplateFile] = useState<File | null>(null);
  const [printTemplatePreviewUrl, setPrintTemplatePreviewUrl] = useState<string | null>(
    null
  );
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const centerTextRef = useRef<HTMLDivElement | null>(null);
  const addressTextRef = useRef<HTMLDivElement | null>(null);
  const phoneTextRef = useRef<HTMLDivElement | null>(null);
  const webOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef(false);
  const dragTargetRef = useRef<"center" | "address" | "phone" | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState<{ v: boolean; h: boolean }>({
    v: false,
    h: false,
  });
  const [imageBox, setImageBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const printPreviewBoxRef = useRef<HTMLDivElement | null>(null);
  const printPreviewImgRef = useRef<HTMLImageElement | null>(null);
  const printCenterTextRef = useRef<HTMLDivElement | null>(null);
  const printAddressTextRef = useRef<HTMLDivElement | null>(null);
  const printPhoneTextRef = useRef<HTMLDivElement | null>(null);
  const printOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const printDraggingRef = useRef(false);
  const printDragTargetRef = useRef<"center" | "address" | "phone" | null>(null);
  const printDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [printShowGuides, setPrintShowGuides] = useState<{ v: boolean; h: boolean }>({
    v: false,
    h: false,
  });
  const [printImageBox, setPrintImageBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [printImageNaturalSize, setPrintImageNaturalSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const [fontColor, setFontColor] = useState<string>("#ffffff");
  const [fontSizePt, setFontSizePt] = useState<number>(90);
  const [fontWeight, setFontWeight] = useState<number>(400);
  const [fontFamily, setFontFamily] = useState<string>("");
  const [addressFontColor, setAddressFontColor] = useState<string>("#ffffff");
  const [addressFontSizePt, setAddressFontSizePt] = useState<number>(90);
  const [addressFontWeight, setAddressFontWeight] = useState<number>(400);
  const [addressFontFamily, setAddressFontFamily] = useState<string>("");
  const [phoneFontColor, setPhoneFontColor] = useState<string>("#ffffff");
  const [phoneFontSizePt, setPhoneFontSizePt] = useState<number>(90);
  const [phoneFontWeight, setPhoneFontWeight] = useState<number>(400);
  const [phoneFontFamily, setPhoneFontFamily] = useState<string>("");
  const [printFontColor, setPrintFontColor] = useState<string>("#ffffff");
  const [printFontSizePt, setPrintFontSizePt] = useState<number>(230);
  const [printFontWeight, setPrintFontWeight] = useState<number>(400);
  const [printFontFamily, setPrintFontFamily] = useState<string>("");
  const [printAddressFontColor, setPrintAddressFontColor] = useState<string>("#ffffff");
  const [printAddressFontSizePt, setPrintAddressFontSizePt] = useState<number>(230);
  const [printAddressFontWeight, setPrintAddressFontWeight] = useState<number>(400);
  const [printAddressFontFamily, setPrintAddressFontFamily] = useState<string>("");
  const [printPhoneFontColor, setPrintPhoneFontColor] = useState<string>("#ffffff");
  const [printPhoneFontSizePt, setPrintPhoneFontSizePt] = useState<number>(230);
  const [printPhoneFontWeight, setPrintPhoneFontWeight] = useState<number>(400);
  const [printPhoneFontFamily, setPrintPhoneFontFamily] = useState<string>("");
  const [posterTitle, setPosterTitle] = useState<string>("");
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({
    x: 10,
    y: 10,
  });
  const [addressPos, setAddressPos] = useState<{ x: number; y: number }>({ x: 10, y: 60 });
  const [phonePos, setPhonePos] = useState<{ x: number; y: number }>({ x: 10, y: 110 });
  const [printTextPos, setPrintTextPos] = useState<{ x: number; y: number }>({
    x: 10,
    y: 10,
  });
  const [printAddressPos, setPrintAddressPos] = useState<{ x: number; y: number }>({
    x: 10,
    y: 60,
  });
  const [printPhonePos, setPrintPhonePos] = useState<{ x: number; y: number }>({
    x: 10,
    y: 110,
  });
  // 표시 항목은 WEB/PRINT 각각 독립적으로 관리해야 함
  const [showWebCenterLine, setShowWebCenterLine] = useState(true);
  const [showWebAddressLine, setShowWebAddressLine] = useState(true);
  const [showWebPhoneLine, setShowWebPhoneLine] = useState(true);
  const [showPrintCenterLine, setShowPrintCenterLine] = useState(true);
  const [showPrintAddressLine, setShowPrintAddressLine] = useState(true);
  const [showPrintPhoneLine, setShowPrintPhoneLine] = useState(true);
  const [postStartAt, setPostStartAt] = useState<string>("");
  const [postEndAt, setPostEndAt] = useState<string>("");
  const [postRangeMode, setPostRangeMode] = useState<"manual" | "forever">(
    "manual"
  );
  const manualPostRangeRef = useRef<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fontLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map());
  const webOverlayDrawSeqRef = useRef(0);
  const printOverlayDrawSeqRef = useRef(0);
  const measureTextBoxImg = useCallback(
    (opts: {
      text: string;
      fontFamily: string;
      fontWeight: number;
      fontSizePt: number;
    }) => {
      const t = String(opts.text || "");
      if (!t) return { w: 0, h: 0 };
      let ctx = measureCtxRef.current;
      if (!ctx) {
        const c = document.createElement("canvas");
        ctx = c.getContext("2d");
        measureCtxRef.current = ctx;
      }
      if (!ctx) return { w: 0, h: 0 };
      const fontSizePx = (Number(opts.fontSizePt || 12) * 4) / 3;
      ctx.font = `${Number(opts.fontWeight || 400)} ${fontSizePx}px "${opts.fontFamily || ""}"`;
      const m = ctx.measureText(t);
      const w = Number(m.width || 0);
      const ascent = Number((m as any).actualBoundingBoxAscent || 0);
      const descent = Number((m as any).actualBoundingBoxDescent || 0);
      const h = ascent + descent || fontSizePx;
      return { w, h };
    },
    []
  );


  const webPosterDisplayUrl = useMemo(() => {
    if (!webPoster?.file_id) return null;
    // Support both absolute and relative URLs.
    if (/^https?:\/\//i.test(webPoster.file_path)) return webPoster.file_path;
    const base = process.env.REACT_APP_API_URL || "";
    const normalized = webPoster.file_path.startsWith("/")
      ? webPoster.file_path
      : `/${webPoster.file_path}`;
    return `${base}${normalized}`;
  }, [webPoster?.file_id, webPoster?.file_path]);

  const printPosterDisplayUrl = useMemo(() => {
    if (!printPoster?.file_id) return null;
    if (/^https?:\/\//i.test(printPoster.file_path)) return printPoster.file_path;
    const base = process.env.REACT_APP_API_URL || "";
    const normalized = printPoster.file_path.startsWith("/")
      ? printPoster.file_path
      : `/${printPoster.file_path}`;
    return `${base}${normalized}`;
  }, [printPoster?.file_id, printPoster?.file_path]);

  // Non-admin should preview only the already-registered image (no local template preview).
  const mainPreviewUrl = isAdmin ? templatePreviewUrl || webPosterDisplayUrl : webPosterDisplayUrl;
  const fontSizePx = useMemo(() => (fontSizePt * 4) / 3, [fontSizePt]); // 96DPI 기준: pt * 96/72
  const printMainPreviewUrl = isAdmin
    ? printTemplatePreviewUrl || printPosterDisplayUrl
    : printPosterDisplayUrl;
  const printFontSizePx = useMemo(() => (printFontSizePt * 4) / 3, [printFontSizePt]); // 96DPI 기준: pt * 96/72
  const webScale = useMemo(() => {
    if (!imageBox || !imageNaturalSize?.w) return 1;
    return imageBox.width / imageNaturalSize.w;
  }, [imageBox, imageNaturalSize?.w]);
  const printScale = useMemo(() => {
    if (!printImageBox || !printImageNaturalSize?.w) return 1;
    return printImageBox.width / printImageNaturalSize.w;
  }, [printImageBox, printImageNaturalSize?.w]);
  const hasWeb = !!webPosterDisplayUrl;
  const hasPrint = !!printPosterDisplayUrl;
  // Non-admin (franchise): show the registered types (WEB/PRINT). If both exist, show both.
  const effectivePosterView = isAdmin ? posterView : { web: hasWeb, print: hasPrint };
  const isBothView = effectivePosterView.web && effectivePosterView.print;
  const webEditable = isAdmin && !!(templateFile || webPosterDisplayUrl);
  const printEditable = isAdmin && !!(printTemplateFile || printPosterDisplayUrl);

  const centerTextValue = useMemo(() => ((user as any)?.center_name) || "", [user]);
  const addressTextValue = useMemo(() => {
    const address = String(centerInfo?.address || "").trim();
    const addressDetail = String(centerInfo?.address_detail || "").trim();
    return [address, addressDetail].filter(Boolean).join(" ").trim();
  }, [centerInfo]);
  const phoneTextValue = useMemo(() => {
    return String(
      centerInfo?.phone_number ||
        centerInfo?.phone ||
        centerInfo?.tel ||
        centerInfo?.center_tel ||
        ""
    ).trim();
  }, [centerInfo]);

  const sanitizeFileName = useCallback((s: string) => {
    return (s || "poster")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const ensureFontLoaded = useCallback(async (family: string) => {
    if (!family) return;
    const cached = fontLoadCacheRef.current.get(family);
    if (cached) {
      try {
        await cached;
      } catch {}
      return;
    }

    const p = (async () => {
      const opt = FONT_OPTIONS.find((f) => f.family === family);
      if (!opt?.url) return;
      const face = new FontFace(family, `url(${opt.url})`);
      await face.load();
      try {
        document.fonts.add(face);
      } catch {}
      // Force-load the specific family so canvas uses it reliably.
      try {
        await (document as any).fonts?.load?.(`12px "${family}"`);
        await (document as any).fonts?.ready;
      } catch {}
    })();

    fontLoadCacheRef.current.set(family, p);
    try {
      await p;
    } catch {
      // If it failed, allow retry next time (don't keep a rejected promise forever)
      fontLoadCacheRef.current.delete(family);
    }
  }, []);

  const downloadPosterImage = useCallback(
    async (type: "WEB" | "PRINT") => {
      const row = type === "WEB" ? webPoster : printPoster;
      const url = type === "WEB" ? webPosterDisplayUrl : printPosterDisplayUrl;
      if (!row || !url) return alert("등록된 이미지가 없습니다.");

      if (type === "WEB") {
        setIsDownloadingWeb(true);
      } else {
        setIsDownloadingPrint(true);
      }

      try {
        // Use the SAME values that the preview uses (state), so the download matches 1:1.
        const centerName = String(centerTextValue || "");
        const addressText = String(addressTextValue || "");
        const phoneText = String(phoneTextValue || "");

        // Load fonts for canvas (only for items we actually draw)
        if (type === "WEB") {
          if (showWebCenterLine && centerName) await ensureFontLoaded(fontFamily || "");
          if (showWebAddressLine && addressText) await ensureFontLoaded(addressFontFamily || "");
          if (showWebPhoneLine && phoneText) await ensureFontLoaded(phoneFontFamily || "");
        } else {
          if (showPrintCenterLine && centerName) await ensureFontLoaded(printFontFamily || "");
          if (showPrintAddressLine && addressText) await ensureFontLoaded(printAddressFontFamily || "");
          if (showPrintPhoneLine && phoneText) await ensureFontLoaded(printPhoneFontFamily || "");
        }

        // Fetch as blob to avoid CORS tainting the canvas.
        let res;
        try {
          res = await axios.get(url, { responseType: "blob" });
        } catch (fetchErr) {
          throw new Error(`이미지 다운로드 실패: ${fetchErr instanceof Error ? fetchErr.message : "알 수 없는 오류"}`);
        }
        const blob = res.data as Blob;
        if (!blob || !(blob instanceof Blob)) {
          throw new Error("다운로드된 데이터가 유효한 이미지 파일이 아닙니다");
        }
        const objUrl = URL.createObjectURL(blob);

        try {
          const img = new Image();
          img.src = objUrl;
          
          // 타임아웃 추가 (10초)
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error("이미지 로드 타임아웃")), 10000);
          });

          try {
            if ((img as any).decode) {
              await Promise.race([(img as any).decode(), timeoutPromise]);
            } else {
              await Promise.race([
                new Promise<void>((resolve, reject) => {
                  img.onload = () => {
                    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                      reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                    } else {
                      resolve();
                    }
                  };
                  img.onerror = () => reject(new Error("이미지 로드 실패"));
                }),
                timeoutPromise,
              ]);
            }
          } catch (decodeErr) {
            // decode 실패 시 onload/onerror로 폴백
            await Promise.race([
              new Promise<void>((resolve, reject) => {
                if (img.complete) {
                  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                    reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                  } else {
                    resolve();
                  }
                } else {
                  img.onload = () => {
                    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                      reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                    } else {
                      resolve();
                    }
                  };
                  img.onerror = () => reject(new Error("이미지 로드 실패"));
                }
              }),
              timeoutPromise,
            ]);
          }

          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;
          if (!w || !h) throw new Error("이미지 크기 정보를 확인할 수 없습니다");

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no canvas context");

          // Draw base image
          ctx.drawImage(img, 0, 0, w, h);

          const drawText = (opts: {
            text: string;
            x: number;
            y: number;
            font_family: string;
            font_size: number;
            font_weight: number;
            color: string;
          }) => {
            const t = String(opts.text || "");
            if (!t) return;
            const fontSizePx = (Number(opts.font_size || 12) * 4) / 3; // 96DPI: pt*96/72
            ctx.save();
            ctx.textBaseline = "top";
            ctx.fillStyle = opts.color || "#ffffff";
            ctx.font = `${Number(opts.font_weight || 400)} ${fontSizePx}px "${
              opts.font_family || ""
            }"`;
            ctx.fillText(t, Math.round(Number(opts.x || 0)), Math.round(Number(opts.y || 0)));
            ctx.restore();
          };

          if (type === "WEB") {
            if (showWebCenterLine && centerName) {
              drawText({
                text: centerName,
                x: textPos.x,
                y: textPos.y,
                font_family: fontFamily,
                font_size: fontSizePt,
                font_weight: fontWeight,
                color: fontColor,
              });
            }
            if (showWebAddressLine && addressText) {
              drawText({
                text: addressText,
                x: addressPos.x,
                y: addressPos.y,
                font_family: addressFontFamily,
                font_size: addressFontSizePt,
                font_weight: addressFontWeight,
                color: addressFontColor,
              });
            }
            if (showWebPhoneLine && phoneText) {
              drawText({
                text: phoneText,
                x: phonePos.x,
                y: phonePos.y,
                font_family: phoneFontFamily,
                font_size: phoneFontSizePt,
                font_weight: phoneFontWeight,
                color: phoneFontColor,
              });
            }
          } else {
            if (showPrintCenterLine && centerName) {
              drawText({
                text: centerName,
                x: printTextPos.x,
                y: printTextPos.y,
                font_family: printFontFamily,
                font_size: printFontSizePt,
                font_weight: printFontWeight,
                color: printFontColor,
              });
            }
            if (showPrintAddressLine && addressText) {
              drawText({
                text: addressText,
                x: printAddressPos.x,
                y: printAddressPos.y,
                font_family: printAddressFontFamily,
                font_size: printAddressFontSizePt,
                font_weight: printAddressFontWeight,
                color: printAddressFontColor,
              });
            }
            if (showPrintPhoneLine && phoneText) {
              drawText({
                text: phoneText,
                x: printPhonePos.x,
                y: printPhonePos.y,
                font_family: printPhoneFontFamily,
                font_size: printPhoneFontSizePt,
                font_weight: printPhoneFontWeight,
                color: printPhoneFontColor,
              });
            }
          }

          // Preserve original image DPI (metadata) in the downloaded PNG if possible.
          let sourceDpi: number | null = null;
          try {
            sourceDpi = await getImageDpiFromBlob(blob, (blob as any)?.type);
          } catch (dpiErr) {
            console.warn("DPI 정보를 가져오는데 실패했습니다:", dpiErr);
            // DPI 정보가 없어도 계속 진행
          }
          
          let outBlob: Blob;
          try {
            outBlob = await canvasToPngBlobWithSourceDpi(canvas, sourceDpi);
          } catch (blobErr) {
            console.error("PNG Blob 생성 실패:", blobErr);
            throw new Error(`PNG 파일 생성 실패: ${blobErr instanceof Error ? blobErr.message : "알 수 없는 오류"}`);
          }
          
          const outUrl = URL.createObjectURL(outBlob);

          const a = document.createElement("a");
          a.href = outUrl;
          const baseName = sanitizeFileName(row.title || posterTitle || "poster");
          const typeLabel = type === "WEB" ? "웹용" : "인쇄용";
          a.download = `${baseName}_${typeLabel}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(outUrl);
        } finally {
          URL.revokeObjectURL(objUrl);
        }
      } catch (e) {
        console.error("다운로드 오류:", e);
        const errMsg = e instanceof Error ? e.message : "알 수 없는 오류";
        alert(`다운로드에 실패했습니다.\n${errMsg}`);
      } finally {
        if (type === "WEB") {
          setIsDownloadingWeb(false);
        } else {
          setIsDownloadingPrint(false);
        }
      }
    },
    [
      ensureFontLoaded,
      fontColor,
      fontFamily,
      fontSizePt,
      fontWeight,
      addressFontColor,
      addressFontFamily,
      addressFontSizePt,
      addressFontWeight,
      phoneFontColor,
      phoneFontFamily,
      phoneFontSizePt,
      phoneFontWeight,
      posterTitle,
      printFontColor,
      printFontFamily,
      printFontSizePt,
      printFontWeight,
      printAddressFontColor,
      printAddressFontFamily,
      printAddressFontSizePt,
      printAddressFontWeight,
      printPhoneFontColor,
      printPhoneFontFamily,
      printPhoneFontSizePt,
      printPhoneFontWeight,
      printPoster,
      printPosterDisplayUrl,
      printAddressPos.x,
      printAddressPos.y,
      printPhonePos.x,
      printPhonePos.y,
      printTextPos,
      sanitizeFileName,
      showWebAddressLine,
      showWebCenterLine,
      showWebPhoneLine,
      showPrintCenterLine,
      showPrintAddressLine,
      showPrintPhoneLine,
      addressPos.x,
      addressPos.y,
      phonePos.x,
      phonePos.y,
      textPos,
      centerTextValue,
      addressTextValue,
      phoneTextValue,
      webPoster,
      webPosterDisplayUrl,
    ]
  );

  const toDateTimeLocalValue = useCallback((v: string) => {
    if (!v) return "";
    // backend: "YYYY-MM-DD HH:mm" -> "YYYY-MM-DDTHH:mm"
    return v.includes("T") ? v.slice(0, 16) : v.replace(" ", "T").slice(0, 16);
  }, []);

  const formatPosterDateTime = (v: string) => {
    if (!v) return "";
    // "2025-12-29T17:24" -> "20251229172400" (초는 00)
    const cleaned = v.replace(/[-:T]/g, "");
    return `${cleaned.slice(0, 12)}00`;
  };

  const fetchPosterDetail = useCallback(async () => {
    if (!posterIdNum) return;
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/poster/${posterIdNum}?poster_id=${posterIdNum}`
      );
      const rows: PosterDetailRow[] = (res.data && res.data.result) || [];
      const base = rows[0];

      if (base?.title != null) setPosterTitle(base.title || "");
      if (base?.start_dt != null) setPostStartAt(toDateTimeLocalValue(base.start_dt || ""));
      if (base?.end_dt != null) setPostEndAt(toDateTimeLocalValue(base.end_dt || ""));

      if (base?.end_dt && String(base.end_dt).startsWith("2999")) {
        setPostRangeMode("forever");
      } else {
        setPostRangeMode("manual");
      }

      const web = rows.find((r) => r.poster_image_type === "WEB") || null;
      const print = rows.find((r) => r.poster_image_type === "PRINT") || null;

      const pickTextRow = (
        imageType: "WEB" | "PRINT",
        textType: "CENTER" | "ADDRESS" | "PHONE"
      ) => {
        return (
          rows.find(
            (r) =>
              r.poster_image_type === imageType &&
              r.poster_text_type === textType &&
              r.use_yn === "Y"
          ) ||
          rows.find(
            (r) => r.poster_image_type === imageType && r.poster_text_type === textType
          ) ||
          null
        );
      };

      const webCenter = pickTextRow("WEB", "CENTER");
      const webAddress = pickTextRow("WEB", "ADDRESS");
      const webPhone = pickTextRow("WEB", "PHONE");
      const printCenter = pickTextRow("PRINT", "CENTER");
      const printAddress = pickTextRow("PRINT", "ADDRESS");
      const printPhone = pickTextRow("PRINT", "PHONE");

      setWebPoster(web);
      setPrintPoster(print);
      setWebTextIds({
        CENTER: webCenter?.poster_text_id || undefined,
        ADDRESS: webAddress?.poster_text_id || undefined,
        PHONE: webPhone?.poster_text_id || undefined,
      });
      setWebTextUseYn({
        CENTER: (webCenter as any)?.use_yn === "Y" ? "Y" : (webCenter as any)?.use_yn === "N" ? "N" : undefined,
        ADDRESS: (webAddress as any)?.use_yn === "Y" ? "Y" : (webAddress as any)?.use_yn === "N" ? "N" : undefined,
        PHONE: (webPhone as any)?.use_yn === "Y" ? "Y" : (webPhone as any)?.use_yn === "N" ? "N" : undefined,
      });
      setPrintTextIds({
        CENTER: printCenter?.poster_text_id || undefined,
        ADDRESS: printAddress?.poster_text_id || undefined,
        PHONE: printPhone?.poster_text_id || undefined,
      });
      setPrintTextUseYn({
        CENTER: (printCenter as any)?.use_yn === "Y" ? "Y" : (printCenter as any)?.use_yn === "N" ? "N" : undefined,
        ADDRESS: (printAddress as any)?.use_yn === "Y" ? "Y" : (printAddress as any)?.use_yn === "N" ? "N" : undefined,
        PHONE: (printPhone as any)?.use_yn === "Y" ? "Y" : (printPhone as any)?.use_yn === "N" ? "N" : undefined,
      });

      // 표시항목 초기화: WEB/PRINT 각각 서버에 존재하는 텍스트 타입 기준
      setShowWebCenterLine((webCenter as any)?.use_yn === "Y");
      setShowWebAddressLine((webAddress as any)?.use_yn === "Y");
      setShowWebPhoneLine((webPhone as any)?.use_yn === "Y");
      setShowPrintCenterLine((printCenter as any)?.use_yn === "Y");
      setShowPrintAddressLine((printAddress as any)?.use_yn === "Y");
      setShowPrintPhoneLine((printPhone as any)?.use_yn === "Y");

      // 처음 진입 시: 실제 존재하는 타입 기준으로 토글 초기화
      const hasWeb = !!web?.file_id;
      const hasPrint = !!print?.file_id;
      if (hasWeb && hasPrint) setPosterView({ web: true, print: true });
      else if (hasWeb) setPosterView({ web: true, print: false });
      else if (hasPrint) setPosterView({ web: false, print: true });

      if (webCenter) {
        setFontFamily(webCenter.font_family || "");
        setFontSizePt(Number(webCenter.font_size || 90));
        setFontWeight(Number((webCenter as any).font_weight || 400));
        setFontColor(webCenter.color || "#ffffff");
        setTextPos({
          x: Number(webCenter.x_px || 10),
          y: Number(webCenter.y_px || 10),
        });
      }
      if (webAddress) {
        setAddressFontFamily(webAddress.font_family || "");
        setAddressFontSizePt(Number(webAddress.font_size || 90));
        setAddressFontWeight(Number((webAddress as any).font_weight || 400));
        setAddressFontColor(webAddress.color || "#ffffff");
        setAddressPos({
          x: Number(webAddress.x_px || 10),
          y: Number(webAddress.y_px || 60),
        });
      }
      if (webPhone) {
        setPhoneFontFamily(webPhone.font_family || "");
        setPhoneFontSizePt(Number(webPhone.font_size || 90));
        setPhoneFontWeight(Number((webPhone as any).font_weight || 400));
        setPhoneFontColor(webPhone.color || "#ffffff");
        setPhonePos({
          x: Number(webPhone.x_px || 10),
          y: Number(webPhone.y_px || 110),
        });
      }

      if (printCenter) {
        setPrintFontFamily(printCenter.font_family || "");
        setPrintFontSizePt(Number(printCenter.font_size || 230));
        setPrintFontWeight(Number((printCenter as any).font_weight || 400));
        setPrintFontColor(printCenter.color || "#ffffff");
        setPrintTextPos({
          x: Number(printCenter.x_px || 10),
          y: Number(printCenter.y_px || 10),
        });
      }
      if (printAddress) {
        setPrintAddressFontFamily(printAddress.font_family || "");
        setPrintAddressFontSizePt(Number(printAddress.font_size || 230));
        setPrintAddressFontWeight(Number((printAddress as any).font_weight || 400));
        setPrintAddressFontColor(printAddress.color || "#ffffff");
        setPrintAddressPos({
          x: Number(printAddress.x_px || 10),
          y: Number(printAddress.y_px || 60),
        });
      }
      if (printPhone) {
        setPrintPhoneFontFamily(printPhone.font_family || "");
        setPrintPhoneFontSizePt(Number(printPhone.font_size || 230));
        setPrintPhoneFontWeight(Number((printPhone as any).font_weight || 400));
        setPrintPhoneFontColor(printPhone.color || "#ffffff");
        setPrintPhonePos({
          x: Number(printPhone.x_px || 10),
          y: Number(printPhone.y_px || 110),
        });
      }
    } catch (e) {
      console.log(e);
      alert("포스터 정보를 불러오지 못했습니다.");
    }
  }, [posterIdNum, toDateTimeLocalValue]);

  const updatePoster = useCallback(async () => {
    if (!isAdmin) return;
    if (!posterIdNum) return alert("잘못된 포스터 ID 입니다.");
    if (isSubmitting) return;

    if (!posterTitle.trim()) return alert("포스터 제목을 입력해주세요.");
    if (!postStartAt) return alert("다운로드 시작일을 선택해주세요.");
    if (!postEndAt) return alert("다운로드 종료일을 선택해주세요.");

    if (posterView.web) {
      if (!templateFile && !webPoster?.file_id) return alert("웹용 이미지를 업로드해주세요.");
      if (showWebCenterLine && centerTextValue && !fontFamily) return alert("웹용 지점명 폰트를 선택해주세요.");
      if (showWebAddressLine && addressTextValue && !addressFontFamily) return alert("웹용 주소 폰트를 선택해주세요.");
      if (showWebPhoneLine && phoneTextValue && !phoneFontFamily) return alert("웹용 매장번호 폰트를 선택해주세요.");
    }
    if (posterView.print) {
      if (!printTemplateFile && !printPoster?.file_id) return alert("인쇄용 이미지를 업로드해주세요.");
      if (showPrintCenterLine && centerTextValue && !printFontFamily) return alert("인쇄용 지점명 폰트를 선택해주세요.");
      if (showPrintAddressLine && addressTextValue && !printAddressFontFamily) return alert("인쇄용 주소 폰트를 선택해주세요.");
      if (showPrintPhoneLine && phoneTextValue && !printPhoneFontFamily) return alert("인쇄용 매장번호 폰트를 선택해주세요.");
    }

    try {
      setIsSubmitting(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterBase`, {
        poster_id: posterIdNum,
        title: posterTitle,
        start_dt: formatPosterDateTime(postStartAt),
        end_dt: formatPosterDateTime(postEndAt),
        userId: user.index,
      });

      const uploadPosterImage = async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("userId", String(user.index));
        const uploadRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/poster/uploadPosterImage`,
          formData
        );
        const fileId = (uploadRes.data && uploadRes.data.file_id) || 0;
        if (!fileId) throw new Error("file_id 없음");
        return fileId;
      };

      const upsertImageAndTexts = async (opts: {
        poster_image_type: "WEB" | "PRINT";
        existing: PosterDetailRow | null;
        file: File | null;
      }) => {
        let fileId = opts.existing?.file_id || 0;
        if (opts.file) {
          fileId = await uploadPosterImage(opts.file);
        }
        if (!fileId) throw new Error(`${opts.poster_image_type}: file_id 없음`);

        let posterImageId = opts.existing?.poster_image_id || 0;
        if (posterImageId) {
          await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterImage`, {
            poster_image_id: posterImageId,
            poster_image_type: opts.poster_image_type,
            file_id: fileId,
            userId: user.index,
          });
        } else {
          const imgRes = await axios.post(`${process.env.REACT_APP_API_URL}/poster/createPosterImage`, {
            poster_id: posterIdNum,
            file_id: fileId,
            poster_image_type: opts.poster_image_type,
            userId: user.index,
          });
          posterImageId =
            (imgRes.data &&
              imgRes.data.result &&
              (imgRes.data.result.insertId || imgRes.data.result.poster_image_id)) ||
            0;
          if (!posterImageId) throw new Error("poster_image_id 없음");
        }

        const upsertText = async (t: "CENTER" | "ADDRESS" | "PHONE", payload: {
          font_family: string;
          font_size: number;
          font_weight: number;
          color: string;
          x_px: number;
          y_px: number;
        }, existingTextId?: number, existingUseYn?: "Y" | "N" | null) => {
          if (existingTextId) {
            if (existingUseYn === "N") {
              await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
                poster_text_id: existingTextId,
                use_yn: "Y",
                userId: user.index,
              });
            }
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterText`, {
              poster_text_id: existingTextId,
              poster_text_type: t,
              font_family: payload.font_family,
              font_size: payload.font_size,
              font_weight: payload.font_weight,
              color: payload.color,
              x_px: Math.round(payload.x_px),
              y_px: Math.round(payload.y_px),
              userId: user.index,
            });
            return;
          }
          await axios.post(`${process.env.REACT_APP_API_URL}/poster/createPosterText`, {
            poster_image_id: posterImageId,
            poster_text_type: t,
            font_family: payload.font_family,
            font_size: payload.font_size,
            font_weight: payload.font_weight,
            color: payload.color,
            x_px: Math.round(payload.x_px),
            y_px: Math.round(payload.y_px),
            userId: user.index,
          });
        };

        if (opts.poster_image_type === "WEB") {
          // 체크 해제된 타입은 use_yn = N 처리(기존 row가 있을 때만)
          if (!showWebCenterLine && webTextIds.CENTER && webTextUseYn.CENTER === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: webTextIds.CENTER,
              use_yn: "N",
              userId: user.index,
            });
          }
          if (!showWebAddressLine && webTextIds.ADDRESS && webTextUseYn.ADDRESS === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: webTextIds.ADDRESS,
              use_yn: "N",
              userId: user.index,
            });
          }
          if (!showWebPhoneLine && webTextIds.PHONE && webTextUseYn.PHONE === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: webTextIds.PHONE,
              use_yn: "N",
              userId: user.index,
            });
          }

          if (showWebCenterLine && centerTextValue) {
            await upsertText(
              "CENTER",
              {
                font_family: fontFamily,
                font_size: fontSizePt,
                font_weight: fontWeight,
                color: fontColor,
                x_px: textPos.x,
                y_px: textPos.y,
              },
              webTextIds.CENTER,
              webTextUseYn.CENTER || null
            );
          }
          if (showWebAddressLine && addressTextValue) {
            await upsertText(
              "ADDRESS",
              {
                font_family: addressFontFamily,
                font_size: addressFontSizePt,
                font_weight: addressFontWeight,
                color: addressFontColor,
                x_px: addressPos.x,
                y_px: addressPos.y,
              },
              webTextIds.ADDRESS,
              webTextUseYn.ADDRESS || null
            );
          }
          if (showWebPhoneLine && phoneTextValue) {
            await upsertText(
              "PHONE",
              {
                font_family: phoneFontFamily,
                font_size: phoneFontSizePt,
                font_weight: phoneFontWeight,
                color: phoneFontColor,
                x_px: phonePos.x,
                y_px: phonePos.y,
              },
              webTextIds.PHONE,
              webTextUseYn.PHONE || null
            );
          }
        } else {
          // 체크 해제된 타입은 use_yn = N 처리(기존 row가 있을 때만)
          if (!showPrintCenterLine && printTextIds.CENTER && printTextUseYn.CENTER === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: printTextIds.CENTER,
              use_yn: "N",
              userId: user.index,
            });
          }
          if (!showPrintAddressLine && printTextIds.ADDRESS && printTextUseYn.ADDRESS === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: printTextIds.ADDRESS,
              use_yn: "N",
              userId: user.index,
            });
          }
          if (!showPrintPhoneLine && printTextIds.PHONE && printTextUseYn.PHONE === "Y") {
            await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterTextUseYn`, {
              poster_text_id: printTextIds.PHONE,
              use_yn: "N",
              userId: user.index,
            });
          }

          if (showPrintCenterLine && centerTextValue) {
            await upsertText(
              "CENTER",
              {
                font_family: printFontFamily,
                font_size: printFontSizePt,
                font_weight: printFontWeight,
                color: printFontColor,
                x_px: printTextPos.x,
                y_px: printTextPos.y,
              },
              printTextIds.CENTER,
              printTextUseYn.CENTER || null
            );
          }
          if (showPrintAddressLine && addressTextValue) {
            await upsertText(
              "ADDRESS",
              {
                font_family: printAddressFontFamily,
                font_size: printAddressFontSizePt,
                font_weight: printAddressFontWeight,
                color: printAddressFontColor,
                x_px: printAddressPos.x,
                y_px: printAddressPos.y,
              },
              printTextIds.ADDRESS,
              printTextUseYn.ADDRESS || null
            );
          }
          if (showPrintPhoneLine && phoneTextValue) {
            await upsertText(
              "PHONE",
              {
                font_family: printPhoneFontFamily,
                font_size: printPhoneFontSizePt,
                font_weight: printPhoneFontWeight,
                color: printPhoneFontColor,
                x_px: printPhonePos.x,
                y_px: printPhonePos.y,
              },
              printTextIds.PHONE,
              printTextUseYn.PHONE || null
            );
          }
        }
      };

      // 체크 해제된 타입은 use_yn = N 처리(기존 row가 있을 때만)
      if (!posterView.web && webPoster?.poster_image_id) {
        await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterImageUseYn`, {
          poster_image_id: webPoster.poster_image_id,
          use_yn: "N",
          userId: user.index,
        });
      }
      if (!posterView.print && printPoster?.poster_image_id) {
        await axios.post(`${process.env.REACT_APP_API_URL}/poster/updatePosterImageUseYn`, {
          poster_image_id: printPoster.poster_image_id,
          use_yn: "N",
          userId: user.index,
        });
      }

      if (posterView.web) {
        await upsertImageAndTexts({
          poster_image_type: "WEB",
          existing: webPoster,
          file: templateFile,
        });
      }
      if (posterView.print) {
        await upsertImageAndTexts({
          poster_image_type: "PRINT",
          existing: printPoster,
          file: printTemplateFile,
        });
      }

      await fetchPosterDetail();
      if (templatePreviewUrl) URL.revokeObjectURL(templatePreviewUrl);
      if (printTemplatePreviewUrl) URL.revokeObjectURL(printTemplatePreviewUrl);
      setTemplateFile(null);
      setTemplatePreviewUrl(null);
      setPrintTemplateFile(null);
      setPrintTemplatePreviewUrl(null);

      alert("포스터가 수정되었습니다.");
    } catch (e) {
      alert("포스터 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isAdmin,
    isSubmitting,
    navigate,
    posterIdNum,
    posterTitle,
    postStartAt,
    postEndAt,
    posterView.web,
    posterView.print,
    fontFamily,
    fontSizePt,
    fontWeight,
    fontColor,
    textPos.x,
    textPos.y,
    addressFontFamily,
    addressFontSizePt,
    addressFontWeight,
    addressFontColor,
    addressPos.x,
    addressPos.y,
    phoneFontFamily,
    phoneFontSizePt,
    phoneFontWeight,
    phoneFontColor,
    phonePos.x,
    phonePos.y,
    printFontFamily,
    printFontSizePt,
    printFontWeight,
    printFontColor,
    printTextPos.x,
    printTextPos.y,
    printAddressFontFamily,
    printAddressFontSizePt,
    printAddressFontWeight,
    printAddressFontColor,
    printAddressPos.x,
    printAddressPos.y,
    printPhoneFontFamily,
    printPhoneFontSizePt,
    printPhoneFontWeight,
    printPhoneFontColor,
    printPhonePos.x,
    printPhonePos.y,
    showWebCenterLine,
    showWebAddressLine,
    showWebPhoneLine,
    showPrintCenterLine,
    showPrintAddressLine,
    showPrintPhoneLine,
    centerTextValue,
    addressTextValue,
    phoneTextValue,
    templateFile,
    printTemplateFile,
    user.index,
    webPoster,
    printPoster,
    webTextIds.CENTER,
    webTextIds.ADDRESS,
    webTextIds.PHONE,
    printTextIds.CENTER,
    printTextIds.ADDRESS,
    printTextIds.PHONE,
    templatePreviewUrl,
    printTemplatePreviewUrl,
    fetchPosterDetail,
  ]);

  useEffect(() => {
    fetchPosterDetail();
  }, [fetchPosterDetail]);

  useEffect(() => {
    installAutoCloseNativePickers();
  }, []);

  useEffect(() => {
    const centerId = (user as any)?.center_id;
    if (!centerId) return;
    const run = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/center`, {
          params: { center_id: centerId },
        });
        setCenterInfo(res.data?.result?.[0] || null);
      } catch (e) {
        console.log(e);
      }
    };
    run();
  }, [user]);

  useEffect(() => {
    if (postRangeMode !== "forever") return;

    // keep manual values so we can restore when switching back
    // (무기한 값(2999)은 manual 값으로 저장하지 않음)
    if (!String(postEndAt || "").startsWith("2999")) {
    manualPostRangeRef.current = { start: postStartAt, end: postEndAt };
    }

    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localIso = new Date(now.getTime() - tzOffsetMs).toISOString();
    const nowLocalNoSeconds = localIso.slice(0, 16); // YYYY-MM-DDTHH:MM

    setPostStartAt(nowLocalNoSeconds);
    setPostEndAt("2999-12-31T23:59");
  }, [postRangeMode]);

  useEffect(() => {
    if (postRangeMode !== "manual") return;
    // restore manual values when switching back
    const s = manualPostRangeRef.current.start;
    const e = manualPostRangeRef.current.end;
    // 무기한(2999) 값은 manual 복원값으로 취급하지 않음
    const has2999 =
      String(s || "").startsWith("2999") || String(e || "").startsWith("2999");
    if ((s || e) && !has2999) {
      setPostStartAt(s);
      setPostEndAt(e);
      return;
    }

    // 무기한(2999)에서 직접입력으로 돌아왔는데, 이전에 직접입력 값이 없으면
    // 2999가 그대로 남아서 선택이 불편하니 기본값을 현재시간 기준으로 되돌린다.
    if (String(postEndAt || "").startsWith("2999")) {
      const now = new Date();
      const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
      const localIso = new Date(now.getTime() - tzOffsetMs).toISOString();
      const nowLocalNoSeconds = localIso.slice(0, 16); // YYYY-MM-DDTHH:MM
      setPostStartAt((prev) =>
        String(prev || "").startsWith("2999") ? nowLocalNoSeconds : prev || nowLocalNoSeconds
      );
      setPostEndAt("");
    }
  }, [postRangeMode]);

  useEffect(() => {
    const selected = FONT_OPTIONS.find((f) => f.family === fontFamily);
    if (!selected || !selected.url) return;

    try {
      const face = new FontFace(
        selected.family,
        `url(${selected.url})`
      );
      // async load, no await needed for UI
      face
        .load()
        .then(() => {
          try {
            document.fonts.add(face);
          } catch (e) {
            console.log(e);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    } catch (e) {
      console.log(e);
    }
  }, [fontFamily]);

  useEffect(() => {
    const selected = FONT_OPTIONS.find((f) => f.family === printFontFamily);
    if (!selected || !selected.url) return;

    try {
      const face = new FontFace(
        selected.family,
        `url(${selected.url})`
      );
      // async load, no await needed for UI
      face
        .load()
        .then(() => {
          try {
            document.fonts.add(face);
          } catch (e) {
            console.log(e);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    } catch (e) {
      console.log(e);
    }
  }, [printFontFamily]);

  const handleTemplateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const fileType = file.type;

    if (fileType !== "image/png" && fileType !== "image/jpeg") {
      alert("PNG 또는 JPG 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }

    // 일단은: 너무 빡빡하지 않게 100MB 제한
    if (file.size > 100 * 1024 * 1024) {
      alert("파일 크기는 100MB 이하만 허용됩니다.");
      e.target.value = "";
      return;
    }

    const dpi = await getImageDpi(file);
    if (dpi == null) {
      alert("웹용 이미지는 DPI 정보를 확인할 수 있어야 업로드 가능합니다. (DPI 100 이하)");
      e.target.value = "";
      return;
    }
    if (dpi > 100) {
      alert(`웹용 이미지는 DPI 100 이하만 업로드 가능합니다. (현재: ${dpi})`);
      e.target.value = "";
      return;
    }

    // 이미지 해상도 체크: 가로/세로 중 하나라도 1000px 이상만 허용
    const tmpUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = tmpUrl;
      
      // 타임아웃 추가 (10초)
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("이미지 로드 타임아웃")), 10000);
      });

      try {
        if ((img as any).decode) {
          await Promise.race([(img as any).decode(), timeoutPromise]);
        } else {
          await Promise.race([
            new Promise<void>((resolve, reject) => {
              img.onload = () => {
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                  reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                } else {
                  resolve();
                }
              };
              img.onerror = () => reject(new Error("이미지 로드 실패"));
            }),
            timeoutPromise,
          ]);
        }
      } catch (decodeErr) {
        // decode 실패 시 onload/onerror로 폴백
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (img.complete) {
              if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
              } else {
                resolve();
              }
            } else {
              img.onload = () => {
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                  reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                } else {
                  resolve();
                }
              };
              img.onerror = () => reject(new Error("이미지 로드 실패"));
            }
          }),
          timeoutPromise,
        ]);
      }

      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w === 0 || h === 0) {
        URL.revokeObjectURL(tmpUrl);
        alert("이미지 크기 정보를 확인할 수 없습니다. 다른 이미지를 선택해주세요.");
        e.target.value = "";
        return;
      }
      if (Math.max(w, h) < 1000) {
        URL.revokeObjectURL(tmpUrl);
        alert("이미지는 가로/세로 중 하나가 1000px 이상이어야 업로드 가능합니다.");
        e.target.value = "";
        return;
      }
    } catch (err) {
      URL.revokeObjectURL(tmpUrl);
      const errMsg = err instanceof Error ? err.message : "알 수 없는 오류";
      alert(`이미지 정보를 확인할 수 없습니다. (${errMsg}) 다른 이미지를 선택해주세요.`);
      e.target.value = "";
      return;
    }

    // Cleanup old preview URL
    if (templatePreviewUrl) URL.revokeObjectURL(templatePreviewUrl);

    setTemplateFile(file);
    setTemplatePreviewUrl(tmpUrl);
  };

  const handlePrintTemplateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const fileType = file.type;

    if (fileType !== "image/png" && fileType !== "image/jpeg") {
      alert("PNG 또는 JPG 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }

    // 일단은: 너무 빡빡하지 않게 100MB 제한
    if (file.size > 100 * 1024 * 1024) {
      alert("파일 크기는 100MB 이하만 허용됩니다.");
      e.target.value = "";
      return;
    }

    const dpi = await getImageDpi(file);
    if (dpi == null) {
      alert("인쇄용 이미지는 DPI 정보를 확인할 수 있어야 업로드 가능합니다. (DPI 200 이상)");
      e.target.value = "";
      return;
    }
    if (dpi < 200) {
      alert(`인쇄용 이미지는 DPI 200 이상만 업로드 가능합니다. (현재: ${dpi})`);
      e.target.value = "";
      return;
    }

    // 이미지 해상도 체크: 가로/세로 중 하나라도 1000px 이상만 허용
    const tmpUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = tmpUrl;
      
      // 타임아웃 추가 (10초)
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("이미지 로드 타임아웃")), 10000);
      });

      try {
        if ((img as any).decode) {
          await Promise.race([(img as any).decode(), timeoutPromise]);
        } else {
          await Promise.race([
            new Promise<void>((resolve, reject) => {
              img.onload = () => {
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                  reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                } else {
                  resolve();
                }
              };
              img.onerror = () => reject(new Error("이미지 로드 실패"));
            }),
            timeoutPromise,
          ]);
        }
      } catch (decodeErr) {
        // decode 실패 시 onload/onerror로 폴백
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (img.complete) {
              if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
              } else {
                resolve();
              }
            } else {
              img.onload = () => {
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                  reject(new Error("이미지 크기 정보를 확인할 수 없습니다"));
                } else {
                  resolve();
                }
              };
              img.onerror = () => reject(new Error("이미지 로드 실패"));
            }
          }),
          timeoutPromise,
        ]);
      }

      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w === 0 || h === 0) {
        URL.revokeObjectURL(tmpUrl);
        alert("이미지 크기 정보를 확인할 수 없습니다. 다른 이미지를 선택해주세요.");
        e.target.value = "";
        return;
      }
      if (Math.max(w, h) < 1000) {
        URL.revokeObjectURL(tmpUrl);
        alert("이미지는 가로/세로 중 하나가 1000px 이상이어야 업로드 가능합니다.");
        e.target.value = "";
        return;
      }
    } catch (err) {
      URL.revokeObjectURL(tmpUrl);
      const errMsg = err instanceof Error ? err.message : "알 수 없는 오류";
      alert(`이미지 정보를 확인할 수 없습니다. (${errMsg}) 다른 이미지를 선택해주세요.`);
      e.target.value = "";
      return;
    }

    // Cleanup old preview URL
    if (printTemplatePreviewUrl) URL.revokeObjectURL(printTemplatePreviewUrl);

    setPrintTemplateFile(file);
    setPrintTemplatePreviewUrl(tmpUrl);
  };

  useEffect(() => {
    return () => {
      if (templatePreviewUrl) URL.revokeObjectURL(templatePreviewUrl);
    };
  }, [templatePreviewUrl]);

  useEffect(() => {
    return () => {
      if (printTemplatePreviewUrl) URL.revokeObjectURL(printTemplatePreviewUrl);
    };
  }, [printTemplatePreviewUrl]);

  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;

    const update = () => {
      const img = previewImgRef.current;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!img || !cw || !ch) return;
      if (!img.naturalWidth || !img.naturalHeight) return;

      // 화면에 맞춤(object-contain) 기준으로 실제 그려지는 이미지 영역 계산
      const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const left = (cw - w) / 2;
      const top = (ch - h) / 2;

      setImageBox((prev) =>
        prev &&
        prev.left === left &&
        prev.top === top &&
        prev.width === w &&
        prev.height === h
          ? prev
          : { left, top, width: w, height: h }
      );
    };

    // 이미지 로드/레이아웃 반영 후 계산되도록 한 프레임 뒤에 실행
    const raf = requestAnimationFrame(update);

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mainPreviewUrl]);

  useEffect(() => {
    const el = printPreviewBoxRef.current;
    if (!el) return;

    const update = () => {
      const img = printPreviewImgRef.current;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!img || !cw || !ch) return;
      if (!img.naturalWidth || !img.naturalHeight) return;

      // 화면에 맞춤(object-contain) 기준으로 실제 그려지는 이미지 영역 계산
      const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const left = (cw - w) / 2;
      const top = (ch - h) / 2;

      setPrintImageBox((prev) =>
        prev &&
        prev.left === left &&
        prev.top === top &&
        prev.width === w &&
        prev.height === h
          ? prev
          : { left, top, width: w, height: h }
      );
    };

    // 이미지 로드/레이아웃 반영 후 계산되도록 한 프레임 뒤에 실행
    const raf = requestAnimationFrame(update);

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [printMainPreviewUrl]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      if (!imageBox) return;
      const container = previewBoxRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const target = dragTargetRef.current;
      const textEl =
        target === "address"
          ? addressTextRef.current
          : target === "phone"
            ? phoneTextRef.current
            : centerTextRef.current;
      const textRect = textEl ? textEl.getBoundingClientRect() : null;
      const textW = (textRect && textRect.width) || 0;
      const textH = (textRect && textRect.height) || 0;

      const natW = imageNaturalSize?.w || 0;
      const natH = imageNaturalSize?.h || 0;
      const scale = webScale || 1;
      if (!natW || !natH || !scale) return;

      // Pointer position in IMAGE coordinates
      const pointerXImg = (e.clientX - rect.left - imageBox.left) / scale;
      const pointerYImg = (e.clientY - rect.top - imageBox.top) / scale;

      const textWImg = textW / scale;
      const textHImg = textH / scale;

      const maxX = Math.max(0, natW - textWImg);
      const maxY = Math.max(0, natH - textHImg);

      let nextX = pointerXImg - dragOffsetRef.current.x;
      let nextY = pointerYImg - dragOffsetRef.current.y;
      nextX = Math.min(Math.max(0, nextX), maxX);
      nextY = Math.min(Math.max(0, nextY), maxY);

      // Figma/Photoshop 스타일 중앙 정렬 가이드(근접 시 표시 + 스냅)
      const snapThreshold = 6; // px
      const snapThresholdImg = snapThreshold / scale;
      const centerTargetX = (natW - textWImg) / 2;
      const centerTargetY = (natH - textHImg) / 2;

      const snapV = Math.abs(nextX - centerTargetX) <= snapThresholdImg;
      const snapH = Math.abs(nextY - centerTargetY) <= snapThresholdImg;

      if (snapV) nextX = Math.min(Math.max(0, centerTargetX), maxX);
      if (snapH) nextY = Math.min(Math.max(0, centerTargetY), maxY);

      setShowGuides((prev) =>
        prev.v === snapV && prev.h === snapH ? prev : { v: snapV, h: snapH }
      );

      nextX = Math.round(nextX);
      nextY = Math.round(nextY);
      if (target === "address") {
        setAddressPos({ x: nextX, y: nextY });
      } else if (target === "phone") {
        setPhonePos({ x: nextX, y: nextY });
      } else {
        setTextPos({ x: nextX, y: nextY });
      }
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      dragTargetRef.current = null;
      setShowGuides((prev) => (prev.v || prev.h ? { v: false, h: false } : prev));
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [imageBox, imageNaturalSize?.w, imageNaturalSize?.h, webScale]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!printDraggingRef.current) return;
      if (!printImageBox) return;
      const container = printPreviewBoxRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const target = printDragTargetRef.current;
      const textEl =
        target === "address"
          ? printAddressTextRef.current
          : target === "phone"
            ? printPhoneTextRef.current
            : printCenterTextRef.current;
      const textRect = textEl ? textEl.getBoundingClientRect() : null;
      const textW = (textRect && textRect.width) || 0;
      const textH = (textRect && textRect.height) || 0;

      const natW = printImageNaturalSize?.w || 0;
      const natH = printImageNaturalSize?.h || 0;
      const scale = printScale || 1;
      if (!natW || !natH || !scale) return;

      const pointerXImg = (e.clientX - rect.left - printImageBox.left) / scale;
      const pointerYImg = (e.clientY - rect.top - printImageBox.top) / scale;

      const textWImg = textW / scale;
      const textHImg = textH / scale;

      const maxX = Math.max(0, natW - textWImg);
      const maxY = Math.max(0, natH - textHImg);

      let nextX = pointerXImg - printDragOffsetRef.current.x;
      let nextY = pointerYImg - printDragOffsetRef.current.y;
      nextX = Math.min(Math.max(0, nextX), maxX);
      nextY = Math.min(Math.max(0, nextY), maxY);

      // Figma/Photoshop 스타일 중앙 정렬 가이드(근접 시 표시 + 스냅)
      const snapThreshold = 6; // px
      const snapThresholdImg = snapThreshold / scale;
      const centerTargetX = (natW - textWImg) / 2;
      const centerTargetY = (natH - textHImg) / 2;

      const snapV = Math.abs(nextX - centerTargetX) <= snapThresholdImg;
      const snapH = Math.abs(nextY - centerTargetY) <= snapThresholdImg;

      if (snapV) nextX = Math.min(Math.max(0, centerTargetX), maxX);
      if (snapH) nextY = Math.min(Math.max(0, centerTargetY), maxY);

      setPrintShowGuides((prev) =>
        prev.v === snapV && prev.h === snapH ? prev : { v: snapV, h: snapH }
      );

      nextX = Math.round(nextX);
      nextY = Math.round(nextY);
      if (target === "address") {
        setPrintAddressPos({ x: nextX, y: nextY });
      } else if (target === "phone") {
        setPrintPhonePos({ x: nextX, y: nextY });
      } else {
        setPrintTextPos({ x: nextX, y: nextY });
      }
    };

    const onMouseUp = () => {
      printDraggingRef.current = false;
      printDragTargetRef.current = null;
      setPrintShowGuides((prev) => (prev.v || prev.h ? { v: false, h: false } : prev));
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [printImageBox, printImageNaturalSize?.w, printImageNaturalSize?.h, printScale]);

  // Render overlay via canvas so preview and download share the same renderer (pixel-identical).
  useEffect(() => {
    if (!imageBox) return;
    if (!imageNaturalSize?.w || !imageNaturalSize?.h) return;
    const canvas = webOverlayCanvasRef.current;
    if (!canvas) return;
    const drawSeq = ++webOverlayDrawSeqRef.current;

    const run = async () => {
      try {
        if (showWebCenterLine && centerTextValue) await ensureFontLoaded(fontFamily || "");
        if (showWebAddressLine && addressTextValue) await ensureFontLoaded(addressFontFamily || "");
        if (showWebPhoneLine && phoneTextValue) await ensureFontLoaded(phoneFontFamily || "");
      } catch {}
      // If a newer draw was scheduled, abort this stale draw (prevents random fallback overwrites).
      if (drawSeq !== webOverlayDrawSeqRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.max(1, Math.round(imageBox.width));
      const cssH = Math.max(1, Math.round(imageBox.height));
      const cssWpx = `${cssW}px`;
      const cssHpx = `${cssH}px`;
      const nextW = Math.round(cssW * dpr);
      const nextH = Math.round(cssH * dpr);
      if (
        canvas.width !== nextW ||
        canvas.height !== nextH ||
        canvas.style.width !== cssWpx ||
        canvas.style.height !== cssHpx
      ) {
        canvas.style.width = cssWpx;
        canvas.style.height = cssHpx;
        canvas.width = nextW;
        canvas.height = nextH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const scale = webScale || 1;

      ctx.save();
      ctx.textBaseline = "top";

      if (showWebCenterLine && centerTextValue) {
        const size = ((Number(fontSizePt || 90) * 4) / 3) * scale;
        ctx.fillStyle = fontColor || "#ffffff";
        ctx.font = `${Number(fontWeight || 400)} ${size}px "${fontFamily || ""}"`;
        ctx.fillText(
          String(centerTextValue || ""),
          Math.round(Number(textPos.x || 0) * scale),
          Math.round(Number(textPos.y || 0) * scale)
        );
      }
      if (showWebAddressLine && addressTextValue) {
        const size = ((Number(addressFontSizePt || 90) * 4) / 3) * scale;
        ctx.fillStyle = addressFontColor || "#ffffff";
        ctx.font = `${Number(addressFontWeight || 400)} ${size}px "${addressFontFamily || ""}"`;
        ctx.fillText(
          String(addressTextValue || ""),
          Math.round(Number(addressPos.x || 0) * scale),
          Math.round(Number(addressPos.y || 0) * scale)
        );
      }
      if (showWebPhoneLine && phoneTextValue) {
        const size = ((Number(phoneFontSizePt || 90) * 4) / 3) * scale;
        ctx.fillStyle = phoneFontColor || "#ffffff";
        ctx.font = `${Number(phoneFontWeight || 400)} ${size}px "${phoneFontFamily || ""}"`;
        ctx.fillText(
          String(phoneTextValue || ""),
          Math.round(Number(phonePos.x || 0) * scale),
          Math.round(Number(phonePos.y || 0) * scale)
        );
      }

      ctx.restore();
    };

    // Schedule; stale-guard ensures only the latest draw writes to the canvas.
    requestAnimationFrame(() => run());
  }, [
    imageBox,
    imageNaturalSize?.w,
    imageNaturalSize?.h,
    webScale,
    textPos.x,
    textPos.y,
    addressPos.x,
    addressPos.y,
    phonePos.x,
    phonePos.y,
    fontColor,
    fontFamily,
    fontSizePt,
    fontWeight,
    addressFontColor,
    addressFontFamily,
    addressFontSizePt,
    addressFontWeight,
    phoneFontColor,
    phoneFontFamily,
    phoneFontSizePt,
    phoneFontWeight,
    centerTextValue,
    addressTextValue,
    phoneTextValue,
    showWebCenterLine,
    showWebAddressLine,
    showWebPhoneLine,
    ensureFontLoaded,
  ]);

  useEffect(() => {
    if (!printImageBox) return;
    if (!printImageNaturalSize?.w || !printImageNaturalSize?.h) return;
    const canvas = printOverlayCanvasRef.current;
    if (!canvas) return;
    const drawSeq = ++printOverlayDrawSeqRef.current;

    const run = async () => {
      try {
        if (showPrintCenterLine && centerTextValue) await ensureFontLoaded(printFontFamily || "");
        if (showPrintAddressLine && addressTextValue) await ensureFontLoaded(printAddressFontFamily || "");
        if (showPrintPhoneLine && phoneTextValue) await ensureFontLoaded(printPhoneFontFamily || "");
      } catch {}
      if (drawSeq !== printOverlayDrawSeqRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.max(1, Math.round(printImageBox.width));
      const cssH = Math.max(1, Math.round(printImageBox.height));
      const cssWpx = `${cssW}px`;
      const cssHpx = `${cssH}px`;
      const nextW = Math.round(cssW * dpr);
      const nextH = Math.round(cssH * dpr);
      if (
        canvas.width !== nextW ||
        canvas.height !== nextH ||
        canvas.style.width !== cssWpx ||
        canvas.style.height !== cssHpx
      ) {
        canvas.style.width = cssWpx;
        canvas.style.height = cssHpx;
        canvas.width = nextW;
        canvas.height = nextH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const scale = printScale || 1;

      ctx.save();
      ctx.textBaseline = "top";

      if (showPrintCenterLine && centerTextValue) {
        const size = ((Number(printFontSizePt || 230) * 4) / 3) * scale;
        ctx.fillStyle = printFontColor || "#ffffff";
        ctx.font = `${Number(printFontWeight || 400)} ${size}px "${printFontFamily || ""}"`;
        ctx.fillText(
          String(centerTextValue || ""),
          Math.round(Number(printTextPos.x || 0) * scale),
          Math.round(Number(printTextPos.y || 0) * scale)
        );
      }
      if (showPrintAddressLine && addressTextValue) {
        const size = ((Number(printAddressFontSizePt || 230) * 4) / 3) * scale;
        ctx.fillStyle = printAddressFontColor || "#ffffff";
        ctx.font = `${Number(printAddressFontWeight || 400)} ${size}px "${
          printAddressFontFamily || ""
        }"`;
        ctx.fillText(
          String(addressTextValue || ""),
          Math.round(Number(printAddressPos.x || 0) * scale),
          Math.round(Number(printAddressPos.y || 0) * scale)
        );
      }
      if (showPrintPhoneLine && phoneTextValue) {
        const size = ((Number(printPhoneFontSizePt || 230) * 4) / 3) * scale;
        ctx.fillStyle = printPhoneFontColor || "#ffffff";
        ctx.font = `${Number(printPhoneFontWeight || 400)} ${size}px "${
          printPhoneFontFamily || ""
        }"`;
        ctx.fillText(
          String(phoneTextValue || ""),
          Math.round(Number(printPhonePos.x || 0) * scale),
          Math.round(Number(printPhonePos.y || 0) * scale)
        );
      }

      ctx.restore();
    };

    requestAnimationFrame(() => run());
  }, [
    printImageBox,
    printImageNaturalSize?.w,
    printImageNaturalSize?.h,
    printScale,
    printTextPos.x,
    printTextPos.y,
    printAddressPos.x,
    printAddressPos.y,
    printPhonePos.x,
    printPhonePos.y,
    printFontColor,
    printFontFamily,
    printFontSizePt,
    printFontWeight,
    printAddressFontColor,
    printAddressFontFamily,
    printAddressFontSizePt,
    printAddressFontWeight,
    printPhoneFontColor,
    printPhoneFontFamily,
    printPhoneFontSizePt,
    printPhoneFontWeight,
    centerTextValue,
    addressTextValue,
    phoneTextValue,
    showPrintCenterLine,
    showPrintAddressLine,
    showPrintPhoneLine,
    ensureFontLoaded,
  ]);
  
  return (
    <div className="min-h-screen p-3 sm:p-10">
      <div className="flex justify-between">
        <div>
          <span className="font-bold text-xl">포스터 상세</span>
        </div>
        <div className="flex items-center gap-2">
          {hasWeb && (
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-white shadow-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0C4A60' }}
              onClick={() => downloadPosterImage("WEB")}
              disabled={isDownloadingWeb || isDownloadingPrint}
            >
              {isDownloadingWeb ? "다운로드 중..." : "웹용 다운로드"}
            </button>
          )}
          {hasPrint && (
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-white shadow-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0C4A60' }}
              onClick={() => downloadPosterImage("PRINT")}
              disabled={isDownloadingWeb || isDownloadingPrint}
            >
              {isDownloadingPrint ? "다운로드 중..." : "인쇄용 다운로드"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-between">
        {isAdmin && (
          <div className="inline-flex items-center rounded-2xl bg-white p-1 shadow-md ring-1 ring-black/5">
            <button
              type="button"
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                  posterView.web && posterView.print
                    ? "bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-slate-50"
                }`}
                onClick={() => setPosterView({ web: true, print: true })}
              >
                전체
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                posterView.web && !posterView.print
                  ? "bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-slate-50"
              }`}
              onClick={() => setPosterView({ web: true, print: false })}
            >
              웹용
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                posterView.print && !posterView.web
                  ? "bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-slate-50"
              }`}
              onClick={() => setPosterView({ web: false, print: true })}
            >
              인쇄용
            </button>
          </div>
        )}
        {isAdmin && (
          <button
            type="button"
            disabled={isSubmitting}
            style={{ backgroundColor: '#5F9EA0' }}
            className="rounded-xl px-4 text-sm font-semibold text-white shadow-md"
            onClick={() => {
              updatePoster();
            }}
          >
            {isSubmitting ? "수정중..." : "수정"}
          </button>
        )}
      </div>

      {isAdmin ? (
        <div className="mt-4 bg-white shadow-md sm:rounded-lg p-4">
            <div className="mt-4 font-bold text-base">포스터 제목</div>
            <input
              type="text"
              className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
              value={posterTitle}
              onChange={(e) => setPosterTitle(e.target.value)}
              placeholder="포스터 제목 입력"
            />

          <div className="mt-4 font-bold text-base">다운로드 가능 기간</div>
            <div className="mt-2 flex items-center gap-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="postRangeMode"
                  value="manual"
                  checked={postRangeMode === "manual"}
                  onChange={() => setPostRangeMode("manual")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">직접입력</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="postRangeMode"
                  value="forever"
                  checked={postRangeMode === "forever"}
                  onChange={() => setPostRangeMode("forever")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">무기한</span>
              </label>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="datetime-local"
                step="60"
                className="w-full p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={postStartAt}
                onChange={(e) => setPostStartAt(e.target.value)}
                onClick={(e) => openInputDatePicker(e.currentTarget)}
                onFocus={(e) => openInputDatePicker(e.currentTarget)}
              disabled={postRangeMode === "forever"}
              />
              <span className="text-sm text-gray-600">~</span>
              <input
                type="datetime-local"
                step="60"
                className="w-full p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                value={postEndAt}
                onChange={(e) => setPostEndAt(e.target.value)}
                onClick={(e) => openInputDatePicker(e.currentTarget)}
                onFocus={(e) => openInputDatePicker(e.currentTarget)}
              disabled={postRangeMode === "forever"}
              />
            </div>
        </div>
      ) : null}

      {/* 기본 템플릿 업로드 + 큰 화면 미리보기 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isAdmin ? (
        <>
        {posterView.web ? (
        <div
          className={`${
            isBothView ? "lg:col-span-1 order-2" : "lg:col-span-1 order-1"
          } bg-white shadow-md sm:rounded-lg p-4`}
        >
          <div className="text-2xl font-extrabold mb-2">웹용</div>
          <div className="font-bold text-base mb-2">기본 템플릿</div>
          <input
            id="poster-template-image-input"
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleTemplateImageChange}
            className="hidden"
          />

          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-bold hover:bg-blue-700"
            onClick={() => {
              const input = document.getElementById(
                "poster-template-image-input"
              ) as HTMLInputElement | null;
              input?.click();
            }}
          >
            이미지 선택
          </button>

          <div className="mt-2 text-xs text-gray-500">
            PNG/JPG, 최대 100MB, DPI 100 이하
          </div>

          <div className="mt-3 text-sm text-gray-800">
            <div className="font-semibold">파일명</div>
              {templateFile ? (
                <div className="break-all">{templateFile.name}</div>
              ) : webPoster?.file_name ? (
                <div className="break-all">{webPoster.file_name}</div>
              ) : (
                <div className="text-red-500">이미지를 업로드 해주세요.</div>
              )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {showWebCenterLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">지점명</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    disabled={!webEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={fontWeight}
                    onChange={(e) => setFontWeight(Number(e.target.value))}
                    disabled={!webEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={fontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!webEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      disabled={!webEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={fontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(fontColor)) {
                          setFontColor("#ffffff");
                        } else {
                          setFontColor(fontColor.toLowerCase());
                        }
                      }}
                      disabled={!webEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(textPos.x * (webScale || 1))}
                        onChange={(e) =>
                          setTextPos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(textPos.y * (webScale || 1))}
                        onChange={(e) =>
                          setTextPos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {showWebAddressLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">주소</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={addressFontFamily}
                    onChange={(e) => setAddressFontFamily(e.target.value)}
                    disabled={!webEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`addr__${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={addressFontWeight}
                    onChange={(e) => setAddressFontWeight(Number(e.target.value))}
                    disabled={!webEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={addressFontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAddressFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!webEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={addressFontColor}
                      onChange={(e) => setAddressFontColor(e.target.value)}
                      disabled={!webEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={addressFontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setAddressFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(addressFontColor)) {
                          setAddressFontColor("#ffffff");
                        } else {
                          setAddressFontColor(addressFontColor.toLowerCase());
                        }
                      }}
                      disabled={!webEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(addressPos.x * (webScale || 1))}
                        onChange={(e) =>
                          setAddressPos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(addressPos.y * (webScale || 1))}
                        onChange={(e) =>
                          setAddressPos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {showWebPhoneLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">매장번호</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={phoneFontFamily}
                    onChange={(e) => setPhoneFontFamily(e.target.value)}
                    disabled={!webEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`phone__${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={phoneFontWeight}
                    onChange={(e) => setPhoneFontWeight(Number(e.target.value))}
                    disabled={!webEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={phoneFontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPhoneFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!webEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={phoneFontColor}
                      onChange={(e) => setPhoneFontColor(e.target.value)}
                      disabled={!webEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={phoneFontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setPhoneFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(phoneFontColor)) {
                          setPhoneFontColor("#ffffff");
                        } else {
                          setPhoneFontColor(phoneFontColor.toLowerCase());
                        }
                      }}
                      disabled={!webEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(phonePos.x * (webScale || 1))}
                        onChange={(e) =>
                          setPhonePos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(phonePos.y * (webScale || 1))}
                        onChange={(e) =>
                          setPhonePos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (webScale || 1),
                          }))
                        }
                        disabled={!webEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 font-bold text-base">표시 항목</div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showWebCenterLine}
                  onChange={(e) => setShowWebCenterLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  센터명 : {String(centerTextValue || "")}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showWebAddressLine}
                  onChange={(e) => setShowWebAddressLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  주소 : {String(addressTextValue || "")}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showWebPhoneLine}
                  onChange={(e) => setShowWebPhoneLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  매장번호 : {String(phoneTextValue || "")}
                </span>
              </label>
            </div>
          </div>
        </div>
        ) : null}

        {posterView.print ? (
        <div
          className={`${
            isBothView ? "lg:col-span-1 order-2" : "lg:col-span-1 order-1"
          } bg-white shadow-md sm:rounded-lg p-4`}
        >
          <div className="text-2xl font-extrabold mb-2">인쇄용</div>
          <div className="font-bold text-base mb-2">기본 템플릿</div>
          <input
            id="poster-print-template-image-input"
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handlePrintTemplateImageChange}
            className="hidden"
          />

          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-bold hover:bg-blue-700"
            onClick={() => {
              const input = document.getElementById(
                "poster-print-template-image-input"
              ) as HTMLInputElement | null;
              input?.click();
            }}
          >
            이미지 선택
          </button>

          <div className="mt-2 text-xs text-gray-500">
            PNG/JPG, 최대 100MB, DPI 200 이상
          </div>

          <div className="mt-3 text-sm text-gray-800">
            <div className="font-semibold">파일명</div>
              {printTemplateFile ? (
                <div className="break-all">{printTemplateFile.name}</div>
              ) : printPoster?.file_name ? (
                <div className="break-all">{printPoster.file_name}</div>
              ) : (
                <div className="text-red-500">이미지를 업로드 해주세요.</div>
              )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {showPrintCenterLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">지점명</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printFontFamily}
                    onChange={(e) => setPrintFontFamily(e.target.value)}
                    disabled={!printEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`print__${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printFontWeight}
                    onChange={(e) => setPrintFontWeight(Number(e.target.value))}
                    disabled={!printEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={printFontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPrintFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!printEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={printFontColor}
                      onChange={(e) => setPrintFontColor(e.target.value)}
                      disabled={!printEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={printFontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setPrintFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(printFontColor)) {
                          setPrintFontColor("#ffffff");
                        } else {
                          setPrintFontColor(printFontColor.toLowerCase());
                        }
                      }}
                      disabled={!printEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printTextPos.x * (printScale || 1))}
                        onChange={(e) =>
                          setPrintTextPos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printTextPos.y * (printScale || 1))}
                        onChange={(e) =>
                          setPrintTextPos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {showPrintAddressLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">주소</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printAddressFontFamily}
                    onChange={(e) => setPrintAddressFontFamily(e.target.value)}
                    disabled={!printEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`print_addr__${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printAddressFontWeight}
                    onChange={(e) => setPrintAddressFontWeight(Number(e.target.value))}
                    disabled={!printEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={printAddressFontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPrintAddressFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!printEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={printAddressFontColor}
                      onChange={(e) => setPrintAddressFontColor(e.target.value)}
                      disabled={!printEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={printAddressFontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setPrintAddressFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(printAddressFontColor)) {
                          setPrintAddressFontColor("#ffffff");
                        } else {
                          setPrintAddressFontColor(printAddressFontColor.toLowerCase());
                        }
                      }}
                      disabled={!printEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printAddressPos.x * (printScale || 1))}
                        onChange={(e) =>
                          setPrintAddressPos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printAddressPos.y * (printScale || 1))}
                        onChange={(e) =>
                          setPrintAddressPos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {showPrintPhoneLine ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="font-bold text-base">매장번호</div>

                  <div className="mt-3 font-bold text-base">폰트</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printPhoneFontFamily}
                    onChange={(e) => setPrintPhoneFontFamily(e.target.value)}
                    disabled={!printEditable}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={`print_phone__${f.family}__${f.url}`} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 굵기</div>
                  <select
                    className="mt-2 w-full p-2 border border-gray-300 rounded bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    value={printPhoneFontWeight}
                    onChange={(e) => setPrintPhoneFontWeight(Number(e.target.value))}
                    disabled={!printEditable}
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400 (일반)</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700 (굵게)</option>
                    <option value={800}>800</option>
                    <option value={900}>900</option>
                  </select>

                  <div className="mt-4 font-bold text-base">폰트 크기</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      step={1}
                      className="w-20 p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                      value={printPhoneFontSizePt}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPrintPhoneFontSizePt(v === "" ? 12 : Number(v));
                      }}
                      disabled={!printEditable}
                    />
                    <span className="text-sm text-gray-600">pt</span>
                  </div>

                  <div className="mt-4 font-bold text-base">색상</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-14 p-0 border border-gray-300 rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                      value={printPhoneFontColor}
                      onChange={(e) => setPrintPhoneFontColor(e.target.value)}
                      disabled={!printEditable}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400"
                      value={printPhoneFontColor}
                      placeholder="#RRGGBB"
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next =
                          raw.startsWith("#") || raw === "" ? raw : `#${raw}`;
                        if (next === "" || /^#[0-9a-fA-F]{0,6}$/.test(next)) {
                          setPrintPhoneFontColor(next);
                        }
                      }}
                      onBlur={() => {
                        if (!/^#[0-9a-fA-F]{6}$/.test(printPhoneFontColor)) {
                          setPrintPhoneFontColor("#ffffff");
                        } else {
                          setPrintPhoneFontColor(printPhoneFontColor.toLowerCase());
                        }
                      }}
                      disabled={!printEditable}
                    />
                  </div>

                  <div className="mt-4 font-bold text-base">위치</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printPhonePos.x * (printScale || 1))}
                        onChange={(e) =>
                          setPrintPhonePos((prev) => ({
                            ...prev,
                            x: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded bg-white text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
                        value={Math.round(printPhonePos.y * (printScale || 1))}
                        onChange={(e) =>
                          setPrintPhonePos((prev) => ({
                            ...prev,
                            y: Number(e.target.value || 0) / (printScale || 1),
                          }))
                        }
                        disabled={!printEditable}
                      />
                      <span className="shrink-0 text-sm text-gray-600">px</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 font-bold text-base">표시 항목</div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showPrintCenterLine}
                  onChange={(e) => setShowPrintCenterLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  센터명 : {String(centerTextValue || "")}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showPrintAddressLine}
                  onChange={(e) => setShowPrintAddressLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  주소 : {String(addressTextValue || "")}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={showPrintPhoneLine}
                  onChange={(e) => setShowPrintPhoneLine(e.target.checked)}
                />
                <span className="whitespace-pre-wrap break-words">
                  매장번호 : {String(phoneTextValue || "")}
                </span>
              </label>
            </div>
          </div>
        </div>
        ) : null}
        </>
        ) : null}

        <div
          className={`${
            isAdmin
              ? isBothView
                ? "order-1 lg:col-span-2 space-y-4"
                : "order-2 lg:col-span-1 space-y-4"
              : "order-1 lg:col-span-2 space-y-4"
          }`}
        >
          {isBothView ? (
            <div className="bg-white shadow-md sm:rounded-lg p-4 flex flex-col h-[calc(88vh-240px)]">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="font-bold text-base">웹용</div>
                  {!isAdmin ? (
                    <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                      SNS와 웹 업로드에 최적화된 이미지입니다.<br />인스타그램, 페이스북, 블로그, 홈페이지 등 온라인 채널 게시에 적합합니다.
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="font-bold text-base">인쇄용</div>
                  {!isAdmin ? (
                    <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                      A4 용지 기준 실제 출력(프린트)에 최적화된 고해상도 이미지입니다.<br />출력 품질 유지를 위해 웹용 이미지와 색감 표현에 일부 차이가 있을 수 있습니다.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                <div className="w-full border rounded-lg bg-gray-50 overflow-hidden min-h-0">
                  {mainPreviewUrl ? (
                    <div
                      ref={previewBoxRef}
                      className={`relative w-full h-full ${isAdmin ? "bg-black" : "bg-transparent"} overflow-hidden`}
                    >
                      <img
                        ref={previewImgRef}
                        src={mainPreviewUrl}
                        alt="웹용 포스터 미리보기"
                        className="w-full h-full object-contain"
                        onLoad={() => {
                          const el = previewBoxRef.current;
                          const img = previewImgRef.current;
                          if (!el || !img) return;
                          const cw = el.clientWidth;
                          const ch = el.clientHeight;
                          if (!cw || !ch) return;
                          if (!img.naturalWidth || !img.naturalHeight) return;

                          const scale = Math.min(
                            cw / img.naturalWidth,
                            ch / img.naturalHeight
                          );
                          const w = img.naturalWidth * scale;
                          const h = img.naturalHeight * scale;
                          const left = (cw - w) / 2;
                          const top = (ch - h) / 2;
                          setImageBox({ left, top, width: w, height: h });
                          setImageNaturalSize({
                            w: img.naturalWidth,
                            h: img.naturalHeight,
                          });
                        }}
                      />

                      {imageBox ? (
                        <>
                          <canvas
                            ref={webOverlayCanvasRef}
                            className="absolute pointer-events-none"
                            style={{
                              left: imageBox.left,
                              top: imageBox.top,
                            }}
                          />
                          {isAdmin && showWebCenterLine && centerTextValue ? (
                            <div
                              ref={centerTextRef}
                              className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                                webEditable ? "cursor-move" : "cursor-not-allowed"
                              }`}
                              style={{
                                left: imageBox.left + textPos.x * webScale,
                                top: imageBox.top + textPos.y * webScale,
                                color: fontColor,
                                fontSize: `${fontSizePx * webScale}px`,
                                fontFamily: fontFamily ? `"${fontFamily}"` : undefined,
                                fontWeight: fontWeight,
                                padding: 0,
                                lineHeight: 1,
                                whiteSpace: "pre",
                              }}
                              onMouseDown={async (e) => {
                                if (!webEditable) return;
                                if (!imageBox) return;
                                const container = previewBoxRef.current;
                                if (!container) return;
                                e.preventDefault();
                                try {
                                  await ensureFontLoaded(fontFamily || "");
                                } catch {}

                                draggingRef.current = true;
                                dragTargetRef.current = "center";
                                setShowGuides({ v: false, h: false });
                                const rect = container.getBoundingClientRect();
                                const scale = webScale || 1;
                                const pointerXImg =
                                  (e.clientX - rect.left - imageBox.left) / scale;
                                const pointerYImg =
                                  (e.clientY - rect.top - imageBox.top) / scale;
                                dragOffsetRef.current = {
                                  x: pointerXImg - (textPos.x || 0),
                                  y: pointerYImg - (textPos.y || 0),
                                };
                              }}
                            >
                              {String(centerTextValue || "")}
                            </div>
                          ) : null}
                          {isAdmin && showWebAddressLine && addressTextValue ? (
                            <div
                              ref={addressTextRef}
                              className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                                webEditable ? "cursor-move" : "cursor-not-allowed"
                              }`}
                              style={{
                                left: imageBox.left + addressPos.x * webScale,
                                top: imageBox.top + addressPos.y * webScale,
                                color: addressFontColor,
                                fontSize: `${((addressFontSizePt * 4) / 3) * webScale}px`,
                                fontFamily: addressFontFamily ? `"${addressFontFamily}"` : undefined,
                                fontWeight: addressFontWeight,
                                padding: 0,
                                lineHeight: 1,
                                whiteSpace: "pre",
                              }}
                              onMouseDown={async (e) => {
                                if (!webEditable) return;
                                if (!imageBox) return;
                                const container = previewBoxRef.current;
                                if (!container) return;
                                e.preventDefault();
                                try {
                                  await ensureFontLoaded(addressFontFamily || "");
                                } catch {}

                                draggingRef.current = true;
                                dragTargetRef.current = "address";
                                setShowGuides({ v: false, h: false });
                                const rect = container.getBoundingClientRect();
                                const scale = webScale || 1;
                                const pointerXImg =
                                  (e.clientX - rect.left - imageBox.left) / scale;
                                const pointerYImg =
                                  (e.clientY - rect.top - imageBox.top) / scale;
                                dragOffsetRef.current = {
                                  x: pointerXImg - (addressPos.x || 0),
                                  y: pointerYImg - (addressPos.y || 0),
                                };
                              }}
                            >
                              {String(addressTextValue || "")}
                            </div>
                          ) : null}
                          {isAdmin && showWebPhoneLine && phoneTextValue ? (
                            <div
                              ref={phoneTextRef}
                              className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                                webEditable ? "cursor-move" : "cursor-not-allowed"
                              }`}
                              style={{
                                left: imageBox.left + phonePos.x * webScale,
                                top: imageBox.top + phonePos.y * webScale,
                                color: phoneFontColor,
                                fontSize: `${((phoneFontSizePt * 4) / 3) * webScale}px`,
                                fontFamily: phoneFontFamily ? `"${phoneFontFamily}"` : undefined,
                                fontWeight: phoneFontWeight,
                                padding: 0,
                                lineHeight: 1,
                                whiteSpace: "pre",
                              }}
                              onMouseDown={async (e) => {
                                if (!webEditable) return;
                                if (!imageBox) return;
                                const container = previewBoxRef.current;
                                if (!container) return;
                                e.preventDefault();
                                try {
                                  await ensureFontLoaded(phoneFontFamily || "");
                                } catch {}

                                draggingRef.current = true;
                                dragTargetRef.current = "phone";
                                setShowGuides({ v: false, h: false });
                                const rect = container.getBoundingClientRect();
                                const scale = webScale || 1;
                                const pointerXImg =
                                  (e.clientX - rect.left - imageBox.left) / scale;
                                const pointerYImg =
                                  (e.clientY - rect.top - imageBox.top) / scale;
                                dragOffsetRef.current = {
                                  x: pointerXImg - (phonePos.x || 0),
                                  y: pointerYImg - (phonePos.y || 0),
                                };
                              }}
                            >
                              {String(phoneTextValue || "")}
                            </div>
                          ) : null}
                        </>
                      ) : null}

                      {isAdmin && imageBox && (showGuides.v || showGuides.h) ? (
                        <>
                          {showGuides.v ? (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                left: imageBox.left + imageBox.width / 2,
                                top: imageBox.top,
                                height: imageBox.height,
                                width: 1,
                                background: "rgba(0, 255, 255, 0.9)",
                              }}
                            />
                          ) : null}
                          {showGuides.h ? (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                left: imageBox.left,
                                top: imageBox.top + imageBox.height / 2,
                                width: imageBox.width,
                                height: 1,
                                background: "rgba(0, 255, 255, 0.9)",
                              }}
                            />
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-500">
                      {isAdmin
                        ? "웹용 이미지를 업로드해주세요."
                        : "등록된 웹용 이미지가 없습니다."}
                    </div>
                  )}
                </div>

                <div className="w-full border rounded-lg bg-gray-50 overflow-hidden min-h-0">
                  {printMainPreviewUrl ? (
                    <div
                      ref={printPreviewBoxRef}
                      className={`relative w-full h-full ${isAdmin ? "bg-black" : "bg-transparent"} overflow-hidden`}
                    >
                      <img
                        ref={printPreviewImgRef}
                        src={printMainPreviewUrl}
                        alt="인쇄용 포스터 미리보기"
                        className="w-full h-full object-contain"
                        onLoad={() => {
                          const el = printPreviewBoxRef.current;
                          const img = printPreviewImgRef.current;
                          if (!el || !img) return;
                          const cw = el.clientWidth;
                          const ch = el.clientHeight;
                          if (!cw || !ch) return;
                          if (!img.naturalWidth || !img.naturalHeight) return;

                          const scale = Math.min(
                            cw / img.naturalWidth,
                            ch / img.naturalHeight
                          );
                          const w = img.naturalWidth * scale;
                          const h = img.naturalHeight * scale;
                          const left = (cw - w) / 2;
                          const top = (ch - h) / 2;
                          setPrintImageBox({ left, top, width: w, height: h });
                          setPrintImageNaturalSize({
                            w: img.naturalWidth,
                            h: img.naturalHeight,
                          });
                        }}
                      />

                    {printImageBox ? (
                      <>
                        <canvas
                          ref={printOverlayCanvasRef}
                          className="absolute pointer-events-none"
                          style={{
                            left: printImageBox.left,
                            top: printImageBox.top,
                          }}
                        />
                        {isAdmin && showPrintCenterLine && centerTextValue ? (
                          <div
                            ref={printCenterTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              printEditable ? "cursor-move" : "cursor-not-allowed"
                            }`}
                            style={{
                              left: printImageBox.left + printTextPos.x * printScale,
                              top: printImageBox.top + printTextPos.y * printScale,
                              color: printFontColor,
                              fontSize: `${printFontSizePx * printScale}px`,
                              fontFamily: printFontFamily
                                ? `"${printFontFamily}"`
                                : undefined,
                              fontWeight: printFontWeight,
                              padding: 0,
                              lineHeight: 1,
                              whiteSpace: "pre",
                            }}
                            onMouseDown={async (e) => {
                              if (!printEditable) return;
                              if (!printImageBox) return;
                              const container = printPreviewBoxRef.current;
                              if (!container) return;
                              e.preventDefault();
                              try {
                                await ensureFontLoaded(printFontFamily || "");
                              } catch {}

                              printDraggingRef.current = true;
                              printDragTargetRef.current = "center";
                              setPrintShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = printScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - printImageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - printImageBox.top) / scale;
                              printDragOffsetRef.current = {
                                x: pointerXImg - (printTextPos.x || 0),
                                y: pointerYImg - (printTextPos.y || 0),
                              };
                            }}
                          >
                            {String(centerTextValue || "")}
                          </div>
                        ) : null}
                        {isAdmin && showPrintAddressLine && addressTextValue ? (
                          <div
                            ref={printAddressTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              printEditable ? "cursor-move" : "cursor-not-allowed"
                            }`}
                            style={{
                              left: printImageBox.left + printAddressPos.x * printScale,
                              top: printImageBox.top + printAddressPos.y * printScale,
                              color: printAddressFontColor,
                              fontSize: `${((printAddressFontSizePt * 4) / 3) * printScale}px`,
                              fontFamily: printAddressFontFamily
                                ? `"${printAddressFontFamily}"`
                                : undefined,
                              fontWeight: printAddressFontWeight,
                              padding: 0,
                              lineHeight: 1,
                              whiteSpace: "pre",
                            }}
                            onMouseDown={async (e) => {
                              if (!printEditable) return;
                              if (!printImageBox) return;
                              const container = printPreviewBoxRef.current;
                              if (!container) return;
                              e.preventDefault();
                              try {
                                await ensureFontLoaded(printAddressFontFamily || "");
                              } catch {}

                              printDraggingRef.current = true;
                              printDragTargetRef.current = "address";
                              setPrintShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = printScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - printImageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - printImageBox.top) / scale;
                              printDragOffsetRef.current = {
                                x: pointerXImg - (printAddressPos.x || 0),
                                y: pointerYImg - (printAddressPos.y || 0),
                              };
                            }}
                          >
                            {String(addressTextValue || "")}
                          </div>
                        ) : null}
                        {isAdmin && showPrintPhoneLine && phoneTextValue ? (
                          <div
                            ref={printPhoneTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              printEditable ? "cursor-move" : "cursor-not-allowed"
                            }`}
                            style={{
                              left: printImageBox.left + printPhonePos.x * printScale,
                              top: printImageBox.top + printPhonePos.y * printScale,
                              color: printPhoneFontColor,
                              fontSize: `${((printPhoneFontSizePt * 4) / 3) * printScale}px`,
                              fontFamily: printPhoneFontFamily
                                ? `"${printPhoneFontFamily}"`
                                : undefined,
                              fontWeight: printPhoneFontWeight,
                              padding: 0,
                              lineHeight: 1,
                              whiteSpace: "pre",
                            }}
                            onMouseDown={async (e) => {
                              if (!printEditable) return;
                              if (!printImageBox) return;
                              const container = printPreviewBoxRef.current;
                              if (!container) return;
                              e.preventDefault();
                              try {
                                await ensureFontLoaded(printPhoneFontFamily || "");
                              } catch {}

                              printDraggingRef.current = true;
                              printDragTargetRef.current = "phone";
                              setPrintShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = printScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - printImageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - printImageBox.top) / scale;
                              printDragOffsetRef.current = {
                                x: pointerXImg - (printPhonePos.x || 0),
                                y: pointerYImg - (printPhonePos.y || 0),
                              };
                            }}
                          >
                            {String(phoneTextValue || "")}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                      {isAdmin && printImageBox && (printShowGuides.v || printShowGuides.h) ? (
                        <>
                          {printShowGuides.v ? (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                left: printImageBox.left + printImageBox.width / 2,
                                top: printImageBox.top,
                                height: printImageBox.height,
                                width: 1,
                                background: "rgba(0, 255, 255, 0.9)",
                              }}
                            />
                          ) : null}
                          {printShowGuides.h ? (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                left: printImageBox.left,
                                top: printImageBox.top + printImageBox.height / 2,
                                width: printImageBox.width,
                                height: 1,
                                background: "rgba(0, 255, 255, 0.9)",
                              }}
                            />
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-500">
                      {isAdmin
                        ? "인쇄용 이미지를 업로드 해주세요."
                        : "등록된 인쇄용 이미지가 없습니다."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {!isBothView && effectivePosterView.web ? (
            <div className={`bg-white shadow-md sm:rounded-lg p-4 flex flex-col ${isBothView ? "h-[calc(88vh-240px)]" : "h-[calc(100vh-180px)]"}`}>
          <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-base">{isAdmin ? "웹용 미리보기" : "웹용"}</div>
                  {!isAdmin && (
                    <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                      SNS와 웹 업로드에 최적화된 이미지입니다.<br />인스타그램, 페이스북, 블로그, 홈페이지 등 온라인 채널 게시에 적합합니다.
                    </div>
                  )}
                </div>
                {isAdmin && webPoster?.file_name ? (
                  <div className="text-xs text-gray-500">파일: {webPoster.file_name}</div>
            ) : null}
          </div>

          <div className="w-full border rounded-lg bg-gray-50 overflow-hidden flex-1 min-h-0">
            {mainPreviewUrl ? (
              <div
                ref={previewBoxRef}
                    className={`relative w-full h-full ${isAdmin ? "bg-black" : "bg-transparent"} overflow-hidden`}
              >
                <img
                  ref={previewImgRef}
                  src={mainPreviewUrl}
                  alt="포스터 미리보기"
                  className="w-full h-full object-contain"
                  onLoad={() => {
                    const el = previewBoxRef.current;
                    const img = previewImgRef.current;
                    if (!el || !img) return;
                    const cw = el.clientWidth;
                    const ch = el.clientHeight;
                    if (!cw || !ch) return;
                    if (!img.naturalWidth || !img.naturalHeight) return;

                    const scale = Math.min(
                      cw / img.naturalWidth,
                      ch / img.naturalHeight
                    );
                    const w = img.naturalWidth * scale;
                    const h = img.naturalHeight * scale;
                    const left = (cw - w) / 2;
                    const top = (ch - h) / 2;
                    setImageBox({ left, top, width: w, height: h });
                        setImageNaturalSize({
                          w: img.naturalWidth,
                          h: img.naturalHeight,
                        });
                  }}
                />

                {/* 지점명 텍스트 (드래그로 위치 조정 / 폰트·크기·색상 적용) */}
                    {imageBox ? (
                      <>
                        <canvas
                          ref={webOverlayCanvasRef}
                          className="absolute pointer-events-none"
                          style={{
                            left: imageBox.left,
                            top: imageBox.top,
                          }}
                        />
                        {isAdmin && showWebCenterLine && centerTextValue ? (
                  <div
                    ref={centerTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              webEditable ? "cursor-move" : "cursor-not-allowed"
                    }`}
                    style={{
                              left: imageBox.left + textPos.x * webScale,
                              top: imageBox.top + textPos.y * webScale,
                      color: fontColor,
                              fontSize: `${fontSizePx * webScale}px`,
                      fontFamily: fontFamily ? `"${fontFamily}"` : undefined,
                      fontWeight: fontWeight,
                              padding: 0,
                              lineHeight: 1,
                      whiteSpace: "pre",
                    }}
                    onMouseDown={async (e) => {
                              if (!webEditable) return;
                      if (!imageBox) return;
                              const container = previewBoxRef.current;
                              if (!container) return;
                      e.preventDefault();
                      try {
                        await ensureFontLoaded(fontFamily || "");
                      } catch {}

                      draggingRef.current = true;
                      dragTargetRef.current = "center";
                      setShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = webScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - imageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - imageBox.top) / scale;
                      dragOffsetRef.current = {
                                x: pointerXImg - (textPos.x || 0),
                                y: pointerYImg - (textPos.y || 0),
                      };
                    }}
                  >
                    {String(centerTextValue || "")}
                  </div>
                        ) : null}
                        {isAdmin && showWebAddressLine && addressTextValue ? (
                          <div
                            ref={addressTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              webEditable ? "cursor-move" : "cursor-not-allowed"
                            }`}
                            style={{
                              left: imageBox.left + addressPos.x * webScale,
                              top: imageBox.top + addressPos.y * webScale,
                              color: addressFontColor,
                              fontSize: `${((addressFontSizePt * 4) / 3) * webScale}px`,
                              fontFamily: addressFontFamily ? `"${addressFontFamily}"` : undefined,
                              fontWeight: addressFontWeight,
                              padding: 0,
                              lineHeight: 1,
                              whiteSpace: "pre",
                            }}
                            onMouseDown={async (e) => {
                              if (!webEditable) return;
                              if (!imageBox) return;
                              const container = previewBoxRef.current;
                              if (!container) return;
                              e.preventDefault();
                              try {
                                await ensureFontLoaded(addressFontFamily || "");
                              } catch {}

                              draggingRef.current = true;
                              dragTargetRef.current = "address";
                              setShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = webScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - imageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - imageBox.top) / scale;
                              dragOffsetRef.current = {
                                x: pointerXImg - (addressPos.x || 0),
                                y: pointerYImg - (addressPos.y || 0),
                              };
                            }}
                          >
                            {String(addressTextValue || "")}
                          </div>
                        ) : null}
                        {isAdmin && showWebPhoneLine && phoneTextValue ? (
                          <div
                            ref={phoneTextRef}
                            className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                              webEditable ? "cursor-move" : "cursor-not-allowed"
                            }`}
                            style={{
                              left: imageBox.left + phonePos.x * webScale,
                              top: imageBox.top + phonePos.y * webScale,
                              color: phoneFontColor,
                              fontSize: `${((phoneFontSizePt * 4) / 3) * webScale}px`,
                              fontFamily: phoneFontFamily ? `"${phoneFontFamily}"` : undefined,
                              fontWeight: phoneFontWeight,
                              padding: 0,
                              lineHeight: 1,
                              whiteSpace: "pre",
                            }}
                            onMouseDown={async (e) => {
                              if (!webEditable) return;
                              if (!imageBox) return;
                              const container = previewBoxRef.current;
                              if (!container) return;
                              e.preventDefault();
                              try {
                                await ensureFontLoaded(phoneFontFamily || "");
                              } catch {}

                              draggingRef.current = true;
                              dragTargetRef.current = "phone";
                              setShowGuides({ v: false, h: false });
                              const rect = container.getBoundingClientRect();
                              const scale = webScale || 1;
                              const pointerXImg =
                                (e.clientX - rect.left - imageBox.left) / scale;
                              const pointerYImg =
                                (e.clientY - rect.top - imageBox.top) / scale;
                              dragOffsetRef.current = {
                                x: pointerXImg - (phonePos.x || 0),
                                y: pointerYImg - (phonePos.y || 0),
                              };
                            }}
                          >
                            {String(phoneTextValue || "")}
                          </div>
                        ) : null}
                      </>
                ) : null}

                {/* 중앙 정렬 가이드라인 */}
                {isAdmin && imageBox && (showGuides.v || showGuides.h) ? (
                  <>
                    {showGuides.v ? (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: imageBox.left + imageBox.width / 2,
                          top: imageBox.top,
                          height: imageBox.height,
                          width: 1,
                          background: "rgba(0, 255, 255, 0.9)",
                        }}
                      />
                    ) : null}
                    {showGuides.h ? (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: imageBox.left,
                          top: imageBox.top + imageBox.height / 2,
                          width: imageBox.width,
                          height: 1,
                          background: "rgba(0, 255, 255, 0.9)",
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">
                    {isAdmin
                      ? "왼쪽에서 이미지를 업로드하거나, 아래 목록에서 포스터를 더블 클릭하세요."
                      : "등록된 웹용 이미지가 없습니다."}
              </div>
            )}
          </div>
        </div>
          ) : null}

          {!isBothView && effectivePosterView.print ? (
            <div className={`bg-white shadow-md sm:rounded-lg p-4 flex flex-col ${isBothView ? "h-[calc(88vh-240px)]" : "h-[calc(100vh-180px)]"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-base">{isAdmin ? "인쇄용 미리보기" : "인쇄용"}</div>
                  {!isAdmin ? (
                    <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                      A4 용지 기준 실제 출력(프린트)에 최적화된 고해상도 이미지입니다.<br />출력 품질 유지를 위해 웹용 이미지와 색감 표현에 일부 차이가 있을 수 있습니다.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="w-full border rounded-lg bg-gray-50 overflow-hidden flex-1 min-h-0">
                {printMainPreviewUrl ? (
                  <div
                    ref={printPreviewBoxRef}
                    className={`relative w-full h-full ${isAdmin ? "bg-black" : "bg-transparent"} overflow-hidden`}
                  >
                    <img
                      ref={printPreviewImgRef}
                      src={printMainPreviewUrl}
                      alt="인쇄용 포스터 미리보기"
                      className="w-full h-full object-contain"
                      onLoad={() => {
                        const el = printPreviewBoxRef.current;
                        const img = printPreviewImgRef.current;
                        if (!el || !img) return;
                        const cw = el.clientWidth;
                        const ch = el.clientHeight;
                        if (!cw || !ch) return;
                        if (!img.naturalWidth || !img.naturalHeight) return;

                        const scale = Math.min(
                          cw / img.naturalWidth,
                          ch / img.naturalHeight
                        );
                        const w = img.naturalWidth * scale;
                        const h = img.naturalHeight * scale;
                        const left = (cw - w) / 2;
                        const top = (ch - h) / 2;
                        setPrintImageBox({ left, top, width: w, height: h });
                        setPrintImageNaturalSize({
                          w: img.naturalWidth,
                          h: img.naturalHeight,
                        });
                      }}
                    />

                    {printImageBox ? (
                      <canvas
                        ref={printOverlayCanvasRef}
                        className="absolute pointer-events-none"
                        style={{
                          left: printImageBox.left,
                          top: printImageBox.top,
                        }}
                      />
                    ) : null}

                    {isAdmin && printImageBox && showPrintCenterLine && centerTextValue ? (
                      <div
                        ref={printCenterTextRef}
                        className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                          printEditable ? "cursor-move" : "cursor-not-allowed"
                        }`}
                        style={{
                          left: printImageBox.left + printTextPos.x * printScale,
                          top: printImageBox.top + printTextPos.y * printScale,
                          color: printFontColor,
                          fontSize: `${printFontSizePx * printScale}px`,
                          fontFamily: printFontFamily ? `"${printFontFamily}"` : undefined,
                          fontWeight: printFontWeight,
                          padding: 0,
                          lineHeight: 1,
                          whiteSpace: "pre",
                        }}
                        onMouseDown={async (e) => {
                          if (!printEditable) return;
                          if (!printImageBox) return;
                          const container = printPreviewBoxRef.current;
                          if (!container) return;
                          e.preventDefault();
                          try {
                            await ensureFontLoaded(printFontFamily || "");
                          } catch {}

                          printDraggingRef.current = true;
                          printDragTargetRef.current = "center";
                          setPrintShowGuides({ v: false, h: false });
                          const rect = container.getBoundingClientRect();
                          const scale = printScale || 1;
                          const pointerXImg =
                            (e.clientX - rect.left - printImageBox.left) / scale;
                          const pointerYImg =
                            (e.clientY - rect.top - printImageBox.top) / scale;
                          printDragOffsetRef.current = {
                            x: pointerXImg - (printTextPos.x || 0),
                            y: pointerYImg - (printTextPos.y || 0),
                          };
                        }}
                      >
                        {String(centerTextValue || "")}
                      </div>
                    ) : null}

                    {isAdmin && printImageBox && showPrintAddressLine && addressTextValue ? (
                      <div
                        ref={printAddressTextRef}
                        className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                          printEditable ? "cursor-move" : "cursor-not-allowed"
                        }`}
                        style={{
                          left: printImageBox.left + printAddressPos.x * printScale,
                          top: printImageBox.top + printAddressPos.y * printScale,
                          color: printAddressFontColor,
                          fontSize: `${((printAddressFontSizePt * 4) / 3) * printScale}px`,
                          fontFamily: printAddressFontFamily ? `"${printAddressFontFamily}"` : undefined,
                          fontWeight: printAddressFontWeight,
                          padding: 0,
                          lineHeight: 1,
                          whiteSpace: "pre",
                        }}
                        onMouseDown={async (e) => {
                          if (!printEditable) return;
                          if (!printImageBox) return;
                          const container = printPreviewBoxRef.current;
                          if (!container) return;
                          e.preventDefault();
                          try {
                            await ensureFontLoaded(printAddressFontFamily || "");
                          } catch {}

                          printDraggingRef.current = true;
                          printDragTargetRef.current = "address";
                          setPrintShowGuides({ v: false, h: false });
                          const rect = container.getBoundingClientRect();
                          const scale = printScale || 1;
                          const pointerXImg =
                            (e.clientX - rect.left - printImageBox.left) / scale;
                          const pointerYImg =
                            (e.clientY - rect.top - printImageBox.top) / scale;
                          printDragOffsetRef.current = {
                            x: pointerXImg - (printAddressPos.x || 0),
                            y: pointerYImg - (printAddressPos.y || 0),
                          };
                        }}
                      >
                        {String(addressTextValue || "")}
                      </div>
                    ) : null}

                    {isAdmin && printImageBox && showPrintPhoneLine && phoneTextValue ? (
                      <div
                        ref={printPhoneTextRef}
                        className={`absolute flex items-center justify-center text-center select-none opacity-0 ${
                          printEditable ? "cursor-move" : "cursor-not-allowed"
                        }`}
                        style={{
                          left: printImageBox.left + printPhonePos.x * printScale,
                          top: printImageBox.top + printPhonePos.y * printScale,
                          color: printPhoneFontColor,
                          fontSize: `${((printPhoneFontSizePt * 4) / 3) * printScale}px`,
                          fontFamily: printPhoneFontFamily ? `"${printPhoneFontFamily}"` : undefined,
                          fontWeight: printPhoneFontWeight,
                          padding: 0,
                          lineHeight: 1,
                          whiteSpace: "pre",
                        }}
                        onMouseDown={async (e) => {
                          if (!printEditable) return;
                          if (!printImageBox) return;
                          const container = printPreviewBoxRef.current;
                          if (!container) return;
                          e.preventDefault();
                          try {
                            await ensureFontLoaded(printPhoneFontFamily || "");
                          } catch {}

                          printDraggingRef.current = true;
                          printDragTargetRef.current = "phone";
                          setPrintShowGuides({ v: false, h: false });
                          const rect = container.getBoundingClientRect();
                          const scale = printScale || 1;
                          const pointerXImg =
                            (e.clientX - rect.left - printImageBox.left) / scale;
                          const pointerYImg =
                            (e.clientY - rect.top - printImageBox.top) / scale;
                          printDragOffsetRef.current = {
                            x: pointerXImg - (printPhonePos.x || 0),
                            y: pointerYImg - (printPhonePos.y || 0),
                          };
                        }}
                      >
                        {String(phoneTextValue || "")}
                      </div>
                    ) : null}

                    {isAdmin && printImageBox && (printShowGuides.v || printShowGuides.h) ? (
                      <>
                        {printShowGuides.v ? (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: printImageBox.left + printImageBox.width / 2,
                              top: printImageBox.top,
                              height: printImageBox.height,
                              width: 1,
                              background: "rgba(0, 255, 255, 0.9)",
                            }}
                          />
                        ) : null}
                        {printShowGuides.h ? (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: printImageBox.left,
                              top: printImageBox.top + printImageBox.height / 2,
                              width: printImageBox.width,
                              height: 1,
                              background: "rgba(0, 255, 255, 0.9)",
                            }}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="p-10 text-center text-gray-500">
                    {isAdmin ? "인쇄용 이미지를 업로드 해주세요." : "등록된 인쇄용 이미지가 없습니다."}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PosterDetail;
