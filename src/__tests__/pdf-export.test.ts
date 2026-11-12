import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportScreenplayPDF } from "../app/(main)/studio/script-formatter/pdf-export";

const pdfMock = vi.hoisted(() => ({
  addPage: vi.fn(),
  getTextWidth: vi.fn(function () {
    return 7;
  }),
  restoreGraphicsState: vi.fn(),
  save: vi.fn(),
  saveGraphicsState: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: class {
    constructor() {
      return pdfMock;
    }
  },
}));

const metadata = {
  title: "Test Script",
  writer: "",
  director: "",
  production: "",
  contact: "",
  draft: "",
  date: "",
};

const options = {
  titlePage: false,
  pageNumbers: false,
  sceneNumbers: false,
  watermark: false,
  watermarkText: "",
};

describe("exportScreenplayPDF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pdfMock.getTextWidth.mockReturnValue(7);
  });

  it("adds pages for a 120-line screenplay without dropping action lines", () => {
    const lines = Array.from({ length: 120 }, (_, index) => ({
      type: "action",
      text: `Action ${index + 1}`,
    }));

    exportScreenplayPDF(lines, metadata, options);

    expect(pdfMock.addPage).toHaveBeenCalledTimes(2);
    expect(pdfMock.text.mock.calls.filter(([text]) => /^Action \d+$/.test(String(text)))).toHaveLength(120);
    expect(pdfMock.save).toHaveBeenCalledWith("Test Script_Screenplay.pdf");
  });

  it("wraps a long dialogue block into multiple PDF lines without losing words", () => {
    const dialogue =
      "We followed the river through the valley until the city lights appeared beyond the hills.";

    exportScreenplayPDF([{ type: "dialogue", text: dialogue }], metadata, options);

    const renderedLines = pdfMock.text.mock.calls.map(([text]) => String(text));
    expect(renderedLines.length).toBeGreaterThan(1);
    expect(renderedLines.join(" ")).toBe(dialogue);
  });
});
