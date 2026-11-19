// A list's rule, by itself: node --test scripts/list-rule.test.mjs (npm run test:rules)
import test from "node:test";
import assert from "node:assert/strict";
import { applyRule, passes } from "../src/utils/list-rule.ts";

const item = (id, data) => ({ id, data });
const ITEMS = [
  item("table", { title: "Table", wood: "Walnut", year: 2025, tags: ["dining", "oak"], date: new Date("2025-03-02") }),
  item("buffet", { title: "Buffet", wood: "White oak", year: 2025, tags: ["storage"] }),
  item("banc", { title: "Banc", wood: "Ash", year: 2024 }),
  item("lit", { title: "Lit", wood: "Walnut", year: 2022, client: { id: "leduc", collection: "clients" } }),
  item("console", { title: "Console", year: 2023, wood: "" }),
];
const ids = (rule, self) => applyRule(ITEMS, rule, self).map((i) => i.id);

test("no rule, or an empty one: the collection as it is", () => {
  assert.deepEqual(ids(undefined), ["table", "buffet", "banc", "lit", "console"]);
  assert.deepEqual(ids({ collection: "projects" }), ["table", "buffet", "banc", "lit", "console"]);
});
test("some: every condition holds", () => {
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "wood", op: "is", value: ["Walnut", "White oak"] }, { field: "year", op: "after", value: 2022 }] }), ["table", "buffet"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "wood", op: "not", value: "walnut" }] }), ["buffet", "banc", "console"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "wood", op: "unset" }] }), ["console"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "tags", op: "has", value: "oak" }] }), ["table"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "client", op: "is", value: "leduc" }] }), ["lit"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "date", op: "before", value: "2025-06-01" }] }), ["table"]);
  assert.deepEqual(ids({ collection: "p", shows: "some", where: [{ field: "nothing", op: "is", value: "x" }] }), []);
});
test("the conditions wait until the list shows some", () => {
  assert.equal(ids({ collection: "p", shows: "all", where: [{ field: "wood", op: "is", value: "Ash" }] }).length, 5);
});
test("order: the first field first, the second where two are equal, the empty ones last", () => {
  assert.deepEqual(ids({ collection: "p", order: [{ by: "year", dir: "desc" }, { by: "title" }] }), ["buffet", "table", "banc", "console", "lit"]);
  assert.deepEqual(ids({ collection: "p", order: [{ by: "wood" }] }), ["banc", "table", "lit", "buffet", "console"]);
  assert.deepEqual(ids({ collection: "p", order: [{ by: "wood", dir: "desc" }] }), ["buffet", "table", "lit", "banc", "console"]);
});
test("by hand: the chosen first in their order, the others as they were", () => {
  assert.deepEqual(ids({ collection: "p", order: "hand", chosen: ["lit", "gone", "table"] }), ["lit", "table", "buffet", "banc", "console"]);
});
test("chosen: only those, in that order; one that is gone is passed", () => {
  assert.deepEqual(ids({ collection: "p", shows: "chosen", chosen: ["console", "gone", "banc"] }), ["console", "banc"]);
});
test("left aside, the page's own item, at most, start at", () => {
  assert.deepEqual(ids({ collection: "p", out: ["buffet"], skipSelf: true }, "table"), ["banc", "lit", "console"]);
  assert.deepEqual(ids({ collection: "p", skipSelf: true }), ["table", "buffet", "banc", "lit", "console"]);
  assert.deepEqual(ids({ collection: "p", limit: 2 }), ["table", "buffet"]);
  assert.deepEqual(ids({ collection: "p", limit: 2, start: 2 }), ["buffet", "banc"]);
  assert.deepEqual(ids({ collection: "p", start: 9 }), []);
});
test("passes: a condition alone", () => {
  assert.equal(passes({ n: "3" }, { field: "n", op: "after", value: 2 }), true);
  assert.equal(passes({ n: "abc" }, { field: "n", op: "after", value: 2 }), false);
  assert.equal(passes({}, { field: "n", op: "set" }), false);
});
