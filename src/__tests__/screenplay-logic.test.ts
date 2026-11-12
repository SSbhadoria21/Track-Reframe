import { describe, expect, it } from "vitest";
import { isRoughText, parseScreenplay } from "../app/(main)/studio/script-formatter/page";

describe("parseScreenplay", () => {
  it("returns no elements for empty or whitespace-only input", () => {
    expect(parseScreenplay("")).toEqual([]);
    expect(parseScreenplay(" \n\t ")).toEqual([]);
  });

  it("detects headings, character cues, parentheticals, dialogue, and blank lines", () => {
    expect(
      parseScreenplay(
        "INT. CAFE - DAY\n\nMAYA\n(quietly)\nI thought you left.\nEXT. STREET - NIGHT",
      ),
    ).toEqual([
      { type: "scene_heading", text: "INT. CAFE - DAY" },
      { type: "blank", text: "" },
      { type: "character", text: "MAYA" },
      { type: "parenthetical", text: "(quietly)" },
      { type: "dialogue", text: "I thought you left." },
      { type: "scene_heading", text: "EXT. STREET - NIGHT" },
    ]);
  });

  it("recognizes case-insensitive scene headings and standard transitions", () => {
    expect(parseScreenplay("int. cabin - night\ncut to:\nFADE OUT.")).toEqual([
      { type: "scene_heading", text: "INT. CABIN - NIGHT" },
      { type: "transition", text: "CUT TO:" },
      { type: "transition", text: "FADE OUT." },
    ]);
  });

  it("keeps long uppercase action from being mistaken for a character cue", () => {
    const longAction = ("THE " + "STORM ".repeat(12)).trim();

    expect(parseScreenplay(longAction)).toEqual([{ type: "action", text: longAction }]);
  });
});

describe("isRoughText", () => {
  it("identifies a long block without a scene heading as rough text", () => {
    expect(
      isRoughText(
        "Maya walks into the room and finds the lights still on. She waits for someone to answer.",
      ),
    ).toBe(true);
  });

  it("does not mark short input or a long screenplay with a scene heading as rough", () => {
    expect(isRoughText("A short note.")).toBe(false);
    expect(
      isRoughText(
        "INT. CAFE - DAY\nMaya walks into the room and finds the lights still on. She waits for someone to answer.",
      ),
    ).toBe(false);
  });
});
