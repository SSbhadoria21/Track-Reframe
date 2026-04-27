import jsPDF from "jspdf";

type ParsedLine = { type: string; text: string };

interface ScriptMeta {
  title: string;
  writer: string;
  director: string;
  production: string;
  contact: string;
  draft: string;
  date: string;
}

interface ExportOpts {
  titlePage: boolean;
  pageNumbers: boolean;
  sceneNumbers: boolean;
  watermark: boolean;
  watermarkText: string;
}

// Industry standard: A4 Size (approx 210x297mm -> 595x842 points), Courier 12pt
const PAGE_W = 595; 
const PAGE_H = 842; 
const MARGIN_TOP = 72; // 1"
const MARGIN_BOTTOM = 72;
const MARGIN_LEFT = 108; // 1.5"
const MARGIN_RIGHT = 72; // 1"
const LINE_HEIGHT = 14; // ~12pt Courier
const FONT_SIZE = 12;
const USABLE_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

// Element-specific margins (in points from left edge)
const CHAR_LEFT = 252; // 3.5" from left
const DIALOG_LEFT = 180; // 2.5"
const DIALOG_RIGHT = 144; // 2" from right
const PAREN_LEFT = 216; // 3"
const PAREN_RIGHT = 180;
const TRANS_LEFT = 432; // 6" from left

function wrapText(text: string, maxWidth: number, charWidth: number): string[] {
  const maxChars = Math.floor(maxWidth / charWidth);
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function exportScreenplayPDF(
  parsed: ParsedLine[],
  meta: ScriptMeta,
  opts: ExportOpts
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("Courier", "normal");
  doc.setFontSize(FONT_SIZE);

  const charWidth = doc.getTextWidth("M"); // monospace char width
  let y = MARGIN_TOP;
  let pageNum = 1;
  let sceneIdx = 0;

  function addPage() {
    doc.addPage();
    pageNum++;
    y = MARGIN_TOP;
    if (opts.pageNumbers) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`${pageNum}.`, PAGE_W - MARGIN_RIGHT, 50, { align: "right" });
      doc.setFontSize(FONT_SIZE);
      doc.setTextColor(0);
    }
    if (opts.watermark) drawWatermark();
  }

  function checkPage(needed: number) {
    if (y + needed > PAGE_H - MARGIN_BOTTOM) addPage();
  }

  function drawWatermark() {
    doc.saveGraphicsState();
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    const cx = PAGE_W / 2;
    const cy = PAGE_H / 2;
    doc.text(opts.watermarkText, cx, cy, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
    doc.setFontSize(FONT_SIZE);
    doc.setTextColor(0);
  }

  // Title page
  if (opts.titlePage) {
    if (opts.watermark) drawWatermark();
    const centerX = PAGE_W / 2;
    let ty = PAGE_H * 0.35;

    doc.setFontSize(24);
    doc.setFont("Courier", "bold");
    doc.text(meta.title || "UNTITLED", centerX, ty, { align: "center" });
    ty += 40;

    doc.setFontSize(FONT_SIZE);
    doc.setFont("Courier", "normal");
    if (meta.writer) {
      doc.text("Written by", centerX, ty, { align: "center" });
      ty += LINE_HEIGHT + 2;
      doc.text(meta.writer, centerX, ty, { align: "center" });
      ty += LINE_HEIGHT * 2;
    }

    if (meta.director) {
      doc.text("Directed by", centerX, ty, { align: "center" });
      ty += LINE_HEIGHT + 2;
      doc.text(meta.director, centerX, ty, { align: "center" });
      ty += LINE_HEIGHT * 2;
    }

    // Bottom left info
    let by = PAGE_H - 144;
    if (meta.production) {
      doc.text(meta.production, MARGIN_LEFT, by);
      by += LINE_HEIGHT;
    }
    if (meta.contact) {
      doc.text(meta.contact, MARGIN_LEFT, by);
      by += LINE_HEIGHT;
    }
    if (meta.draft) {
      doc.text(`Draft ${meta.draft} — ${meta.date}`, MARGIN_LEFT, by);
    }

    addPage();
  } else {
    if (opts.watermark) drawWatermark();
    if (opts.pageNumbers) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("1.", PAGE_W - MARGIN_RIGHT, 50, { align: "right" });
      doc.setFontSize(FONT_SIZE);
      doc.setTextColor(0);
    }
  }

  // Render each line
  for (const line of parsed) {
    if (line.type === "blank") {
      y += LINE_HEIGHT;
      continue;
    }

    doc.setFont("Courier", "normal");
    doc.setTextColor(0);

    if (line.type === "scene_heading") {
      sceneIdx++;
      checkPage(LINE_HEIGHT * 3);
      y += LINE_HEIGHT;
      doc.setFont("Courier", "bold");
      const headText = line.text;
      if (opts.sceneNumbers) {
        doc.text(`${sceneIdx}`, MARGIN_LEFT - 30, y);
        doc.text(`${sceneIdx}`, PAGE_W - MARGIN_RIGHT + 10, y);
      }
      doc.text(headText, MARGIN_LEFT, y);
      y += LINE_HEIGHT * 2;
    } else if (line.type === "character") {
      checkPage(LINE_HEIGHT * 3);
      y += LINE_HEIGHT;
      doc.setFont("Courier", "bold");
      doc.text(line.text, CHAR_LEFT, y);
      y += LINE_HEIGHT;
    } else if (line.type === "parenthetical") {
      checkPage(LINE_HEIGHT);
      doc.text(line.text, PAREN_LEFT, y);
      y += LINE_HEIGHT;
    } else if (line.type === "dialogue") {
      const maxW = PAGE_W - DIALOG_LEFT - DIALOG_RIGHT;
      const wrapped = wrapText(line.text, maxW, charWidth);
      checkPage(wrapped.length * LINE_HEIGHT);
      for (const wl of wrapped) {
        doc.text(wl, DIALOG_LEFT, y);
        y += LINE_HEIGHT;
      }
    } else if (line.type === "transition") {
      checkPage(LINE_HEIGHT * 2);
      y += LINE_HEIGHT;
      doc.text(line.text, TRANS_LEFT, y, { align: "right" });
      y += LINE_HEIGHT;
    } else {
      // Action
      const wrapped = wrapText(line.text, USABLE_W, charWidth);
      checkPage(wrapped.length * LINE_HEIGHT);
      for (const wl of wrapped) {
        doc.text(wl, MARGIN_LEFT, y);
        y += LINE_HEIGHT;
      }
    }
  }

  doc.save(`${meta.title || "Untitled"}_Screenplay.pdf`);
}
