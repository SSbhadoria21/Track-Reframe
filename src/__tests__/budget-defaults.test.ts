import { describe, expect, it } from "vitest";
import {
  BUDGET_DEPARTMENTS_TEMPLATE,
  getDefaultDepartments,
  getSuggestedRate,
} from "../lib/budget-defaults";

describe("budget defaults", () => {
  it("creates the ordered department template with only the first department expanded", () => {
    const departments = getDefaultDepartments();

    expect(departments).toHaveLength(18);
    expect(departments.map(({ name, order }) => ({ name, order }))).toEqual(
      BUDGET_DEPARTMENTS_TEMPLATE.map(({ name, order }) => ({ name, order })),
    );
    expect(departments.map(({ isExpanded }) => isExpanded)).toEqual([
      true,
      ...Array(17).fill(false),
    ]);
    expect(departments.every(({ subtotal, items }) => subtotal === 0 && items.length === 0)).toBe(true);
  });

  it("returns fresh department IDs and item arrays for each budget", () => {
    const first = getDefaultDepartments();
    const second = getDefaultDepartments();

    expect(new Set(first.map(({ id }) => id)).size).toBe(18);
    expect(first.map(({ id }) => id)).not.toEqual(second.map(({ id }) => id));
    expect(first[0].items).not.toBe(second[0].items);
  });

  it("maps each production scale to its suggested rate", () => {
    const rates = {
      Micro: 100,
      Indie: 250,
      "Semi-Professional": 500,
      Professional: 1000,
    };

    for (const [scale, expectedRate] of Object.entries(rates)) {
      expect(getSuggestedRate(scale, "Producer")).toBe(expectedRate);
    }
  });

  it("returns zero for an unknown production scale", () => {
    expect(getSuggestedRate("Studio blockbuster", "Producer")).toBe(0);
  });
});
