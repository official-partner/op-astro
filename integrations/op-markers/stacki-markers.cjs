// Stacki's source markers (MIT, © 2026 Timothy Ricks: LICENSE beside this file), bundled by OP v2's scripts/build-markers.mts. Never edited by hand.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
)), __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  markSourceFile: () => markSourceFile
});
module.exports = __toCommonJS(stdin_exports);

// vendor/stacki/electron/previewServer/previewMarkers.ts
var import_node_async_hooks = require("node:async_hooks"), import_node_crypto = require("node:crypto"), import_node_fs2 = require("node:fs"), import_node_path2 = __toESM(require("node:path"), 1);

// vendor/stacki/shared/core/assert.ts
function assert(condition, message) {
  if (!condition)
    throw new Error(`Assertion failed: ${message}`);
}

// vendor/stacki/shared/core/brand.ts
var DIGEST_RE = /^[0-9a-f]{64}$/;
function toDigest(value) {
  if (!DIGEST_RE.test(value))
    throw new Error("Digest: expected 64 lowercase hex characters");
  return value;
}
function toUtf16Offset(value) {
  if (!Number.isSafeInteger(value))
    throw new Error("Utf16Offset: expected safe integer");
  if (value < 0)
    throw new Error("Utf16Offset: expected nonnegative integer");
  return value;
}

// vendor/stacki/shared/core/limits.ts
var PLATFORM_LIMITS = {
  /**
   * UTF-16 code units in one JavaScript string: V8's maximum string length on
   * 64-bit platforms (2^29 - 24, about 512 MB of ASCII). A page is decoded to
   * one string, so this is the longest page, file or IPC string field there
   * can be. A file's UTF-8 byte length is never smaller than its unit count, so
   * a file within this many bytes always decodes; it is also the largest byte
   * length a read, a write or an intent payload needs to admit.
   */
  stringUnitsMax: 536870888,
  /**
   * Elements in one JavaScript array: the ECMAScript array length ceiling
   * (2^32 - 1). Every list this code builds (nodes, entries, files, markers,
   * splices) is an array, so no count can honestly be bounded below it.
   */
  arrayLengthMax: 4294967295,
  /**
   * The largest integer a `number` holds exactly. Sums of sizes (bytes of many
   * strings together) are checked against it so an assertion has a number to
   * compare with; no input comes near it.
   */
  safeIntegerMax: Number.MAX_SAFE_INTEGER
}, LIMITS = {
  /** Nodes in one page tree: bounded only by what an array holds. */
  treeNodesMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Nesting depth of one page tree. Hand-written markup rarely exceeds 20. */
  treeDepthMax: 64,
  /** Length of a tag or component name. */
  tagNameCharsMax: 128,
  /** Length of a single attribute name or value: bounded only by the string. */
  attrCharsMax: PLATFORM_LIMITS.stringUnitsMax,
  /** Attributes on one tag. */
  attrsPerNodeMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Text/comment/raw payload of one node, in UTF-16 code units. */
  nodeValueCharsMax: PLATFORM_LIMITS.stringUnitsMax,
  /** Entries of each kind in a project scan (pages, layouts, components). */
  scanEntriesMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Folders listed by a project scan. */
  scanFoldersMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Props on one component schema. */
  propSchemaFieldsMax: 512,
  /** Literal options on one union-typed prop. */
  propOptionsMax: 256,
  /**
   * Levels of item fields one List prop declares: its items' fields, the fields
   * of a list or group among them, and the fields of one more inside that. A
   * field on the last level is a plain value. The Properties panel draws one
   * nested editor per level, and the prop model reads them back
   * (PROP_MODEL_LIMITS.propNestingDepthMax counts each list and group twice).
   */
  listFieldDepthMax: 3,
  /** Item fields on one level of a List prop's item. */
  listFieldsPerLevelMax: 24,
  /** Item fields on every level of one List prop together. */
  listFieldsTotalMax: 96,
  /** Choices of one Option item field. */
  listOptionsMax: 32,
  /** Import declarations in one frontmatter block. */
  importsMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Length of one IPC payload string field: the longest string there is. */
  ipcFieldCharsMax: PLATFORM_LIMITS.stringUnitsMax,
  /** Length of one path crossing a boundary: Windows' extended-length limit. */
  ipcPathCharsMax: 32768,
  /** Items in one array or keys in one object crossing a boundary. */
  ipcItemsMax: PLATFORM_LIMITS.arrayLengthMax,
  /** Nesting depth of one structured value crossing a boundary. */
  ipcDepthMax: 128,
  /** Characters one syntax-colouring slice tokenises before it yields to the event
   * loop. TextMate and Lezer work is synchronous CPU, so this bounds the work of
   * one slice (about 30 ms of TextMate work), never the size of the text: a page of any length is
   * coloured slice by slice. */
  syntaxHighlightSliceCharsMax: 16e3,
  // Editor core (plan §8). The projection reuses treeNodesMax and treeDepthMax:
  // a projected node is a page-tree node, so one name keeps one meaning.
  /** Bytes of one source file. Merged up from electron/lib/mainLimits.ts so the
   * renderer, the actor and the disk readers answer to one number. It is the
   * platform string ceiling: UTF-8 bytes are never fewer than UTF-16 units, so
   * every file within it decodes. */
  sourceBytesMax: PLATFORM_LIMITS.stringUnitsMax,
  /** Intents accepted by one document actor and not yet terminal. Past this,
   * submission returns `backpressured`; the persistence layer holds the draft. */
  intentsPendingMax: 64,
  /** Work units an exact diff may spend BEYOND the linear scans every diff
   * pays (four passes over both files), and each span mapping through it: one
   * unit is one byte comparison or one frontier cell (shared/engine/diff.ts).
   * Not a size limit: a file of any size with a small edit costs only its
   * linear scans, which the allowance covers. It is the point where an exact
   * minimum script stops being worth its cost (quadratic blow-ups on
   * repetitive content); past it the diff DEGRADES to the blocks it can prove
   * equal (shared/engine/coarseDiff.ts) and nothing is refused. */
  diffWorkMax: 5e7,
  /** Edit distance (bytes deleted plus bytes inserted) an exact diff searches
   * to. The frontiers it keeps grow with its square: 2·(D + 1)² 32-bit cells,
   * about 34 MB at this bound, so this is a memory ceiling on the exact
   * algorithm, not on the file. A change larger than this degrades to a coarse
   * diff (see diffWorkMax); a span inside an unchanged block still maps. */
  diffDistanceMax: 2048,
  /** Document actors one host caches (electron/documents/documentActors.ts).
   * A cache size, not a limit: an actor holds only its snapshot between
   * intents, so the least recently used idle ones are dropped past this and
   * re-read the disk on their next intent. A batch of any number of files runs;
   * the count only decides how much stays in memory. */
  documentActorsMax: 512,
  /** Snapshot bytes all of one host's actors cache together; past it, idle
   * actors are dropped least recently used first. A single document of any
   * size still opens and edits: it is simply not kept once it is idle. */
  documentBytesRetainedMax: 64 * 1024 * 1024,
  /** Parses one actor may have in flight: the current read plus one newer. */
  parseTasksInFlightMax: 2,
  /** Snapshots one actor retains: the committed one plus the candidate under
   * verification. Pending intents keep only their authored preconditions. */
  snapshotsRetainedMax: 2,
  /** Earlier snapshots a host keeps per actor (step 6): the bytes the renderer
   * authored an edit against, once the actor's own writes or an outside one
   * replaced them. The renderer keeps authoring against the page it shows
   * until a save lands with nothing newer typed, so a run of saves under a
   * busy keyboard needs as many as the commit log holds. This is the depth of
   * a cache of history, not a size: an edit authored before the oldest kept
   * snapshot is refused, never guessed, and the page asks to be reloaded. */
  authoredSnapshotsMax: 16,
  /** Bytes of those earlier snapshots per actor, so sixteen copies of a large
   * page never pile up; the oldest go first, but the newest always stays, so a
   * document bigger than this still has the snapshot its next edit needs. */
  authoredBytesRetainedMax: 16 * 1024 * 1024,
  /** Commits a host remembers per actor — the bytes before, the bytes after,
   * the splices between — so an edit authored before the actor's own recent
   * writes is rebased exactly, without a diff (shared/engine/rebase.ts). */
  commitLogEntriesMax: 16,
  /** Undo entries one session keeps (the renderer's history; step 6 moves the
   * bound here from a literal in App.tsx, where it was already 100). */
  undoEntriesMax: 100,
  /** Diagnostics one parse-error projection carries, and the length of each. */
  diagnosticsMax: 64,
  diagnosticCharsMax: 4096
};

// vendor/stacki/shared/core/record.ts
function toRecord(input) {
  if (!(typeof input != "object" || input === null || Array.isArray(input)))
    return input;
}
function toArray(input) {
  if (Array.isArray(input))
    return input;
}

// vendor/stacki/shared/core/boundary.ts
var BOUNDARY_LIMITS = {
  textLengthMax: LIMITS.ipcFieldCharsMax,
  pathLengthMax: LIMITS.ipcPathCharsMax,
  itemsMax: LIMITS.ipcItemsMax,
  depthMax: LIMITS.ipcDepthMax
};
function text(input) {
  if (typeof input != "string")
    throw new Error("Expected string");
  if (input.length > BOUNDARY_LIMITS.textLengthMax)
    throw new Error("String exceeds limit");
  return input;
}
function boolean(input) {
  if (typeof input != "boolean")
    throw new Error("Expected boolean");
  return input;
}
function optional(parse) {
  return (input) => input === void 0 ? void 0 : parse(input);
}
function list(parse) {
  return (input) => {
    let values = toArray(input);
    if (!values)
      throw new Error("Expected array");
    if (values.length > BOUNDARY_LIMITS.itemsMax)
      throw new Error("Array exceeds limit");
    return values.map(parse);
  };
}
function record(input) {
  let value = toRecord(input);
  if (!value)
    throw new Error("Expected object");
  if (Object.keys(value).length > BOUNDARY_LIMITS.itemsMax)
    throw new Error("Object exceeds limit");
  return value;
}
function object(shape) {
  return (input) => {
    let source = record(input), result = {};
    for (let [key, parse] of Object.entries(shape)) {
      let value = parse(source[key]);
      value !== void 0 && (result[key] = value);
    }
    return result;
  };
}

// vendor/stacki/shared/properties/componentDefaults.ts
var DEFAULT_LIMITS = {
  componentsMax: 512,
  childrenMax: 32,
  depthMax: 12,
  nodesMax: 256,
  propsMax: 64,
  textCharsMax: 16384,
  sourceCharsMax: 262144,
  storedNodesMax: 4096
};
function componentFile(input) {
  let value = text(input);
  if (value.length > 500 || !/^(src\/|node_modules\/(?:@[\w.-]+\/)?[\w.-]+\/)[\w./ -]+\.astro$/.test(value))
    throw new Error("Component defaults: expected a project-relative component .astro path");
  if (value.split("/").some((part) => part.startsWith(".") || part === ""))
    throw new Error("Component defaults: invalid path segment");
  return value;
}
function parseComponentDefaults(input) {
  let value = record(input);
  if (value.version !== 1)
    throw new Error("Component defaults: unsupported version");
  let entries = Object.entries(record(value.components));
  if (entries.length > DEFAULT_LIMITS.componentsMax)
    throw new Error("Component defaults: too many components");
  let nodes = 0, takeNode = () => {
    if (nodes += 1, nodes > DEFAULT_LIMITS.storedNodesMax)
      throw new Error("Component defaults exceed the stored node limit");
  }, components = Object.fromEntries(entries.map(([file, recipe]) => [componentFile(file), parseRecipe(recipe, 0, takeNode)]));
  return assert(Object.keys(components).length === entries.length, "Recipe parsing preserves every owner"), assert(nodes <= DEFAULT_LIMITS.storedNodesMax, "Parsed recipes fit the total node budget"), { version: 1, components };
}
var parseDefaultComponent = object({
  importPath: optional(text),
  file: componentFile,
  name: text,
  props: list(text),
  slots: list(text),
  slotText: boolean
}), parseDefaultsSnapshot = object({
  source: optional(text),
  config: parseComponentDefaults,
  catalog: list(parseDefaultComponent)
}), parseDefaultsSave = object({
  source: optional(text),
  config: parseComponentDefaults
});
function defaultValue(input) {
  if (typeof input == "boolean")
    return input;
  if (typeof input == "number") {
    if (!Number.isFinite(input))
      throw new Error("Default number must be finite");
    return input;
  }
  let value = text(input);
  if (value.length > DEFAULT_LIMITS.textCharsMax)
    throw new Error("Default text exceeds 16 KiB");
  return value;
}
function parseRecipe(input, depth, takeNode) {
  if (takeNode(), depth > DEFAULT_LIMITS.depthMax)
    throw new Error("Component defaults exceed the nesting limit");
  let value = record(input), props = value.props, content = value.text, children = value.children;
  if (content !== void 0 && children !== void 0)
    throw new Error("Choose text or children for a recipe, not both");
  return {
    ...props === void 0 ? {} : { props: parseRecipeProps(props) },
    ...content === void 0 ? {} : { text: parseRecipeText(content) },
    ...children === void 0 ? {} : { children: parseRecipeChildren(children, depth, takeNode) }
  };
}
function parseRecipeText(input) {
  let value = defaultValue(input);
  if (typeof value != "string")
    throw new Error("Default text must be a string");
  return value;
}
function parseRecipeProps(input) {
  let entries = Object.entries(record(input));
  if (entries.length > DEFAULT_LIMITS.propsMax)
    throw new Error("Too many default props");
  return Object.fromEntries(
    entries.map(([name, value]) => {
      if (!/^[A-Za-z_][\w:-]{0,99}$/.test(name))
        throw new Error("Invalid default prop name");
      return [name, defaultValue(value)];
    })
  );
}
function parseRecipeChildren(input, depth, takeNode) {
  let values = list(record)(input);
  if (values.length > DEFAULT_LIMITS.childrenMax)
    throw new Error("Too many default children");
  return values.map((value) => {
    if (depth + 1 > DEFAULT_LIMITS.depthMax)
      throw new Error("Default children exceed the depth limit");
    if (["literal", "element", "component"].filter((key) => value[key] !== void 0).length !== 1)
      throw new Error("A default child must name exactly one component, element, or literal");
    if (value.literal !== void 0)
      return takeNode(), { literal: parseRecipeText(value.literal) };
    let recipe = parseRecipe(value, depth + 1, takeNode);
    if (value.element !== void 0) {
      let element = text(value.element);
      if (!/^[a-z][a-z0-9-]{0,99}$/.test(element))
        throw new Error("Invalid default HTML element");
      return { element, ...recipe };
    }
    if (value.inherit !== void 0 && value.inherit !== !1)
      throw new Error("Captured child defaults use inherit: false");
    return {
      component: componentFile(value.component),
      ...recipe,
      ...value.inherit === !1 ? { inherit: !1 } : {}
    };
  });
}

// vendor/stacki/shared/properties/defaultsCanvas.ts
function isDefaultsCanvas(file) {
  return /^\.stacki\/canvas\/[a-f0-9-]{36}\.astro$/.test(file);
}
function defaultsCanvasFile(input) {
  let file = text(input);
  if (!isDefaultsCanvas(file))
    throw new Error("Invalid component defaults canvas path");
  return file;
}
function defaultsCanvasSource(input) {
  let source = text(input);
  if (source.length > DEFAULT_LIMITS.sourceCharsMax)
    throw new Error("Component defaults canvas exceeds 256 KiB");
  return source;
}
var parseCanvasCreate = object({ file: defaultsCanvasFile, source: defaultsCanvasSource }), parseCanvasFile = object({ file: defaultsCanvasFile });

// vendor/stacki/shared/page/previewToken.ts
var PREVIEW_STAMP_PREFIX = "avb-d:", PREVIEW_STAMP_ATTRIBUTE = "data-avb-d";
function stampPathProblem(file) {
  if (file.length === 0)
    return "empty";
  if (LIMITS.ipcPathCharsMax < file.length)
    return "too long";
  if (/[\0\\\r\n]/.test(file) || file.includes("-->"))
    return "forbidden character";
  if (file.startsWith("/") || /^[A-Za-z]:/.test(file))
    return "absolute";
  if (file.split("/").some((segment) => segment === ".." || segment === "." || segment === ""))
    return "not normalized";
}
function stampData(stamp) {
  let problem = stampPathProblem(stamp.file);
  return assert(problem === void 0, `A stamped path is a project-relative path (${problem})`), `${PREVIEW_STAMP_PREFIX}${stamp.checksum}:${stamp.file}`;
}
function stampComment(stamp) {
  return `<!--${stampData(stamp)}-->`;
}

// vendor/stacki/shared/page/frontmatter.ts
function parseImportSlots(input) {
  let slots = toArray(input);
  if (!slots)
    throw new Error("ImportSlots: expected array");
  if (slots.length > LIMITS.importsMax)
    throw new Error("ImportSlots: exceeds limit");
  return slots.map(parseImportSlot);
}
function parseImportSlot(input) {
  let slot = toRecord(input);
  if (!slot)
    throw new Error("ImportSlot: expected object");
  let members = toArray(slot.members);
  if (!members)
    throw new Error("ImportSlot.members: expected array");
  if (members.length > LIMITS.importsMax)
    throw new Error("ImportSlot.members: exceeds limit");
  return {
    at: parseOffset(slot.at, "ImportSlot.at"),
    offset: parseOffset(slot.offset, "ImportSlot.offset"),
    source: parseText(slot.source, "ImportSlot.source"),
    suffix: parseText(slot.suffix, "ImportSlot.suffix"),
    tail: parseText(slot.tail, "ImportSlot.tail"),
    members: members.map(parseImportMember)
  };
}
function parseImportMember(input) {
  let member = toRecord(input);
  if (!member)
    throw new Error("ImportMember: expected object");
  let named = member.named, typeOnly = member.typeOnly;
  for (let flag of [named, typeOnly])
    if (flag !== void 0 && typeof flag != "boolean")
      throw new Error("ImportMember: expected boolean flag");
  return {
    name: parseText(member.name, "ImportMember.name"),
    path: parseText(member.path, "ImportMember.path"),
    quote: parseText(member.quote, "ImportMember.quote"),
    at: parseOffset(member.at, "ImportMember.at"),
    ...typeof named == "boolean" ? { named } : {},
    ...typeof typeOnly == "boolean" ? { typeOnly } : {},
    ...member.imported === void 0 ? {} : {
      imported: parseText(member.imported, "ImportMember.imported")
    }
  };
}
function parseText(input, field) {
  if (typeof input != "string")
    throw new Error(`${field}: expected string`);
  if (input.length > LIMITS.nodeValueCharsMax)
    throw new Error(`${field}: exceeds limit`);
  return input;
}
function parseOffset(input, field) {
  if (typeof input != "number")
    throw new Error(`${field}: expected integer`);
  if (!Number.isSafeInteger(input))
    throw new Error(`${field}: expected integer`);
  if (input < 0 || input > LIMITS.ipcFieldCharsMax)
    throw new Error(`${field}: outside source bounds`);
  return input;
}

// vendor/stacki/shared/core/span.ts
function toUtf16Span(start, end) {
  let span = { start: toUtf16Offset(start), end: toUtf16Offset(end) };
  if (span.end < span.start)
    throw new Error("Utf16Span: end must not precede start");
  return span;
}

// vendor/stacki/shared/page/pageTreeInvariants.ts
function assertTreeInvariants(nodes) {
  if (nodes.length > LIMITS.treeNodesMax)
    throw new Error(`Tree invariant violated: exceeds ${LIMITS.treeNodesMax} nodes`);
  let pending = nodes.map((node) => ({ node, depth: 0 })), ids = /* @__PURE__ */ new Set();
  for (let index = 0; index < pending.length; index++) {
    let entry = pending[index];
    if (!entry)
      throw new Error("Tree invariant violated: missing traversal entry");
    if (entry.depth > LIMITS.treeDepthMax)
      throw new Error(`Tree invariant violated: exceeds depth ${LIMITS.treeDepthMax}`);
    let { node, depth } = entry;
    if (typeof node.id != "string")
      throw new Error("Tree invariant violated: missing id");
    if (ids.has(node.id))
      throw new Error(`Tree invariant violated: duplicate id ${node.id}`);
    if (ids.add(node.id), node.children) {
      if (pending.length + node.children.length > LIMITS.treeNodesMax)
        throw new Error(`Tree invariant violated: exceeds ${LIMITS.treeNodesMax} nodes`);
      for (let child of node.children)
        pending.push({ node: child, depth: depth + 1 });
    }
  }
}

// vendor/stacki/shared/page/pageNode.ts
function parseMapBodyParts(input, children) {
  if (!Array.isArray(input))
    throw new Error("Map.bodyParts: expected array");
  if (input.length > LIMITS.treeNodesMax + 1)
    throw new Error("Map.bodyParts: exceeds part limit");
  if (!Array.isArray(children) || input.length !== children.length + 1)
    throw new Error("Map.bodyParts: expected one more part than markup roots");
  let length = 0;
  return input.map((part) => {
    if (typeof part != "string")
      throw new Error("Map.bodyParts: expected string");
    if (length += part.length, length > LIMITS.nodeValueCharsMax)
      throw new Error("Map.bodyParts: exceeds source limit");
    return part;
  });
}

// vendor/stacki/electron/parse/astroParserValidation.ts
var NODE_VARIANT_FIELDS = {
  component: ["name", "children", "shorthand", "tightClose", "closeSource", "dynamicTag", "astroAsset", "chunkFile", "chunkAggregate"],
  element: ["name", "children", "shorthand", "tightClose", "closeSource", "dynamicTag", "astroAsset", "chunkFile", "chunkAggregate"],
  text: ["value"],
  expr: ["value"],
  "raw-line": ["value"],
  comment: ["value", "jsx"],
  raw: ["name", "inner"],
  map: ["head", "children", "headSource", "body", "bodyParts", "bare"],
  cond: ["op", "test", "children"],
  branch: ["name", "children"],
  "chunk-group": ["name", "chunkFile", "children"]
};
function parseSerializeNodes(input) {
  let nodes = toArray(input);
  if (!nodes)
    throw new Error("SerializeNodes: expected array");
  if (nodes.length > LIMITS.treeNodesMax)
    throw new Error("SerializeNodes: node limit");
  if (!nodes.every(isParserNode))
    throw new Error("SerializeNodes: invalid node");
  let pending = nodes.map((node) => ({
    node,
    depth: 0
  })), visited = 0;
  for (let index = 0; index < pending.length; index++) {
    let current = pending[index];
    if (!current)
      throw new Error("SerializeNodes: missing traversal entry");
    if (++visited > LIMITS.treeNodesMax)
      throw new Error("SerializeNodes: node limit");
    if (current.depth > LIMITS.treeDepthMax)
      throw new Error("SerializeNodes: depth limit");
    let record2 = parseSerializeNode(current.node), children = toArray(record2.children);
    if (children) {
      if (pending.length + children.length > LIMITS.treeNodesMax)
        throw new Error("SerializeNodes: node limit");
      for (let node of children)
        pending.push({ node, depth: current.depth + 1 });
    }
  }
  return nodes;
}
function parseSerializePage(input) {
  let record2 = parseRecord(input, "SerializePage"), imports = toArray(record2.imports ?? []);
  if (!imports)
    throw new Error("SerializePage.imports: expected array");
  if (imports.length > LIMITS.importsMax)
    throw new Error("SerializePage.imports: limit");
  let layout = record2.frontmatterLayout === void 0 ? void 0 : parseRecord(record2.frontmatterLayout, "SerializePage.frontmatterLayout");
  return {
    imports: imports.map(parseSerializeImport),
    frontmatterLead: parseText2(record2.frontmatterLead ?? "", "frontmatterLead"),
    extraFrontmatter: parseText2(record2.extraFrontmatter ?? "", "extraFrontmatter"),
    extraFrontmatterSpaced: parseBoolean(record2.extraFrontmatterSpaced ?? !0),
    hadFrontmatter: parseBoolean(record2.hadFrontmatter ?? !0),
    trailingBlank: parseCount(record2.trailingBlank ?? 0, "trailingBlank"),
    eol: parsePageEol(record2.eol),
    nodes: parseSerializeNodes(record2.nodes),
    ...layout === void 0 ? {} : {
      frontmatterLayout: {
        extra: parseText2(layout.extra, "frontmatterLayout.extra"),
        slots: parseImportSlots(layout.slots)
      }
    }
  };
}
function parsePageEol(input) {
  if (input === void 0 || input === `
`)
    return `
`;
  if (input === `\r
`)
    return `\r
`;
  throw new Error("SerializePage.eol: expected LF or CRLF");
}
function parseSerializeImport(input) {
  let record2 = parseRecord(input, "SerializeImport"), member = parseImportMember({
    ...record2,
    quote: record2.quote ?? "'",
    at: record2.at ?? 0
  });
  return record2.at === void 0 ? { ...member, at: -1 } : member;
}
function parseSerializeNode(input) {
  let record2 = parseRecord(input, "SerializeNode");
  switch (parseSerializeMetadata(record2), parseSerializeVariant(record2), record2.kind) {
    case "text":
    case "expr":
    case "raw-line":
    case "comment":
      parseText2(record2.value, "node.value");
      break;
    case "raw":
      parseText2(record2.name, "node.name"), parseText2(record2.inner, "node.inner");
      break;
    case "component":
    case "element":
    case "branch":
    case "chunk-group":
      if (parseText2(record2.name, "node.name"), record2.kind === "branch" && record2.name !== "then" && record2.name !== "else")
        throw new Error("SerializeNode: invalid branch name");
      record2.kind === "chunk-group" && parseText2(record2.chunkFile, "node.chunkFile"), parseSerializeChildren(record2);
      break;
    case "map":
      parseText2(record2.head, "node.head"), record2.bodyParts !== void 0 && parseMapBodyParts(record2.bodyParts, record2.children), record2.body !== void 0 && parseStrings(record2.body, LIMITS.treeNodesMax), parseSerializeChildren(record2);
      break;
    case "cond":
      if (parseText2(record2.test, "node.test"), record2.op !== "?" && record2.op !== "&&")
        throw new Error("SerializeNode: invalid conditional operator");
      parseSerializeChildren(record2);
      break;
    default:
      throw new Error("SerializeNode: unknown kind");
  }
  return record2;
}
function isParserNode(input) {
  return parseSerializeNode(input), !0;
}
function parseSerializeVariant(record2) {
  let kind = record2.kind;
  if (typeof kind != "string")
    throw new Error("SerializeNode: unknown kind");
  let allowed = Object.hasOwn(NODE_VARIANT_FIELDS, kind) ? NODE_VARIANT_FIELDS[kind] : void 0;
  if (!allowed)
    throw new Error("SerializeNode: unknown kind");
  for (let field of [
    "name",
    "children",
    "shorthand",
    "tightClose",
    "closeSource",
    "dynamicTag",
    "astroAsset",
    "chunkFile",
    "chunkAggregate",
    "value",
    "jsx",
    "inner",
    "head",
    "headSource",
    "body",
    "bodyParts",
    "bare",
    "op",
    "test"
  ])
    if (record2[field] !== void 0 && !allowed.includes(field))
      throw new Error(`SerializeNode: ${field} is not valid on ${kind}`);
}
function parseSerializeChildren(record2) {
  if (Object.hasOwn(record2, "children") && record2.children === void 0 && (record2.kind === "component" || record2.kind === "element"))
    return;
  let children = toArray(record2.children);
  if (!children)
    throw new Error("SerializeNode.children: expected array");
  if (children.length > LIMITS.treeNodesMax)
    throw new Error("SerializeNodes: node limit");
  if (record2.kind === "cond") {
    for (let child of children)
      if (toRecord(child)?.kind !== "branch")
        throw new Error("SerializeNode: conditional children must be branches");
  }
}
function parseSerializeMetadata(record2) {
  for (let field of ["id", "source", "attrSource", "closeSource", "headSource", "chunkFile", "mdSource"])
    record2[field] !== void 0 && parseText2(record2[field], `node.${field}`);
  for (let field of ["blankBefore", "blankAfter", "start", "end"])
    record2[field] !== void 0 && parseCount(record2[field], `node.${field}`);
  for (let field of ["jsx", "shorthand", "tightClose", "dynamicTag", "astroAsset", "chunkAggregate", "bare"])
    record2[field] !== void 0 && parseBoolean(record2[field]);
  record2.attrOrder !== void 0 && parseStrings(record2.attrOrder, LIMITS.attrsPerNodeMax), record2.props !== void 0 && parseSerializeProps(record2.props);
}
function parseSerializeProps(input) {
  let record2 = parseRecord(input, "SerializeProps"), entries = Object.entries(record2);
  if (entries.length > LIMITS.attrsPerNodeMax)
    throw new Error("SerializeProps: attr limit");
  for (let [name, input2] of entries) {
    parseText2(name, "attribute name", LIMITS.attrCharsMax);
    let prop = parseRecord(input2, "SerializeProp");
    switch (prop.type) {
      case "bare":
        break;
      case "expr":
      case "spread":
      case "string":
        parseText2(prop.value, "attribute value", LIMITS.attrCharsMax);
        break;
      default:
        throw new Error("SerializeProp: unknown type");
    }
  }
}
function parseRecord(input, field) {
  let record2 = toRecord(input);
  if (!record2)
    throw new Error(`${field}: expected object`);
  return record2;
}
function parseText2(input, field, limit = LIMITS.nodeValueCharsMax) {
  if (typeof input != "string")
    throw new Error(`${field}: expected string`);
  if (input.length > limit)
    throw new Error(`${field}: exceeds limit`);
  return input;
}
function parseStrings(input, limit) {
  let list2 = toArray(input);
  if (!list2)
    throw new Error("SerializeNode: expected string array");
  if (list2.length > limit)
    throw new Error("SerializeNode: string array limit");
  for (let value of list2)
    parseText2(value, "array value");
}
function parseCount(input, field) {
  if (typeof input != "number")
    throw new Error(`${field}: expected integer`);
  if (!Number.isSafeInteger(input))
    throw new Error(`${field}: expected integer`);
  if (input < 0 || input > LIMITS.ipcFieldCharsMax)
    throw new Error(`${field}: outside source bounds`);
  return input;
}
function parseBoolean(input) {
  if (typeof input != "boolean")
    throw new Error("SerializeNode: expected boolean");
  return input;
}

// vendor/stacki/shared/page/frontmatterSource.ts
var DEFAULT_IMPORT = /import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\2;?/y, NAMED_IMPORT = /import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2;?/y, MEMBER = /^(type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/;
function skipQuoted(text2, start) {
  let quote = text2.charAt(start);
  assert("'\"`".includes(quote), "skipQuoted: starts at a quote");
  let i = start + 1;
  for (; i < text2.length; i++)
    if (text2.charAt(i) === "\\")
      i++;
    else {
      if (text2.charAt(i) === quote)
        return i + 1;
      quote === "`" && text2.charAt(i) === "$" && text2.charAt(i + 1) === "{" && (i = skipBraced(text2, i + 1) - 1);
    }
  return assert(i > start, "skipQuoted: a quoted run consumes its opening quote"), i;
}
function skipCodeToken(text2, i) {
  if ("'\"`".includes(text2.charAt(i)))
    return skipQuoted(text2, i);
  if (text2.startsWith("//", i)) {
    let end = text2.indexOf(`
`, i + 2);
    return end < 0 ? text2.length : end;
  }
  if (text2.startsWith("/*", i)) {
    let end = text2.indexOf("*/", i + 2);
    return end < 0 ? text2.length : end + 2;
  }
  let before = i - 1;
  if (text2.charAt(i) === "/")
    for (; before >= 0 && /\s/.test(text2.charAt(before)); )
      before--;
  let previous = before >= 0 ? text2.charAt(before) : void 0;
  if (text2.charAt(i) === "/" && (before < 0 || previous !== void 0 && "=(:,[!&|?{};".includes(previous))) {
    let inClass = !1;
    for (let j = i + 1; j < text2.length && text2.charAt(j) !== `
`; j++)
      if (text2.charAt(j) === "\\")
        j++;
      else if (text2.charAt(j) === "[")
        inClass = !0;
      else if (text2.charAt(j) === "]")
        inClass = !1;
      else if (text2.charAt(j) === "/" && !inClass)
        return j + 1;
  }
  return i;
}
function skipBraced(text2, start) {
  assert(text2.charAt(start) === "{", "skipBraced: starts at an opening brace");
  let depth = 0;
  for (let i = start; i < text2.length; i++) {
    let skipped = skipCodeToken(text2, i);
    if (skipped !== i) {
      i = skipped - 1;
      continue;
    }
    if (text2.charAt(i) === "{")
      depth++;
    else if (text2.charAt(i) === "}" && --depth === 0)
      return i + 1;
  }
  return text2.length;
}
function readFrontmatter(source = "") {
  let imports = [], slots = [], cursor = 0, extra = "";
  for (let i = 0; i < source.length; i++) {
    let skipped = skipCodeToken(source, i);
    if (skipped !== i) {
      i = skipped - 1;
      continue;
    }
    if (!source.startsWith("import", i) || /[\w$.]/.test(source.charAt(i - 1)))
      continue;
    let parsed = parseImportAt(source, i);
    if (parsed === void 0)
      continue;
    extra += source.slice(cursor, i);
    let suffix = /^[ \t]*\r?\n/.exec(source.slice(parsed.end))?.[0] || "", raw = source.slice(i, parsed.end);
    slots.push({
      at: i,
      offset: extra.length,
      source: raw,
      suffix,
      tail: raw.slice(parsed.pathEnd),
      members: parsed.members.map((member) => ({ ...member }))
    }), imports.push(...parsed.members), cursor = parsed.end + suffix.length, assert(cursor > i, "readFrontmatter: every modelled import consumes source"), i = cursor - 1;
  }
  return extra += source.slice(cursor), {
    imports,
    // All declarations stay visible to binding/schema editors, including
    // those preceding the first import. Slots preserve their source position.
    frontmatterLead: "",
    extraFrontmatter: extra.trim(),
    extraFrontmatterSpaced: /^[ \t]*\r?\n/.test(extra),
    frontmatterLayout: { extra, slots }
  };
}
function parseImportAt(source, at) {
  DEFAULT_IMPORT.lastIndex = NAMED_IMPORT.lastIndex = at;
  let plain = DEFAULT_IMPORT.exec(source), match = plain ?? NAMED_IMPORT.exec(source);
  if (match === null)
    return;
  let quote = match[2], specifier = match[3], body = match[1];
  if (quote === void 0 || specifier === void 0 || body === void 0)
    return;
  let members = plain === null ? namedMembers(body, specifier, quote, at) : [{ name: body, path: specifier, quote, at }];
  if (members === void 0)
    return;
  let end = at + match[0].length, attribute = /^[ \t]*(?:with|assert)\s*\{/.exec(source.slice(end));
  attribute && (end = skipBraced(source, end + attribute[0].length - 1), source.charAt(end) === ";" && end++);
  let pathEnd = match[0].lastIndexOf(quote + specifier + quote) + specifier.length + 2;
  return assert(end > at, "parseImportAt: an import statement is not empty"), { members, end, pathEnd };
}
function namedMembers(body, specifier, quote, at) {
  let members = [], texts = body.split(",").map((text2) => text2.trim()).filter(Boolean);
  for (let text2 of texts) {
    let member = MEMBER.exec(text2);
    if (member === null || member[2] === void 0)
      return;
    let [typePrefix, imported, alias] = [member[1], member[2], member[3]];
    members.push({
      name: alias || imported,
      imported,
      named: !0,
      path: specifier,
      quote,
      at,
      ...typePrefix ? { typeOnly: !0 } : {}
    });
  }
  return members.length > 0 ? members : void 0;
}
var sameImport = (candidate, existing, specFor) => candidate.name === existing.name && (specFor ? specFor(candidate) : candidate.path) === existing.path && candidate.quote === existing.quote && !!candidate.named == !!existing.named && candidate.imported === existing.imported && !!candidate.typeOnly == !!existing.typeOnly;
function importLines(imports, tail, specFor) {
  let groups = [], named = /* @__PURE__ */ new Map();
  for (let imp of imports) {
    let specifier = specFor ? specFor(imp) : imp.path;
    if (!imp.named) {
      groups.push({ members: [imp], specifier });
      continue;
    }
    let group = named.get(specifier);
    group || (group = { members: [], specifier }, groups.push(group), named.set(specifier, group)), group.members.push(imp);
  }
  return groups.map(({ members, specifier }) => {
    let first = members[0];
    if (first === void 0)
      return "";
    let quote = first.quote === '"' ? '"' : "'";
    return `import ${first.named ? "{ " + members.map((imp) => {
      let name = imp.imported && imp.imported !== imp.name ? `${imp.imported} as ${imp.name}` : imp.name;
      return imp.typeOnly ? `type ${name}` : name;
    }).join(", ") + " }" : first.name} from ${quote}${specifier}${quote}${tail}`;
  });
}
function withWhitespace(raw, value = "") {
  if (value === raw.trim())
    return raw;
  let from = raw.length - raw.trimStart().length, to = Math.max(from, raw.trimEnd().length), result = raw.slice(0, from) + value + raw.slice(to);
  return assert(result.trim() === value.trim(), "withWhitespace: the value is replaced whole"), result;
}
function moveOffsets(before, after, offsets) {
  if (before === after || !offsets.length)
    return [...offsets];
  if (before.trim() === "") {
    let lead = after.length - after.trimStart().length, kept = offsets.map((offset) => Math.min(offset, lead));
    return assert(
      kept.every((offset) => offset <= lead),
      "moveOffsets: imports of an empty block stay above the new code"
    ), safeImportOffsets(after, kept);
  }
  let split = (text2) => text2.match(/[^\n]*\n|[^\n]+$/g) || [], beforeLines = split(before), afterLines = split(after), first = 0;
  for (; first < beforeLines.length && first < afterLines.length && beforeLines[first] === afterLines[first]; )
    first++;
  let beforeEnd = beforeLines.length, afterEnd = afterLines.length;
  for (; beforeEnd > first && afterEnd > first && beforeLines[beforeEnd - 1] === afterLines[afterEnd - 1]; )
    beforeEnd--, afterEnd--;
  let dp = commonLinesTable(beforeLines.slice(first, beforeEnd), afterLines.slice(first, afterEnd)), moved = [], oldAt = 0, newAt = 0, slot = 0, take = (oldText, newText, line) => {
    let end = oldAt + oldText.length;
    for (; slot < offsets.length && (offsets[slot] ?? 0) < end; )
      moved.push(newAt + (line === "kept" ? (offsets[slot] ?? 0) - oldAt : 0)), slot++;
    oldAt = end, newAt += newText.length;
  };
  for (let i2 = 0; i2 < first; i2++)
    take(beforeLines[i2] ?? "", afterLines[i2] ?? "", "kept");
  let i = first, j = first;
  for (; i < beforeEnd || j < afterEnd; )
    i < beforeEnd && j < afterEnd && beforeLines[i] === afterLines[j] ? take(beforeLines[i++] ?? "", afterLines[j++] ?? "", "kept") : i < beforeEnd && (j === afterEnd || !dp.length || (dp[i - first + 1]?.[j - first] ?? 0) >= (dp[i - first]?.[j - first + 1] ?? 0)) ? take(beforeLines[i++] ?? "", "", "changed") : take("", afterLines[j++] ?? "", "changed");
  for (; i < beforeLines.length; )
    take(beforeLines[i++] ?? "", afterLines[j++] ?? "", "kept");
  for (; slot++ < offsets.length; )
    moved.push(newAt);
  return assert(moved.length === offsets.length, "moveOffsets: every slot is moved"), safeImportOffsets(after, moved);
}
function commonLinesTable(before, after) {
  let table = [];
  if (before.length * after.length > 262144)
    return table;
  for (let i = 0; i <= before.length; i++)
    table.push(new Uint32Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--) {
      let row = table[i];
      assert(row !== void 0, "commonLinesTable: every row was allocated"), row[j] = before[i] === after[j] ? (table[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(table[i + 1]?.[j] ?? 0, table[i]?.[j + 1] ?? 0);
    }
  return table;
}
function safeImportOffsets(text2, offsets) {
  let safe = [], slot = 0, depth = 0, lineStart = !0, ended = !0, previous = "";
  for (let i = 0; i < text2.length && slot < offsets.length; i++) {
    if (!depth && (ended || lineStart && !"=(:,[!&|?+-*/.".includes(previous)))
      for (; slot < offsets.length && (offsets[slot] ?? 0) <= i; )
        safe.push(i), slot++;
    let skipped = skipCodeToken(text2, i);
    if (skipped !== i) {
      text2.charAt(i) !== "/" && (previous = text2.charAt(i), lineStart = ended = !1), i = skipped - 1;
      continue;
    }
    let char = text2.charAt(i);
    if (char === `
`) {
      lineStart = !0;
      continue;
    }
    /\s/.test(char) || ("([{".includes(char) ? depth++ : ")]}".includes(char) && depth--, ended = char === ";" && depth === 0, lineStart = !1, previous = char);
  }
  for (; slot++ < offsets.length; )
    safe.push(text2.length);
  return assert(safe.length === offsets.length, "safeImportOffsets: every slot keeps a place"), assert(
    safe.every((offset) => offset <= text2.length),
    "safeImportOffsets: every place is inside the text"
  ), safe;
}
function writeFrontmatter(model, specFor) {
  let layout = model.frontmatterLayout;
  if (!layout)
    return writeFrontmatterFresh(model, specFor);
  let { groups, additions } = groupImports(layout, model.imports || []), extra = withWhitespace(layout.extra, model.extraFrontmatter), offsets = moveOffsets(
    layout.extra,
    extra,
    layout.slots.map((slot) => slot.offset)
  ), output = model.frontmatterLead ? model.frontmatterLead + `
` : "", from = 0;
  for (let i = 0; i < layout.slots.length; i++) {
    let slot = layout.slots[i];
    assert(slot !== void 0, "writeFrontmatter: slot index in bounds");
    let members = groups.get(slot.at) ?? [];
    if (output += extra.slice(from, offsets[i]), from = offsets[i] ?? from, members.length) {
      extra !== layout.extra && from === extra.length && output && !/\n$/.test(output) && (output += `
`);
      let untouched = members.length === slot.members.length && members.every((imp, index) => {
        let original = slot.members[index];
        return original !== void 0 && sameImport(imp, original, specFor);
      });
      output += (untouched ? slot.source : importLines(members, slot.tail, specFor).join(`
`)) + slot.suffix;
    }
    i === layout.slots.length - 1 && additions.length && (output && !/\n$/.test(output) && (output += `
`), output += importLines(additions, ";", specFor).join(`
`), extra.slice(from) && (output += `
`));
  }
  return !layout.slots.length && additions.length && (from = extra.length - extra.trimStart().length, output += extra.slice(0, from), output += importLines(additions, ";", specFor).join(`
`), extra.slice(from) && (output += `
`)), output + extra.slice(from);
}
function writeFrontmatterFresh(model, specFor) {
  let lines = [];
  return model.frontmatterLead && lines.push(model.frontmatterLead), lines.push(...importLines(model.imports || [], ";", specFor)), model.extraFrontmatter && (lines.length && model.extraFrontmatterSpaced !== !1 && lines.push(""), lines.push(model.extraFrontmatter)), lines.join(`
`);
}
function groupImports(layout, imports) {
  let groups = new Map(layout.slots.map((slot) => [slot.at, []])), added = [];
  for (let imp of imports) {
    let group = imp.at === void 0 ? void 0 : groups.get(imp.at);
    group ? group.push(imp) : added.push(imp);
  }
  let additions = [];
  for (let imp of added) {
    let slot = imp.named && layout.slots.find((layoutSlot) => (groups.get(layoutSlot.at) ?? []).some((grouped) => grouped.named && grouped.path === imp.path));
    if (slot) {
      let target = groups.get(slot.at);
      assert(target !== void 0, "groupImports: slot group exists \u2014 groups were built from layout.slots"), target.push(imp);
    } else
      additions.push(imp);
  }
  return assert(additions.length <= imports.length, "groupImports: additions come from the imports"), { groups, additions };
}

// vendor/stacki/electron/parse/astroLexical.ts
function findMatchingBrace(code, start) {
  return findMatchingDelimiter(code, start, "{", "}");
}
function findMatchingParen(code, start) {
  return findMatchingDelimiter(code, start, "(", ")");
}
function skipStringOrComment(code, start) {
  return skipLiteral(code, start, 0);
}
function findMatchingDelimiter(code, start, open, close, nesting = 0) {
  if (nesting > LIMITS.treeDepthMax)
    return -1;
  assert(code.charAt(start) === open, "Delimiter scanning starts at its opening token");
  let depth = 0;
  for (let position = start; position < code.length; position++) {
    let skipped = skipLiteral(code, position, nesting);
    if (skipped !== position) {
      position = skipped - 1;
      continue;
    }
    let character = code.charAt(position);
    if (character === open)
      depth++;
    else if (character === close && (depth--, depth === 0))
      return assert(position > start, "A matching delimiter follows its opener"), position;
  }
  return -1;
}
function skipLiteral(code, start, nesting) {
  let character = code.charAt(start);
  if (character === "`")
    return skipTemplate(code, start, nesting);
  if (character === '"' || character === "'")
    return skipQuoted2(code, start, character);
  if (character !== "/")
    return start;
  if (code.charAt(start + 1) === "/") {
    if (code.charAt(start - 1) === ":")
      return start;
    let end = code.indexOf(`
`, start + 2);
    return end === -1 ? code.length : end;
  }
  if (code.charAt(start + 1) === "*") {
    let end = code.indexOf("*/", start + 2);
    return end === -1 ? code.length : end + 2;
  }
  return regexCanStart(code, start) ? skipRegex(code, start) : start;
}
function skipQuoted2(code, start, quote) {
  for (let position = start + 1; position < code.length; position++) {
    let character = code.charAt(position);
    if (character === "\\")
      position++;
    else {
      if (character === quote)
        return position + 1;
      if (character === `
` || character === "\r")
        return start;
    }
  }
  return start;
}
function skipTemplate(code, start, nesting) {
  if (nesting >= LIMITS.treeDepthMax)
    return code.length;
  for (let position = start + 1; position < code.length; position++) {
    let character = code.charAt(position);
    if (character === "\\")
      position++;
    else {
      if (character === "`")
        return position + 1;
      if (character === "$" && code.charAt(position + 1) === "{") {
        let end = findMatchingDelimiter(code, position + 1, "{", "}", nesting + 1);
        if (end === -1)
          return code.length;
        position = end;
      }
    }
  }
  return code.length;
}
function regexCanStart(code, start) {
  let position = start - 1;
  for (; position >= 0 && /\s/.test(code.charAt(position)); )
    position--;
  if (position < 0 || "([{=:,;!?&|".includes(code.charAt(position)))
    return !0;
  let end = position + 1;
  for (; position >= 0 && /[\w$]/.test(code.charAt(position)); )
    position--;
  return /^(return|throw|case|typeof|void|delete|yield|await)$/.test(code.slice(position + 1, end));
}
function skipRegex(code, start) {
  let characterClass = !1;
  for (let position = start + 1; position < code.length; position++) {
    let character = code.charAt(position);
    if (character === "\\")
      position++;
    else {
      if (character === `
` || character === "\r")
        return start;
      if (character === "[")
        characterClass = !0;
      else if (character === "]")
        characterClass = !1;
      else if (character === "/" && !characterClass)
        return position + 1;
    }
  }
  return start;
}

// vendor/stacki/shared/page/htmlTags.ts
var HTML_VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

// vendor/stacki/electron/parse/astroAttrs.ts
var RAW_ELEMENTS = /* @__PURE__ */ new Set(["style", "script"]), PENDING_ID = "n0", makeId = () => PENDING_ID;
function assignPathIds(nodes, prefix, depth) {
  assert(depth <= LIMITS.treeDepthMax, "Path ids are assigned within the depth bound");
  for (let [index, node] of nodes.entries()) {
    let path3 = prefix === "" ? String(index) : `${prefix}.${index}`;
    node.id !== "layout" && (node.id = `n${path3}`), Array.isArray(node.children) && assignPathIds(node.children, path3, depth + 1);
  }
}
function propsOf(scanned) {
  return Object.fromEntries(scanned.map((found) => [found.name, found.attr]));
}
var ATTR_NAME = /[^\s"'<>/={}]+/y;
function scanAttrsChecked(source) {
  let found = [], names = /* @__PURE__ */ new Set();
  for (let position = 0; position < source.length; ) {
    let character = source.charAt(position);
    if (character === "/" || /\s/.test(character)) {
      position++;
      continue;
    }
    let attribute = scanAttr(source, position);
    if (typeof attribute == "string")
      return { attrs: found, problem: attribute };
    if (assert(attribute.to > position, "An attribute scan advances"), assert(attribute.to <= source.length, "An attribute stays inside its source"), names.has(attribute.name))
      return { attrs: found, problem: `a duplicate ${attribute.attr.type === "spread" ? "spread" : `${attribute.name} attribute`}` };
    names.add(attribute.name), found.push(attribute), position = attribute.to;
  }
  return { attrs: found, problem: void 0 };
}
function scanAttrs(source) {
  return scanAttrsChecked(source).attrs;
}
function scanAttr(source, from) {
  if (source.charAt(from) === "{")
    return scanSpreadAttr(source, from) ?? "an attribute written as braces the editor cannot read";
  ATTR_NAME.lastIndex = from;
  let match = ATTR_NAME.exec(source);
  if (!match)
    return "an attribute the editor cannot read";
  let name = match[0], end = from + name.length, nameAt = [from, end], equalsAt = scanAttrSpace(source, end);
  if (source.charAt(equalsAt) !== "=")
    return { name, attr: { type: "bare" }, from, to: end, nameAt, valueAt: void 0 };
  let valueStart = scanAttrSpace(source, equalsAt + 1), quote = source.charAt(valueStart);
  if (quote === '"' || quote === "'") {
    let close2 = source.indexOf(quote, valueStart + 1);
    return close2 === -1 ? `an unclosed quote in the ${name} attribute` : {
      name,
      attr: { type: "string", value: source.slice(valueStart + 1, close2) },
      from,
      to: close2 + 1,
      nameAt,
      valueAt: [valueStart + 1, close2]
    };
  }
  if (quote !== "{")
    return quote === "`" ? `the ${name} attribute written with a backtick template` : `the ${name} attribute written without quotes`;
  let close = findMatchingBrace(source, valueStart);
  if (close === -1)
    return `an unclosed { in the ${name} attribute`;
  let valueAt = scanAttrTrim(source, valueStart + 1, close);
  return {
    name,
    attr: { type: "expr", value: source.slice(...valueAt) },
    from,
    to: close + 1,
    nameAt,
    valueAt
  };
}
function scanSpreadAttr(source, from) {
  let close = findMatchingBrace(source, from);
  if (close === -1)
    return;
  let bodyAt = scanAttrSpace(source, from + 1);
  if (!source.startsWith("...", bodyAt))
    return scanShorthandAttr(source, from, close);
  let valueAt = scanAttrTrim(source, bodyAt + 3, close), value = source.slice(...valueAt);
  return {
    name: `...${value}`,
    attr: { type: "spread", value },
    from,
    to: close + 1,
    nameAt: void 0,
    valueAt
  };
}
var SHORTHAND_NAME = /^[A-Za-z_$][\w$]*$/;
function scanShorthandAttr(source, from, close) {
  let bodyAt = scanAttrTrim(source, from + 1, close), name = source.slice(...bodyAt);
  if (SHORTHAND_NAME.test(name))
    return { name, attr: { type: "expr", value: name }, from, to: close + 1, nameAt: bodyAt, valueAt: bodyAt, shorthand: !0 };
}
function expandShorthand(attrs) {
  let out = "", cursor = 0;
  for (let found of scanAttrs(attrs))
    found.shorthand === !0 && (out += `${attrs.slice(cursor, found.from)}${found.name}={${found.name}}`, cursor = found.to);
  return out + attrs.slice(cursor);
}
function scanAttrSpace(source, from) {
  let position = from;
  for (; position < source.length && /\s/.test(source.charAt(position)); )
    position++;
  return position;
}
function scanAttrTrim(source, from, to) {
  let raw = source.slice(from, to), start = from + raw.length - raw.trimStart().length;
  return [start, start + raw.trim().length];
}
function attrSpansOf(scanned, base) {
  let at = ([start, end]) => toUtf16Span(base + start, base + end);
  return scanned.map((found) => {
    let span = toUtf16Span(base + found.from, base + found.to), { name, attr } = found;
    switch (attr.type) {
      case "string":
      case "expr":
        return {
          type: attr.type,
          name,
          span,
          nameSpan: at(required(found.nameAt, "Named attribute has a name")),
          valueSpan: at(required(found.valueAt, "Valued attribute has a value"))
        };
      case "bare":
        return { type: "bare", name, span, nameSpan: at(required(found.nameAt, "Bare name")) };
      case "spread":
        return {
          type: "spread",
          name,
          span,
          valueSpan: at(required(found.valueAt, "Spread body"))
        };
    }
  });
}
function attrsAsWritten(node) {
  if (!node.attrSource)
    return;
  let flat = (text2) => text2.replace(/\s+/g, " ").trim();
  return flat(expandShorthand(node.attrSource)) === flat(serializeAttrs(node.props, node.attrOrder)) ? node.attrSource : void 0;
}
function tagFields(attrs, attrsAt) {
  let { attrs: scanned, problem } = scanAttrsChecked(attrs), props = propsOf(scanned), attrOrder = Object.keys(props), spans = attrsAt === void 0 ? {} : { attrSpans: attrSpansOf(scanned, attrsAt) }, source = attrs && (attrs.includes(`
`) || scanned.some((found) => found.shorthand === !0)) ? { attrSource: attrs } : {};
  return { problem, fields: attrOrder.length ? { props, attrOrder, ...spans, ...source } : { props, ...spans, ...source } };
}
function orderedProps(props, order) {
  let entries = Object.entries(props || {});
  if (!order || !order.length)
    return entries;
  let held = new Map(entries), out = [];
  for (let name of order)
    held.has(name) && out.push([name, required(held.get(name), "Ordered attribute exists")]);
  let known = new Set(order);
  for (let [name, attr] of entries)
    known.has(name) || out.push([name, attr]);
  return out;
}
function closed(value) {
  let lineComment = !1;
  for (let position = 0; position < value.length; position++) {
    let skipped = skipStringOrComment(value, position);
    skipped !== position ? (lineComment = value.startsWith("//", position) && !value.includes(`
`, position), position = skipped - 1) : value.charAt(position).trim() !== "" && (lineComment = !1);
  }
  return lineComment ? `${value}
` : value;
}
function serializeAttrs(props, order) {
  let parts = [];
  for (let [name, attr] of orderedProps(props, order))
    attr?.type === "spread" ? parts.push(`{...${closed(attr.value)}}`) : attr === void 0 || attr.type === "bare" ? parts.push(name) : attr.type === "expr" ? parts.push(`${name}={${closed(attr.value)}}`) : parts.push(`${name}="${String(attr.value).replace(/"/g, "&quot;")}"`);
  return parts.length ? " " + parts.join(" ") : "";
}
function required(value, message) {
  return assert(value !== void 0, message), value;
}

// vendor/stacki/electron/parse/astroFence.ts
var OPENING_FENCE = /^\s*---[ \t]*\r?\n/, FENCE_TAIL = /[ \t]*(?:\r?\n|$)/y, LEADING_COMMENTS = /^(?:\s|<!--[\s\S]*?-->)*---/;
function readFence(text2) {
  let start = text2.startsWith("\uFEFF") ? 1 : 0, opening = OPENING_FENCE.exec(text2.slice(start));
  if (opening === null)
    return /^\s*---/.test(text2.slice(start)) ? {
      kind: "unreadable",
      what: "a frontmatter fence the editor cannot read (an unclosed fence, or code on the opening line)",
      near: text2.slice(start).trimStart().slice(0, 40)
    } : LEADING_COMMENTS.test(text2.slice(start)) ? { kind: "unreadable", what: "a frontmatter fence after a comment", near: text2.slice(start, start + 40) } : { kind: "none" };
  let codeStart = start + opening[0].length, codeEnd = firstFenceIn(text2, codeStart);
  if (codeEnd === -1)
    return {
      kind: "unreadable",
      what: "a frontmatter fence the editor cannot read (an unclosed fence, or code on the opening line)",
      near: text2.slice(start, start + 40)
    };
  if (codeEnd > codeStart && text2.charAt(codeEnd - 1) !== `
`)
    return { kind: "unreadable", what: "a --- that shares its line with frontmatter code", near: text2.slice(codeEnd - 20, codeEnd + 20) };
  FENCE_TAIL.lastIndex = codeEnd + 3;
  let tail = FENCE_TAIL.exec(text2);
  return tail === null ? { kind: "unreadable", what: "text after the closing frontmatter fence on its line", near: text2.slice(codeEnd, codeEnd + 40) } : { kind: "fence", codeStart, codeEnd, code: text2.slice(codeStart, codeEnd), length: codeEnd + 3 + tail[0].length };
}
function firstFenceIn(text2, from) {
  for (let position = from; position < text2.length; position++) {
    let skipped = skipStringOrComment(text2, position);
    if (skipped !== position)
      position = skipped - 1;
    else if (text2.startsWith("---", position))
      return position;
  }
  return -1;
}

// vendor/stacki/electron/parse/astroTag.ts
var TAG_NAME = /<([A-Za-z][\w.-]*)/y;
function scanTag(source, start) {
  TAG_NAME.lastIndex = start;
  let match = TAG_NAME.exec(source);
  if (!match)
    return;
  let name = match[1];
  assert(name !== void 0, "A matched tag has a name");
  let attrsAt = start + match[0].length;
  if (/[\s/>]/.test(source.charAt(attrsAt)))
    for (let position = attrsAt; position < source.length; position++) {
      let character = source.charAt(position);
      if (character === ">") {
        let selfClose = source.charAt(position - 1) === "/" ? "/" : "";
        return assert(position >= attrsAt, "A tag ends after its name"), {
          full: source.slice(start, position + 1),
          name,
          attrs: source.slice(attrsAt, position - selfClose.length),
          selfClose,
          end: position + 1
        };
      }
      if (character === "<")
        return;
      if (character === "{") {
        let end = findMatchingBrace(source, position);
        if (end === -1)
          return;
        position = end;
      } else if (character === '"' || character === "'") {
        let end = source.indexOf(character, position + 1);
        if (end === -1)
          return;
        position = end;
      }
    }
}

// vendor/stacki/electron/parse/astroScan.ts
var normalizeHead = (text2) => text2.replace(/\s+/g, " ").trim();
function dedentHead(text2) {
  let lines = text2.split(`
`);
  for (; lines.length && !required(lines[0], "First line exists").trim(); )
    lines.shift();
  if (lines.length < 2)
    return normalizeHead(text2);
  let indents = lines.filter((line) => line.trim()).map((line) => (line.match(/^[ \t]*/)?.[0] ?? "").length), common = Math.min(...indents);
  return lines.map((line) => line.trim() ? line.slice(common) : "").join(`
`).trimEnd();
}
function topLevelStatements(source) {
  let out = [], push = (end) => out.push({ text: source.slice(start, end), at: start }), depth = 0, start = 0;
  for (let i = 0; i < source.length; i++) {
    let skipped = skipStringOrComment(source, i);
    if (skipped !== i) {
      i = skipped - 1;
      continue;
    }
    let character = source.charAt(i);
    "([{".includes(character) ? depth++ : ")]}".includes(character) ? depth-- : (character === ";" && depth === 0 || character === `
` && depth === 0 && /^\s*(const|let|return)\b/.test(source.slice(i))) && (push(i), start = i + 1);
  }
  return source.slice(start).trim() && push(source.length), out;
}
function afterComments(text2) {
  let i = 0;
  for (let pass = 0; pass <= text2.length; pass++) {
    for (; i < text2.length && /\s/.test(text2.charAt(i)); )
      i++;
    if (i >= text2.length)
      return text2.length;
    if (!(text2.charAt(i) === "/" && (text2.charAt(i + 1) === "*" || text2.charAt(i + 1) === "/")))
      return i;
    if (text2.charAt(i + 1) === "*" && text2.indexOf("*/", i + 2) === -1)
      return;
    let skipped = skipStringOrComment(text2, i);
    if (skipped === i)
      return i;
    i = skipped;
  }
  assert(!1, "Comments in front of a statement end within its text");
}
function endsInComment(text2) {
  let inside = !1;
  for (let i = 0; i < text2.length; i++) {
    let skipped = skipStringOrComment(text2, i);
    skipped !== i ? (inside = (text2.startsWith("//", i) || text2.startsWith("/*", i)) && !text2.slice(skipped).trim(), i = skipped - 1) : text2.charAt(i).trim() && (inside = !1);
  }
  return inside;
}
function splitBlockLoopBody(block) {
  let statements = topLevelStatements(block);
  if (!statements.length)
    return;
  let body = [];
  for (let i = 0; i < statements.length; i++) {
    let statement = required(statements[i], "Statement index is in bounds"), lead = statement.text.length - statement.text.trimStart().length, raw = statement.text.trim(), rawAt = statement.at + lead;
    if (!raw)
      continue;
    let at = afterComments(raw);
    if (at === void 0)
      return;
    let after = raw.slice(at), text2 = after.trim();
    if (!text2) {
      body.push(raw);
      continue;
    }
    if (/^return\b/.test(text2)) {
      if (statements.slice(i + 1).some((rest) => rest.text.trim()))
        return;
      let markup = text2.slice(6);
      if (/^[ \t]*(?:\r|\n)/.test(markup))
        return;
      let markupAt = rawAt + at + (after.length - after.trimStart().length) + 6, trimLeft = () => {
        let space = markup.length - markup.trimStart().length;
        markup = markup.trim(), markupAt += space;
      };
      for (trimLeft(); markup.startsWith("(") && findMatchingParen(markup, 0) === markup.length - 1; )
        markup = markup.slice(1, -1), markupAt += 1, trimLeft();
      return markup.startsWith("<") ? (at && body.push(raw.slice(0, at).trim()), { body, markup, at: markupAt }) : void 0;
    }
    if (!/^(const|let)\s/.test(text2))
      return;
    body.push(endsInComment(raw) ? raw : raw.replace(/;*$/, ";"));
  }
}
var blockHead = (head) => head.replace(/\($/, "{");
function topLevelOps(source) {
  let out = [], depth = 0;
  for (let i = 0; i < source.length; i++) {
    let skipped = skipStringOrComment(source, i);
    if (skipped !== i) {
      i = skipped - 1;
      continue;
    }
    let ch = source.charAt(i);
    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      continue;
    }
    if (ch === "<") {
      let tag = scanTag(source, i);
      if (tag) {
        i = tag.end - 1;
        continue;
      }
    }
    depth === 0 && (ch === "?" ? source.charAt(i + 1) === "?" || source.charAt(i + 1) === "." ? i++ : out.push({ op: "?", at: i }) : ch === ":" ? out.push({ op: ":", at: i }) : ch === "&" && source.charAt(i + 1) === "&" && (out.push({ op: "&&", at: i }), i++));
  }
  return out;
}
var NOT_SEARCHED = -2, NOT_YET_FOUND = { lt: NOT_SEARCHED, br: NOT_SEARCHED, next: NOT_SEARCHED };
function nextDelimiters(template, from, previous) {
  let lt = nextIndexOf(template, "<", from, previous.lt), br = nextIndexOf(template, "{", from, previous.br);
  return lt === -1 ? { lt, br, next: br } : br === -1 ? { lt, br, next: lt } : { lt, br, next: Math.min(lt, br) };
}
function nextIndexOf(template, needle, from, previous) {
  return assert(previous >= NOT_SEARCHED, "A cached index is a position, -1, or not searched"), previous === -1 ? -1 : previous >= from ? (assert(template.charAt(previous) === needle, "A cached index still names its needle"), previous) : template.indexOf(needle, from);
}
function findMatchingClose(template, from, name) {
  let depth = 1, found = NOT_YET_FOUND;
  for (let position = from; position < template.length; ) {
    found = nextDelimiters(template, position, found);
    let next = found.next;
    if (next === -1)
      return -1;
    if (next === found.br) {
      let end = findMatchingBrace(template, next);
      if (end === -1)
        return -1;
      position = end + 1;
    } else if (template.startsWith("<!--", next)) {
      let end = template.indexOf("-->", next + 4);
      position = end === -1 ? template.length : end + 3;
    } else if (template.startsWith(`</${name}`, next)) {
      let suffix = next + name.length + 2, close = /^\s*>/.exec(template.slice(suffix));
      if (close) {
        if (depth--, depth === 0)
          return next;
        position = suffix + close[0].length;
      } else
        position = suffix;
    } else {
      let tag = scanTag(template, next);
      if (!tag) {
        position = next + 1;
        continue;
      }
      if (position = tag.end, tag.selfClose === "/")
        continue;
      if (tag.name === name)
        depth++;
      else if (RAW_ELEMENTS.has(tag.name)) {
        let close = template.indexOf(`</${tag.name}`, position), end = close === -1 ? -1 : template.indexOf(">", close);
        position = end === -1 ? template.length : end + 1;
      }
    }
  }
  return -1;
}
function findMatchingFragmentClose(template, from) {
  let depth = 1;
  for (let position = from; position < template.length; )
    if (template.charAt(position) === "{") {
      let end = findMatchingBrace(template, position);
      if (end === -1)
        return -1;
      position = end + 1;
    } else if (template.startsWith("<!--", position)) {
      let end = template.indexOf("-->", position + 4);
      if (end === -1)
        return -1;
      position = end + 3;
    } else if (template.startsWith("</>", position)) {
      if (--depth === 0)
        return position;
      position += 3;
    } else if (template.startsWith("<>", position))
      depth++, position += 2;
    else if (template.charAt(position) === "<") {
      let tag = scanTag(template, position);
      if (!tag) {
        position++;
        continue;
      }
      if (position = tag.end, RAW_ELEMENTS.has(tag.name) && tag.selfClose !== "/") {
        let close = template.indexOf(`</${tag.name}`, position), end = close === -1 ? -1 : template.indexOf(">", close);
        if (end === -1)
          return -1;
        position = end + 1;
      }
    } else
      position++;
  return -1;
}

// vendor/stacki/electron/parse/astroParseState.ts
function makeBranch(name, children, raw, base) {
  let branch = { id: makeId(), kind: "branch", name, children };
  if (base !== void 0) {
    let start = base + (raw.length - raw.trimStart().length);
    branch.start = start, branch.end = Math.max(start, base + raw.trimEnd().length);
  }
  return branch;
}
var branchIsMarkup = (kids) => (kids || []).some((kid) => kid.kind !== "expr" && kid.kind !== "text");
function exprBranch(raw, base = void 0) {
  let text2 = String(raw), expression = text2.trimStart(), at = base === void 0 ? void 0 : base + (text2.length - expression.length);
  for (expression = expression.trimEnd(); expression.startsWith("(") && findMatchingParen(expression, 0) === expression.length - 1; ) {
    let inner = expression.slice(1, -1), trimmed = inner.trimStart();
    at !== void 0 && (at += 1 + (inner.length - trimmed.length)), expression = trimmed.trimEnd();
  }
  if (!expression || expression.startsWith("<"))
    return;
  let node = { id: makeId(), kind: "expr", value: `{${expression}}` };
  return at !== void 0 && (node.start = at, node.end = at + expression.length), [node];
}
var parseState = {
  lastBail: void 0,
  depth: 0,
  nodes: 0,
  conditions: 0
};
function bail(nodes, template, at, what) {
  return parseState.lastBail || (parseState.lastBail = { what, near: template.slice(at, at + 60) }), { nodes, clean: !1 };
}
function resetParseBail() {
  parseState.lastBail = void 0;
}
function parseTemplateAt(node, base, from, to) {
  return base === void 0 ? node : { ...node, start: base + from, end: base + to };
}
function parseTemplateWithinBounds(nodes) {
  if (nodes.length > LIMITS.treeNodesMax)
    return !1;
  let pending = nodes.map((node) => ({ node, depth: 0 }));
  for (let index = 0; index < pending.length; index++) {
    let entry = required(pending[index], "Template traversal index is in bounds");
    if (entry.depth > LIMITS.treeDepthMax)
      return !1;
    if (entry.node.children) {
      if (pending.length + entry.node.children.length > LIMITS.treeNodesMax)
        return !1;
      for (let node of entry.node.children)
        pending.push({ node, depth: entry.depth + 1 });
    }
  }
  return !0;
}

// vendor/stacki/shared/page/htmlText.ts
var NAMED = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\xA0",
  copy: "\xA9",
  reg: "\xAE",
  trade: "\u2122",
  deg: "\xB0",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  minus: "\u2212",
  shy: "\xAD",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  sbquo: "\u201A",
  bdquo: "\u201E",
  laquo: "\xAB",
  raquo: "\xBB",
  lsaquo: "\u2039",
  rsaquo: "\u203A",
  times: "\xD7",
  divide: "\xF7",
  plusmn: "\xB1",
  frac12: "\xBD",
  frac14: "\xBC",
  frac34: "\xBE",
  sup1: "\xB9",
  sup2: "\xB2",
  sup3: "\xB3",
  micro: "\xB5",
  middot: "\xB7",
  bull: "\u2022",
  dagger: "\u2020",
  Dagger: "\u2021",
  sect: "\xA7",
  para: "\xB6",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  euro: "\u20AC",
  pound: "\xA3",
  yen: "\xA5",
  cent: "\xA2",
  curren: "\xA4",
  larr: "\u2190",
  uarr: "\u2191",
  rarr: "\u2192",
  darr: "\u2193",
  harr: "\u2194",
  ne: "\u2260",
  le: "\u2264",
  ge: "\u2265",
  asymp: "\u2248",
  infin: "\u221E",
  radic: "\u221A",
  sum: "\u2211",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200C",
  zwj: "\u200D",
  eacute: "\xE9",
  egrave: "\xE8",
  ecirc: "\xEA",
  agrave: "\xE0",
  aacute: "\xE1",
  acirc: "\xE2",
  ouml: "\xF6",
  ooslash: "\xF8",
  oslash: "\xF8",
  uuml: "\xFC",
  auml: "\xE4",
  ccedil: "\xE7",
  ntilde: "\xF1",
  szlig: "\xDF",
  aring: "\xE5",
  ae: "\xE6",
  oelig: "\u0153"
}, ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;
function decodeEntities(text2) {
  return String(text2 ?? "").replace(ENTITY, (whole, body) => {
    if (body.charAt(0) === "#") {
      let second = body.charAt(1), code = second === "x" || second === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 1 || code > 1114111)
        return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    if (Object.hasOwn(NAMED, body))
      return NAMED[body] ?? whole;
    let lower = body.toLowerCase();
    return Object.hasOwn(NAMED, lower) ? NAMED[lower] ?? whole : whole;
  });
}
function encodeText(text2) {
  return String(text2 ?? "").replace(/[&<>{}    ‌‍­]/g, (character) => {
    if (character === "&")
      return "&amp;";
    if (character === "<")
      return "&lt;";
    if (character === ">")
      return "&gt;";
    let code = character.codePointAt(0);
    return code === void 0 ? character : `&#${code};`;
  });
}
function collapseWhitespace(text2) {
  return text2.replace(/\s{2,}|[^\S ]/g, " ").trim();
}
function collapseText(raw) {
  return (/^\s/.test(raw) ? " " : "") + collapseWhitespace(raw) + (/\s$/.test(raw) ? " " : "");
}
function textValue(raw) {
  let collapsed = collapseText(raw);
  return collapsed.includes("&") ? decodeEntities(collapsed) : collapsed;
}

// vendor/stacki/electron/parse/astroMapSerialize.ts
function serializeMapCallback(node, render) {
  let parts = node.bodyParts;
  assert(parts !== void 0, "General callbacks carry their JavaScript parts"), assert(parts.length === node.children.length + 1, "Every markup root has surrounding code"), assert(parts.length <= LIMITS.treeNodesMax + 1, "Callback serialization is bounded"), assert(node.head.endsWith("("), "A normalized callback head ends with its body placeholder");
  let output = ["{", (node.headSource && normalizeHead(node.headSource) === node.head ? node.headSource : node.head).slice(0, -1)];
  for (let index = 0; index < parts.length; index++) {
    let part = parts[index];
    assert(part !== void 0, "Callback part index is in bounds"), output.push(part);
    let child = node.children[index];
    child !== void 0 && output.push(render(child, index));
  }
  return output.join("");
}

// vendor/stacki/electron/parse/astroSerialize.ts
var PRINT_INDENT_UNIT = "  ", INLINE_TAGS = /* @__PURE__ */ new Set(["strong", "em", "b", "i", "sup", "sub", "code", "a", "span", "br", "small", "mark", "u", "s"]);
function isSimpleExpr(node) {
  return node.kind === "expr" && /^\{[^{}]*\}$/.test(node.value) && !node.value.includes("<");
}
function isInlineRun(nodes, depth) {
  return depth > LIMITS.treeDepthMax ? !1 : nodes.length > 0 && nodes.every(
    (node) => node.kind === "text" || isSimpleExpr(node) || node.kind === "element" && INLINE_TAGS.has(node.name.toLowerCase()) && (node.children === void 0 || node.children.length === 0 || isInlineRun(node.children, depth + 1))
  );
}
function inlineString(nodes, depth) {
  assert(depth <= LIMITS.treeDepthMax, "inlineString: depth limit");
  let out = "";
  for (let node of nodes)
    node.kind === "text" ? out += textOut(node) : node.kind === "expr" ? out += node.value : node.kind !== "element" ? assert(!1, "Inline runs contain only text, expressions, and elements") : node.children === void 0 ? out += `<${node.name}${serializeAttrs(node.props, node.attrOrder)} />` : node.children.length === 0 ? out += `<${node.name}${serializeAttrs(node.props, node.attrOrder)}></${node.name}>` : out += `<${node.name}${serializeAttrs(node.props, node.attrOrder)}>` + inlineString(node.children, depth + 1) + `</${node.name}>`;
  return out;
}
function tagInlineRun(nodes, path3, { atRoot, depth }) {
  return assert(depth <= LIMITS.treeDepthMax, "tagInlineRun: depth limit"), nodes.map((node, i) => {
    if (node.kind !== "element")
      return node;
    let childPath = `${path3}.${i}`, forwards = Object.keys(node.props || {}).some((key) => key.startsWith("...")), pathProp = atRoot || forwards ? {
      type: "expr",
      value: `[${JSON.stringify(childPath)}, Astro.props["data-avb-p"]].filter(Boolean).join(" ")`
    } : { type: "string", value: childPath }, tagged = {
      ...node,
      source: void 0,
      // As on a block element, the explicit marker precedes a spread: HTML
      // keeps the first duplicate attribute, which must name this child too.
      props: forwards ? { "data-avb-p": pathProp, ...node.props } : { ...node.props, "data-avb-p": pathProp },
      attrOrder: forwards && node.attrOrder ? ["data-avb-p", ...node.attrOrder] : node.attrOrder
    };
    return Array.isArray(node.children) && node.children.length > 0 && (tagged.children = tagInlineRun(node.children, childPath, { atRoot: !1, depth: depth + 1 })), tagged;
  });
}
function textAsWritten(node) {
  return node.source ? textValue(node.source) === node.value ? node.source : void 0 : encodeText(node.value);
}
function textOut(node) {
  let source = node.source;
  return source !== void 0 && textValue(source) === node.value ? collapseText(source) : encodeText(node.value);
}
function reindentRun(source, indent) {
  let lines = source.split(`
`), base = required(lines[lines.length - 1], "Split source has a final line");
  if (lines.length < 2 || !/^[ \t]*$/.test(base) || base === indent)
    return source;
  let shift;
  if (indent.startsWith(base)) {
    let add = indent.slice(base.length);
    shift = (line) => line.trim() ? add + line : line;
  } else if (base.startsWith(indent)) {
    let drop = base.slice(indent.length);
    shift = (line) => line.startsWith(drop) ? line.slice(drop.length) : line;
  } else
    return source;
  return [lines[0], ...lines.slice(1, -1).map(shift), indent].join(`
`);
}
var squash = (text2) => text2.replace(/\s+/g, "");
function inlineRunUnchanged(node, depth) {
  return !!node.source && node.source.includes(`
`) && // Compared in the file's own spelling on both sides: inlineString writes
  // `&rsquo;` back as `&rsquo;` for a node nobody has touched, and decoding
  // one side would call every hand-wrapped run with an entity in it changed
  // — reflowing the paragraph onto one line for having been looked at.
  squash(collapseText(node.source)) === squash(inlineString(node.children ?? [], depth + 1));
}
function blockAsWritten(node, indent, depth, unit) {
  if (!node.source)
    return;
  let probe = { ...node, source: void 0, blankBefore: 0, blankAfter: 0 }, rebuilt = [];
  serializeNode(probe, "", rebuilt, depth, unit);
  let flat = (text2) => text2.replace(/[\s(){}]+/g, "").trim(), comparedSource = node.kind === "map" && node.children.length === 1 && node.children[0]?.kind === "cond" ? node.source.replace(/,(\s*\)\s*\})$/, "$1") : node.source;
  if (flat(rebuilt.join(`
`)) !== flat(comparedSource))
    return;
  let sourceLines = node.source.split(`
`), base = (required(sourceLines[sourceLines.length - 1], "Source has a final line").match(/^[ \t]*/) || [""])[0];
  return sourceLines.map((line, i) => i === 0 ? indent + line : line.startsWith(base) ? indent + line.slice(base.length) : line);
}
function serializeCondBody(node, indent, lines, depth, unit) {
  assert(depth <= LIMITS.treeDepthMax, "serializeCondBody: depth limit");
  let kidsOf = (i) => node.children?.[i]?.children || [], thenKids = kidsOf(0), elseKids = node.op === "&&" ? void 0 : kidsOf(1), chained = elseKids && elseKids.length === 1 && elseKids[0]?.kind === "cond" ? elseKids[0] : void 0, tail = elseKids === void 0 ? "" : chained ? " :" : elseKids.length ? " : (" : " : null", head = `${node.test} ${node.op === "&&" ? "&&" : "?"} `, branchOut = (kids, at) => {
    if (kids.length === 1 && kids[0]?.kind === "expr") {
      String(kids[0].value ?? "").trim().replace(/^\{/, "").replace(/\}$/, "").split(`
`).forEach((line, i) => lines.push(i === 0 ? at + line : line));
      return;
    }
    for (let child of kids)
      serializeNode(child, at, lines, depth + 2, unit);
  };
  thenKids.length ? (lines.push(indent + head + "("), branchOut(thenKids, indent + unit), lines.push(indent + ")" + tail)) : lines.push(indent + head + "null" + tail), chained ? serializeCondBody(chained, indent, lines, depth + 2, unit) : elseKids && elseKids.length && (branchOut(elseKids, indent + unit), lines.push(indent + ")"));
}
function serializeNode(node, indent, lines, depth, unit = PRINT_INDENT_UNIT) {
  if (assert(depth <= LIMITS.treeDepthMax, "serializeNode: depth limit"), node.kind !== "chunk-group") {
    for (let i = 0; i < (node.blankBefore || 0); i++)
      lines.push("");
    if (node.chunkFile || node.chunkAggregate) {
      lines.push(`${indent}<${node.name}${serializeAttrs(node.props, node.attrOrder)} />`);
      return;
    }
    switch (node.kind) {
      case "text":
        return serializeNodeText(node, indent, lines);
      case "expr": {
        let exprLines = node.value.split(`
`);
        lines.push(indent + exprLines[0]);
        for (let i = 1; i < exprLines.length; i++)
          lines.push(required(exprLines[i], "Expression line index is in bounds"));
        return;
      }
      case "map":
        return serializeNodeMap(node, indent, lines, depth, unit);
      case "cond": {
        let kept = blockAsWritten(node, indent, depth, unit);
        if (kept) {
          for (let line of kept)
            lines.push(line);
          return;
        }
        lines.push(indent + "{"), serializeCondBody(node, indent + unit, lines, depth, unit), lines.push(indent + "}");
        return;
      }
      case "branch":
        for (let child of node.children || [])
          serializeNode(child, indent, lines, depth + 1, unit);
        return;
      case "comment":
        lines.push(node.jsx ? `${indent}{/*${node.value}*/}` : `${indent}<!--${node.value}-->`);
        return;
      case "raw-line":
        lines.push(indent + node.value);
        return;
      case "raw":
        return serializeNodeRaw(node, indent, lines);
      case "component":
      case "element":
        return serializeNodeElement(node, indent, lines, depth, unit);
    }
  }
}
function serializeNodeCallback(node, indent, lines, depth, unit) {
  let text2 = serializeMapCallback(node, (child) => {
    let rendered = [];
    return serializeNode(child, "", rendered, depth + 1, unit), rendered.join(`
`);
  });
  lines.push(indent + text2);
}
function serializeNodeText(node, indent, lines) {
  let written = textAsWritten(node);
  if (written === void 0 || !written.includes(`
`)) {
    lines.push(indent + textOut(node).replace(/^ +| +$/g, ""));
    return;
  }
  let body = written.replace(/^[ \t]*\r?\n/, "").replace(/\s+$/, ""), [first, ...more] = body.split(`
`);
  lines.push(indent + required(first, "Split text has a first line").replace(/^[ \t]+/, ""));
  for (let line of more)
    lines.push(line);
}
function serializeNodeMap(node, indent, lines, depth, unit) {
  let keptMap = blockAsWritten(node, indent, depth, unit);
  if (keptMap) {
    for (let line of keptMap)
      lines.push(line);
    return;
  }
  if (node.bodyParts !== void 0)
    return serializeNodeCallback(node, indent, lines, depth, unit);
  if (lines.push(indent + "{"), node.body && node.body.length) {
    lines.push(indent + unit + blockHead(node.head));
    for (let line of node.body)
      lines.push(indent + unit + unit + line);
    lines.push(indent + "    return ("), serializeLoopBody(node, indent + unit + unit + unit, lines, depth, unit), lines.push(indent + "    );"), lines.push(indent + "  })"), lines.push(indent + "}");
    return;
  }
  let conditional = node.children.length === 1 ? node.children[0] : void 0;
  if (conditional?.kind === "cond") {
    lines.push(indent + unit + node.head), serializeCondBody(conditional, indent + unit + unit, lines, depth + 1, unit), lines.push(indent + "  ))"), lines.push(indent + "}");
    return;
  }
  if (node.bare) {
    lines.push(indent + unit + node.head.replace(/\($/, "").trimEnd()), serializeLoopBody(node, indent + unit + unit, lines, depth, unit), lines.push(indent + "  )"), lines.push(indent + "}");
    return;
  }
  let kept = node.headSource && normalizeHead(node.headSource) === node.head ? node.headSource : void 0, inner = "";
  if (kept) {
    let headLines = kept.split(`
`);
    for (let line of headLines)
      lines.push(line ? indent + unit + line : "");
    inner = required(headLines[headLines.length - 1], "Loop head has a final line").match(/^[ \t]*/)?.[0] ?? "";
  } else
    lines.push(indent + unit + node.head);
  serializeLoopBody(node, indent + unit + inner + unit, lines, depth, unit), lines.push(indent + unit + inner + "))"), lines.push(indent + "}");
}
function serializeLoopBody(node, indent, lines, depth, unit) {
  let children = node.children || [];
  if (children.length === 0) {
    lines.push(indent + "null");
    return;
  }
  let wrapper = loopBodyWrapper(node);
  if (wrapper === void 0) {
    for (let child of children)
      serializeNode(child, indent, lines, depth + 1, unit);
    return;
  }
  lines.push(indent + (wrapper === "<>" ? "<>" : "<Fragment>"));
  for (let child of children)
    serializeNode(child, indent + unit, lines, depth + 1, unit);
  lines.push(indent + (wrapper === "<>" ? "</>" : "</Fragment>"));
}
function loopBodyWrapper(node) {
  return node.fragment !== void 0 ? node.fragment : (assert(node.children.length > 0, "loopBodyWrapper: an empty loop writes null, not a wrapper"), node.children.every(isLoopTag) ? void 0 : "<>");
}
function isLoopTag(child) {
  switch (child.kind) {
    case "element":
    case "component":
    case "raw":
      return !0;
    case "comment":
      return child.jsx !== !0;
    case "text":
    case "expr":
    case "raw-line":
    case "map":
    case "cond":
    case "branch":
    case "chunk-group":
      return !1;
    default:
      return child;
  }
}
function serializeNodeRaw(node, indent, lines) {
  let open = `${indent}<${node.name}${serializeAttrs(node.props, node.attrOrder)}>`, inner = node.inner.replace(/^\r?\n/, "").replace(/\r?\n[ \t]*$/, "");
  if (!inner.trim()) {
    lines.push(`${open}</${node.name}>`);
    return;
  }
  lines.push(open);
  for (let line of inner.split(`
`))
    lines.push(line);
  lines.push(`${indent}</${node.name}>`);
}
function serializeNodeElement(node, indent, lines, depth, unit) {
  let kept = attrsAsWritten(node), attrs = kept === void 0 ? serializeAttrs(node.props, node.attrOrder) : kept, tagName = node.shorthand && node.name === "Fragment" && !attrs ? "" : node.name, closeTag = node.closeSource && node.closeSource.startsWith(`</${tagName}`) ? node.closeSource : `</${tagName}>`, openTag = (close) => {
    let tail = kept !== void 0 && /\s$/.test(attrs) ? close.replace(/^ /, "") : close, text2 = `${indent}<${tagName}${attrs}${tail}`;
    for (let line of text2.split(`
`))
      lines.push(line);
  };
  if (node.children === void 0) {
    openTag(node.tightClose ? "/>" : " />");
    return;
  }
  if (node.children.length > 0 && isInlineRun(node.children, depth + 1)) {
    if (inlineRunUnchanged(node, depth)) {
      openTag(`>${reindentRun(required(node.source, "Unchanged inline run has source"), indent)}` + closeTag);
      return;
    }
    openTag(`>${inlineString(node.children, depth + 1)}${closeTag}`);
    return;
  }
  if (node.children.length === 0) {
    let inner = node.source !== void 0 && node.source.trim() === "" ? node.source : "";
    openTag(`>${inner ? reindentRun(inner, indent) : ""}${closeTag}`);
    return;
  }
  openTag(">");
  for (let child of node.children)
    serializeNode(child, indent + unit, lines, depth + 1, unit);
  for (let i = 0; i < (node.blankAfter || 0); i++)
    lines.push("");
  for (let line of `${indent}${closeTag}`.split(`
`))
    lines.push(line);
}

// vendor/stacki/electron/parse/astroMapSyntax.ts
var import_typescript = __toESM(require("typescript"), 1);
function readMapSyntax(source) {
  if (!source.includes("map") && !source.includes("flatMap"))
    return;
  assert(source.length <= LIMITS.ipcFieldCharsMax, "Map source is bounded by its template");
  let syntax = mapSourceFile(source);
  if (syntax === void 0)
    return;
  let statement = syntax.statements[0];
  if (!statement || !import_typescript.default.isExpressionStatement(statement))
    return;
  let call = unwrapExpression(statement.expression);
  if (!import_typescript.default.isCallExpression(call))
    return;
  let method = mapAccessName(call.expression);
  if (method !== "map" && method !== "flatMap")
    return;
  let argument = call.arguments[0];
  if (!argument)
    return;
  let callback = unwrapExpression(argument), body = import_typescript.default.isArrowFunction(callback) || import_typescript.default.isFunctionExpression(callback) ? callback.body : callback, markup = mapMarkup(body, syntax);
  if (markup === void 0 || !mapDiagnosticsAccepted(syntax, markup, siblingRunSpans(body, syntax)))
    return;
  let bodyStart = body.getStart(syntax) - 1;
  if (assert(bodyStart >= 0, "Callback body follows the synthetic opening parenthesis"), bodyStart + 1 > LIMITS.attrCharsMax)
    return;
  let parts = [], position = bodyStart;
  for (let span of markup)
    assert(span.start >= position, "Callback markup roots are ordered and disjoint"), parts.push(source.slice(position, span.start)), position = span.end;
  return parts.push(source.slice(position) + "}"), {
    // Compact readers own map syntax only. Preserve flatMap's callback scopes
    // verbatim, including nested map calls that must not become the outer head.
    form: method === "map" ? mapForm(callback, markup.length) : "general",
    head: source.slice(0, bodyStart) + "(",
    parts,
    markup
  };
}
function mapSourceFile(source) {
  try {
    return import_typescript.default.createSourceFile("callback.tsx", `(${source})`, import_typescript.default.ScriptTarget.Latest, !0, import_typescript.default.ScriptKind.TSX);
  } catch (error) {
    if (error instanceof RangeError)
      return;
    throw error;
  }
}
function mapForm(callback, markupCount) {
  if (!import_typescript.default.isArrowFunction(callback))
    return "general";
  if (import_typescript.default.isBlock(callback.body))
    return "block";
  let body = unwrapExpression(callback.body);
  return isMarkup(body) ? "markup" : markupCount > 0 && conditionalMarkupCount(body, 0) === markupCount ? "conditional" : "general";
}
function conditionalMarkupCount(expression, depth) {
  if (depth >= LIMITS.treeDepthMax)
    return 0;
  let node = unwrapExpression(expression);
  if (isJsxRoot(node))
    return 1;
  let run = siblingRun(node);
  return run !== void 0 ? run.length : import_typescript.default.isConditionalExpression(node) ? conditionalMarkupCount(node.whenTrue, depth + 1) + conditionalMarkupCount(node.whenFalse, depth + 1) : import_typescript.default.isBinaryExpression(node) && node.operatorToken.kind === import_typescript.default.SyntaxKind.AmpersandAmpersandToken ? conditionalMarkupCount(node.right, depth + 1) : 0;
}
function mapDiagnosticsAccepted(syntax, markup, runs) {
  let holes = [...markup, ...runs], diagnostics = Reflect.get(syntax, "parseDiagnostics");
  return !Array.isArray(diagnostics) || diagnostics.length > LIMITS.treeNodesMax ? !1 : diagnostics.every((diagnostic) => {
    if (typeof diagnostic != "object" || diagnostic === null)
      return !1;
    let start = Reflect.get(diagnostic, "start"), length = Reflect.get(diagnostic, "length");
    return typeof start != "number" || typeof length != "number" ? !1 : holes.some((span) => start - 1 >= span.start && start + length - 1 <= span.end);
  });
}
function unwrapExpression(expression) {
  let current = expression;
  for (let depth = 0; depth <= LIMITS.treeDepthMax; depth++) {
    if (!import_typescript.default.isParenthesizedExpression(current))
      return current;
    current = current.expression;
  }
  return current;
}
function mapAccessName(expression) {
  if (import_typescript.default.isPropertyAccessExpression(expression))
    return expression.name.text;
  if (import_typescript.default.isElementAccessExpression(expression)) {
    let name = expression.argumentExpression;
    if (import_typescript.default.isStringLiteral(name))
      return name.text;
  }
}
function mapMarkup(body, syntax) {
  let pending = [{ node: body, depth: 0 }], roots = [];
  for (let index = 0; index < pending.length; index++) {
    let entry = pending[index];
    if (assert(entry !== void 0, "Syntax traversal index is in bounds"), entry.depth > LIMITS.treeDepthMax)
      return;
    let node = entry.node;
    if (isJsxRoot(node))
      roots.push({ start: node.getStart(syntax) - 1, end: node.end - 1 });
    else if (import_typescript.default.isExpression(node) && siblingRun(node) !== void 0)
      for (let sibling of required2(siblingRun(node)))
        roots.push({ start: sibling.getStart(syntax) - 1, end: sibling.end - 1 });
    else if (node.forEachChild((child) => {
      if (pending.length === LIMITS.treeNodesMax)
        return !0;
      pending.push({ node: child, depth: entry.depth + 1 });
    }))
      return;
  }
  return assert(roots.length <= LIMITS.treeNodesMax, "Markup roots are bounded by syntax nodes"), roots.sort((left, right) => left.start - right.start);
}
function isJsxRoot(node) {
  return import_typescript.default.isJsxElement(node) || import_typescript.default.isJsxSelfClosingElement(node) || import_typescript.default.isJsxFragment(node);
}
function isMarkup(expression) {
  return isJsxRoot(expression) ? !0 : siblingRun(expression) !== void 0;
}
function siblingRun(expression) {
  let siblings = [], current = expression;
  for (let index = 0; index < LIMITS.treeNodesMax && import_typescript.default.isBinaryExpression(current); index++) {
    if (current.operatorToken.kind !== import_typescript.default.SyntaxKind.CommaToken || current.operatorToken.pos !== current.operatorToken.end || !isJsxRoot(current.left))
      return;
    siblings.push(current.left), current = current.right;
  }
  if (siblings.length !== 0 && isJsxRoot(current))
    return siblings.push(current), assert(siblings.length >= 2, "A sibling run has at least two roots"), siblings;
}
function siblingRunSpans(body, syntax) {
  let spans = [], pending = [{ node: body, depth: 0 }];
  for (let index = 0; index < pending.length; index++) {
    let entry = pending[index];
    if (assert(entry !== void 0, "Sibling-run traversal index is in bounds"), entry.depth > LIMITS.treeDepthMax)
      continue;
    let run = import_typescript.default.isExpression(entry.node) ? siblingRun(entry.node) : void 0;
    if (run !== void 0) {
      let first = required2(run[0]), last = required2(run[run.length - 1]);
      spans.push({ start: first.getStart(syntax) - 1, end: last.end - 1 });
    } else
      entry.node.forEachChild((child) => {
        pending.length < LIMITS.treeNodesMax && pending.push({ node: child, depth: entry.depth + 1 });
      });
  }
  return spans;
}
function required2(value) {
  return assert(value !== void 0, "A sibling run index is in bounds"), value;
}

// vendor/stacki/electron/parse/astroTemplate.ts
function tryParseMap(exprText, base = void 0) {
  let inner = exprText.slice(1, -1), syntax = readMapSyntax(inner);
  if (!syntax)
    return;
  let inBase = base === void 0 ? void 0 : base + 1;
  return parseMapEmpty(syntax) || parseMapSimple(inner, syntax, inBase) || parseMapCallback(inner, syntax, inBase);
}
function parseMapEmpty(syntax) {
  let [part] = syntax.parts;
  if (!(syntax.markup.length !== 0 || syntax.parts.length !== 1 || part === void 0) && /^\(?\s*null\s*\)\s*\)\s*\}?\s*$/.test(part))
    return { id: makeId(), kind: "map", head: normalizeHead(syntax.head), headSource: syntax.head, children: [] };
}
function parseMapSimple(inner, syntax, base) {
  switch (syntax.form) {
    case "conditional":
      return tryParseConditionalMap(inner, base);
    case "markup":
      return tryParseConciseMap(inner, base) || tryParseBareMap(inner, base);
    case "block":
      return syntax.markup.length === 1 ? tryParseBlockMap(inner, base) : void 0;
    case "general":
      return;
    default:
      return syntax.form;
  }
}
function parseMapCallback(inner, syntax, base) {
  let children = [], count2 = parseState.nodes, previousBail = parseState.lastBail;
  for (let span of syntax.markup) {
    let parsed = parseTemplate(inner.slice(span.start, span.end), base === void 0 ? void 0 : base + span.start);
    if (!parsed.clean || parsed.nodes.length !== 1) {
      parseState.nodes = count2, parseState.lastBail = previousBail;
      return;
    }
    children.push(required(parsed.nodes[0], "A callback markup root parsed as one node"));
  }
  return assert(syntax.parts.length === children.length + 1, "Callback code surrounds each markup root"), {
    id: makeId(),
    kind: "map",
    head: normalizeHead(syntax.head),
    headSource: syntax.head,
    bodyParts: syntax.parts,
    children
  };
}
function tryParseConditionalMap(inner, base = void 0) {
  let arrow = inner.match(/^([\s\S]*?\.map\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*)/);
  if (!arrow)
    return;
  let headRaw = required(arrow[1], "Conditional loop header capture"), mapOpen = headRaw.lastIndexOf(".map(") + 4, mapClose = findMatchingParen(inner, mapOpen);
  if (mapClose === -1 || inner.slice(mapClose + 1).trim())
    return;
  let body = inner.slice(headRaw.length, mapClose).replace(/,\s*$/, ""), child = conditionalMapBody(body, base === void 0 ? void 0 : base + headRaw.length);
  if (child)
    return {
      id: makeId(),
      kind: "map",
      head: normalizeHead(headRaw + "("),
      children: [child]
    };
}
function conditionalMapBody(raw, base) {
  let text2 = raw.trim(), at = base === void 0 ? void 0 : base + (raw.length - raw.trimStart().length);
  for (; text2.startsWith("(") && findMatchingParen(text2, 0) === text2.length - 1; ) {
    let inner = text2.slice(1, -1), trimmed = inner.trimStart();
    at !== void 0 && (at += 1 + (inner.length - trimmed.length)), text2 = trimmed.trimEnd();
  }
  if (text2.startsWith("<"))
    return;
  let count2 = parseState.nodes, previousBail = parseState.lastBail, child = parseCondSource(text2, at);
  if (!child) {
    parseState.nodes = count2, parseState.lastBail = previousBail;
    return;
  }
  return at !== void 0 && (child.start = at, child.end = at + text2.length), child;
}
function tryParseConciseMap(inner, base = void 0) {
  let arrow = inner.match(/^([\s\S]*?\.map\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\()/);
  if (!arrow)
    return;
  let headRaw = required(arrow[1], "Loop header capture"), openIndex = arrow[0].length - 1, closeIndex = findMatchingParen(inner, openIndex);
  if (closeIndex === -1 || !/^\s*\)\s*$/.test(inner.slice(closeIndex + 1)))
    return;
  let body = inner.slice(openIndex + 1, closeIndex);
  if (!body.trimStart().startsWith("<"))
    return;
  let parsed = parseTemplate(body, base === void 0 ? void 0 : base + openIndex + 1);
  if (parsed.clean)
    return {
      id: makeId(),
      kind: "map",
      head: normalizeHead(headRaw),
      // e.g. "stats.map((stat) => ("
      // A chain written across several lines — `posts` / `.sort(…)` / `.map(…)` —
      // is one line once normalized, and writing that back would flatten how the
      // page was written. Keep the original layout to re-emit while the head
      // still says the same thing; see serializeNode's 'map' case.
      headSource: dedentHead(headRaw),
      ...unwrappedLoopBody(body, parsed.nodes)
    };
}
function unwrappedLoopBody(body, nodes) {
  let significant = nodes.filter((node) => node.kind !== "comment"), only = significant.length === 1 && nodes.length === 1 ? significant[0] : void 0;
  if (only === void 0 || only.kind !== "component" || only.name !== "Fragment")
    return { children: nodes };
  if (Object.keys(only.props ?? {}).length > 0)
    return { children: nodes };
  let fragment = body.trimStart().startsWith("<>") ? "<>" : "Fragment", children = only.children ?? [];
  return assert(children !== nodes, "unwrappedLoopBody: the children are the wrapper\u2019s own"), { children, fragment };
}
function tryParseBareMap(inner, base = void 0) {
  let arrow = inner.match(/^([\s\S]*?\.map\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*)</);
  if (!arrow)
    return;
  let headRaw = required(arrow[1], "Loop header capture"), mapOpen = headRaw.lastIndexOf(".map(") + 4, mapClose = findMatchingParen(inner, mapOpen);
  if (mapClose === -1 || inner.slice(mapClose + 1).trim())
    return;
  let bareBody = inner.slice(headRaw.length, mapClose), parsed = parseTemplate(bareBody, base === void 0 ? void 0 : base + headRaw.length);
  if (parsed.clean)
    return {
      id: makeId(),
      kind: "map",
      head: normalizeHead(headRaw + "("),
      // the Loop editor reads one shape
      bare: !0,
      ...unwrappedLoopBody(bareBody, parsed.nodes)
    };
}
function tryParseBlockMap(inner, base = void 0) {
  let arrow = inner.match(/^([\s\S]*?\.map\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*)\{/);
  if (!arrow)
    return;
  let headRaw = required(arrow[1], "Loop header capture"), openIndex = arrow[0].length - 1, closeIndex = findMatchingBrace(inner, openIndex);
  if (closeIndex === -1 || !/^\s*\)\s*$/.test(inner.slice(closeIndex + 1)))
    return;
  let split = splitBlockLoopBody(inner.slice(openIndex + 1, closeIndex));
  if (!split)
    return;
  let parsed = parseTemplate(split.markup, base === void 0 ? void 0 : base + openIndex + 1 + split.at);
  if (parsed.clean)
    return {
      id: makeId(),
      kind: "map",
      head: normalizeHead(headRaw + "("),
      body: split.body,
      ...unwrappedLoopBody(split.markup, parsed.nodes)
    };
}
function branchNodes(raw, base = void 0) {
  let text2 = String(raw), expression = text2.trimStart(), at = base === void 0 ? void 0 : base + (text2.length - expression.length);
  for (expression = expression.trimEnd(); expression.startsWith("(") && findMatchingParen(expression, 0) === expression.length - 1; ) {
    let inner = expression.slice(1, -1), trimmed = inner.trimStart();
    at !== void 0 && (at += 1 + (inner.length - trimmed.length)), expression = trimmed.trimEnd();
  }
  if (expression === "" || /^(null|undefined|false|''|"")$/.test(expression))
    return [];
  if (expression.startsWith("<")) {
    let saved = parseState.lastBail, parsed = parseTemplate(expression, at);
    if (parsed.clean)
      return parsed.nodes;
    parseState.lastBail = saved;
    return;
  }
  let nested = parseCondSource(expression, at);
  return nested && at !== void 0 && (nested.start = at, nested.end = at + expression.length), nested ? [nested] : void 0;
}
function parseCondSource(source, base = void 0) {
  if (!(parseState.conditions >= LIMITS.treeDepthMax)) {
    parseState.conditions++;
    try {
      return parseCondSourceBody(source, base);
    } finally {
      parseState.conditions--, assert(parseState.conditions >= 0, "Conditional recursion unwinds to its caller");
    }
  }
}
function parseCondSourceBody(source, base) {
  let raw = String(source), text2 = raw.trim();
  if (!text2)
    return;
  let from = base === void 0 ? void 0 : base + (raw.length - raw.trimStart().length), ops = topLevelOps(text2), ternary = ops.find((operator) => operator.op === "?");
  if (ternary) {
    let colon = ops.find((operator) => operator.op === ":" && operator.at > ternary.at);
    if (!colon)
      return;
    let test2 = text2.slice(0, ternary.at).trim();
    if (!test2)
      return;
    let thenRaw2 = text2.slice(ternary.at + 1, colon.at), elseRaw = text2.slice(colon.at + 1), thenKids = branchNodes(thenRaw2, from === void 0 ? void 0 : from + ternary.at + 1), elseKids = branchNodes(elseRaw, from === void 0 ? void 0 : from + colon.at + 1);
    return thenKids && !elseKids && branchIsMarkup(thenKids) ? elseKids = exprBranch(elseRaw, from === void 0 ? void 0 : from + colon.at + 1) : elseKids && !thenKids && branchIsMarkup(elseKids) && (thenKids = exprBranch(thenRaw2, from === void 0 ? void 0 : from + ternary.at + 1)), !thenKids || !elseKids ? void 0 : {
      id: makeId(),
      kind: "cond",
      op: "?",
      test: test2,
      children: [
        makeBranch("then", thenKids, thenRaw2, from === void 0 ? void 0 : from + ternary.at + 1),
        makeBranch("else", elseKids, elseRaw, from === void 0 ? void 0 : from + colon.at + 1)
      ]
    };
  }
  let ands = ops.filter((operator) => operator.op === "&&"), and = ands[ands.length - 1];
  if (!and)
    return;
  let test = text2.slice(0, and.at).trim();
  if (!test)
    return;
  let thenRaw = text2.slice(and.at + 2), thenAt = from === void 0 ? void 0 : from + and.at + 2, kids = branchNodes(thenRaw, thenAt);
  if (!(!kids || !kids.length))
    return {
      id: makeId(),
      kind: "cond",
      op: "&&",
      test,
      children: [makeBranch("then", kids, thenRaw, thenAt)]
    };
}
function tryParseMapWithSource(exprText, base = void 0) {
  let node = tryParseMap(exprText, base);
  return node && (node.source = exprText), node;
}
function tryParseCond(exprText, base = void 0) {
  let node = parseCondSource(exprText.slice(1, -1), base === void 0 ? void 0 : base + 1);
  return node && (node.source = exprText), node;
}
function parseTemplate(template, base = void 0) {
  if (typeof template != "string")
    return bail([], "", 0, "a non-string template");
  if (template.length > LIMITS.ipcFieldCharsMax)
    return bail([], "", 0, "a template exceeding the source limit");
  if (parseState.depth > LIMITS.treeDepthMax)
    return bail([], template, 0, "markup exceeding the nesting limit");
  parseState.depth === 0 && (parseState.nodes = 0), parseState.depth++;
  try {
    let result = parseTemplateBody(template, base);
    return parseState.depth === 1 && result.clean && !parseTemplateWithinBounds(result.nodes) ? bail([], template, 0, "markup exceeding the tree limits") : (parseState.depth === 1 && assignPathIds(result.nodes, "", 0), result);
  } finally {
    parseState.depth--, assert(parseState.depth >= 0, "Template recursion unwinds to its caller");
  }
}
function parseTemplateBody(template, base) {
  let nodes = [], position = 0, pendingBlank = 0, gaps = [], emit = (node) => {
    let placed = pendingBlank ? { ...node, blankBefore: pendingBlank } : node;
    pendingBlank = 0, nodes.push(placed), parseState.nodes++;
  }, at = (node, from, to) => parseTemplateAt(node, base, from, to), found = NOT_YET_FOUND;
  for (; position < template.length; ) {
    if (parseState.nodes >= LIMITS.treeNodesMax)
      return bail(nodes, template, position, "markup exceeding the node limit");
    found = nextDelimiters(template, position, found);
    let { lt, br, next } = found, textEnd = next === -1 ? template.length : next, text2 = template.slice(position, textEnd);
    if (!text2.trim() && text2) {
      let breaks = (text2.match(/\n/g) || []).length;
      breaks > 1 && (pendingBlank = Math.max(pendingBlank, breaks - 1)), nodes.length && gaps.push({ index: nodes.length, from: position, to: textEnd });
    }
    if (text2.trim()) {
      let node = { id: makeId(), kind: "text", value: textValue(text2) };
      (text2.includes(`
`) || /&[#a-zA-Z]/.test(text2)) && (node.source = text2), emit(at(node, position, textEnd));
    }
    if (next === -1)
      break;
    if (next === br && (lt === -1 || br < lt)) {
      let close = findMatchingBrace(template, br);
      if (close === -1)
        return bail(nodes, template, br, "an unclosed { \u2026 } expression");
      let exprText = template.slice(br, close + 1), node = parseTemplateExpression(exprText, base === void 0 ? void 0 : base + br);
      emit(at(node, br, close + 1)), position = close + 1;
      continue;
    }
    let tag = parseTemplateMarkup(template, lt, base);
    switch (tag.kind) {
      case "bail":
        return bail(nodes, template, lt, tag.what);
      case "child-bail":
        return { nodes, clean: !1 };
      case "tag":
        emit(tag.node), position = tag.end;
        break;
    }
  }
  return parseTemplateGaps(nodes, gaps, base), { nodes, clean: !0, trailingBlank: pendingBlank };
}
function parseTemplateTag(template, lt, base) {
  let shorthand = template.startsWith("<>", lt), match = shorthand ? { full: "<>", name: "Fragment", attrs: "", selfClose: "" } : scanTag(template, lt);
  if (!match)
    return { kind: "bail", what: "a stray < or unclosed tag attribute" };
  let { full, name, attrs, selfClose } = match, attributes = tagFields(attrs, base === void 0 || shorthand ? void 0 : base + lt + 1 + name.length);
  if (attributes.problem !== void 0)
    return { kind: "bail", what: attributes.problem };
  let { fields } = attributes, isComponent = /^[A-Z]/.test(name), kind = isComponent ? "component" : "element", afterOpen = lt + full.length;
  if (selfClose === "/" || !isComponent && HTML_VOID_TAGS.has(name.toLowerCase()))
    return {
      kind: "tag",
      node: parseTemplateAt(
        {
          id: makeId(),
          kind,
          name,
          ...fields,
          // `<x/>` and `<x />` mean the same thing and are not the same text.
          ...selfClose === "/" && !/\s\/>$/.test(full) ? { tightClose: !0 } : {},
          children: void 0
        },
        base,
        lt,
        afterOpen
      ),
      end: afterOpen
    };
  if (!isComponent && RAW_ELEMENTS.has(name.toLowerCase())) {
    let close = template.indexOf(`</${name}`, afterOpen);
    if (close === -1)
      return { kind: "bail", what: `an unclosed <${name}> block` };
    let closeEnd = template.indexOf(">", close);
    return closeEnd === -1 ? { kind: "bail", what: `an unclosed <${name}> block` } : {
      kind: "tag",
      node: parseTemplateAt(
        {
          id: makeId(),
          kind: "raw",
          name,
          ...fields,
          inner: template.slice(afterOpen, close)
        },
        base,
        lt,
        closeEnd + 1
      ),
      end: closeEnd + 1
    };
  }
  return parseTemplateTagPaired({ template, lt, base, name, attrs, fields, afterOpen, shorthand, kind });
}
function parseTemplateExpression(exprText, base) {
  let jsxComment = exprText.match(/^\{\s*\/\*([\s\S]*?)\*\/\s*\}$/);
  return jsxComment ? {
    id: makeId(),
    kind: "comment",
    value: required(jsxComment[1], "JSX comment capture"),
    jsx: !0
  } : tryParseMapWithSource(exprText, base) || tryParseCond(exprText, base) || { id: makeId(), kind: "expr", value: exprText };
}
function parseTemplateMarkup(template, lt, base) {
  if (template.startsWith("<!--", lt)) {
    let end = template.indexOf("-->", lt + 4);
    return end === -1 ? { kind: "bail", what: "an unclosed <!-- comment" } : {
      kind: "tag",
      end: end + 3,
      node: parseTemplateAt(
        {
          id: makeId(),
          kind: "comment",
          value: template.slice(lt + 4, end)
        },
        base,
        lt,
        end + 3
      )
    };
  }
  if (/^<!doctype/i.test(template.slice(lt))) {
    let end = template.indexOf(">", lt);
    return end === -1 ? { kind: "bail", what: "an unclosed <!doctype>" } : {
      kind: "tag",
      end: end + 1,
      node: parseTemplateAt(
        {
          id: makeId(),
          kind: "raw-line",
          value: template.slice(lt, end + 1)
        },
        base,
        lt,
        end + 1
      )
    };
  }
  return parseTemplateTag(template, lt, base);
}
function parseTemplateGaps(nodes, gaps, base) {
  if (gaps.length && isInlineRun(nodes, 0))
    for (let i = gaps.length - 1; i >= 0; i--) {
      let gap = required(gaps[i], "Inline gap index is in bounds");
      if (gap.index >= nodes.length)
        continue;
      let space = { id: makeId(), kind: "text", value: " " };
      nodes.splice(gap.index, 0, parseTemplateAt(space, base, gap.from, gap.to));
    }
}
function parseTemplateTagPaired(open) {
  let { template, lt, base, name, fields, afterOpen, shorthand, kind } = open, closeIndex = shorthand ? findMatchingFragmentClose(template, afterOpen) : findMatchingClose(template, afterOpen, name);
  if (closeIndex === -1)
    return { kind: "bail", what: `an unclosed <${shorthand ? "" : name}> tag` };
  let inner = template.slice(afterOpen, closeIndex), innerResult = parseTemplate(inner, base === void 0 ? void 0 : base + afterOpen);
  if (!innerResult.clean)
    return { kind: "child-bail" };
  let source = inner.includes(`
`) && (isInlineRun(innerResult.nodes, 0) || innerResult.nodes.length === 0) ? inner : void 0, blankAfter = innerResult.trailingBlank || 0, closeEnd = template.indexOf(">", closeIndex) + 1, closeText = template.slice(closeIndex, closeEnd);
  return {
    kind: "tag",
    node: parseTemplateAt(
      {
        id: makeId(),
        kind,
        name,
        ...shorthand ? { shorthand: !0 } : {},
        ...source === void 0 ? {} : { source },
        ...blankAfter ? { blankAfter } : {},
        ...fields,
        ...closeText.includes(`
`) ? { closeSource: closeText } : {},
        children: innerResult.nodes
      },
      base,
      lt,
      closeEnd
    ),
    end: closeEnd
  };
}

// vendor/stacki/shared/page/loopSource.ts
var LOOP_SOURCE_LIMITS = {
  // Steps peeled off a source before giving up: wrappers and narrowing calls
  // stack a few deep in a real page, never dozens.
  stepsMax: 16,
  // A loop head longer than this is not one the picker reads.
  headCharsMax: 4e3
}, MAP_HEAD = /^([\s\S]+?)\s*\??\.\s*map\(\s*(?:\(\s*([A-Za-z_$][\w$]*)\s*(?:,\s*([A-Za-z_$][\w$]*)\s*)?\)|([A-Za-z_$][\w$]*))\s*=>\s*\(?$/, VALUE_PATH = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\]|\["(?:[^"\\]|\\.)*"\])*$/, KEEPS_ELEMENT = /* @__PURE__ */ new Set(["filter", "slice", "sort", "toSorted", "reverse", "toReversed", "concat"]), EMPTY_FALLBACK = /\s*(?:\?\?|\|\|)\s*\[\s*\]$/, OBJECT_VALUES = /^Object\.values\(([\s\S]*)\)$/;
function parseLoopHead(head) {
  let text2 = head.trim();
  if (LOOP_SOURCE_LIMITS.headCharsMax < text2.length)
    return;
  let match = MAP_HEAD.exec(text2), source = match?.[1]?.trim(), item = match?.[2] ?? match?.[4];
  if (!(source === void 0 || source === "" || item === void 0))
    return assert(text2.includes(item), "A loop item is named in its head"), { source, item, index: match?.[3] };
}
function loopSourcePath(source) {
  let text2 = source.trim(), kind = "list";
  for (let step = 0; step < LOOP_SOURCE_LIMITS.stepsMax; step++) {
    let peeled = peelStep(text2);
    if (peeled === void 0)
      break;
    text2 = peeled;
  }
  let values = OBJECT_VALUES.exec(text2);
  if (values?.[1] !== void 0) {
    kind = "values", text2 = values[1].trim();
    for (let step = 0; step < LOOP_SOURCE_LIMITS.stepsMax; step++) {
      let peeled = peelStep(text2);
      if (peeled === void 0)
        break;
      text2 = peeled;
    }
  }
  let path3 = text2.replace(/\?\.(?=\[)/g, "").replace(/\?\./g, ".");
  if (VALUE_PATH.test(path3))
    return assert(path3.length <= source.length, "A loop source path is part of its source"), { kind, path: path3 };
}
function peelStep(text2) {
  let fallback = text2.replace(EMPTY_FALLBACK, "");
  if (fallback !== text2)
    return fallback.trim();
  if (!text2.endsWith(")"))
    return;
  let open = matchingOpen(text2, text2.length - 1);
  if (open === void 0)
    return;
  if (open === 0)
    return text2.slice(1, -1).trim();
  let call = /\??\.\s*([A-Za-z_$][\w$]*)\s*$/.exec(text2.slice(0, open)), method = call?.[1];
  if (!(call === null || method === void 0))
    return KEEPS_ELEMENT.has(method) ? text2.slice(0, open - call[0].length).trim() : void 0;
}
function matchingOpen(text2, close) {
  assert(close < text2.length, "A closing bracket is inside its text");
  let depth = 0, quote;
  for (let i = close; i >= 0; i--) {
    let character = text2.charAt(i);
    if (quote !== void 0) {
      character === quote && text2.charAt(i - 1) !== "\\" && (quote = void 0);
      continue;
    }
    if (character === '"' || character === "'" || character === "`")
      quote = character;
    else if (character === ")" || character === "]" || character === "}")
      depth += 1;
    else if ((character === "(" || character === "[" || character === "{") && (depth -= 1, depth === 0))
      return i;
  }
}

// vendor/stacki/shared/page/previewIteration.ts
var ITERATION_MARKER_PREFIX = "avb-i:";
function iterationMarkerExpression(loopHead, loopPath) {
  assert(loopPath.length > 0, "iterationMarkerExpression: a loop has a path");
  let head = parseLoopHead(loopHead);
  if (head === void 0)
    return;
  let source = loopSourcePath(head.source);
  if (source === void 0)
    return;
  let list2 = source.kind === "values" ? `Object.values(${source.path})` : source.path, tail = JSON.stringify(`:${loopPath}-->`), lookup = `(() => { try { const list = ${list2}; const at = list.indexOf(${head.item}); return at === list.lastIndexOf(${head.item}) ? at : -1; } catch { return -1; } })()`, expression = `${JSON.stringify(`<!--${ITERATION_MARKER_PREFIX}`)} + ${lookup} + ${tail}`;
  return assert(expression.length < LIMITS.attrCharsMax, "iterationMarkerExpression: the expression is bounded"), expression;
}

// vendor/stacki/electron/parse/astroSerializeMarked.ts
function serializeNodesMarked(nodes, roots) {
  assert(nodes.length <= LIMITS.treeNodesMax, "serializeNodesMarked: node limit");
  let printed2 = markedSiblings(nodes, { indent: "", outerIndent: "", edges: "none" }, (index) => ({
    path: roots.pathOf(index),
    inSlot: !1,
    atRoot: roots.atRoot,
    depth: 0,
    stamp: roots.stamp,
    source: roots.source
  }));
  return assert(nodes.length > 0 || printed2 === "", "serializeNodesMarked: no roots print nothing"), printed2;
}
var markerFor = (path3, kind, { inSlotContent, slotAttr = "" }) => inSlotContent || slotAttr ? `<Fragment${slotAttr} set:html={${JSON.stringify(`<!--avb-${kind}:${path3}-->`)}} />` : `<!--avb-${kind}:${path3}-->`;
function markedText(node, indent, place) {
  let { path: path3, inSlot } = place;
  assert(place.depth <= LIMITS.treeDepthMax, "markedText: depth limit"), assert(node.kind !== "chunk-group", "markedText: a chunk group is synthetic and is never printed");
  let route = serializeNodeMarkedRoute(node, place), body = markedBody(node, indent, place, route);
  if (route.tagInPlace || route.markWithin)
    return body;
  let slotAttr = route.slotAttr;
  return markedGlue(body, markerFor(path3, "s", { inSlotContent: inSlot, slotAttr }), markerFor(path3, "e", { inSlotContent: inSlot, slotAttr }));
}
function markedBody(node, indent, place, route) {
  let { path: path3, atRoot, depth, stamp, source } = place;
  if (assert(depth <= LIMITS.treeDepthMax, "markedBody: depth limit"), (node.kind === "component" || node.kind === "element") && !node.chunkFile && !node.chunkAggregate && Array.isArray(node.children) && // Inline runs serialize as one line — markers between words would break
  // spacing (each marker's surrounding newlines render as a space).
  !(node.children.length > 0 && isInlineRun(node.children, depth + 1))) {
    let children = node.children, open = `<${node.name}${serializeAttrs(route.markedProps, route.attrOrder)}>`, close = `</${node.name}>`, inner = children.length === 0 ? emptyInner(node, source) : markedSiblings(children, { indent: indent + "  ", outerIndent: indent, edges: "markup" }, (i) => ({
      path: `${path3}.${i}`,
      inSlot: node.kind === "component",
      atRoot: node.name === "Fragment" && atRoot,
      depth: depth + 1,
      stamp,
      source
    }));
    return route.markWithin ? open + markedGlue(inner, markerFor(path3, "s", { inSlotContent: !0 }), markerFor(path3, "e", { inSlotContent: !0 })) + close : open + inner + close;
  }
  switch (node.kind) {
    case "map":
      return markedMap(node, indent, place);
    case "cond":
      return markedCond(node, indent, place);
    case "branch":
      return markedSiblings(node.children || [], { indent, outerIndent: indent, edges: "none" }, (i) => ({ ...place, path: `${path3}.${i}`, depth: depth + 1 }));
    case "component":
    case "element":
    case "text":
    case "expr":
    case "raw-line":
    case "comment":
    case "raw": {
      let base = route.carryPath ? { ...node, props: route.markedProps, attrOrder: route.attrOrder } : node;
      return markedLeaf(base, indent, place);
    }
    case "chunk-group":
      return assert(!1, "markedBody: a chunk group is never printed"), "";
    default:
      return node;
  }
}
function markedSiblings(nodes, layout, placeOf) {
  assert(nodes.length <= LIMITS.treeNodesMax, "markedSiblings: node limit");
  let printed2 = nodes.flatMap((node, index) => node.kind === "chunk-group" ? [] : [{ node, text: markedText(node, layout.indent, placeOf(index)) }]);
  if (printed2.length === 0)
    return "";
  let first = printed2[0], last = printed2[printed2.length - 1];
  assert(first !== void 0, "markedSiblings: a non-empty list has a first sibling"), assert(last !== void 0, "markedSiblings: a non-empty list has a last sibling");
  let source = placeOf(0).source, gaps = locatedGaps(
    printed2.map(({ node }) => node),
    source
  );
  if (gaps !== void 0) {
    let lead2 = layout.edges === "markup" ? gaps.lead : "", trail2 = layout.edges === "markup" ? gaps.trail : "";
    return lead2 + printed2.map(({ text: text2 }, index) => index === 0 ? text2 : (gaps.between[index - 1] ?? "") + text2).join("") + trail2;
  }
  let lead = layout.edges === "markup" ? `
${layout.indent}` : "", trail = layout.edges === "markup" ? `
${layout.outerIndent}` : "";
  return lead + printed2.map(({ text: text2 }) => text2).join(`
${layout.indent}`) + trail;
}
function markedMap(node, indent, place) {
  let { path: path3, atRoot, depth, stamp, source } = place;
  if (assert(depth <= LIMITS.treeDepthMax, "markedMap: depth limit"), node.bodyParts !== void 0) {
    let text2 = serializeMapCallback(node, (child, index) => "<Fragment>" + (child.kind === "chunk-group" ? "" : markedText(child, "", { path: `${path3}.${index}`, inSlot: !0, atRoot, depth: depth + 1, stamp, source })) + "</Fragment>");
    return assert(text2.startsWith("{"), "markedMap: a callback loop is written in braces"), text2;
  }
  let children = node.children || [], wrapped = children.length > 0 && (source === void 0 ? loopBodyWrapper(node) !== void 0 : node.fragment !== void 0), bodyIndent = indent + (node.body && node.body.length ? "      " : "    "), inner = markedSiblings(children, { indent: bodyIndent + "  ", outerIndent: bodyIndent, edges: wrapped ? "markup" : "none" }, (i) => ({
    path: `${path3}.${i}`,
    inSlot: !0,
    atRoot,
    depth: depth + 1,
    stamp,
    source
  })), expression = iterationMarkerExpression(node.head, path3), body = `<Fragment>${expression === void 0 ? "" : `<Fragment set:html={${expression}} />`}${inner}</Fragment>`;
  if (node.body && node.body.length) {
    let statements = node.body.map((line) => `${indent}    ${line}`);
    return [
      "{",
      `${indent}  ${blockHead(node.head)}`,
      ...statements,
      `${indent}    return (`,
      bodyIndent + body,
      `${indent}    );`,
      `${indent}  })`,
      `${indent}}`
    ].join(`
`);
  }
  return ["{", `${indent}  ${node.head}`, bodyIndent + body, `${indent}  ))`, `${indent}}`].join(`
`);
}
function markedCond(node, indent, place) {
  let { path: path3, atRoot, depth, stamp, source } = place;
  assert(depth <= LIMITS.treeDepthMax, "markedCond: depth limit");
  let branches = node.children || [], inner = indent + "    ", branchOut = (branch, i) => inner + "<Fragment>" + (branch === void 0 ? "" : markedText(branch, inner + "  ", { path: `${path3}.${i}`, inSlot: !0, atRoot, depth: depth + 1, stamp, source })) + "</Fragment>", lines = ["{", indent + "  " + node.test + (node.op === "&&" ? " && (" : " ? ("), branchOut(branches[0], 0)];
  return node.op === "&&" ? lines.push(indent + "  )") : lines.push(indent + "  ) : (", branchOut(branches[1], 1), indent + "  )"), lines.push(indent + "}"), assert(node.op === "&&" || branches.length <= 2, "markedCond: a ternary has two branches"), lines.join(`
`);
}
function serializeNodeMarkedRoute(node, { path: path3, atRoot, depth, stamp }) {
  let slotValue = node.props?.slot, slotted = slotValue && slotValue.type === "string" && !!slotValue.value, tagInPlace = slotted && node.kind === "element", slotAttr = slotted ? ` slot="${slotValue.value}"` : "", markWithin = slotted && (node.name === "Fragment" || node.name === "slot") && Array.isArray(node.children) && node.children.length > 0 && !isInlineRun(node.children, depth + 1), carryPath = (node.kind === "element" || node.kind === "component") && node.name !== "Fragment" && node.name !== "slot", forwards = Object.keys(node.props || {}).some((key) => key.startsWith("...")), pathProp = forwards || atRoot ? {
    type: "expr",
    value: `[${JSON.stringify(path3)}, Astro.props["data-avb-p"]].filter(Boolean).join(" ")`
  } : { type: "string", value: path3 }, carriesStamp = carryPath && atRoot && stamp !== void 0, stampProp = carriesStamp ? {
    type: "expr",
    value: `[${JSON.stringify(stampData(stamp))}, Astro.props[${JSON.stringify(PREVIEW_STAMP_ATTRIBUTE)}]].filter(Boolean).join("\\n")`
  } : void 0, markerNames = carriesStamp ? ["data-avb-p", PREVIEW_STAMP_ATTRIBUTE] : ["data-avb-p"], markerProps = stampProp ? { "data-avb-p": pathProp, [PREVIEW_STAMP_ATTRIBUTE]: stampProp } : { "data-avb-p": pathProp }, attrOrder = !carryPath || !node.attrOrder ? node.attrOrder : forwards && node.kind === "element" ? [...markerNames, ...node.attrOrder] : [...node.attrOrder, ...markerNames], markedProps = carryPath ? forwards && node.kind === "element" ? { ...markerProps, ...node.props } : { ...node.props, ...markerProps } : node.props;
  return {
    tagInPlace,
    markWithin,
    slotAttr,
    carryPath,
    markedProps,
    attrOrder
  };
}
function markedLeaf(base, indent, { path: path3, atRoot, depth, source }) {
  assert(depth <= LIMITS.treeDepthMax, "markedLeaf: depth limit");
  let span = spanOf(base, source);
  if (span !== void 0 && writtenVerbatim(base))
    return span.text;
  if ((base.kind === "component" || base.kind === "element") && !base.chunkFile && !base.chunkAggregate && Array.isArray(base.children) && base.children.length > 0 && isInlineRun(base.children, depth + 1) && (base.kind === "element" || base.kind === "component")) {
    assert(base.children !== void 0, "Inline run has children");
    let tagged = tagInlineRun(base.children, path3, {
      atRoot: base.name === "Fragment" && atRoot,
      depth: depth + 1
    }), located = inlineRunLocated(tagged, source, depth + 1);
    return located !== void 0 ? `<${base.name}${serializeAttrs(base.props, base.attrOrder)}>${located}</${base.name}>` : printed({ ...base, source: void 0, children: tagged }, indent, depth);
  }
  return printed(base, indent, depth);
}
function writtenVerbatim(node) {
  switch (node.kind) {
    case "text":
    case "raw":
      return !0;
    case "expr":
    case "comment":
    case "raw-line":
    case "component":
    case "element":
    case "map":
    case "cond":
    case "branch":
    case "chunk-group":
      return !1;
    default:
      return node;
  }
}
function inlineRunLocated(nodes, source, depth) {
  assert(depth <= LIMITS.treeDepthMax, "inlineRunLocated: depth limit");
  let gaps = locatedGaps(nodes, source);
  if (gaps === void 0)
    return;
  let out = gaps.lead;
  for (let [index, node] of nodes.entries()) {
    index > 0 && (out += gaps.between[index - 1] ?? "");
    let text2 = inlineNodeLocated(node, source, depth);
    if (text2 === void 0)
      return;
    out += text2;
  }
  return assert(out.length > 0, "inlineRunLocated: a run with children prints them"), out + gaps.trail;
}
function inlineNodeLocated(node, source, depth) {
  let span = spanOf(node, source);
  if (span === void 0)
    return;
  if (node.kind === "text")
    return span.text;
  if (node.kind === "expr")
    return node.value;
  assert(node.kind === "element", "inlineNodeLocated: an inline run holds text, expressions and elements");
  let open = `<${node.name}${serializeAttrs(node.props, node.attrOrder)}`;
  if (node.children === void 0)
    return `${open} />`;
  if (node.children.length === 0)
    return `${open}>${emptyInner(node, source)}</${node.name}>`;
  let inner = inlineRunLocated(node.children, source, depth + 1);
  return inner === void 0 ? void 0 : `${open}>${inner}</${node.name}>`;
}
function emptyInner(node, source) {
  let span = spanOf(node, source);
  if (span === void 0)
    return node.source !== void 0 && node.source.trim() === "" ? node.source : "";
  let close = span.text.lastIndexOf("</");
  return assert(close > 0, "emptyInner: a paired element ends with its closing tag"), whitespaceBefore(span.text, close);
}
function printed(node, indent, depth) {
  let lines = [];
  serializeNode(node, indent, lines, depth);
  let text2 = lines.join(`
`);
  return text2.startsWith(indent) ? text2.slice(indent.length) : text2;
}
function spanOf(node, source) {
  if (source === void 0)
    return;
  let { start, end } = node;
  if (!(start === void 0 || end === void 0))
    return assert(start <= end, "spanOf: a node starts before it ends"), assert(end <= source.length, "spanOf: offsets index the text they were read from"), { start, end, text: source.slice(start, end) };
}
function locatedGaps(nodes, source) {
  if (source === void 0)
    return;
  let located = nodes.map((node) => spanOf(node, source)).filter((span) => span !== void 0);
  if (located.length < nodes.length)
    return;
  let first = located[0], last = located[located.length - 1];
  if (first === void 0 || last === void 0)
    return;
  let between = [];
  for (let index = 1; index < located.length; index++) {
    let left = located[index - 1], right = located[index];
    if (assert(left !== void 0, "locatedGaps: index is in bounds"), assert(right !== void 0, "locatedGaps: index is in bounds"), right.start < left.end)
      return;
    let gap = source.slice(left.end, right.start);
    if (whitespaceBefore(gap, gap.length) !== gap)
      return;
    between.push(gap);
  }
  return { lead: whitespaceBefore(source, first.start), between, trail: whitespaceAfter(source, last.end) };
}
var HTML_WHITESPACE = /* @__PURE__ */ new Set([" ", "	", `
`, "\f", "\r"]);
function whitespaceBefore(text2, offset) {
  assert(offset <= text2.length, "whitespaceBefore: offset is in the text");
  let start = offset;
  for (; start > 0 && HTML_WHITESPACE.has(text2[start - 1] ?? ""); )
    start--;
  return text2.slice(start, offset);
}
function whitespaceAfter(text2, offset) {
  assert(offset <= text2.length, "whitespaceAfter: offset is in the text");
  let end = offset;
  for (; end < text2.length && HTML_WHITESPACE.has(text2[end] ?? ""); )
    end++;
  return text2.slice(offset, end);
}
function markedGlue(text2, start, end) {
  let lead = whitespaceAfter(text2, 0);
  if (lead.length === text2.length)
    return start + text2 + end;
  let trail = whitespaceBefore(text2, text2.length), content = text2.slice(lead.length, text2.length - trail.length);
  return assert(content.length > 0, "markedGlue: text with something besides whitespace keeps it"), lead + start + content + end + trail;
}

// vendor/stacki/electron/parse/astroChunks.ts
var import_node_fs = __toESM(require("node:fs"), 1), import_node_path = __toESM(require("node:path"), 1);
function resolveChunks(model, pagePath, options = {}) {
  let rawImports = /* @__PURE__ */ new Map();
  for (let imp of model.imports)
    /\.html\?raw$/i.test(imp.path) && imp.path.startsWith(".") && rawImports.set(imp.name, import_node_path.default.resolve(import_node_path.default.dirname(pagePath), imp.path.replace(/\?raw$/i, "")));
  if (!rawImports.size)
    return;
  let aggregates = resolveChunksAggregates(model.extraFrontmatter), walk = (list2, depth) => {
    assert(depth <= LIMITS.treeDepthMax, "resolveChunks: depth limit");
    for (let node of list2) {
      if (node.kind === "component" && node.props?.["set:html"]?.type === "expr" && node.children === void 0) {
        let ref = node.props["set:html"].value.trim();
        if (rawImports.has(ref)) {
          let file = required(rawImports.get(ref), "Chunk import exists"), children = resolveChunksParseFile(file, options);
          children && (node.chunkFile = file, node.children = children);
          continue;
        }
        if (aggregates.has(ref)) {
          let groups = [];
          for (let ident of required(aggregates.get(ref), "Chunk aggregate exists")) {
            if (!rawImports.has(ident))
              continue;
            let file = required(rawImports.get(ident), "Aggregate chunk import exists"), children = resolveChunksParseFile(file, options);
            children && groups.push({
              id: makeId(),
              kind: "chunk-group",
              name: ident,
              chunkFile: file,
              children
            });
          }
          groups.length && (node.children = groups, node.chunkAggregate = !0);
          continue;
        }
      }
      Array.isArray(node.children) && walk(node.children, depth + 1);
    }
  };
  walk(model.nodes, 0), assignPathIds(model.nodes, "", 0);
}
function chunkImportMarks(model) {
  let marks = /* @__PURE__ */ new Map(), walk = (list2, prefix, depth) => {
    assert(depth <= LIMITS.treeDepthMax, "chunkImportMarks: depth limit"), list2.forEach((node, i) => {
      let childPath = prefix ? `${prefix}.${i}` : String(i);
      if (node.chunkFile) {
        let group = node.kind === "chunk-group", html = node.props?.["set:html"], ident = group ? node.name : html && html.type !== "bare" ? html.value.trim() : void 0;
        ident && marks.set(ident, { path: childPath, group });
      }
      Array.isArray(node.children) && walk(node.children, childPath, depth + 1);
    });
  };
  return walk(model.nodes, "", 0), marks;
}
function resolveChunksParseFile(filePath, options) {
  let source;
  try {
    source = import_node_fs.default.readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  let { nodes, clean } = parseTemplate(source, options.locs ? 0 : void 0);
  return clean ? nodes : void 0;
}
function resolveChunksAggregates(extraFrontmatter) {
  let aggregates = /* @__PURE__ */ new Map(), aggRe = /(?:const|let)\s+(\w+)\s*=\s*\[([^\]]*)\]\s*\.join\(/g, am;
  for (; (am = aggRe.exec(extraFrontmatter)) !== null; ) {
    let idents = required(am[2], "Chunk aggregate members capture").split(",").map((part) => part.trim()).filter(Boolean);
    idents.length && idents.every((i) => /^\w+$/.test(i)) && aggregates.set(required(am[1], "Chunk aggregate name capture"), idents);
  }
  return aggregates;
}

// vendor/stacki/electron/parse/propModel/readPropModel.ts
var import_typescript6 = __toESM(require("typescript"), 1);

// vendor/stacki/shared/properties/propTags.ts
var PROP_TAG_LIMITS = {
  // A doc comment is prose about one prop; four attributes' worth is past any.
  docCharsMax: LIMITS.attrCharsMax * 4,
  decimalsMax: 10,
  groupCharsMax: 80
}, NUMBER_TAG_SOURCE = String.raw`(-?\d+(?:\.\d+)?)(?![\d.]*\d)`;

// vendor/stacki/shared/properties/propModel.ts
var PROP_MODEL_LIMITS = {
  // How deep groups and lists of groups nest: `items: { cta: { link: {…} } }[]` is three. A List prop's
  // item fields nest LIMITS.listFieldDepthMax levels, and each level of a list is a list and a group.
  propNestingDepthMax: LIMITS.listFieldDepthMax * 2,
  // Branches of one union of prop shapes; past this the union is not modelled.
  propVariantsMax: 32,
  propsMax: LIMITS.propSchemaFieldsMax,
  optionsMax: LIMITS.propOptionsMax,
  // Union tables one component declares (each `A | B` of shapes is one).
  unionsMax: 64,
  // Type text as written; longer types are cut by the producer.
  typeTextCharsMax: LIMITS.attrCharsMax,
  textCharsMax: LIMITS.attrCharsMax,
  docCharsMax: PROP_TAG_LIMITS.docCharsMax
};

// vendor/stacki/electron/parse/propModel/propDeclarations.ts
var import_typescript4 = __toESM(require("typescript"), 1);

// vendor/stacki/electron/parse/astroSyntax.ts
var import_typescript2 = __toESM(require("typescript"), 1);

// vendor/stacki/shared/properties/i18n/messages/en/ai.ts
var messages = {
  "ai.account.email": "Account  {email}",
  "ai.account.options": "Account options",
  "ai.account.signOut": "Sign out",
  "ai.account.signedInTo": "Signed in to {product}",
  "ai.activity.edited": {
    one: "edited {count} file",
    other: "edited {count} files"
  },
  "ai.activity.fetched": {
    one: "fetched {count} page",
    other: "fetched {count} pages"
  },
  "ai.activity.ran": {
    one: "ran {count} command",
    other: "ran {count} commands"
  },
  "ai.activity.read": {
    one: "read {count} file",
    other: "read {count} files"
  },
  "ai.activity.searched": {
    one: "searched {count} time",
    other: "searched {count} times"
  },
  "ai.activity.used": {
    one: "used {count} tool",
    other: "used {count} tools"
  },
  "ai.activity.usedTools": {
    one: "Used {count} tool",
    other: "Used {count} tools"
  },
  "ai.agent.badge.installing": "Installing",
  "ai.agent.badge.notInstalled": "Not installed",
  "ai.agent.badge.ready": "Ready",
  "ai.agent.badge.signIn": "Sign in",
  "ai.agent.switch.label": "Agent: {agent}. Change agent",
  "ai.agent.switch.menu": "Agent",
  "ai.agent.switch.newChat": "Switches to a new chat",
  "ai.agent.switch.title": "Change agent (Claude or Codex)",
  "ai.bridge.unexpectedReply": "Unexpected reply from Stacki: {detail}",
  "ai.changes.applied": "Applied",
  "ai.changes.deleted": "Deleted",
  "ai.changes.filesChanged": {
    one: "{count} file changed",
    other: "{count} files changed"
  },
  "ai.changes.goneKept": "The diff is no longer available once a change is kept.",
  "ai.changes.goneUndone": "The diff is no longer available once a change is undone.",
  "ai.changes.keep": "Keep",
  "ai.changes.keepAll": "Keep all",
  "ai.changes.kept": "Kept",
  "ai.changes.label": "Changes in this turn",
  "ai.changes.loading": "Loading the diff\u2026",
  "ai.changes.new": "New",
  "ai.changes.openFile": "Open file",
  "ai.changes.openNamed": "Open {name}",
  "ai.changes.unavailable": "The diff could not be loaded.",
  "ai.changes.undo": "Undo",
  "ai.changes.undoAll": "Undo all",
  "ai.changes.undone": "Undone",
  "ai.changes.untracked.failed": "Could not save the setting.",
  "ai.changes.untracked.nowOn": "Snapshots are on for new turns",
  "ai.changes.untracked.off": "Snapshots are off",
  "ai.changes.untracked.turnOn": "Turn on",
  "ai.changes.untracked.unavailable": "Changes could not be captured for this turn",
  "ai.code.copy": "Copy code",
  "ai.common.copied": "Copied",
  "ai.common.copyDetails": "Copy details",
  "ai.common.copyFailed": "Couldn\u2019t copy",
  "ai.common.details": "Details",
  "ai.common.tryAgain": "Try again",
  "ai.compaction.done": "Conversation compacted",
  "ai.compaction.failed": "Compaction failed",
  "ai.compaction.running": "Compacting conversation\u2026",
  "ai.compaction.saved": "Conversation compacted \xB7 saved ~{tokens} tokens",
  "ai.compaction.stopped": "Compaction stopped",
  "ai.composer.add.commands": "Commands and skills",
  "ai.composer.add.images": "Add image",
  "ai.composer.add.label": "Add to message",
  "ai.composer.add.mention": "Mention a file or skill",
  "ai.composer.add.note": "You can also drop project files on the box, or paste images.",
  "ai.composer.add.title": "Add images, or type / for commands",
  "ai.composer.attach.images": "Attach images",
  "ai.composer.attach.limit": {
    one: "Attach up to {count} file per message.",
    other: "Attach up to {count} files per message."
  },
  "ai.composer.attach.remove": "Remove attachment",
  "ai.composer.attach.unsupported": "Attach images, or files from this project.",
  "ai.composer.commands": "Commands",
  "ai.composer.default": "Default",
  "ai.composer.dictate": "Dictate",
  "ai.composer.dictate.privacy": "Speech is recognized by your system\u2019s speech service, which may process audio online. Stacki stores no audio.",
  "ai.composer.dictate.stop": "Stop dictation",
  "ai.composer.dictate.title": "Click to dictate, or hold to talk",
  "ai.composer.dictate.unavailable": "Voice input is not available",
  "ai.composer.effort": "Effort",
  "ai.composer.listening": "Listening\u2026 click the microphone to finish",
  "ai.composer.mention.failed": "Couldn\u2019t search the project.",
  "ai.composer.mention.label": "Mention a file, skill or instructions",
  "ai.composer.mention.limit": {
    one: "Up to {count} mention per message.",
    other: "Up to {count} mentions per message."
  },
  "ai.composer.mention.none": "No matches.",
  "ai.composer.mention.searching": "Searching\u2026",
  "ai.composer.messageLabel": "Message {agent}",
  "ai.composer.mode": "Mode",
  "ai.composer.mode.confirm.action": "Use {mode}",
  "ai.composer.mode.confirm.body": "{agent} will change files and run commands without asking first. Files it edits can be kept or undone afterwards; commands it runs cannot be undone.",
  "ai.composer.mode.confirm.cancel": "Keep asking",
  "ai.composer.mode.confirm.title": "Use {mode}?",
  "ai.composer.mode.dangerTitle": "Mode: {mode}. {agent} acts without asking first.",
  "ai.composer.mode.locked": "The mode changes when the agent is done",
  "ai.composer.mode.plan": "Plan",
  "ai.composer.mode.planHint": "Create a plan before making changes",
  "ai.composer.mode.title": "Mode: {mode}",
  "ai.composer.model": "Model",
  "ai.composer.model.locked": "The model changes when the agent is done",
  "ai.composer.model.reset": "Reset to defaults",
  "ai.composer.model.resetHint": "New chats start from {agent}\u2019s own settings",
  "ai.composer.model.title": "{model}, {effort} effort",
  "ai.composer.moreModels": "More models",
  "ai.composer.placeholder.drop": "Drop images or files here",
  "ai.composer.placeholder.send": "\u23CE to send, {queueKey} to queue for later",
  "ai.composer.placeholder.steer": "\u23CE to steer, {queueKey} to queue",
  "ai.composer.recommended": "Recommended",
  "ai.composer.send": "Send",
  "ai.composer.send.title": "Send (Enter)",
  "ai.composer.stop": "Stop",
  "ai.composer.stop.title": "Stop the agent (Esc)",
  "ai.context.already": "Already compacting",
  "ai.context.compact": "Compact",
  "ai.context.compact.title": "Summarize the conversation so far to free up context",
  "ai.context.compacting": "Compacting\u2026",
  "ai.context.label": "Context usage",
  "ai.context.labelPercent": "Context usage, {percent}% used",
  "ai.context.note": "Compacting replaces earlier messages with a summary to free up room.",
  "ai.context.ring": "Context",
  "ai.context.ringPercent": "Context {percent}% used",
  "ai.context.sentence": "{used} tokens of {size} \xB7 {percent}%",
  "ai.context.unknown": "The agent has not reported its context window yet.",
  "ai.context.wait": "Wait for the agent to finish",
  "ai.dictation.blockedWindow": "The microphone was blocked for this window. Restart Stacki and try again.",
  "ai.dictation.failed": "Voice input failed ({error}).",
  "ai.dictation.language": "Voice input does not support this language here. Switch the interface language or type your message.",
  "ai.dictation.network": "Voice input could not reach the speech service. Check your connection and try again.",
  "ai.dictation.noSpeech": "No speech was heard. Try again.",
  "ai.dictation.notAllowed": "Microphone access was not allowed. Press the microphone to try again.",
  "ai.dictation.off": "Microphone access is off. Allow it in System Settings, then try again.",
  "ai.dictation.offHint": "In Privacy & Security \u2192 Microphone, switch on \u201C{app}\u201D.",
  "ai.dictation.openSettings": "Open System Settings",
  "ai.dictation.restricted": "Microphone access is restricted on this Mac, so voice input cannot start.",
  "ai.dictation.restrictedHint": "A profile or Screen Time rule blocks it; only an administrator can change that.",
  "ai.dictation.silence": "Stopped listening after a pause. Press the microphone to start again.",
  "ai.dictation.startFailed": "Could not start the microphone. Try again.",
  "ai.dictation.unavailable": "Voice input is not available here.",
  "ai.diff.binary": "Binary file, no preview.",
  "ai.diff.changesTo": "Changes to {name}",
  "ai.diff.deleted": "Deleted",
  "ai.diff.large": "A large change: shown as the old lines removed and the new ones added.",
  "ai.diff.lineEndings": "Only line endings changed.",
  "ai.diff.newFile": "New file",
  "ai.diff.noChanges": "No changes to show.",
  "ai.diff.showLines": {
    one: "Show {count} line",
    other: "Show {count} lines"
  },
  "ai.diff.showMore": "Show more rows",
  "ai.diff.showSome": {
    one: "Show {step} of {count} line",
    other: "Show {step} of {count} lines"
  },
  "ai.effort.description": "Higher effort means more thorough responses, but takes longer and uses your limits faster.",
  "ai.effort.extra": "Extra",
  "ai.effort.info.max": "Maximum reasoning: the most thorough and slowest setting, and it uses your limits fastest.",
  "ai.effort.info.ultra": "Ultra delegates work to other agents and can use your limits quickly.",
  "ai.error.alreadyKept": "This change was already kept.",
  "ai.error.alreadyUndone": "This change was already undone.",
  "ai.error.archivedMove": "An archived chat cannot be moved. Restore it first.",
  "ai.error.busyRequests": "{agent} has too many requests waiting.",
  "ai.error.cannotCompact": "{agent} cannot compact a conversation from Stacki.",
  "ai.error.cannotSteer": "{agent} cannot take a message while it works.",
  "ai.error.changeGone": "This change is no longer kept for review.",
  "ai.error.changePath": "A change is named by its project-relative path.",
  "ai.error.changedAfter": "{path} changed after the agent\u2019s edit. Open it to put it right by hand.",
  "ai.error.changedWhileMerging": "{path} changed again while you were merging. Undo it again to see the new version.",
  "ai.error.chatFull": "This chat is full. Start a new chat to continue.",
  "ai.error.chatMissing": "This chat no longer exists.",
  "ai.error.chatNotRunning": "This chat is not running.",
  "ai.error.chatsFull": {
    one: "A project keeps at most {count} chat. Delete some to start another.",
    other: "A project keeps at most {count} chats. Delete some to start another."
  },
  "ai.error.compacting": "The conversation is being compacted. Send your message when it is done.",
  "ai.error.diffGone": "This change is no longer kept for review, so its diff is not available.",
  "ai.error.dropOtherSection": "The chat to drop before is in another section.",
  "ai.error.installFirst": "Install the {agent} connection first.",
  "ai.error.installing": "{agent} is already being installed.",
  "ai.error.missingCli": "{agent} is not installed on this computer.",
  "ai.error.misunderstood": "{agent} answered in a way Stacki does not understand.",
  "ai.error.notMergeable": "{path} can no longer be merged.",
  "ai.error.notRunning": "{agent} is not running.",
  "ai.error.notText": "{path} can no longer be read as text.",
  "ai.error.notTrusted": "Allow agents to work in this project first.",
  "ai.error.nothingToCompact": "There is nothing to compact yet.",
  "ai.error.protocol": "{agent} speaks protocol version {theirs}; Stacki speaks {ours}.",
  "ai.error.requestAnswered": "This request was already answered or has expired.",
  "ai.error.sectionMissing": "This section no longer exists.",
  "ai.error.sectionNameTaken": "Another section already has that name.",
  "ai.error.sectionsFull": {
    one: "A project keeps at most {count} section.",
    other: "A project keeps at most {count} sections."
  },
  "ai.error.separateTurn": "{agent} started the message as a separate turn that Stacki cannot show.",
  "ai.error.settingUnavailable": "The agent does not offer that setting.",
  "ai.error.signIn": "Sign in to {agent} to continue.",
  "ai.error.stillAnswering": "The agent is still answering. Stop it or wait.",
  "ai.error.stillAnsweringCompact": "The agent is still answering. Compact when it is done.",
  "ai.error.stopped": "{agent} stopped{detail}",
  "ai.error.timeout": "{agent} took too long to answer.",
  "ai.error.title": "The reply didn\u2019t finish.",
  "ai.error.writeFirst": "Write a message first.",
  "ai.gate.connect.action": "Download and connect",
  "ai.gate.connect.text": "Stacki needs a small connector to talk to {agent} (about {megabytes} MB, version {version}).",
  "ai.gate.connect.title": "Connect {agent}",
  "ai.gate.connecting": "Connecting {agent}\u2026",
  "ai.gate.failed.title": "{agent} could not start",
  "ai.gate.missing.how": "How to install {agent}",
  "ai.gate.missing.text": "Install {agent} on this computer, then sign in to it once. Stacki uses your own installation.",
  "ai.gate.missing.title": "{agent} is not installed",
  "ai.group.failed": {
    one: "{count} failed",
    other: "{count} failed"
  },
  "ai.group.showEarlier": "Show {count} earlier",
  "ai.image.detailed": "This image is too detailed. Crop it or choose a smaller one.",
  "ai.image.prepare": "Could not prepare this image.",
  "ai.image.size": "Each image must be smaller than 20 MB.",
  "ai.image.type": "Choose a PNG, JPEG, WebP or GIF image.",
  "ai.markdown.openLink": "Open {url}",
  "ai.markdown.table": "Table",
  "ai.markdown.taskDone": "Done",
  "ai.markdown.taskOpen": "Not done",
  "ai.mention.builtin.appBuilder.description": "Instructions for building a Stacki app. Click to copy them.",
  "ai.mention.builtin.appBuilder.title": "App builder instructions",
  "ai.mention.group.builtin": "Built-in",
  "ai.mention.group.file": "Files",
  "ai.mention.group.skill": "Skills",
  "ai.mention.skillTitle": "{name} skill ({path})",
  "ai.mention.skillTitleShort": "{name} skill",
  "ai.menu.reviewChanges": "Ask me to keep AI changes",
  "ai.menu.reviewChanges.info": "Off: edits apply at once and can be undone. On: you choose Keep or Undo for each file.",
  "ai.message.actions": "Message actions",
  "ai.message.copy": "Copy message",
  "ai.message.edit": "Edit message",
  "ai.message.editTitle": "Edit and send again",
  "ai.message.resend": "Send message again",
  "ai.message.resendTitle": "Send again",
  "ai.message.showLess": "Show less",
  "ai.message.showMore": "Show more",
  "ai.notice.cannotContinue": "{agent} could not continue the earlier conversation, so this chat starts a new one.",
  "ai.notice.cannotFork": "{agent} cannot carry the earlier conversation into a fork, so this chat starts a new one.",
  "ai.notice.chatFull": "This chat is full; new messages are no longer saved. Start a new chat.",
  "ai.notice.forkFailed": "{agent} could not fork the earlier conversation, so this chat starts a new one.",
  "ai.notice.settingsRefused": "{agent} did not accept your last {settings}, so this chat uses its own.",
  "ai.notice.unsupportedUpdate": "The agent sent an update Stacki does not show yet ({update}).",
  "ai.panel.dismiss": "Dismiss",
  "ai.panel.loadingChats": "Loading chats",
  "ai.panel.setUpToStart": "Set up {agent} to start chatting",
  "ai.panel.signInToKeep": "Sign in to {agent} to keep chatting",
  "ai.panel.signInToStart": "Sign in to {agent} to start chatting",
  "ai.panel.trustFirst": "Allow agents in this project first",
  "ai.permission.ask.command": "Run a command",
  "ai.permission.ask.delete": "Delete a file",
  "ai.permission.ask.edit": "Edit a file",
  "ai.permission.ask.fetch": "Fetch a page",
  "ai.permission.ask.move": "Move a file",
  "ai.permission.ask.other": "Needs your answer",
  "ai.permission.ask.read": "Read a file",
  "ai.permission.ask.search": "Search the project",
  "ai.permission.command": "Command to run",
  "ai.permission.label": "Permission request",
  "ai.permission.moreFiles": {
    one: "and {count} more file",
    other: "and {count} more files"
  },
  "ai.permission.show": "Show",
  "ai.permission.verdict.allowed": "Allowed",
  "ai.permission.verdict.alwaysAllowed": "Always allowed",
  "ai.permission.verdict.answered": "Answered",
  "ai.permission.verdict.denied": "Denied",
  "ai.permission.verdict.stopped": "Stopped",
  "ai.permission.waiting": "Waiting: {title}",
  "ai.plan.complete": "Plan complete",
  "ai.queue.hint": "Queued messages are kept until you close this window.",
  "ai.queue.label": "Queued messages",
  "ai.queue.paused": "Paused after the last turn did not finish.",
  "ai.queue.remove": "Remove queued message",
  "ai.queue.resume": "Resume",
  "ai.queue.sendNow": "Send now",
  "ai.quick.label": "Suggested replies",
  "ai.quick.send": "Send \u201C{option}\u201D",
  "ai.sessions.actionsFor": "Actions for {name}",
  "ai.sessions.actionsMenu": "{name} actions",
  "ai.sessions.addSection": "Add a section to group chats",
  "ai.sessions.allChats": "All chats",
  "ai.sessions.archive": "Archive",
  "ai.sessions.archivedHeading": "Archived",
  "ai.sessions.chatActions": "Chat actions",
  "ai.sessions.chatName": "Chat name",
  "ai.sessions.chats": "Chats",
  "ai.sessions.clearFilters": "Clear search and filters",
  "ai.sessions.collapseAll": "Collapse all",
  "ai.sessions.context": "{used} of {size} tokens",
  "ai.sessions.delete": "Delete",
  "ai.sessions.deleteChat.body": "\u201C{title}\u201D and its history are removed from this computer. This cannot be undone. Files the agent changed stay as they are. To keep the chat out of the way without losing it, archive it instead.",
  "ai.sessions.deleteChat.confirm": "Delete chat",
  "ai.sessions.deleteChat.title": "Delete this chat?",
  "ai.sessions.deleteSection": "Delete section",
  "ai.sessions.deleteSection.body": {
    one: "Its chat moves to No section. No chat is deleted. The section itself cannot be brought back.",
    other: "Its {count} chats move to No section. No chat is deleted. The section itself cannot be brought back."
  },
  "ai.sessions.deleteSection.empty": "The section is empty. This cannot be undone.",
  "ai.sessions.deleteSection.title": "Delete the section \u201C{name}\u201D?",
  "ai.sessions.dropHere": "Drag a chat here.",
  "ai.sessions.empty": "No chats yet. Start one and it will be listed here.",
  "ai.sessions.expandAll": "Expand all",
  "ai.sessions.filter": "Filter chats",
  "ai.sessions.filter.all": "All",
  "ai.sessions.filter.archived": "Show archived",
  "ai.sessions.filter.order": "Chats are in your order. Drag a chat to move it.",
  "ai.sessions.filter.pinned": "Only pinned",
  "ai.sessions.filter.unread": "Only unread",
  "ai.sessions.fork": "Fork",
  "ai.sessions.hideSection": "Hide {name}",
  "ai.sessions.markRead": "Mark as read",
  "ai.sessions.markUnread": "Mark as unread",
  "ai.sessions.moveDown": "Move down",
  "ai.sessions.moveToSection": "Move to section",
  "ai.sessions.moveUp": "Move up",
  "ai.sessions.newChat": "New chat",
  "ai.sessions.newSection": "New section",
  "ai.sessions.newSectionMenu": "New section\u2026",
  "ai.sessions.noArchived": "No archived chats.",
  "ai.sessions.noMatch": "No chat matches.",
  "ai.sessions.noSection": "No section",
  "ai.sessions.nothingHere": "Nothing here.",
  "ai.sessions.now": "now",
  "ai.sessions.pin": "Pin",
  "ai.sessions.pinned": "Pinned",
  "ai.sessions.rename": "Rename",
  "ai.sessions.renameHint": "{title} (double click to rename)",
  "ai.sessions.restore": "Restore",
  "ai.sessions.running": "Running",
  "ai.sessions.search": "Search chats",
  "ai.sessions.sectionLimit": {
    one: "A project has at most {count} section.",
    other: "A project has at most {count} sections."
  },
  "ai.sessions.sectionName": "Section name",
  "ai.sessions.showSection": "Show {name}",
  "ai.sessions.unpin": "Unpin",
  "ai.sessions.unread": "Unread",
  "ai.setup.copyDetails": "Copy details",
  "ai.setup.failed.install": "{agent} wasn\u2019t installed",
  "ai.setup.failed.signIn": "Sign-in didn\u2019t finish",
  "ai.setup.failed.signOut": "Sign-out didn\u2019t finish",
  "ai.setup.install.action": "Install {agent}",
  "ai.setup.install.text": "{agent} isn\u2019t on this computer yet. Stacki installs it for you; it takes a minute.",
  "ai.setup.install.title": "Install {agent}",
  "ai.setup.installing.text": "This can take a minute. You can keep working meanwhile.",
  "ai.setup.installing.title": "Installing {agent}\u2026",
  "ai.setupError.helperNotExecutable": "The sign-in could not start: the terminal helper is not executable. Run \u201Cnpm run fix:pty\u201D, restart Stacki, then try again.",
  "ai.setupError.installFailed": "{agent} could not be installed. Check your connection and try again.",
  "ai.setupError.installerStart": "Stacki could not start the {agent} installer on this computer. Open Details, or install it yourself in a terminal: npm install --global @openai/codex",
  "ai.setupError.needsNode": "Installing {agent} needs Node.js. Install Node.js from nodejs.org, then try again.",
  "ai.setupError.needsPermission": "Installing {agent} needs permission Stacki does not ask for. Use \u201CCopy details\u201D and run it in Terminal.",
  "ai.setupError.notFoundYet": "{agent} was installed, but Stacki cannot find it yet. Restart Stacki, then try again.",
  "ai.setupError.signInStart": "The sign-in could not start.",
  "ai.setupError.signInStartDetail": "The sign-in could not start. {detail}",
  "ai.setupError.signInTimeout": {
    one: "Sign-in didn\u2019t finish in {count} minute. Try again.",
    other: "Sign-in didn\u2019t finish in {count} minutes. Try again."
  },
  "ai.setupError.signInUnfinished": "Sign-in did not finish. Try again.",
  "ai.setupError.signOut": "Signing out did not work.",
  "ai.setupError.stoppedCode": "Sign-in stopped (code {code}). Open Details for what the CLI said.",
  "ai.setupError.stoppedWith": "Sign-in stopped: {detail}",
  "ai.signIn.action": "Sign in",
  "ai.signIn.codeLabel": "Code from the browser",
  "ai.signIn.codePlaceholder": "Paste the code from your browser",
  "ai.signIn.copyLink": "Copy sign-in link",
  "ai.signIn.done": "Signed in",
  "ai.signIn.expired": "Your session expired. Sign in again to keep chatting.",
  "ai.signIn.reopen": "Didn\u2019t open? Open the page again",
  "ai.signIn.retryMessage": "Retry message",
  "ai.signIn.title": "Sign in to {agent}",
  "ai.signIn.toStart": "Sign in to start chatting.",
  "ai.signIn.useTerminal": "Use the terminal instead",
  "ai.signIn.waiting.code": "When the page shows a code, copy it and paste it below.",
  "ai.signIn.waiting.text": "When the page says you are signed in, come back here. It ends by itself after five minutes.",
  "ai.signIn.waiting.title": "Finish signing in in your browser",
  "ai.status.counted.command": {
    one: "Running {count} command",
    other: "Running {count} commands"
  },
  "ai.status.counted.editing": {
    one: "Editing {count} file",
    other: "Editing {count} files"
  },
  "ai.status.counted.reading": {
    one: "Reading {count} file",
    other: "Reading {count} files"
  },
  "ai.status.counted.searching": {
    one: "Running {count} search",
    other: "Running {count} searches"
  },
  "ai.status.idle.looking": "Looking around",
  "ai.status.idle.thinking": "Thinking it through",
  "ai.status.idle.working": "Working",
  "ai.status.phase.command": "Running a command",
  "ai.status.phase.compacting": "Compacting conversation",
  "ai.status.phase.editing": "Editing files",
  "ai.status.phase.fetching": "Fetching",
  "ai.status.phase.reading": "Reading files",
  "ai.status.phase.searching": "Searching",
  "ai.status.phase.thinking": "Thinking",
  "ai.status.phase.waiting": "Waiting for you",
  "ai.store.queueFull": {
    one: "Only {count} message can wait. Send or remove one first.",
    other: "Only {count} messages can wait. Send or remove one first."
  },
  "ai.studio.addNote": "You can also drop or paste images on the box.",
  "ai.studio.addTitle": "Add images, or type @ to mention a file",
  "ai.studio.applied": "Applied to the shared draft. Ready to preview.",
  "ai.studio.applyDraft": "Apply to draft",
  "ai.studio.applyFailed": "Could not apply changes.",
  "ai.studio.applying": "Applying changes to the draft\u2026",
  "ai.studio.attachFailed": "Could not attach images.",
  "ai.studio.attachFiles": "Attach image files",
  "ai.studio.attachLimit": {
    one: "Attach up to {count} image per message.",
    other: "Attach up to {count} images per message."
  },
  "ai.studio.backToChat": "Back to the chat",
  "ai.studio.chatHistory": "Chat history",
  "ai.studio.chooseModel": "Choose model",
  "ai.studio.connectModel": "Connect a model to start",
  "ai.studio.deleteBody": "The conversation is removed from this browser. Changes already applied to the draft stay.",
  "ai.studio.deleteTitle": "Delete \u201C{title}\u201D?",
  "ai.studio.dictation.denied": "Microphone access was denied. Allow it in your browser settings and try again.",
  "ai.studio.dictation.failed": "Voice input failed ({code}). Try again or type your message.",
  "ai.studio.dictation.unavailable": "Voice input is unavailable in this browser. Try Chrome or Safari.",
  "ai.studio.discard": "Discard",
  "ai.studio.discarded": "Discarded. No changes were applied.",
  "ai.studio.download": "Download {name}",
  "ai.studio.dragPin": "Drag a chat here to pin it.",
  "ai.studio.dropImages": "Drop images here",
  "ai.studio.filesToChange": {
    one: "{count} file to change",
    other: "{count} files to change"
  },
  "ai.studio.imagesFull": "Image history is full. Delete an older chat to attach more images.",
  "ai.studio.interrupted": "This request was interrupted by a reload. Check the draft before retrying.",
  "ai.studio.latest": "Latest response",
  "ai.studio.makeRoom": "Delete a chat to make room",
  "ai.studio.mentionFile": "Mention a file",
  "ai.studio.mentionLabel": "Mention a project file",
  "ai.studio.messages": {
    one: "{count} message",
    other: "{count} messages"
  },
  "ai.studio.modelLocked": "The model changes when the response is done",
  "ai.studio.modelsFailed": "Could not load models.",
  "ai.studio.noChats": "No chats yet.",
  "ai.studio.noFiles": "No matching files.",
  "ai.studio.noMessages": "No messages yet",
  "ai.studio.noModel": "No model connected",
  "ai.studio.notConnected": "AI is not connected yet. Ask the site owner to connect a provider.",
  "ai.studio.placeholder": "\u23CE to send, @ to mention a file",
  "ai.studio.preparingImages": "Preparing images\u2026",
  "ai.studio.proposed": "Proposed changes",
  "ai.studio.proposedAgainst": "Changes are proposed against {file}",
  "ai.studio.removeImage": "Remove {name}",
  "ai.studio.retryConnection": "Retry connection",
  "ai.studio.sendFailed": "Could not send message.",
  "ai.studio.sendMessage": "Send message",
  "ai.studio.startChat": "Start a new chat",
  "ai.studio.starter.explain": "Explain how this page is built",
  "ai.studio.starter.improve": "Help me improve this page",
  "ai.studio.starter.mobile": "Make this page work better on mobile",
  "ai.studio.stopResponse": "Stop response",
  "ai.studio.stopResponseTitle": "Stop the response",
  "ai.studio.stopped": "Response stopped.",
  "ai.studio.storageFailed": "Chat history could not be saved on this device. Keep this tab open.",
  "ai.studio.thinking": "Thinking through your request\u2026",
  "ai.studio.threeWorking": "Three chats are already working. Wait for one to finish.",
  "ai.studio.voiceInput": "Voice input",
  "ai.studio.voiceUnavailable": "Voice input is unavailable in this browser",
  "ai.studio.welcome.line1": "Make a change, explore an idea,",
  "ai.studio.welcome.line2": "or bring a reference image.",
  "ai.studio.welcome.title": "What would you like to build?",
  "ai.studio.working": "Working",
  "ai.studio.workspace": "AI workspace",
  "ai.subagents.back": "Back to chat",
  "ai.subagents.doing.command": "Running {command}",
  "ai.subagents.doing.editing": "Editing {file}",
  "ai.subagents.doing.reading": "Reading {file}",
  "ai.subagents.doing.starting": "Starting",
  "ai.subagents.doing.thinking": "Thinking",
  "ai.subagents.doing.writing": "Writing",
  "ai.subagents.empty": "Nothing from this agent yet.",
  "ai.subagents.failed": {
    one: "{count} failed",
    other: "{count} failed"
  },
  "ai.subagents.finished": {
    one: "{count} agent finished",
    other: "{count} agents finished"
  },
  "ai.subagents.label": "Agents",
  "ai.subagents.more": {
    one: "{count} earlier agent not shown",
    other: "{count} earlier agents not shown"
  },
  "ai.subagents.running": {
    one: "{count} agent working",
    other: "{count} agents working"
  },
  "ai.subagents.status.done": "Done",
  "ai.subagents.status.failed": "Failed",
  "ai.subagents.status.running": "Running",
  "ai.subagents.status.waiting": "Waiting for you",
  "ai.tasks.done": "Done",
  "ai.tasks.failed": "Failed",
  "ai.tasks.finished": {
    one: "{count} task finished",
    other: "{count} tasks finished"
  },
  "ai.tasks.label": "Background tasks",
  "ai.tasks.running": {
    one: "{count} task running",
    other: "{count} tasks running"
  },
  "ai.tasks.stop": "Stop agent",
  "ai.thought.for": "Thought for {duration}",
  "ai.thought.plain": "Thought",
  "ai.thought.thinking": "Thinking\u2026",
  "ai.toggle.fastMode": "Fast mode",
  "ai.toggle.ultracode": "Ultracode",
  "ai.tool.calls": {
    one: "{count} call",
    other: "{count} calls"
  },
  "ai.tool.exit": "Exit {code}",
  "ai.tool.hiddenEarlier": {
    one: "{total} earlier character hidden",
    other: "{total} earlier characters hidden"
  },
  "ai.tool.hiddenMore": {
    one: "{total} more character hidden",
    other: "{total} more characters hidden"
  },
  "ai.tool.output": "Tool output",
  "ai.tool.showAll": "Show all",
  "ai.tool.status.done": "Done",
  "ai.tool.status.failed": "Failed",
  "ai.tool.status.running": "Running",
  "ai.tool.status.waiting": "Waiting",
  "ai.tool.untitled": "Tool",
  "ai.transcript.empty": "Ask for a change, or a question about this project.",
  "ai.transcript.jumpLatest": "Jump to latest",
  "ai.transcript.label": "Conversation",
  "ai.transcript.showEarlier": "Show {count} earlier",
  "ai.transcript.workedFor": "Worked for {duration}",
  "ai.trust.allow": "Allow in this project",
  "ai.trust.text": "Claude and Codex can read, change and run anything in this project. Their edits apply right away, and you keep or undo each file after.",
  "ai.trust.title": "Let agents work in this project?",
  "ai.turn.done": "Done.",
  "ai.turn.error": "Something went wrong.",
  "ai.turn.maxRequests": "The agent reached its step limit for one message.",
  "ai.turn.maxTokens": "The reply reached its length limit.",
  "ai.turn.refusal": "The agent declined this request.",
  "ai.turn.signIn": "Sign in to continue.",
  "ai.turn.stopped": "Stopped.",
  "ai.voice.hintHandsFree": "Hands-free: say \u201Csend\u201D, \u201Cnew line\u201D or \u201Cscratch that\u201D, or press the microphone to stop.",
  "ai.voice.hintHandsFreeBasic": "Hands-free: press the microphone to stop.",
  "ai.voice.hintHold": "Release to stop.",
  "ai.voice.level": "Microphone level"
};

// vendor/stacki/shared/properties/i18n/messages/en/apps.ts
var messages2 = {
  "apps.about.installedFrom": "Installed from",
  "apps.about.less": "Less",
  "apps.about.listed": "Listed in the marketplace",
  "apps.about.listedHint": "The marketplace follows this app\u2019s GitHub releases: publish a release there and it appears here.",
  "apps.about.more": "More",
  "apps.about.needs": "Needs",
  "apps.about.needsHint": "Installs and updates are refused on an older Stacki.",
  "apps.about.needsVersion": "Stacki {version} or later",
  "apps.about.network": "Network",
  "apps.about.networkHint": "Listed under External services, below.",
  "apps.about.reaches": { one: "Reaches {count} service", other: "Reaches {count} services" },
  "apps.about.storedIn": "Stored in",
  "apps.about.thisProject": "This project",
  "apps.about.title": "About",
  "apps.about.worksOffline": "Works offline",
  "apps.badge.rowCount": "{name}: {count}",
  "apps.badge.waiting": "Apps: {count} waiting",
  "apps.build.copied": "The AI chat isn\u2019t available here, so the \u201C{action}\u201D prompt is copied. Paste it into your AI agent.",
  "apps.build.failed": "Stacki could not open the AI chat or copy the prompt: {message}",
  "apps.build.label": "Build an app",
  "apps.capture.cancelable": "{name}: {reason} \xB7 Esc to cancel",
  "apps.capture.clickToPlace": "Click to place",
  "apps.capture.listening": "{name} is listening for clicks",
  "apps.capture.reason": "{name}: {reason}",
  "apps.check.license": "It uses the MIT license",
  "apps.check.public": "The repository is public",
  "apps.check.release": "It has a release with the app\u2019s .zip",
  "apps.check.scan": "The secret scan is clean",
  "apps.check.topic": "It carries the stacki-app topic",
  "apps.chooser.sectionStacki": "Stacki apps",
  "apps.chooser.sectionUploaded": "Uploaded to this project",
  "apps.chooser.sectionYours": "Your GitHub apps",
  "apps.commands.hint": "Run from the command palette, or anywhere in the editor with their keys.",
  "apps.commands.inUse": "{shortcut} is in use by {holder}, installed first.",
  "apps.commands.listLabel": "{name} commands",
  "apps.commands.none": "None",
  "apps.commands.reservedHint": "Use {modifiers} with a number from {first} to {last}",
  "apps.commands.shortcutFor": "Shortcut for {title}",
  "apps.commands.title": "Commands",
  "apps.commands.useOwnKey": "Use the app\u2019s own key",
  "apps.commands.usedBy": "Used by {name}",
  "apps.connect.account": "GitHub account",
  "apps.connect.addTopic": "Add the {topic} topic to a repository that publishes a Stacki app release.",
  "apps.connect.bundle": "App bundle",
  "apps.connect.checkRelease": "Check release",
  "apps.connect.checking": "Checking\u2026",
  "apps.connect.howToAdd": "How to add it",
  "apps.connect.loadFailed": "Couldn\u2019t load your repositories",
  "apps.connect.loading": "Loading repositories",
  "apps.connect.loadingReleases": "Loading releases\u2026",
  "apps.connect.noApps": "No Stacki apps on {account}",
  "apps.connect.noBundle": "This release has no .zip app bundle.",
  "apps.connect.noMatch": "No Stacki apps match.",
  "apps.connect.noReleases": "This repository has no releases yet.",
  "apps.connect.orPaste": "or paste a repository URL above",
  "apps.connect.pasteDetail": "Paste a GitHub repository above, as owner/repo or its github.com address, to see its releases.",
  "apps.connect.pasteTitle": "Paste a public repository",
  "apps.connect.pasteToConnect": "Paste a public GitHub repository to connect its releases.",
  "apps.connect.prerelease": "Pre-release",
  "apps.connect.publicRepository": "Public repository",
  "apps.connect.rateLimited": "GitHub is limiting requests",
  "apps.connect.releases": "Releases",
  "apps.connect.repositories": "Repositories",
  "apps.connect.restartDetail": "Stacki updated while it was open. Quit it and open it again to list your repositories; pasting a repository above works now.",
  "apps.connect.restartTitle": "Restart Stacki to finish updating",
  "apps.connect.searchLabel": "Search repositories or paste a GitHub URL",
  "apps.connect.signIn": "Sign in with GitHub",
  "apps.connect.signInDetail": "Your repositories and your organizations\u2019 are listed here. A public repository can be pasted above without signing in.",
  "apps.connect.signInTitle": "Sign in with GitHub to see your repositories",
  "apps.connect.tryAgainIn": { one: "Try again in {count} minute.", other: "Try again in {count} minutes." },
  "apps.connect.tryAgainSoon": "Try again in a few minutes.",
  "apps.connect.updated": "Updated {when}",
  "apps.connect.use": "Use",
  "apps.connections.advanced": "Advanced: use your own OAuth client",
  "apps.connections.connect": "Connect {provider}",
  "apps.connections.connected": "Connected",
  "apps.connections.connectedAs": "Connected as {account}",
  "apps.connections.disconnect": "Disconnect",
  "apps.connections.disconnecting": "Disconnecting\u2026",
  "apps.connections.finishInBrowser": "Finish signing in in your browser.",
  "apps.connections.hint": "Each person signs in with their own account. Tokens stay on this computer, never in the project.",
  "apps.connections.notConnected": "Not connected",
  "apps.connections.ownClientAdvanced": "Fill in your own client id (and secret, where the provider needs one) in App settings, and Stacki signs in with your client instead of Stacki\u2019s. Register the loopback address on this computer as its redirect; clear the client id to go back to Stacki\u2019s connection.",
  "apps.connections.ownClientCustom": "Signs in with your own OAuth client: fill in its client id in App settings, and register this app\u2019s redirect address with it.",
  "apps.connections.title": "Connections",
  "apps.connections.waiting": "Waiting\u2026",
  "apps.danger.uninstall": "Uninstall app",
  "apps.danger.zone": "Danger zone",
  "apps.details.aboutNamed": "About {name}",
  "apps.details.openOnGitHub": "Open {repository} on GitHub",
  "apps.details.options": "{name} options",
  "apps.details.popupLabel": "{name} details",
  "apps.details.thisRow": "this row",
  "apps.details.versionNamed": "Version {version}",
  "apps.error.adminOnly": "Only an admin can install, update or remove apps.",
  "apps.error.alreadyInstalled": "{name} {version} is already installed.",
  "apps.error.appLimit": "A project has at most {count} apps",
  "apps.error.approvedReleaseChanged": "The approved release changed since it was checked; nothing was installed.",
  "apps.error.approvedWrongApp": 'The approved release holds the app "{found}", not "{id}".',
  "apps.error.approvedWrongVersion": "The approved release of {name} is version {found}, not {expected}.",
  "apps.error.assetNoSize": "The release asset has no size.",
  "apps.error.assetTooBig": "{asset} is {bytes} bytes; an app is at most {max}.",
  "apps.error.assetWrongRepository": "The release asset does not download from its own repository.",
  "apps.error.cannotCreateUnder": "This account cannot create repositories under {owner}. Ask an owner of {owner} for that permission, or choose your own account.",
  "apps.error.clientIdCleared": "The {provider} client id was cleared; connect again.",
  "apps.error.clientIdMissing": "Fill in your own {provider} client id in the app's settings first.",
  "apps.error.clientSecretMissing": "Fill in the {provider} client secret in the app's settings first.",
  "apps.error.declaresNoProvider": '{name} declares no auth provider "{provider}".',
  "apps.error.digestMalformed": "GitHub\u2019s digest for the asset is malformed.",
  "apps.error.downloadDigestMismatch": "The download does not match the digest GitHub published for it.",
  "apps.error.downloadHTTPSOnly": "Apps download over HTTPS only.",
  "apps.error.downloadNotGitHub": "The download was sent to {host}, which is not GitHub.",
  "apps.error.downloadRedirectNowhere": "GitHub redirected the download nowhere.",
  "apps.error.downloadRedirectedTooMany": "GitHub redirected the download too many times.",
  "apps.error.downloadSizeMismatch": "The download is {actual} bytes; the release says {expected}.",
  "apps.error.downloadStatus": "The download answered {status}.",
  "apps.error.exceedsBytes": "{path} exceeds {bytes} bytes",
  "apps.error.folderEntriesMax": "{directory} holds more than {count} entries",
  "apps.error.folderHasLink": "{path} is a link; an app\u2019s folder holds files only",
  "apps.error.folderHoldsOtherApp": '{folder} holds the app "{found}"',
  "apps.error.folderIdMismatch": 'The folder is named "{folder}" but its stacki-app.json says "id": "{id}". Rename one to match.',
  "apps.error.folderIsLink": "This is a link. An app\u2019s folder holds its files itself.",
  "apps.error.folderPastLimit": "A project has at most {count} apps; this folder is past the limit.",
  "apps.error.folderTooDeep": "{path} is nested more than {count} folders deep",
  "apps.error.folderTooManyFiles": "{path} holds more than {count} files",
  "apps.error.gitHubAnsweredAccountRepositories": "GitHub answered {status} for this account's repositories.",
  "apps.error.gitHubAnsweredRelease": "GitHub answered {status} for {repository}'s release.",
  "apps.error.gitHubAnsweredReleases": "GitHub answered {status} for {repository}'s releases.",
  "apps.error.gitHubAnsweredRepository": "GitHub answered {status} for {repository}.",
  "apps.error.gitHubNoRelease": "{repository} has no such release, or this account cannot read it.",
  "apps.error.gitHubWrite.addTopic": "GitHub answered {status} when asked to add the topic{detail}.",
  "apps.error.gitHubWrite.createRelease": "GitHub answered {status} when asked to create the release{detail}.",
  "apps.error.gitHubWrite.createRepository": "GitHub answered {status} when asked to create the repository{detail}.",
  "apps.error.gitHubWrite.moveBranch": "GitHub answered {status} when asked to move the branch{detail}.",
  "apps.error.gitHubWrite.readBranch": "GitHub answered {status} when asked to read the branch{detail}.",
  "apps.error.gitHubWrite.readLastCommit": "GitHub answered {status} when asked to read the last commit{detail}.",
  "apps.error.gitHubWrite.readLatestRelease": "GitHub answered {status} when asked to read the latest release{detail}.",
  "apps.error.gitHubWrite.readOwner": "GitHub answered {status} when asked to read the owner{detail}.",
  "apps.error.gitHubWrite.readRepository": "GitHub answered {status} when asked to read the repository{detail}.",
  "apps.error.gitHubWrite.readTopics": "GitHub answered {status} when asked to read the topics{detail}.",
  "apps.error.gitHubWrite.uploadBundle": "GitHub answered {status} when asked to upload the app bundle{detail}.",
  "apps.error.gitHubWrite.uploadFile": "GitHub answered {status} when asked to upload a file{detail}.",
  "apps.error.gitHubWrite.writeCommit": "GitHub answered {status} when asked to write the commit{detail}.",
  "apps.error.gitHubWrite.writeTree": "GitHub answered {status} when asked to write the tree{detail}.",
  "apps.error.installedElsewhere": 'An app with the id "{id}" is already installed from elsewhere. Remove it first.',
  "apps.error.makePublicStatus": "GitHub answered {status} when making {repository} public.",
  "apps.error.marketplaceDigestMismatch": "{name} {version} does not match the SHA-256 the marketplace approved; nothing was installed.",
  "apps.error.marketplaceDoesNotList": 'The marketplace does not list "{id}".',
  "apps.error.marketplaceIndexStatus": "The marketplace index answered HTTP {status}.",
  "apps.error.marketplaceNoLongerApproves": "The marketplace no longer approves this version; nothing was installed.",
  "apps.error.marketplaceUnreachable": "The marketplace could not be reached: {detail}",
  "apps.error.needsDesktop": "Sharing to GitHub, changing a repository and submitting to the marketplace need Stacki Desktop, which holds your GitHub sign-in.",
  "apps.error.noApp": "The {role} role cannot use this app.",
  "apps.error.noApps": "Your role cannot use apps.",
  "apps.error.noCodeEdit": "Your role cannot edit code, so apps cannot change project files for it.",
  "apps.error.noLongerListed": "This app is no longer listed in the marketplace.",
  "apps.error.noLongerListedNothingInstalled": "This app is no longer listed in the marketplace; nothing was installed.",
  "apps.error.noLongerWaiting": "That app is no longer waiting to be installed. Choose it again.",
  "apps.error.noMarketplace": "Your role cannot see the marketplace.",
  "apps.error.noMarketplaceInstall": "Your role cannot install from the marketplace.",
  "apps.error.noPublish": "Your role cannot publish apps.",
  "apps.error.noReleaseToScan": "{repository} has no release with a .zip app bundle to scan.",
  "apps.error.noShare": "Your role cannot share apps.",
  "apps.error.noShareOrPublish": "Your role cannot share or publish apps.",
  "apps.error.noSignInWaiting": "No sign-in is waiting for this app.",
  "apps.error.noThisApp": "Your role cannot use this app.",
  "apps.error.noUpdateWaiting": "That app has no update waiting.",
  "apps.error.notApprovedVersion": "{name} {version} is not an approved version.",
  "apps.error.notConnected": "Not connected to {provider}; connect it in the app's details or with stacki.auth.connect.",
  "apps.error.notInstalled": 'The app "{id}" is not installed.',
  "apps.error.notReadyForMarketplace": "{repository} is not ready for the marketplace: {failing}.",
  "apps.error.onlyUploadedShared": "Only an app uploaded from a file or added to the project folder is shared from here; this one already comes from GitHub or the marketplace.",
  "apps.error.onlyUploadedSwitch": "Only an app uploaded from a file or added to the project folder switches to a GitHub release.",
  "apps.error.privateUnknown": "GitHub did not say whether {repository} is private.",
  "apps.error.releaseChanged": "The release changed since it was checked; nothing was installed.",
  "apps.error.releaseExists": "The release {tag} already exists.",
  "apps.error.releaseNoAsset": "The release {tag} has no asset named {asset}.",
  "apps.error.releaseNoId": "GitHub created the release without an id.",
  "apps.error.releaseNoTag": "The release has no usable tag.",
  "apps.error.releaseTooManyAssets": "The release lists too many assets.",
  "apps.error.releaseWrongApp": 'The release holds the app "{found}", not "{id}".',
  "apps.error.repositoryExists": "{repository} already exists, or GitHub refused the name. Choose another name.",
  "apps.error.repositoryNoBranch": "GitHub created the repository without a branch.",
  "apps.error.repositoryNotFound": "{repository} was not found, or this account cannot read it.",
  "apps.error.responseNotBytes": "The response body is not bytes.",
  "apps.error.responseTooLarge": "The response is larger than {max} bytes.",
  "apps.error.restartForApps": "Restart Stacki to use Apps.",
  "apps.error.scanFailedNotAsked": "The secret scan did not pass, so the marketplace was not asked. Move each key into an app setting, then rescan.",
  "apps.error.scanFailedNothingCreated": "The secret scan did not pass, so nothing was created on GitHub. Move each key into an app setting, then rescan.",
  "apps.error.scanFailedPrivate": "The secret scan did not pass, so {repository} stays private. Move each key into an app setting, then rescan.",
  "apps.error.signInCancelled": "The sign-in was cancelled.",
  "apps.error.signInExpired": "The {provider} sign-in expired; connect again.",
  "apps.error.signInNoCode": "{provider} sent no authorization code.",
  "apps.error.signInNoHandoff": "The {provider} sign-in came back without Stacki's handoff; connect again.",
  "apps.error.signInNotStarted": "This sign-in is not one Stacki started, or it has expired.",
  "apps.error.signInRefused": "{provider} refused the sign-in: {detail}",
  "apps.error.signInSomeoneWaiting": "Someone is already waiting for this sign-in.",
  "apps.error.signInTimedOut": "The sign-in timed out; connect again to retry.",
  "apps.error.signInToListRepositories": "Sign in with GitHub to list your repositories.",
  "apps.error.signInWaiting": "{name} is already waiting for a sign-in; finish it in the browser or wait for it to time out.",
  "apps.error.signInsTooMany": "Too many sign-ins are waiting; try again shortly.",
  "apps.error.studioNoServer": "This Studio has no server for Apps. Run Studio from your project to use them.",
  "apps.error.switchWrongRelease": "The release holds {found}, not {expected}; the app was not switched.",
  "apps.error.tokenNoAnswer": "{provider} did not answer the token request: {detail}",
  "apps.error.tokenNotJSON": "{provider} answered the token request with something other than JSON (status {status}).",
  "apps.error.topicsFull": "{repository} already has {count} topics; remove one to add {topic}.",
  "apps.error.uploadedNoUpdatesToInstall": "An uploaded app has no updates to install.",
  "apps.error.uploadedNoUpdatesUpload": "An uploaded app has no updates; upload the new file instead.",
  "apps.error.versionTooOld": "{name} {version}: Needs Stacki {minimum} or later. Update Stacki.",
  "apps.error.zipTooBig": "The app zips to {bytes} bytes; a release is at most {max}. Nothing was created on GitHub.",
  "apps.folder.errorNotice": "This app\u2019s files have an error: {reason}. Showing the last working version.",
  "apps.folder.scanHint": "Found in {folder}, so no install step checked its files.",
  "apps.folder.scanTitle": "Secret scan",
  "apps.folder.showInFinder": "Show in Finder",
  "apps.folder.showNamedInFinder": "Show {name} in Finder",
  "apps.frame.closeApp": "Close app",
  "apps.frame.closeNamed": "Close {name}",
  "apps.license.body": "Stacki commits a standard MIT LICENSE file, \u201CCopyright (c) {year} {holder}\u201D, to the default branch. Anyone may then use, change and share the app.",
  "apps.license.confirm": "Add MIT license",
  "apps.license.title": "Add the MIT license to {name}?",
  "apps.loadFromGitHub": "Load App From GitHub",
  "apps.makePublic.body": "Everyone on the internet will be able to see {name}: all of its code and its whole history, not only the app's files. This cannot be undone from Stacki.",
  "apps.makePublic.confirm": "Make public",
  "apps.makePublic.title": "Make {name} public?",
  "apps.market.appDetails": "App details",
  "apps.market.approved": "Approved",
  "apps.market.approvedHint": "Stacki installs only a download whose SHA-256 matches the one recorded when this version was approved.",
  "apps.market.apps": "Marketplace apps",
  "apps.market.byAuthor": "by {author}",
  "apps.market.categories": "Categories",
  "apps.market.disclaimer": "Community apps, MIT licensed. Stacki doesn\u2019t review them; install apps you trust.",
  "apps.market.emptyLabel": "Marketplace empty",
  "apps.market.emptyText": "Built an app? Send it for review and it can be listed here.",
  "apps.market.emptyTitle": "No apps in the marketplace yet",
  "apps.market.installBody": "By {author}. {disclaimer}",
  "apps.market.installTip": "Install {name} {version}, approved with SHA-256 {hash}\u2026",
  "apps.market.installTitle": "Install {name} {version}?",
  "apps.market.installed": "Installed",
  "apps.market.installing": "Installing\u2026",
  "apps.market.needsStacki": "Needs Stacki {minimum} or later. Update Stacki.",
  "apps.market.noMatch": "No marketplace app matches \u201C{query}\u201D.",
  "apps.market.search": "Search the marketplace",
  "apps.market.submitApp": "Submit an app",
  "apps.market.unavailable": "Marketplace unavailable",
  "apps.market.unavailableText": "Your installed apps keep working. Try again in a moment.",
  "apps.market.unavailableTitle": "Marketplace isn\u2019t available right now",
  "apps.market.version": "Version",
  "apps.menu.details": "Details",
  "apps.menu.remove": "Remove app",
  "apps.menu.share": "Share to GitHub\u2026",
  "apps.menu.submit": "Submit to marketplace",
  "apps.menu.updateTo": "Update to {version}",
  "apps.network.external": "Uses external services: {hosts}",
  "apps.network.offline": "Works fully offline",
  "apps.panel.add": "Add an app",
  "apps.panel.autoUpdateOff": "{name} now waits for you to choose Update.",
  "apps.panel.autoUpdateOn": "{name} now installs updates by itself.",
  "apps.panel.emptyAdmin": "Use + to add an app.",
  "apps.panel.emptyMember": "Use + for {action}, and ask an admin to install apps for this project.",
  "apps.panel.emptyTitle": "Add tools to Stacki with apps.",
  "apps.panel.install": "Install",
  "apps.panel.installNamed": "Install {name}",
  "apps.panel.installed": "{name} {version} is installed.",
  "apps.panel.installedHeading": "Installed",
  "apps.panel.loading": "Loading apps",
  "apps.panel.noMatch": "No installed app matches \u201C{query}\u201D.",
  "apps.panel.openNamed": "Open {name}",
  "apps.panel.removed": "{name} was removed.",
  "apps.panel.replaces": "replaces {name}",
  "apps.panel.roleCannotShare": "Your role cannot share apps to GitHub; ask an admin to share this one.",
  "apps.panel.search": "Search installed apps",
  "apps.panel.switchedToRelease": "{name} now installs updates from its GitHub release.",
  "apps.panel.title": "Apps",
  "apps.panel.updateNamed": "Update {name}",
  "apps.panel.updated": "{name} updated to {version}.",
  "apps.place.github": "GitHub",
  "apps.place.githubPrivate": "GitHub \xB7 Private",
  "apps.place.githubPrivateTip": "Installed from {repository}, a private GitHub repository",
  "apps.place.githubPublic": "GitHub \xB7 Public",
  "apps.place.githubPublicTip": "Installed from {repository}, a public GitHub repository",
  "apps.place.githubReleaseTip": "Installed from a GitHub release",
  "apps.place.githubRepositoryTip": "Installed from {repository} on GitHub",
  "apps.place.local": "Local",
  "apps.place.localTip": "Only in this project's .stacki/apps folder",
  "apps.place.marketplace": "Marketplace",
  "apps.place.marketplaceTip": "Listed in the Stacki marketplace",
  "apps.place.uploadedTip": "Uploaded as {fileName}; only in this project's .stacki/apps folder",
  "apps.privacy.hide": "Hide my details from apps",
  "apps.privacy.hint": "Apps see only an id that is the same for you in this project.",
  "apps.publicShare.body": "Everyone on the internet will be able to see the app\u2019s files. Stacki adds an MIT license, so others may use and change them.",
  "apps.publicShare.confirm": "Create public repository",
  "apps.publicShare.title": "Create the public repository {name}?",
  "apps.publish.appsToPublish": "Apps to publish",
  "apps.publish.asking": "Asking the marketplace about this release\u2026",
  "apps.publish.attachZip": "Attach the app\u2019s .zip to a GitHub release, then come back.",
  "apps.publish.checkShape": "The marketplace\u2019s check answered in a shape Stacki does not read.",
  "apps.publish.commitLicense": "Commit the MIT LICENSE",
  "apps.publish.httpAnswered": "The marketplace answered HTTP {status}.",
  "apps.publish.license": "License",
  "apps.publish.licenseReadAs": "GitHub reads this repository\u2019s license as {license}.",
  "apps.publish.makingPublic": "Making public\u2026",
  "apps.publish.mitRequired": "Marketplace apps must use the MIT license",
  "apps.publish.nameCharacters": "Use letters, digits, \u201C.\u201D, \u201C-\u201D and \u201C_\u201D only.",
  "apps.publish.nameEmpty": "Name the repository.",
  "apps.publish.nameGit": "A repository name cannot end in \u201C.git\u201D.",
  "apps.publish.nameReserved": "That name is reserved by GitHub.",
  "apps.publish.nameTooLong": "A repository name is at most {max} characters.",
  "apps.publish.needsDesktop": "Publishing needs Stacki Desktop",
  "apps.publish.nothingSent": "Nothing was sent. Try again later, or submit with the web form.",
  "apps.publish.openRepository": "Open the repository",
  "apps.publish.openSettings": "Open repository settings",
  "apps.publish.private": "This repository is private. The marketplace needs it public.",
  "apps.publish.readFailed": "Couldn\u2019t read {name}",
  "apps.publish.reading": "Reading {name}\u2026",
  "apps.publish.readyToSubmit": "Ready to submit: {name} v{version}",
  "apps.publish.refused": "The marketplace refused the submission",
  "apps.publish.release": "Release",
  "apps.publish.releaseFirst": "Release the app first",
  "apps.publish.replaceLicense": "Replace the LICENSE file with the MIT license on GitHub, then come back.",
  "apps.publish.requirements": "Marketplace requirements",
  "apps.publish.scanFirst": "The secret scan must be clean before the repository is made public.",
  "apps.publish.searchLabel": "Search your apps or paste a GitHub URL",
  "apps.publish.shareFirst": "Version {version} \xB7 Share it to GitHub first",
  "apps.publish.signInDetail": "The marketplace confirms who submits with the account you publish with.",
  "apps.publish.signInTitle": "Sign in with GitHub to publish",
  "apps.publish.studioDetail": "The marketplace confirms who submits with your GitHub sign-in, which Studio does not hold. Publish from Stacki Desktop, or use the web form.",
  "apps.publish.submit": "Submit for review",
  "apps.publish.submittedDetail": "The app is in the review queue.",
  "apps.publish.submittedTitle": "Submitted for review",
  "apps.publish.submitting": "Submitting\u2026",
  "apps.publish.title": "Publish to marketplace",
  "apps.publish.unavailable": "The marketplace isn\u2019t taking submissions right now",
  "apps.publish.updatedDetail": "The marketplace already had this app; it now has your latest release.",
  "apps.publish.updatedTitle": "Updated your submission",
  "apps.publish.uploaded": "Uploaded",
  "apps.publish.webForm": "Open the web form",
  "apps.refusal.admin.detail": "Ask an admin of the repository, or change the visibility yourself in its settings if you are one.",
  "apps.refusal.admin.title": "Only an admin of this repository can make it public",
  "apps.refusal.policy.detail": "An owner of the organization can allow them, or change the visibility in the repository\u2019s settings.",
  "apps.refusal.policy.title": "The organization does not allow public repositories",
  "apps.refusal.scope.detail": "Sign in to GitHub again with the repo scope, or change the visibility in the repository\u2019s settings.",
  "apps.refusal.scope.title": "Your GitHub sign-in cannot change repositories",
  "apps.scan.again": "Scan again",
  "apps.scan.allowlist": "A line that only looks like a key, such as a test fixture, can be listed in the manifest\u2019s {field} by its file and {hash}, where reviewers see it.",
  "apps.scan.allowlistTooLong": "secretsAllowlist has more than {max} entries",
  "apps.scan.cannotFinish": "{reason}. A scan that cannot finish does not pass.",
  "apps.scan.couldNotRun": "The secret scan could not run",
  "apps.scan.declare": "Declare a secret setting",
  "apps.scan.details": "Details",
  "apps.scan.everyone": "Everyone who installs the app would get these keys. Remove each one before it leaves this computer.",
  "apps.scan.fileTooLarge": "{path} is larger than {max} bytes to scan",
  "apps.scan.foundTitle": { one: "Found {total} possible secret", other: "Found {total} possible secrets" },
  "apps.scan.hide": "Hide",
  "apps.scan.lineHash": "Line hash {hash}",
  "apps.scan.moveKey": "Move each key into an app setting: declare it in {file}, and each person fills in their own in the app\u2019s details.",
  "apps.scan.noneFound": { one: "No secrets found in {count} file", other: "No secrets found in {count} files" },
  "apps.scan.noneFoundSentence": { one: "No secrets found in {count} file.", other: "No secrets found in {count} files." },
  "apps.scan.possibleFound": { one: "{total} possible secret found", other: "{total} possible secrets found" },
  "apps.scan.readSetting": "Read the setting",
  "apps.scan.removedRescan": "I\u2019ve removed it, rescan",
  "apps.scan.rescan": "Rescan",
  "apps.scan.rule.assignedSecret": "Hard-coded secret value",
  "apps.scan.rule.awsAccessKey": "AWS access key",
  "apps.scan.rule.githubPat": "GitHub fine-grained token",
  "apps.scan.rule.githubToken": "GitHub token",
  "apps.scan.rule.googleApiKey": "Google API key",
  "apps.scan.rule.jwt": "JSON Web Token",
  "apps.scan.rule.privateKey": "Private key",
  "apps.scan.rule.skKey": "API secret key (sk-)",
  "apps.scan.rule.slackToken": "Slack token",
  "apps.scan.rule.slackWebhook": "Slack webhook",
  "apps.scan.rule.stripeKey": "Stripe key",
  "apps.scan.scanning": "Scanning the app\u2019s files for secrets\u2026",
  "apps.scan.thenRead": "Then read it in the app:",
  "apps.scan.tooLarge": "The app is too large to scan",
  "apps.scan.tooManyBytes": "More than {max} bytes to scan for secrets",
  "apps.scan.tooManyFiles": "More than {max} files to scan for secrets",
  "apps.services.hint": "The services this app may reach, as its manifest declares them. Stacki holds it to this list.",
  "apps.services.listLabel": "{name} external services",
  "apps.services.ownAccount": "Each person\u2019s own account",
  "apps.services.title": "External services",
  "apps.settings.advanced": "Advanced",
  "apps.settings.hide": "Hide",
  "apps.settings.hideNamed": "Hide {name}",
  "apps.settings.hint": "Each person fills these in for themselves. Secret values are kept outside the project.",
  "apps.settings.needsBeforeStart": "{name} needs these before it can start. Secret values are kept outside the project.",
  "apps.settings.reading": "Reading settings\u2026",
  "apps.settings.required": "required",
  "apps.settings.requiredEmpty": { one: "{count} required setting is empty", other: "{count} required settings are empty" },
  "apps.settings.save": "Save settings",
  "apps.settings.saving": "Saving\u2026",
  "apps.settings.secretKept": "Kept outside the project, never committed.",
  "apps.settings.setUp": "Set up {name}",
  "apps.settings.show": "Show",
  "apps.settings.showNamed": "Show {name}",
  "apps.settings.title": "App settings",
  "apps.share.alsoSubmit": "Also submit to the marketplace",
  "apps.share.appsToShare": "Apps to share",
  "apps.share.available": "Available",
  "apps.share.back": "Back",
  "apps.share.checking": "Checking {owner}\u2019s repositories\u2026",
  "apps.share.clipboardFailed": "Stacki could not reach the clipboard.",
  "apps.share.copied": "Copied the repository link.",
  "apps.share.copyLink": "Copy link",
  "apps.share.created.commit": "A commit of {count} files on {branch}",
  "apps.share.created.releaseWithAsset": "The release {tag} with {asset}",
  "apps.share.created.releaseWithoutAsset": "The release {tag}, without its asset yet",
  "apps.share.created.repositoryPrivate": "The private repository {repository}, with a README on {branch}",
  "apps.share.created.repositoryPublic": "The public repository {repository}, with a README on {branch}",
  "apps.share.created.topic": "The {topic} topic on {repository}",
  "apps.share.createdBefore": "Created before it stopped; delete or finish them on GitHub:",
  "apps.share.creates": "Creates {address}",
  "apps.share.done": "Done",
  "apps.share.exists": "{name} already exists",
  "apps.share.failed": "Failed",
  "apps.share.installUpdates": "Install updates from this repository",
  "apps.share.invite": "Invite people",
  "apps.share.nameLabel": "Repository name",
  "apps.share.needsDesktop": "Sharing needs Stacki Desktop",
  "apps.share.noneDetail": "Apps installed from a file or added to the project folder can be shared to GitHub. Apps loaded from GitHub or the marketplace already live there.",
  "apps.share.noneTitle": "No apps to share",
  "apps.share.nothingCreated": "Nothing was created on GitHub.",
  "apps.share.organization": "Organization",
  "apps.share.ownerLabel": "Repository owner",
  "apps.share.personal": "Personal",
  "apps.share.progress": "Progress",
  "apps.share.reading": "Reading your GitHub sign-in\u2026",
  "apps.share.releaseOnGitHub": "Release {tag} is on GitHub.",
  "apps.share.repository": "Repository",
  "apps.share.sharePrivately": "Share privately",
  "apps.share.sharePublicly": "Share publicly",
  "apps.share.sharedPrivately": "Shared privately",
  "apps.share.sharedPublicly": "Shared publicly",
  "apps.share.sharing": "Sharing\u2026",
  "apps.share.signInDetail": "The app is shared with the account you publish with.",
  "apps.share.signInTitle": "Sign in with GitHub to share",
  "apps.share.signedInAs": "Signed in as {account}",
  "apps.share.step.addTopic": "Add the stacki-app topic",
  "apps.share.step.commit": "Commit the app\u2019s files",
  "apps.share.step.commitWithLicense": "Commit the app\u2019s files and the MIT license",
  "apps.share.step.createPrivate": "Create the private repository",
  "apps.share.step.createPublic": "Create the public repository",
  "apps.share.step.release": "Release the app bundle",
  "apps.share.studioDetail": "Studio holds no GitHub sign-in to create repositories with. Share the app from Stacki Desktop.",
  "apps.share.subject": "Share {name}",
  "apps.share.subjectMeta": "Version {version} \xB7 to GitHub",
  "apps.share.switching": "Switching\u2026",
  "apps.share.title": "Share app to GitHub",
  "apps.share.updateNotice": "The project gets an update notice when {name} publishes a new release.",
  "apps.share.visibility": "Visibility",
  "apps.share.working": "Working\u2026",
  "apps.source.file": "Uploaded file",
  "apps.source.fileNamed": "Uploaded file \xB7 {fileName}",
  "apps.source.githubTag": "GitHub \xB7 {tag}",
  "apps.source.local": "Project folder",
  "apps.source.localLong": "Added to the project folder",
  "apps.source.marketplace": "Stacki marketplace",
  "apps.source.marketplaceVersion": "Stacki marketplace \xB7 v{version}",
  "apps.uninstall.body": "Removes the app and its files from this project for everyone.",
  "apps.uninstall.confirm": "Uninstall",
  "apps.uninstall.title": "Uninstall {name}?",
  "apps.updates.additions": "New in v{version}: {additions}.",
  "apps.updates.adminCanInstall": "An admin can install this update.",
  "apps.updates.adminOnly": "Admin only",
  "apps.updates.automatically": "Update automatically",
  "apps.updates.automaticallyHint": "Install new versions of this app as they are released. Only turn this on for a publisher you trust.",
  "apps.updates.automaticallyNamed": "Update {name} automatically",
  "apps.updates.available": { one: "An app update is available", other: "{count} app updates are available" },
  "apps.updates.availableVersion": "Update available \xB7 v{version}",
  "apps.updates.listLabel": "{name} updates",
  "apps.updates.needsApproval": "Update needs your OK \xB7 v{version}",
  "apps.updates.title": "Updates",
  "apps.updates.update": "Update",
  "apps.visibility.private": "Private",
  "apps.visibility.privateOrganization": "People in {owner} can install it with {action}.",
  "apps.visibility.privateUser": "Only you and people you invite can install it with {action}.",
  "apps.visibility.public": "Public",
  "apps.visibility.publicDetail": "Anyone can install it. Adds an MIT license."
};

// vendor/stacki/shared/properties/i18n/messages/en/assets.ts
var messages3 = {
  "assets.batch.compressed": {
    one: "{count} image compressed.",
    other: "{count} images compressed."
  },
  "assets.batch.deleteBody": "Moves selected assets to the trash. Site references are kept.",
  "assets.batch.deleteTitle": {
    one: "Delete {count} asset?",
    other: "Delete {count} assets?"
  },
  "assets.batch.deleted": {
    one: "{count} asset deleted.",
    other: "{count} assets deleted."
  },
  "assets.batch.failed": "{name}: {error}",
  "assets.batch.limit": "Select at most {count} files.",
  "assets.batch.progress": "{index} of {total} \xB7 {name}",
  "assets.compress.action": "Compress",
  "assets.compress.close": "Close compression dialog",
  "assets.compress.description": "Resize to 95% and convert at 95% quality. Site references update automatically, and originals move to Trash after success.",
  "assets.compress.format": "Select a file format",
  "assets.compress.skipped": "{count} already in this format will be skipped.",
  "assets.compress.title": {
    one: "Compress {count} image",
    other: "Compress {count} images"
  },
  "assets.connect.accessKeyId": "Access key ID",
  "assets.connect.accountId": "Account ID",
  "assets.connect.accountIdPlaceholder": "32 characters, from the R2 overview",
  "assets.connect.action": "Connect",
  "assets.connect.addressing.path": "In the path (endpoint/bucket)",
  "assets.connect.addressing.virtual": "As a subdomain (bucket.endpoint)",
  "assets.connect.advanced": "Advanced: enter keys manually",
  "assets.connect.bucket": "Bucket",
  "assets.connect.bucketAddress": "Bucket address",
  "assets.connect.bucketUrlPlaceholder": "Your bucket\u2019s public URL",
  "assets.connect.bunny.button": "Connect with Bunny",
  "assets.connect.bunny.choose": "Storage zone",
  "assets.connect.bunny.explain": "Paste your account API key: Stacki finds your storage zones with it, then keeps only the chosen zone\u2019s storage password, encrypted. The account key is not kept.",
  "assets.connect.bunny.find": "Find storage zones",
  "assets.connect.bunny.keyLabel": "Bunny account API key",
  "assets.connect.bunny.noZones": "This account has no storage zones yet.",
  "assets.connect.bunny.open": "Open my Bunny API key",
  "assets.connect.bunny.publicLabel": "Pull zone URL",
  "assets.connect.checking": "Checking the connection\u2026",
  "assets.connect.connecting": "Connecting\u2026",
  "assets.connect.edit": "Edit {label}",
  "assets.connect.endpoint": "Endpoint",
  "assets.connect.endpointPlaceholder": "Endpoint URL",
  "assets.connect.falkenstein": "Falkenstein (de, primary)",
  "assets.connect.hint.bunny": "The storage zone\u2019s password is under Storage \u2192 your zone \u2192 FTP & API Access. The pull zone URL is the CDN address connected to the zone (Pull zones \u2192 your zone \u2192 Hostnames).",
  "assets.connect.hint.r2": "Create an R2 API token with Object Read & Write for this bucket (R2 \u2192 Manage API tokens). The public URL is the bucket\u2019s public development URL or its custom domain (R2 \u2192 bucket \u2192 Settings).",
  "assets.connect.hint.s3": "Any host that speaks the S3 API: AWS S3, Backblaze B2, DigitalOcean Spaces, Wasabi, MinIO. The public URL is where the bucket\u2019s files are served from.",
  "assets.connect.host": "Host",
  "assets.connect.looking": "Looking\u2026",
  "assets.connect.name": "Name",
  "assets.connect.publicUrl": "Public URL",
  "assets.connect.pullZonePlaceholder": "Your pull zone\u2019s URL",
  "assets.connect.r2.button": "Connect with Cloudflare",
  "assets.connect.r2.choose": "Bucket",
  "assets.connect.r2.explain": "Cloudflare opens with an R2 read & write token filled in. Create it, then paste it here: Stacki finds your buckets with it and keeps only that bucket\u2019s keys, encrypted.",
  "assets.connect.r2.find": "Find buckets",
  "assets.connect.r2.keyLabel": "Cloudflare API token",
  "assets.connect.r2.noBuckets": "This token reaches no R2 buckets. Create a bucket first, or check the token\u2019s accounts.",
  "assets.connect.r2.open": "Create token in Cloudflare",
  "assets.connect.r2.publicLabel": "Public bucket URL",
  "assets.connect.region": "Region",
  "assets.connect.save": "Save connection",
  "assets.connect.secretAccessKey": "Secret access key",
  "assets.connect.title": "Connect media storage",
  "assets.connect.useAccount": "Use the account instead",
  "assets.connect.zonePassword": "Storage zone password",
  "assets.delete.action": "Delete",
  "assets.delete.body": "The file moves to your Bin. Anything on the site still pointing at {path} will stop finding it.",
  "assets.delete.title": "Delete {name}?",
  "assets.drop.limit": "Drop at most {count} files at once.",
  "assets.empty": "Empty folder. Drop files here or use the upload button.",
  "assets.error.allowance": "Asset allowance reached: 200 files or 100 MB. Remove or optimize assets before uploading.",
  "assets.error.changesNotRestored": "Could not restore asset changes",
  "assets.error.changesNotSaved": "Could not persist asset changes",
  "assets.error.folderHidden": "Folders containing hidden files or symbolic links cannot be moved",
  "assets.error.folderOutside": "{file} is not in one of the project's asset folders",
  "assets.error.folderUnsupportedEntry": "Folder contains an unsupported entry",
  "assets.error.invalidFolderName": "Invalid folder name",
  "assets.error.invalidName": "Invalid name",
  "assets.error.moveAcrossRoots": "Moving between public/ and src/ changes how the file is referenced (URL vs import), so it needs the references updated too. Not supported yet \u2014 move it outside the app and fix the references by hand.",
  "assets.error.moveIntoItself": "Cannot move a folder into itself.",
  "assets.error.moveMax": "Move at most {count} assets at once",
  "assets.error.moveMaxEntries": "Move at most {count} files and folders at once",
  "assets.error.nameTaken": "Something with that name already exists.",
  "assets.error.onlyFilesDeleted": "Only files can be deleted",
  "assets.error.replaceAudioNotFile": "{name} is an audio file; replace it with an audio file too, not a file.",
  "assets.error.replaceAudioNotImage": "{name} is an audio file; replace it with an audio file too, not an image.",
  "assets.error.replaceAudioNotVideo": "{name} is an audio file; replace it with an audio file too, not a video.",
  "assets.error.replaceExtension": "{name} must be replaced with another {extension} file.",
  "assets.error.replaceExtensionless": "{name} must be replaced with another extensionless file.",
  "assets.error.replaceFileNotAudio": "{name} is a file; replace it with a file too, not an audio file.",
  "assets.error.replaceFileNotImage": "{name} is a file; replace it with a file too, not an image.",
  "assets.error.replaceFileNotVideo": "{name} is a file; replace it with a file too, not a video.",
  "assets.error.replaceImageNotAudio": "{name} is an image; replace it with an image too, not an audio file.",
  "assets.error.replaceImageNotFile": "{name} is an image; replace it with an image too, not a file.",
  "assets.error.replaceImageNotVideo": "{name} is an image; replace it with an image too, not a video.",
  "assets.error.replaceVideoNotAudio": "{name} is a video; replace it with a video too, not an audio file.",
  "assets.error.replaceVideoNotFile": "{name} is a video; replace it with a video too, not a file.",
  "assets.error.replaceVideoNotImage": "{name} is a video; replace it with a video too, not an image.",
  "assets.error.singleName": "Use a single folder or file name",
  "assets.error.sourceCode": "{name} is source code, not an asset; edit it in the project instead.",
  "assets.error.storageRemoveFailed": "Could not remove the old stored asset",
  "assets.error.storageSaveFailed": "Could not save asset to durable storage",
  "assets.error.tooBig": "Asset exceeds {size} MB",
  "assets.error.tooLarge": "That file is too large to edit in the app (over 5 MB).",
  "assets.error.uploadMax": "Upload at most {count} files at once.",
  "assets.folderName": "Folder name",
  "assets.header.newFolder": "New folder",
  "assets.header.openFirst": "Open public/ or src/ first",
  "assets.header.select": "Select",
  "assets.header.selectTitle": "Select assets to compress or delete together",
  "assets.header.upload": "Upload assets",
  "assets.hosted.deleteFileBody": "The file is deleted from the host, and anything linking to it stops finding it. Hosts keep no bin, so this cannot be undone.",
  "assets.hosted.deleteFolderBody": "The folder and everything in it are deleted from the host. Hosts keep no bin, so this cannot be undone.",
  "assets.hosted.edit": "Edit connection\u2026",
  "assets.hosted.loading": "Loading\u2026",
  "assets.hosted.openLink": "Open link",
  "assets.hosted.refresh": "Refresh",
  "assets.hosted.remove": "Remove connection",
  "assets.hosted.rename": "Rename",
  "assets.hosted.truncated": "This folder holds more files than the panel lists.",
  "assets.hosted.tryAgain": "Try again",
  "assets.hosted.upload": "Upload media",
  "assets.input.accountId": "A Cloudflare account id is 32 letters and digits (a\u2013f, 0\u20139).",
  "assets.input.bucket": "A bucket name is 3\u201363 lower-case letters, digits, dots and hyphens.",
  "assets.input.choose": "Choose a {what}.",
  "assets.input.chooseAccount": "Choose a Cloudflare account.",
  "assets.input.key.paste": "Paste the {what}.",
  "assets.input.key.printable": "The {what} is printable characters on one line.",
  "assets.input.label": "A connection name is 1\u2013{max} characters.",
  "assets.input.region": "A region is lower-case letters, digits and hyphens, e.g. us-east-1.",
  "assets.input.secret.bunny": "Bunny Storage takes its storage zone password.",
  "assets.input.secret.keyPair": "This host takes an access key ID and a secret access key.",
  "assets.input.storageZone": "A storage zone name is letters, digits and hyphens.",
  "assets.input.url.endpointPath": "The S3 endpoint is the API address alone, without a path.",
  "assets.input.url.enter": "Enter the {what}.",
  "assets.input.url.https": "The {what} must use https (http only for localhost).",
  "assets.input.url.login": "The {what} cannot hold a login.",
  "assets.input.url.notUrl": "The {what} is not a URL.",
  "assets.input.url.queryFragment": "The {what} cannot hold a query or a fragment.",
  "assets.input.what.accessKeyId": "access key ID",
  "assets.input.what.account": "account",
  "assets.input.what.bucket": "bucket",
  "assets.input.what.bunnyKey": "Bunny API key",
  "assets.input.what.cloudflareToken": "Cloudflare API token",
  "assets.input.what.endpoint": "S3 endpoint",
  "assets.input.what.fileUrl": "file URL",
  "assets.input.what.publicBucketUrl": "public bucket URL",
  "assets.input.what.publicUrl": "public URL",
  "assets.input.what.pullZoneUrl": "pull zone URL",
  "assets.input.what.secretAccessKey": "secret access key",
  "assets.input.what.storagePassword": "storage password",
  "assets.input.what.storageZone": "storage zone",
  "assets.item.detail": "{dimensions} \u2022 {size}",
  "assets.item.dimensions": "{width} x {height}",
  "assets.item.kindDetail": "{kind} \u2022 {size}",
  "assets.items.label": "Asset files",
  "assets.kind.audio": "Audio",
  "assets.kind.file": "File",
  "assets.kind.font": "Font",
  "assets.kind.image": "Image",
  "assets.kind.text": "Text",
  "assets.kind.video": "Video",
  "assets.link.copied": "Link copied",
  "assets.link.copyFailed": "Could not copy the link: {error}",
  "assets.listing.label": "assets",
  "assets.missing.message": "This project has no {folder} folder yet.",
  "assets.missing.upload": "Upload an asset",
  "assets.pick.audio": "Choose an audio file",
  "assets.pick.file": "Choose a file",
  "assets.pick.image": "Choose an image",
  "assets.pick.video": "Choose a video",
  "assets.provider.s3": "S3-compatible",
  "assets.request.failed": "The media request failed.",
  "assets.search.noMatch": "No assets match",
  "assets.search.placeholder": "Search assets",
  "assets.selection.all": "All assets",
  "assets.selection.compress": "Compress selected images",
  "assets.selection.compressAria": "Compress selected assets",
  "assets.selection.compressImages": {
    one: "{count} image",
    other: "{count} images"
  },
  "assets.selection.compressNone": "None of the selected files can be compressed: only PNG, JPEG, WebP, AVIF and TIFF images can.",
  "assets.selection.compressSome": {
    one: "Compress {images}; {count} other file is skipped (only PNG, JPEG, WebP, AVIF and TIFF can be compressed)",
    other: "Compress {images}; {count} other files are skipped (only PNG, JPEG, WebP, AVIF and TIFF can be compressed)"
  },
  "assets.selection.count": "{selected} of {total}",
  "assets.selection.delete": "Delete selected assets",
  "assets.selection.limit": "Select up to {count} files at a time",
  "assets.selection.select": "Select {name}",
  "assets.selection.selectAll": "Select all assets",
  "assets.selection.selectAllTitle": "Select all",
  "assets.selection.wait": "Wait for the current batch to finish",
  "assets.sort.label": "Sort: {sort}",
  "assets.sort.largest": "Largest first",
  "assets.sort.menu": "Sort assets",
  "assets.sort.nameAscending": "Alphabetical (A-Z)",
  "assets.sort.nameDescending": "Alphabetical (Z-A)",
  "assets.sort.newest": "Newest first",
  "assets.sort.oldest": "Oldest first",
  "assets.sort.smallest": "Smallest first",
  "assets.source.addConnector": "Add connector",
  "assets.source.project": "Project",
  "assets.source.removeBody": "Stacki forgets this host and its keys. The files on the host are not touched, and links to them keep working.",
  "assets.source.removeTitle": "Remove {label}?",
  "assets.source.switch": "Switch source",
  "assets.tile.clickToEdit": "{path} \u2014 click to edit",
  "assets.tile.compress": "Compress\u2026",
  "assets.tile.copyLink": "Copy link",
  "assets.tile.options": "Options for {name}",
  "assets.tile.replace": "Replace\u2026",
  "assets.tile.use": "Use {path}",
  "assets.title": "Assets",
  "assets.toast.alreadyGone": "That asset was already gone.",
  "assets.toast.nameGone": "{name} was already gone.",
  "assets.toast.replaced": "Replaced {name}.",
  "assets.undo.move": "move {name}",
  "assets.undo.rename": "rename to {name}",
  "assets.upload.limit": "Upload 1 to {max} files at once.",
  "assets.upload.nothing": "Nothing was uploaded.",
  "assets.view.compact": "List - Small",
  "assets.view.grid": "Grid",
  "assets.view.label": "View: {view}",
  "assets.view.list": "List",
  "assets.view.menu": "Asset view"
};

// vendor/stacki/shared/properties/i18n/messages/en/audits.ts
var messages4 = {
  "audits.check.ariaHiddenFocusable.title": "Hidden but focusable",
  "audits.check.ariaHiddenFocusable.why": "Keyboard focus lands on something screen readers were told does not exist.",
  "audits.check.ariaRole.title": "Invalid role",
  "audits.check.ariaRole.why": "An unknown role is ignored, or misleads assistive technology about the element.",
  "audits.check.buttonName.title": "Unnamed button",
  "audits.check.buttonName.why": 'A button with no text or label is announced as "button" with no purpose.',
  "audits.check.canonical.title": "Canonical link",
  "audits.check.canonical.why": "Without a canonical URL, duplicate addresses split a page\u2019s ranking.",
  "audits.check.contrast.title": "Low contrast",
  "audits.check.contrast.why": "Low-contrast text is hard to read, in sunlight and for people with low vision.",
  "audits.check.controlLabel.title": "Unlabelled field",
  "audits.check.controlLabel.why": "People using screen readers or voice control cannot tell what to enter.",
  "audits.check.descriptionDuplicate.title": "Duplicate description",
  "audits.check.descriptionDuplicate.why": "The same snippet on many pages makes every result look alike.",
  "audits.check.descriptionLong.title": "Description too long",
  "audits.check.descriptionLong.why": "Search results cut a long description off mid-sentence.",
  "audits.check.descriptionMissing.title": "Missing description",
  "audits.check.descriptionMissing.why": "Without one, search engines pick a snippet from the page, often a poor one.",
  "audits.check.descriptionShort.title": "Description too short",
  "audits.check.descriptionShort.why": "Search results pad a short description with text taken from the page.",
  "audits.check.duplicateId.title": "Duplicate id",
  "audits.check.duplicateId.why": "Labels, anchors and ARIA references point at the first element only.",
  "audits.check.h1Count.title": "Missing or extra h1",
  "audits.check.h1Count.why": "One top heading tells readers and search engines what the page is about.",
  "audits.check.headingOrder.title": "Skipped heading level",
  "audits.check.headingOrder.why": "Skipping levels breaks the outline people navigate a page by.",
  "audits.check.htmlLang.title": "Missing lang",
  "audits.check.htmlLang.why": "Screen readers pick the wrong voice and pronunciation without a lang attribute.",
  "audits.check.iframeTitle.title": "Untitled iframe",
  "audits.check.iframeTitle.why": "Screen readers list frames by title; an untitled frame is a mystery.",
  "audits.check.imgAlt.title": "Missing alt text",
  "audits.check.imgAlt.why": "Screen readers announce the file name, or nothing, instead of what the image shows.",
  "audits.check.imgDecorative.title": "Decorative image has alt",
  "audits.check.imgDecorative.why": "An image marked decorative is still announced while its alt text is not empty.",
  "audits.check.imgDimensions.title": "Image without size",
  "audits.check.imgDimensions.why": "The page jumps when the image loads (layout shift), which hurts Core Web Vitals.",
  "audits.check.imgLarge.title": "Large image",
  "audits.check.imgLarge.why": "Large images slow the page\u2019s first paint, most of all on mobile.",
  "audits.check.launch404.title": "No 404 page",
  "audits.check.launch404.why": "A missing page shows the host\u2019s bare error instead of a way back into the site.",
  "audits.check.launchAnalytics.title": "No analytics",
  "audits.check.launchAnalytics.why": "Without analytics nobody can tell how the site is used after launch.",
  "audits.check.launchFavicon.title": "No favicon",
  "audits.check.launchFavicon.why": "Tabs, bookmarks and search results show a blank icon.",
  "audits.check.launchSocialImage.title": "No social image",
  "audits.check.launchSocialImage.why": "Links shared on social media show no picture, or a broken one.",
  "audits.check.linkBroken.title": "Broken link",
  "audits.check.linkBroken.why": "Visitors and crawlers land on a 404.",
  "audits.check.linkName.title": "Unnamed link",
  "audits.check.linkName.why": 'Assistive technology announces only "link", so nobody can tell where it goes.',
  "audits.check.linkNoopener.title": "New tab without noopener",
  "audits.check.linkNoopener.why": "A page opened in a new tab can reach back into this one through window.opener.",
  "audits.check.linkText.title": "Vague link text",
  "audits.check.linkText.why": '"Click here" says nothing out of context, to people or to search engines.',
  "audits.check.noindex.title": "Hidden from search",
  "audits.check.noindex.why": "A noindex robots tag keeps the page out of every search engine.",
  "audits.check.perfBlocking.title": "Render-blocking resource",
  "audits.check.perfBlocking.why": "A stylesheet or script in the head holds back the first paint.",
  "audits.check.perfCls.title": "Layout shift",
  "audits.check.perfCls.why": "Content jumps as the page loads, and people click the wrong thing.",
  "audits.check.perfFetchpriority.title": "Largest image not prioritised",
  "audits.check.perfFetchpriority.why": "The browser fetches the most important image no sooner than the rest.",
  "audits.check.perfFontDisplay.title": "Font without font-display",
  "audits.check.perfFontDisplay.why": "Text stays invisible while the font downloads.",
  "audits.check.perfImageFormat.title": "Image not AVIF or WebP",
  "audits.check.perfImageFormat.why": "Modern formats are much smaller for the same picture.",
  "audits.check.perfImageSize.title": "Oversized image",
  "audits.check.perfImageSize.why": "The file has far more pixels than the page shows.",
  "audits.check.perfLazy.title": "Offscreen image loads eagerly",
  "audits.check.perfLazy.why": "Images below the fold compete with what people see first.",
  "audits.check.perfLcp.title": "Slow largest paint",
  "audits.check.perfLcp.why": "The biggest element takes long to appear, so the page feels slow to load.",
  "audits.check.perfTbt.title": "Long tasks",
  "audits.check.perfTbt.why": "Script work blocks the page from answering clicks and typing.",
  "audits.check.perfThirdParty.title": "Third-party script",
  "audits.check.perfThirdParty.why": "Scripts from other origins add requests and work you do not control.",
  "audits.check.perfWeight.title": "Heavy page",
  "audits.check.perfWeight.why": "Many or large downloads slow the page on mobile connections.",
  "audits.check.placeholderImage.title": "Placeholder image",
  "audits.check.placeholderImage.why": "A stock placeholder image is not the picture the page needs.",
  "audits.check.placeholderText.title": "Placeholder text",
  "audits.check.placeholderText.why": "Lorem ipsum and template copy look unfinished and say nothing to readers or search engines.",
  "audits.check.robots.title": "No robots.txt",
  "audits.check.robots.why": "Crawlers look for robots.txt first, and for the sitemap it names.",
  "audits.check.sitemap.title": "No sitemap",
  "audits.check.sitemap.why": "A sitemap tells search engines which pages exist.",
  "audits.check.socialTags.title": "Missing social tags",
  "audits.check.socialTags.why": "Shared links show no title, description or image in social previews.",
  "audits.check.structuredData.title": "No structured data",
  "audits.check.structuredData.why": "Schema markup can earn rich results such as breadcrumbs and articles.",
  "audits.check.styleGlobal.title": "Style block not global",
  "audits.check.styleGlobal.why": "A scoped {style} only reaches this file\u2019s own markup; the project writes global styles.",
  "audits.check.styleLayer.title": "Global styles outside @layer",
  "audits.check.styleLayer.why": "Unlayered global rules outrank every layer, so components cannot override them.",
  "audits.check.svgButtonLabel.title": "Unlabelled icon button",
  "audits.check.svgButtonLabel.why": "The icon is drawn, not read: without a label the control has no name.",
  "audits.check.tabindexPositive.title": "Positive tabindex",
  "audits.check.tabindexPositive.why": "A positive tabindex jumps the element ahead of the page\u2019s reading order.",
  "audits.check.titleDuplicate.title": "Duplicate title",
  "audits.check.titleDuplicate.why": "Pages with the same title compete with each other in search results.",
  "audits.check.titleMissing.title": "Missing title",
  "audits.check.titleMissing.why": "The title is the tab name, the bookmark and the search result headline.",
  "audits.check.tokenColor.title": "Raw colour",
  "audits.check.tokenColor.why": "A colour written by hand drifts from the palette; a variable keeps every use in step.",
  "audits.check.tokenUnit.title": "Unit outside a variable",
  "audits.check.tokenUnit.why": "The project keeps this unit inside variable definitions only.",
  "audits.check.tokenValue.title": "Raw value",
  "audits.check.tokenValue.why": "Spacing, radius and type written by hand drift from the scale the variables define.",
  "audits.check.videoAutoplay.title": "Autoplaying video",
  "audits.check.videoAutoplay.why": "Sound that starts on its own, or motion with no way to stop it, gets in the way.",
  "audits.detail.alsoOn": '"{value}" is also on {routes}',
  "audits.detail.alsoOnMore": '"{value}" is also on {routes} and {more} more',
  "audits.detail.ariaHiddenFocusable": 'aria-hidden="true" on a focusable element',
  "audits.detail.autoplayWithoutOne": "Autoplays without {first}",
  "audits.detail.autoplayWithoutTwo": "Autoplays without {first} or {second}",
  "audits.detail.canonicalNotURL": 'href="{href}" is not a URL',
  "audits.detail.canonicalPointsAt": "Points at {path}, not {route}",
  "audits.detail.contrastRatio": "{ratio}:1, needs {required}:1 ({color} on {background})",
  "audits.detail.descriptionEmpty": "The meta description is empty",
  "audits.detail.descriptionLength": "{length} characters (aim for {min}\u2013{max})",
  "audits.detail.headNoCanonical": "{head} has no canonical link",
  "audits.detail.headNoDescription": "{head} has no meta description",
  "audits.detail.headNoTitle": "{head} has no {title}",
  "audits.detail.htmlNoLang": "{html} has no lang",
  "audits.detail.idReferenced": 'id="{id}" (referenced, so renaming needs a choice)',
  "audits.detail.idRepeatsInLoop": 'id="{id}" repeats on every item of a loop',
  "audits.detail.idRepeatsOnPage": 'id="{id}" appears more than once on the page',
  "audits.detail.imageMarkedDecorative": "{detail} (marked decorative)",
  "audits.detail.imageSize": "{source} is {kilobytes} KB",
  "audits.detail.langEmpty": "lang is empty",
  "audits.detail.launchNo404": "No src/pages/404 page",
  "audits.detail.launchNoAnalytics": "No analytics snippet in any page, and no analytics integration",
  "audits.detail.launchNoFavicon": "No page links an icon, and public/ has no favicon",
  "audits.detail.noRobots": "Neither public/robots.txt, a robots.txt endpoint nor a robots integration",
  "audits.detail.noSitemap": "No sitemap integration, sitemap endpoint or served sitemap",
  "audits.detail.noSocialImage": "No og:image on {route}",
  "audits.detail.noStructuredData": "No page writes application/ld+json structured data",
  "audits.detail.noindexLayout": 'content="{content}" hides every page using this layout',
  "audits.detail.perfImageSize": "{name}: {natural}px wide, shown at {shown}px (on {route})",
  "audits.detail.perfLcp": "{seconds} s to the largest paint (on {route})",
  "audits.detail.perfOnRoute": "{detail} (on {route})",
  "audits.detail.perfTbt": "{milliseconds} ms of blocking script (on {route})",
  "audits.detail.perfWeight": "{megabytes} MB in {requests} requests (dev server) (on {route})",
  "audits.detail.renderedH1Count": "The page renders {total} {h1} elements",
  "audits.detail.renderedNoCanonical": "The page renders no canonical link",
  "audits.detail.renderedNoDescription": "The page renders no meta description",
  "audits.detail.renderedNoH1": "The page renders no {h1}",
  "audits.detail.renderedNoTitle": "The page renders no {title}",
  "audits.detail.renderedTitleEmpty": "The rendered {title} is empty",
  "audits.detail.secondH1": "A second {h1} in this file",
  "audits.detail.socialImageBroken": "{url} does not load (on {route})",
  "audits.detail.socialMissing": "Missing {tags}",
  "audits.detail.styleNoLayer": "{styleGlobal} with no @layer",
  "audits.detail.styleNotGlobal": "{style} without is:global or is:inline",
  "audits.detail.titleEmpty": "{title} is empty",
  "audits.detail.writtenByComponent": "{detail} (written by the component here)",
  "audits.fix.addAltEmpty": 'Add alt=""',
  "audits.fix.addCanonical": "Add canonical link",
  "audits.fix.addDimensions": 'Add width="{width}" height="{height}"',
  "audits.fix.addFetchpriority": 'Add fetchpriority="high"',
  "audits.fix.addHeight": 'Add height="{height}"',
  "audits.fix.addLang": 'Add lang="{value}"',
  "audits.fix.addLazy": 'Add loading="lazy"',
  "audits.fix.addMetaDescription": "Add meta description",
  "audits.fix.addNoopener": 'Add rel="noopener"',
  "audits.fix.addOne": "Add {first}",
  "audits.fix.addTitle": "Add {title}",
  "audits.fix.addTitleFromSource": "Add title from its source",
  "audits.fix.addTwo": "Add {first} and {second}",
  "audits.fix.addWidth": 'Add width="{width}"',
  "audits.fix.linkTo": "Link to {route}",
  "audits.fix.makeHeadingH1": "Make this heading an h1",
  "audits.fix.makeIdsUnique": "Make ids unique per instance",
  "audits.fix.removeTabindex": "Remove tabindex",
  "audits.fix.renameTo": 'Rename to "{name}"',
  "audits.fix.setAltEmpty": 'Set alt=""',
  "audits.fix.setTabindexZero": 'Set tabindex="0"',
  "audits.fix.setValue": "Set {property} to {value}",
  "audits.fix.useVariable": "Use {variable}",
  "audits.ignorePage.aria": "Reason for ignoring this page",
  "audits.ignorePage.menu": "Ignore page\u2026",
  "audits.ignorePage.placeholder": "Why ignore every finding here?",
  "audits.ignorePage.submit": "Ignore page",
  "audits.ignored.all": "Unignore all",
  "audits.ignored.allConfirm": "Unignore all {count} items? Their findings return.",
  "audits.ignored.cancel": "Cancel",
  "audits.ignored.chip": "Ignored",
  "audits.ignored.empty": "Nothing is ignored.",
  "audits.ignored.page": "Whole page ignored: {reason}",
  "audits.ignored.pageCount": "{count} hidden",
  "audits.ignored.stale": "No longer reported",
  "audits.ignored.unignore": "Unignore",
  "audits.measure.characters": { one: "{count} character", other: "{count} characters" },
  "audits.review.refused.empty": "Type a value, or press Escape to keep the old one.",
  "audits.review.refused.illegal": "A value cannot hold semicolons, braces or comments.",
  "audits.review.refused.important": "Leave !important out: the declaration keeps its own.",
  "audits.review.refused.long": "That value is too long.",
  "audits.review.refused.unbalanced": "Close every bracket and quote.",
  "audits.review.refused.unsupported": "{property} does not accept that value.",
  "audits.review.value.connect": "Connect {property} to a variable",
  "audits.review.value.edit": "Edit {property}",
  "audits.review.value.group": "Changes all {count} identical values",
  "audits.review.value.label": "{property} value"
};

// vendor/stacki/shared/properties/i18n/messages/en/auditsUi.ts
var messages5 = {
  "auditsUi.after": "After",
  "auditsUi.again": "Audit again",
  "auditsUi.before": "Before",
  "auditsUi.breakdown.colour": { one: "{count} colour", other: "{count} colours" },
  "auditsUi.breakdown.radius": { one: "{count} radius", other: "{count} radius" },
  "auditsUi.breakdown.size": { one: "{count} size", other: "{count} size" },
  "auditsUi.breakdown.spacing": { one: "{count} spacing", other: "{count} spacing" },
  "auditsUi.breakdown.type": { one: "{count} type", other: "{count} type" },
  "auditsUi.breakdown.unit": { one: "{count} unit", other: "{count} unit" },
  "auditsUi.category": "Category",
  "auditsUi.changeLink": "Change link\u2026",
  "auditsUi.createPage": "Create {route}",
  "auditsUi.empty.auditing": "Auditing\u2026",
  "auditsUi.empty.clean": "No issues \xB7 checked {time}.",
  "auditsUi.empty.cleanOffline": "No issues \xB7 checked {time}. Start the preview to check contrast too.",
  "auditsUi.empty.nothing": "Nothing here.",
  "auditsUi.empty.open": "Open a page to audit it.",
  "auditsUi.filter.accessibility": "Accessibility",
  "auditsUi.filter.all": "All",
  "auditsUi.filter.content": "Placeholders",
  "auditsUi.filter.performance": "Speed",
  "auditsUi.filter.seo": "SEO and launch",
  "auditsUi.filter.tokens": "Design tokens",
  "auditsUi.find.find": "Find",
  "auditsUi.find.includeCode": "Include code",
  "auditsUi.find.inFiles": { one: "in {count} file", other: "in {count} files" },
  "auditsUi.find.matchCase": "Match case",
  "auditsUi.find.matches": { one: "{count} match", other: "{count} matches" },
  "auditsUi.find.none": "No matches",
  "auditsUi.find.onlyCode": "Only code matched; code is found, not rewritten.",
  "auditsUi.find.placeCode": "code",
  "auditsUi.find.placeText": "text",
  "auditsUi.find.replace": "Replace",
  "auditsUi.find.replaceAll": "Replace all",
  "auditsUi.find.replaceCmsLabel": "Replace in CMS entries",
  "auditsUi.find.replaceLabel": "Replace \u201C{query}\u201D",
  "auditsUi.find.replaceWith": "Replace with",
  "auditsUi.find.replacedCmsFiles": { one: "Replaced in {count} CMS file.", other: "Replaced in {count} CMS files." },
  "auditsUi.find.replacedFiles": { one: "Replaced in {count} file.", other: "Replaced in {count} files." },
  "auditsUi.find.searching": "Searching\u2026",
  "auditsUi.find.title": "Find & replace",
  "auditsUi.find.where": "Where",
  "auditsUi.find.wholeWord": "Whole word",
  "auditsUi.fix": "Fix",
  "auditsUi.fix.busy": "The open page is busy saving; try again in a moment.",
  "auditsUi.fix.fileChanged": "The file changed before the fix could be written ({reason}).",
  "auditsUi.fix.moved": "The {element} this fix is for has moved; audit again.",
  "auditsUi.fix.notEditable": "This file cannot be edited visually.",
  "auditsUi.fix.styleBlockChanged": "The style block changed since the audit; audit again.",
  "auditsUi.fix.stylesheetChanged": "The stylesheet changed since the audit; audit again.",
  "auditsUi.fix.stylesheetSwapsOnly": "Only text swaps are made in a stylesheet.",
  "auditsUi.fix.swapAlone": "A text swap is made with its node or its file, not on its own.",
  "auditsUi.fix.textChanged": "The text this change is for has changed; search again.",
  "auditsUi.fixAllLabel": "Fix audit findings",
  "auditsUi.fixWithAI": "Fix with AI",
  "auditsUi.fixed.many": { one: "Fixed {fixed} in {count} file.", other: "Fixed {fixed} in {count} files." },
  "auditsUi.fixed.one": "Fixed.",
  "auditsUi.fixesReady": { one: "{count} fix ready", other: "{count} fixes ready" },
  "auditsUi.fixes.info": "What Apply will change",
  "auditsUi.fixes.line": "line {line}",
  "auditsUi.fixes.more": { one: "+ {count} more", other: "+ {count} more" },
  "auditsUi.fixes.title": { one: "Apply will make {count} change", other: "Apply will make {count} changes" },
  "auditsUi.group.colour": "Colour",
  "auditsUi.group.radius": "Radius",
  "auditsUi.group.size": "Size",
  "auditsUi.group.spacing": "Spacing",
  "auditsUi.group.type": "Type",
  "auditsUi.group.unit": "Unit",
  "auditsUi.handOff.partial": "{message} The first {count} went; send the rest after.",
  "auditsUi.ignoreButton": "Ignore",
  "auditsUi.ignoreMenu": "Ignore\u2026",
  "auditsUi.ignoreReason": "Reason for ignoring",
  "auditsUi.ignoreWhy": "Why ignore it?",
  "auditsUi.ignoreWriteFailed": "Couldn\u2019t update .stacki/audits.json: {error}",
  "auditsUi.ignoredNote": "Ignored: {reason}",
  "auditsUi.linkTo": "Link to",
  "auditsUi.linkToLabel": "Link to {route}",
  "auditsUi.menu.closeFind": "Close find & replace",
  "auditsUi.menu.configure": "Configure checks\u2026",
  "auditsUi.menu.find": "Find & replace\u2026",
  "auditsUi.menu.hideIgnored": "Hide ignored",
  "auditsUi.menu.hideSearch": "Hide search",
  "auditsUi.menu.sendAll": "Send all to AI",
  "auditsUi.menu.showIgnored": "Show ignored ({count})",
  "auditsUi.more": "More",
  "auditsUi.options": "Audit options",
  "auditsUi.perf.allPages": "All pages",
  "auditsUi.perf.error.stopped": "The page stopped loading.",
  "auditsUi.perf.error.timeout": "The page took too long to load.",
  "auditsUi.perf.error.unreachable": "Couldn\u2019t reach the dev server.",
  "auditsUi.perf.failed": "Couldn\u2019t measure {route}",
  "auditsUi.perf.failedThis": "Couldn\u2019t measure this page",
  "auditsUi.perf.footer": "Dev server \xB7 approximate",
  "auditsUi.perf.footerMeasured": "Dev server \xB7 approximate \xB7 measured {ago}",
  "auditsUi.perf.measureAgain": "Measure again",
  "auditsUi.perf.measuring": "Measuring {route}",
  "auditsUi.perf.measuringThis": "Measuring this page",
  "auditsUi.perf.metric.cls.hint": "Cumulative Layout Shift: how much content jumps while loading. Good under 0.1.",
  "auditsUi.perf.metric.cls.label": "CLS",
  "auditsUi.perf.metric.lcp.hint": "Largest Contentful Paint: when the biggest element appears. Good under 2.5 s.",
  "auditsUi.perf.metric.lcp.label": "LCP",
  "auditsUi.perf.metric.requests.hint": "Requests the page makes. The dev server serves one per module, so this runs high.",
  "auditsUi.perf.metric.requests.label": "Requests",
  "auditsUi.perf.metric.tbt.hint": "Total Blocking Time: script work that blocks clicks and typing. Good under 200 ms.",
  "auditsUi.perf.metric.tbt.label": "TBT",
  "auditsUi.perf.metric.transfer.hint": "Everything downloaded. The dev server serves unbundled modules, so this runs high.",
  "auditsUi.perf.metric.transfer.label": "Transfer",
  "auditsUi.perf.rating.fair": "Needs work",
  "auditsUi.perf.rating.good": "Good",
  "auditsUi.perf.rating.poor": "Poor",
  "auditsUi.perf.score": "Score {score} out of 100",
  "auditsUi.perf.startPreview": "Start the preview to measure this page\u2019s speed.",
  "auditsUi.perf.stepCollecting": "Collecting metrics\u2026",
  "auditsUi.perf.stepLoading": "Loading the page in a hidden window\u2026",
  "auditsUi.pickPage": "Pick a page\u2026",
  "auditsUi.pill.page": "{count} on this page",
  "auditsUi.pill.pageTitle": "Findings on the open page and the components it uses",
  "auditsUi.pill.siteTitle": "Findings across the site",
  "auditsUi.progress.files": "Reading files \xB7 {done} of {total}",
  "auditsUi.progress.pages": "Checking pages \xB7 {done} of {total}",
  "auditsUi.review.applyCount": "Apply {count}",
  "auditsUi.review.applyExact": { one: "Apply {count} exact fix", other: "Apply {count} exact fixes" },
  "auditsUi.review.button": "Review",
  "auditsUi.review.changes": "Changes",
  "auditsUi.review.declaration": "Declaration",
  "auditsUi.review.file": "File",
  "auditsUi.review.goToRule": "Go to the rule",
  "auditsUi.review.groupIdentical": "Group identical",
  "auditsUi.review.hasFix": "Has a fix",
  "auditsUi.review.ignoreFile": "Ignore this file",
  "auditsUi.review.ignoreProperty": "Ignore {property} in this file",
  "auditsUi.review.ignoreThese": "Ignore these {count}",
  "auditsUi.review.ignoreThis": "Ignore this value",
  "auditsUi.review.kind": "Kind",
  "auditsUi.review.kindOfValue": "Kind of value",
  "auditsUi.review.line": "Line",
  "auditsUi.review.noMatch": "Nothing matches these filters.",
  "auditsUi.review.rowsMax": "Showing the first {count}; narrow the filters to see the rest.",
  "auditsUi.review.selector": "Selector",
  "auditsUi.review.showUses": "Show each use",
  "auditsUi.review.styleBlocks": "Style blocks",
  "auditsUi.review.suggestion": "Suggestion",
  "auditsUi.review.title": "Raw values",
  "auditsUi.review.useVariable": "Use variable",
  "auditsUi.review.useVariables": "Use variables",
  "auditsUi.review.window": "Review raw values",
  "auditsUi.scope.label": "Audit scope",
  "auditsUi.scope.page": "This page",
  "auditsUi.scope.site": "Site",
  "auditsUi.searchFindings": "Search findings",
  "auditsUi.speedClear": "No speed issues found",
  "auditsUi.stopIgnoring": "Stop ignoring",
  "auditsUi.title": "Audits",
  "auditsUi.variableToUse": "Variable to use"
};

// vendor/stacki/shared/properties/i18n/messages/en/cms.ts
var messages6 = {
  "cms.add": "Add",
  "cms.addField": "Add field",
  "cms.addItem": "Add item",
  "cms.check.endsWith": "Ends with",
  "cms.check.gt": "Greater than",
  "cms.check.includes": "Contains",
  "cms.check.integer": "Whole numbers only",
  "cms.check.lengthCharacters": "Exactly this many characters",
  "cms.check.lengthItems": "Exactly this many items",
  "cms.check.lengthPlain": "Exactly this many",
  "cms.check.letterCase": "Letter case",
  "cms.check.lt": "Less than",
  "cms.check.maxCharacters": "Maximum characters",
  "cms.check.maxDate": "Latest date",
  "cms.check.maxHeight": "Maximum image height (pixels)",
  "cms.check.maxItems": "Maximum items",
  "cms.check.maxNumber": "Maximum number",
  "cms.check.maxWidth": "Maximum image width (pixels)",
  "cms.check.minCharacters": "Minimum characters",
  "cms.check.minDate": "Earliest date",
  "cms.check.minHeight": "Minimum image height (pixels)",
  "cms.check.minItems": "Minimum items",
  "cms.check.minNumber": "Minimum number",
  "cms.check.minWidth": "Minimum image width (pixels)",
  "cms.check.multipleOf": "Multiple of",
  "cms.check.nullable": "Allow an empty value (null)",
  "cms.check.pattern": "Matches the pattern (regular expression)",
  "cms.check.sign": "Sign",
  "cms.check.startsWith": "Starts with",
  "cms.check.trim": "Trim spaces from both ends",
  "cms.choice.any": "Any",
  "cms.choice.asTyped": "As typed",
  "cms.choice.lowercase": "Lowercase",
  "cms.choice.negative": "Negative (below 0)",
  "cms.choice.nonnegative": "Zero or positive",
  "cms.choice.nonpositive": "Zero or negative",
  "cms.choice.positive": "Positive (above 0)",
  "cms.choice.uppercase": "Uppercase",
  "cms.collection.unreadable": "unreadable",
  "cms.color.choose": "Choose the colour for {label}",
  "cms.color.name": "colour",
  "cms.delete": "Delete",
  "cms.draft.chooseTarget": "Choose the collection the field refers to.",
  "cms.draft.fieldExists": "A field named {name} already exists.",
  "cms.draft.fieldsChanged": "The fields changed since they were listed.",
  "cms.draft.fieldsMax": "A collection holds at most {count} fields.",
  "cms.draft.memberExists": "Two fields are named \u201C{name}\u201D.",
  "cms.draft.membersDepth": "Groups nest at most {count} deep.",
  "cms.draft.membersEmpty": "Give each item at least one field.",
  "cms.draft.membersMax": "A group holds at most {count} fields.",
  "cms.draft.nameField": "Name the field.",
  "cms.draft.noField": "There is no field {name}.",
  "cms.field.emptyGroup": "Empty group.",
  "cms.field.expression": "expression",
  "cms.field.noFields": "These items have no fields yet \u2014 add them in the collection\u2019s settings.",
  "cms.fieldType.boolean.hint": "On or off",
  "cms.fieldType.boolean.label": "Toggle",
  "cms.fieldType.code.hint": "A computed value",
  "cms.fieldType.code.label": "Code",
  "cms.fieldType.color.hint": "A hex value",
  "cms.fieldType.color.label": "Color",
  "cms.fieldType.date.hint": "A calendar date",
  "cms.fieldType.date.label": "Date",
  "cms.fieldType.email.hint": "An address",
  "cms.fieldType.email.label": "Email",
  "cms.fieldType.image.hint": "From your assets",
  "cms.fieldType.image.label": "Image",
  "cms.fieldType.link.hint": "A web address",
  "cms.fieldType.link.label": "Link",
  "cms.fieldType.list.hint": "Tags, bullets",
  "cms.fieldType.list.label": "List of text",
  "cms.fieldType.longtext.hint": "A paragraph",
  "cms.fieldType.longtext.label": "Long text",
  "cms.fieldType.number.hint": "A figure",
  "cms.fieldType.number.label": "Number",
  "cms.fieldType.object.hint": "Fields kept together",
  "cms.fieldType.object.label": "Group",
  "cms.fieldType.objects.hint": "A list of entries",
  "cms.fieldType.objects.label": "Repeating items",
  "cms.fieldType.phone.hint": "A number to call",
  "cms.fieldType.phone.label": "Phone",
  "cms.fieldType.text.hint": "A short line",
  "cms.fieldType.text.label": "Text",
  "cms.item.numbered": "Item {number}",
  "cms.itemCount": { one: "{count} item", other: "{count} items" },
  "cms.list.dragReorder": "Drag to reorder",
  "cms.list.empty": "Empty",
  "cms.list.emptyEntry": "(empty)",
  "cms.list.noItems": "No items",
  "cms.list.rename": "Rename",
  "cms.operations.fieldExists": "This level already has a \u201C{name}\u201D field.",
  "cms.panel.astroContent": "Astro content",
  "cms.panel.back": "All collections",
  "cms.panel.badgeOpen": "open",
  "cms.panel.badgeThisPage": "this page",
  "cms.panel.collectionName": "Collection name",
  "cms.panel.collectionSettings": "Collection settings",
  "cms.panel.collections": "collections",
  "cms.panel.connect": "Connect a CMS",
  "cms.panel.contentCollections": "Content Collections",
  "cms.panel.declaredIn": "Declared in {path}",
  "cms.panel.kindCustom": "Custom CMS",
  "cms.panel.newCollection": "New collection",
  "cms.panel.title": "Content",
  "cms.prop.typeAny": "Type any value",
  "cms.prop.useColourPicker": "Use the colour picker",
  "cms.saved": "Saved",
  "cms.settings.back": "Back to items",
  "cms.settings.backToTypes": "Back to field types",
  "cms.settings.chooseType": "Choose a field type",
  "cms.settings.codeKey": "Your code reads this as {key}.",
  "cms.settings.deleteCollection": "Delete collection",
  "cms.settings.deleteConfirmTitle": "Delete the {name} collection?",
  "cms.settings.deleteField": "Delete field",
  "cms.settings.deleteFieldBody": "Its content is removed from every item in this collection.",
  "cms.settings.deleteFieldTitle": "Delete the \u201C{name}\u201D field?",
  "cms.settings.deleteNamed": "Delete {name}",
  "cms.settings.deleteNote": "Moves the collection to the Trash. Pages that import src/{path} keep working \u2014 they switch to an empty list.",
  "cms.settings.done": "Done",
  "cms.settings.fieldsShared": { one: "Shared by {count} item.", other: "Shared by all {count} items." },
  "cms.settings.fieldsSingle": "This file holds one set of fields.",
  "cms.settings.fieldsTitle": "Collection fields",
  "cms.settings.hideFields": "Hide its fields",
  "cms.settings.nameExample": "e.g. {name}",
  "cms.settings.nameExampleText": "Subtitle",
  "cms.settings.nameLabel": "Name",
  "cms.settings.newField": "New {type} field",
  "cms.settings.noFields": "No fields yet.",
  "cms.settings.showFields": "Show its fields",
  "cms.settings.title": "{name} Settings",
  "cms.settings.typeFixed": "A field\u2019s type is set when it\u2019s created",
  "cms.settings.usageMore": "{files}, +{count} more",
  "cms.settings.usageNone": "No page uses it.",
  "cms.settings.usagePages": {
    one: "{count} page uses it ({files}). It will keep working, showing nothing, until you point it at other data.",
    other: "{count} pages use it ({files}). They will keep working, showing nothing, until you point them at other data."
  },
  "cms.slug.help": "The entry\u2019s id: its file name, and what references and getEntry() calls name it by.",
  "cms.slug.name": "Slug",
  "cms.toggle.off": "Off",
  "cms.toggle.on": "On",
  "cms.undo.edit": "content edit",
  "cms.video.author": "Author: {author}",
  "cms.video.loading": "Loading {host} video\u2026",
  "cms.video.open": "Open video",
  "cms.video.source": "Source: {source}",
  "cms.view.addFirst": "Add the first item",
  "cms.view.basicInfo": "Basic info",
  "cms.view.close": "Close the CMS",
  "cms.view.deleteBody": "It\u2019s removed from this collection.",
  "cms.view.deleteItem": "Delete item",
  "cms.view.deleteTitle": "Delete \u201C{title}\u201D?",
  "cms.view.duplicate": "Duplicate item",
  "cms.view.newItem": "New item",
  "cms.view.noFields": "This collection has no fields yet \u2014 add them in its settings.",
  "cms.view.noMatch": "No items match \u201C{query}\u201D.",
  "cms.view.nothingYet": "Nothing here yet.",
  "cms.view.search": "Search items",
  "cms.view.select": "Select an item to edit it.",
  "cms.view.unreadable": "This file can\u2019t be read as content \u2014 {detail}",
  "cms.view.value": "Value"
};

// vendor/stacki/shared/properties/i18n/messages/en/cmsBackend.ts
var messages7 = {
  "cmsBackend.body.description": "The entry\u2019s Markdown, below its frontmatter.",
  "cmsBackend.body.title": "Body",
  "cmsBackend.config.collectionExists": "A collection named \u201C{name}\u201D already exists.",
  "cmsBackend.config.collectionsNotClosed": "The content config\u2019s collections export is not closed.",
  "cmsBackend.config.nameUsed": "\u201C{name}\u201D is already used in the content config.",
  "cmsBackend.config.noCollections": "Stacki could not find `export const collections = {{ \u2026 }}` in the content config.",
  "cmsBackend.config.notListed": "{collection} is not in the content config\u2019s collections.",
  "cmsBackend.config.tooLarge": "The content config is too large to edit here.",
  "cmsBackend.connection.cannotTest": "This connection cannot be tested.",
  "cmsBackend.content.unreadable": "The content collection could not be read.",
  "cmsBackend.data.parseFailed": "{file} could not be parsed \u2014 {detail}",
  "cmsBackend.data.readFailed": "Could not read {file} \u2014 {detail}",
  "cmsBackend.data.tooLarge": "{file} is too large to edit here.",
  "cmsBackend.data.unreadableFormat": "Stacki cannot read {extension} data files yet.",
  "cmsBackend.entries.customLoader": "{collection} is built by a loader in this project, not stored in a file. Its entries are rebuilt from scratch on every sync, so anything written here would be overwritten.",
  "cmsBackend.entries.idsGenerated": "{collection} builds its ids in the loader, from the entry\u2019s own fields. The ids shown are the file paths, which is not what other collections reference.",
  "cmsBackend.entries.parserNote": "{collection} is parsed by a function in the content config before Astro sees it. Fields that are not in the file itself were made by that parser: they are shown, but editing one here would have nowhere to go.",
  "cmsBackend.entry.generated": "{collection} builds its ids in its loader, so its id cannot be changed by renaming a file.",
  "cmsBackend.entry.noId": "Nothing in {file} says what this entry\u2019s id is.",
  "cmsBackend.entry.parsed": "{collection} is parsed by a function in the content config, so its ids are not in the file.",
  "cmsBackend.fieldName.empty": "Name the field.",
  "cmsBackend.fieldName.invalid": "A field name starts with a letter and holds letters, digits, - and _.",
  "cmsBackend.fieldName.tooLong": { one: "A field name is at most {count} character.", other: "A field name is at most {count} characters." },
  "cmsBackend.media.bodyNotBytes": "The host sent a body that is not bytes.",
  "cmsBackend.media.bodyTooLarge": "The host sent more than {size} MB.",
  "cmsBackend.media.bunnyNoZone": "This Bunny account has no storage zone named {name}.",
  "cmsBackend.media.bunnyNotList": "Bunny Storage sent a listing that is not a list.",
  "cmsBackend.media.bunnyRefusedKey": "Bunny refused this API key. Use the account API key (Account settings \u2192 API key), not a storage zone password.",
  "cmsBackend.media.bunnyUnreadable": "Bunny Storage sent an unreadable listing.",
  "cmsBackend.media.cloudflareInactive": "This Cloudflare token is not active. Create a new one and paste it again.",
  "cmsBackend.media.cloudflareNoToken": "Cloudflare did not say which token this is.",
  "cmsBackend.media.cloudflareRefused": "Cloudflare refused the request.{detail}",
  "cmsBackend.media.fileGone": "That file is no longer there.",
  "cmsBackend.media.fileTooLarge": "{name} is larger than {size} MB.",
  "cmsBackend.media.missingInFolder": "{name} is no longer in this folder. Refresh and try again.",
  "cmsBackend.media.nameExists": "Something with that name already exists.",
  "cmsBackend.media.nestedTooDeep": "This folder is nested too deeply to change here.",
  "cmsBackend.media.status.limited": "The host is limiting requests. Try again in a moment.{detail}",
  "cmsBackend.media.status.notFound": "The host has no such bucket, zone or file.{detail}",
  "cmsBackend.media.status.refused": "The host refused the request ({status}).{detail}",
  "cmsBackend.media.status.refusedKeys": "The host refused the keys. Check them, and that they may read and write this bucket.{detail}",
  "cmsBackend.media.status.server": "The host had a problem ({status}). Try again in a moment.{detail}",
  "cmsBackend.media.tooManyFiles": "This folder holds more than {count} files; change it in the host\u2019s own dashboard.",
  "cmsBackend.media.tooManyFilesBunny": "This folder holds more than {count} files; change it in Bunny\u2019s own dashboard.",
  "cmsBackend.media.unreachable": "Could not reach {host}: {reason}",
  "cmsBackend.network.failed": "The CMS request failed.",
  "cmsBackend.payload.noDrafts": "{collection} has no drafts to publish or discard.",
  "cmsBackend.payload.noUpload": "Payload has no upload collection this account can see.",
  "cmsBackend.payload.notOrdered": "Payload collections are not ordered.",
  "cmsBackend.sample.answered": "That address answered {status}.",
  "cmsBackend.sample.answeredWith": "That address answered {status}: {detail}",
  "cmsBackend.sample.notFound": "Nothing was found at that address (404).",
  "cmsBackend.sample.refused": "That address refused the request ({status}). Check the header and its value.",
  "cmsBackend.sample.tooLarge": "That reply is larger than {size} MB, which is too much to sample.",
  "cmsBackend.sanity.answered": "Sanity answered {status}.",
  "cmsBackend.sanity.noKeyRole": "Your role in this Sanity project cannot create API keys (Administrator or Developer can). Ask an admin for one, then paste it with the key option beside the sign-in button.",
  "cmsBackend.sanity.signInFailed": "Sanity sign-in failed.",
  "cmsBackend.sanity.signInGone": "This Sanity sign-in is no longer running.",
  "cmsBackend.sanity.signInTimedOut": "Sanity sign-in timed out.",
  "cmsBackend.sanity.someone": "Someone",
  "cmsBackend.schema.collectionExists": "A collection named {name} already exists.",
  "cmsBackend.schema.fieldExists": "A field named {name} already exists.",
  "cmsBackend.schema.fieldsChanged": "The fields changed since they were listed. Reopen the settings.",
  "cmsBackend.schema.imageByHand": "Add `image` to the schema\u2019s function by hand, then add the field.",
  "cmsBackend.schema.noField": "There is no field {name}.",
  "cmsBackend.schema.noImageSchema": "This collection has no schema to add an image field to.",
  "cmsBackend.schema.noObject": "{collection} has no z.object({{ \u2026 }}) schema in the config to edit.",
  "cmsBackend.schema.notCollection": "{name} is not a collection in the content config.",
  "cmsBackend.schema.tooComplex": "{name} is written as a method or a very long chain; edit it in the config.",
  "cmsBackend.slug.empty": "A slug needs at least one letter or number",
  "cmsBackend.slug.saved": "Saved as \u201C{slug}\u201D",
  "cmsBackend.slug.taken": "Another item already uses this slug",
  "cmsBackend.slug.tooLong": { one: "At most {count} character", other: "At most {count} characters" }
};

// vendor/stacki/shared/properties/i18n/messages/en/cmsConnections.ts
var messages8 = {
  "cmsConnections.actions.connectSanity": "Connect Sanity",
  "cmsConnections.actions.logInSanity": "Log in with Sanity",
  "cmsConnections.actions.moreSanity": "More ways to connect Sanity",
  "cmsConnections.actions.pasteSanityKey": "Paste a Sanity key",
  "cmsConnections.collection.entry": "Collection entry",
  "cmsConnections.collection.invalid": "Invalid collection content",
  "cmsConnections.collection.shared": "Changes are shared live.",
  "cmsConnections.collection.source": "Source",
  "cmsConnections.collection.sourceLabel": "Collection source",
  "cmsConnections.dialog.title": "Connect a CMS",
  "cmsConnections.form.customKey": "Key (the header\u2019s value)",
  "cmsConnections.form.dataset": "Dataset",
  "cmsConnections.form.draftEndpoint": "Draft endpoint",
  "cmsConnections.form.hint.custom": "Stacki sends each canvas edit as JSON {{document, field, value, draft: true}} to this address with the header above.",
  "cmsConnections.form.hint.sanity": "Create one in sanity.io/manage \u2192 your project \u2192 API \u2192 Tokens, with the Editor role. It reads drafts and writes them.",
  "cmsConnections.form.keyHeader": "Key header",
  "cmsConnections.form.projectId": "Project ID",
  "cmsConnections.form.title.custom": "Connect a custom CMS",
  "cmsConnections.form.title.sanity": "Add a Sanity key",
  "cmsConnections.input.address.credentials": "The CMS address cannot hold a login or a fragment.",
  "cmsConnections.input.address.empty": "Enter the CMS address.",
  "cmsConnections.input.address.https": "The CMS address must use https (http only for localhost).",
  "cmsConnections.input.address.notURL": "The CMS address is not a URL.",
  "cmsConnections.input.address.query": "The CMS address cannot hold a query (?\u2026).",
  "cmsConnections.input.authChoice": "Choose an API key or a login for Payload.",
  "cmsConnections.input.collections.few": "Name a few Payload collections, or none to detect them.",
  "cmsConnections.input.collections.twice": "A Payload collection is named twice.",
  "cmsConnections.input.email": "Enter the email of the Payload account.",
  "cmsConnections.input.invalid.authCollection": "Invalid Payload auth collection.",
  "cmsConnections.input.invalid.collection": "Invalid Payload collection.",
  "cmsConnections.input.invalid.dataset": "Invalid Sanity dataset name.",
  "cmsConnections.input.invalid.header": "Invalid header name.",
  "cmsConnections.input.invalid.locale": "Invalid Payload locale.",
  "cmsConnections.input.invalid.projectId": "Invalid Sanity project id.",
  "cmsConnections.input.label": "A connection name is 1\u2013{max} characters.",
  "cmsConnections.input.password.enter": "Enter the password.",
  "cmsConnections.input.password.oneLine": "A password is one line.",
  "cmsConnections.input.secret.paste": "Paste the API key.",
  "cmsConnections.input.secret.printable": "An API key is printable characters on one line.",
  "cmsConnections.kind.custom": "Custom CMS",
  "cmsConnections.list.noEncryption": "This computer can\u2019t encrypt keys, so Stacki won\u2019t save any.",
  "cmsConnections.sanityDetected": "This site uses Sanity. Connect it to edit its content in Stacki.",
  "cmsConnections.signIn.browser": "Sign in on Sanity\u2019s page in your browser, then come back here. Stacki creates an Editor key for this site\u2019s project and keeps only that key.",
  "cmsConnections.signIn.cancelled": "Sign-in cancelled.",
  "cmsConnections.signIn.complete": "Connected.",
  "cmsConnections.signIn.connect": "Connect",
  "cmsConnections.signIn.creating": "Creating an Editor key for this project\u2026",
  "cmsConnections.signIn.envNote": "This site\u2019s .env names the project and dataset chosen below.",
  "cmsConnections.signIn.openAgain": "Open the browser again",
  "cmsConnections.signIn.project": "Project",
  "cmsConnections.signIn.starting": "Starting\u2026",
  "cmsConnections.signIn.tryAgain": "Try again",
  "cmsConnections.studio.pasteKey": "Paste a Sanity key to connect from Studio.",
  "cmsConnections.studio.payloadUnavailable": "Testing a Payload connection is not available in Stacki Studio yet. Use Stacki Desktop.",
  "cmsConnections.studio.requestFailed": "The CMS request failed.",
  "cmsConnections.studio.saveFailed": "Could not save the connection.",
  "cmsConnections.title": "CMS connections"
};

// vendor/stacki/shared/properties/i18n/messages/en/cmsRemote.ts
var messages9 = {
  "cmsRemote.actions.current": "Current",
  "cmsRemote.actions.discard": "Discard changes",
  "cmsRemote.actions.discardBody": "The unpublished changes to this item are thrown away. Sanity keeps them in its history.",
  "cmsRemote.actions.discardConfirm": "Discard",
  "cmsRemote.actions.discardTitle": "Discard changes?",
  "cmsRemote.actions.fixBeforePublishing": `Fix before publishing:
{problems}`,
  "cmsRemote.actions.history": "History",
  "cmsRemote.actions.more": "More",
  "cmsRemote.actions.noHistory": "No history yet.",
  "cmsRemote.actions.publish": "Publish",
  "cmsRemote.actions.publishing": "Publishing\u2026",
  "cmsRemote.actions.restore": "Restore",
  "cmsRemote.actions.restoreBody": "The item as it was {when} becomes its draft. Publish it to put it live.",
  "cmsRemote.actions.restoreTitle": "Restore this version?",
  "cmsRemote.actions.unpublish": "Unpublish",
  "cmsRemote.actions.unpublishBody": "It leaves the live site. Its content is kept as a draft you can publish again.",
  "cmsRemote.actions.unpublishConfirm": "Unpublish",
  "cmsRemote.actions.unpublishTitle": "Unpublish this item?",
  "cmsRemote.asset.noFile": "No file",
  "cmsRemote.asset.replace": "Replace",
  "cmsRemote.asset.upload": "Upload",
  "cmsRemote.asset.uploadAnImage": "Upload an image",
  "cmsRemote.asset.uploadImage": "Upload image",
  "cmsRemote.asset.uploading": "Uploading\u2026",
  "cmsRemote.cache.offline": "You\u2019re offline. This CMS\u2019s content shows when you reconnect.",
  "cmsRemote.collection.allCollections": "All collections",
  "cmsRemote.collection.itemCount": { one: "{count} item", other: "{count} items" },
  "cmsRemote.collection.name": "Collection name",
  "cmsRemote.collection.new": "New collection",
  "cmsRemote.collection.noneBody": "A collection keeps entries as Markdown files in src/content, typed by a schema.",
  "cmsRemote.collection.noneTitle": "No content collections yet.",
  "cmsRemote.collection.settings": "Collection settings",
  "cmsRemote.columns.choose": "Choose columns",
  "cmsRemote.columns.none": "No fields to show as columns.",
  "cmsRemote.common.item": "Item",
  "cmsRemote.common.no": "No",
  "cmsRemote.common.none": "None",
  "cmsRemote.common.off": "Off",
  "cmsRemote.common.on": "On",
  "cmsRemote.common.tryAgain": "Try again",
  "cmsRemote.common.yes": "Yes",
  "cmsRemote.delete.action": "Delete",
  "cmsRemote.delete.bodyCms": "{titles} will be deleted from {connection}, published and draft. Sanity keeps their history.",
  "cmsRemote.delete.bodyCmsMore": "{titles} and more will be deleted from {connection}, published and draft. Sanity keeps their history.",
  "cmsRemote.delete.bodyProject": "{titles} will be deleted from the project. {note}",
  "cmsRemote.delete.bodyProjectMore": "{titles} and more will be deleted from the project. {note}",
  "cmsRemote.delete.filesToTrash": "Their files move to the Trash.",
  "cmsRemote.delete.itemBodyCms": "It will be deleted from {connection}, published and draft. Sanity keeps its history.",
  "cmsRemote.delete.itemBodyProject": "It will be deleted from the project. {note}",
  "cmsRemote.delete.thisItem": "this item",
  "cmsRemote.delete.title": "Delete \u201C{title}\u201D?",
  "cmsRemote.delete.titleMany": { one: "Delete {count} item?", other: "Delete {count} items?" },
  "cmsRemote.field.choose": "Choose {field}\u2026",
  "cmsRemote.field.empty": "Empty",
  "cmsRemote.field.lockedOnce": "Set once: the Studio locks it after it is chosen.",
  "cmsRemote.field.readOnly": "Read-only in the Studio.",
  "cmsRemote.fieldHint.group": "Fields kept together as one object",
  "cmsRemote.fieldHint.list": "A list of items: plain values, or groups of fields like team members",
  "cmsRemote.fieldList.allFields": "All fields",
  "cmsRemote.fieldList.syncOff": "Keep in step",
  "cmsRemote.fieldList.syncOn": "Slug follows the name: click to edit it by hand",
  "cmsRemote.fieldSettings.advanced": "Advanced validation",
  "cmsRemote.fieldSettings.default": "Default",
  "cmsRemote.fieldSettings.defaultPlaceholder": "Used when an entry leaves it out",
  "cmsRemote.fieldSettings.example": "E.g. {value}",
  "cmsRemote.fieldSettings.helpPlaceholder": "Shown under the field\u2019s name to guide whoever edits it",
  "cmsRemote.fieldSettings.helpText": "Help text",
  "cmsRemote.fieldSettings.methodNote": "This field is written as a method in the content config: only its name, place and removal change here.",
  "cmsRemote.fieldSettings.name": "Name",
  "cmsRemote.fieldSettings.options": "Options",
  "cmsRemote.fieldSettings.optionsPlaceholder": "One option per line",
  "cmsRemote.fieldSettings.required": "This field is required",
  "cmsRemote.fieldSettings.savedAs": "Saved as {key}",
  "cmsRemote.fieldType.anyValue": "Any value",
  "cmsRemote.fieldType.color": "Color",
  "cmsRemote.fieldType.constant": "Constant",
  "cmsRemote.fieldType.custom": "Custom",
  "cmsRemote.fieldType.date": "Date",
  "cmsRemote.fieldType.dateTime": "Date/Time",
  "cmsRemote.fieldType.email": "Email",
  "cmsRemote.fieldType.file": "File",
  "cmsRemote.fieldType.group": "Group",
  "cmsRemote.fieldType.image": "Image",
  "cmsRemote.fieldType.keyValue": "Key\u2013value",
  "cmsRemote.fieldType.link": "Link",
  "cmsRemote.fieldType.list": "List",
  "cmsRemote.fieldType.location": "Location",
  "cmsRemote.fieldType.longText": "Long text",
  "cmsRemote.fieldType.multiImage": "Multi-image",
  "cmsRemote.fieldType.multiReference": "Multi-reference",
  "cmsRemote.fieldType.number": "Number",
  "cmsRemote.fieldType.option": "Option",
  "cmsRemote.fieldType.phone": "Phone",
  "cmsRemote.fieldType.plainText": "Plain text",
  "cmsRemote.fieldType.reference": "Reference",
  "cmsRemote.fieldType.richText": "Rich text",
  "cmsRemote.fieldType.slug": "Slug",
  "cmsRemote.fieldType.switch": "Switch",
  "cmsRemote.fieldType.videoLink": "Video link",
  "cmsRemote.group.fields": "Fields",
  "cmsRemote.item.backToList": "Back to the list",
  "cmsRemote.item.duplicate": "Duplicate",
  "cmsRemote.item.edited": "Edited {time}",
  "cmsRemote.item.publishedAt": "Published {time}",
  "cmsRemote.items.byHand": "Written by hand in the content config",
  "cmsRemote.items.fieldName": "Field name",
  "cmsRemote.items.fieldSettings": "Field settings",
  "cmsRemote.items.fieldType": "Field type",
  "cmsRemote.items.fields": "Fields of each item",
  "cmsRemote.items.group": "Group of fields",
  "cmsRemote.items.hint": "What each item in the list holds. Pick a group to give every item its own fields, like a team member\u2019s name and photo.",
  "cmsRemote.items.other": "Written by hand",
  "cmsRemote.items.removeField": "Remove field",
  "cmsRemote.items.title": "List items",
  "cmsRemote.list.add": "Add {name}",
  "cmsRemote.list.addPlaceholder": "Add {name}\u2026",
  "cmsRemote.list.dragToReorder": "Drag to reorder",
  "cmsRemote.list.itemNumber": "Item {number}",
  "cmsRemote.list.namedNumber": "{name} {number}",
  "cmsRemote.list.showAll": "Show all {count}",
  "cmsRemote.list.showFewer": "Show fewer",
  "cmsRemote.pending.blocked": "Fill in the required fields and a free slug first",
  "cmsRemote.pending.copy": "{title} (copy)",
  "cmsRemote.pending.create": "Create",
  "cmsRemote.pending.creating": "Creating\u2026",
  "cmsRemote.pending.fieldFailed": "The item was made, but {field}: {message}",
  "cmsRemote.pending.slugFailed": "The item was made, but its slug: {message}",
  "cmsRemote.pending.slugPlaceholder": "Made from the name when left empty",
  "cmsRemote.settings.addField": "Add field",
  "cmsRemote.settings.back": "Back",
  "cmsRemote.settings.backToItems": "Back to the items",
  "cmsRemote.settings.collection": "Collection",
  "cmsRemote.settings.deleteCollection": "Delete collection",
  "cmsRemote.settings.deleteCollectionBody": "Its entries move to the Trash, it leaves the content config, fields in other collections that point at it are removed, and code that reads it gets nothing to read.",
  "cmsRemote.settings.deleteCollectionTitle": "Delete {collection}?",
  "cmsRemote.settings.deleteField": "Delete field",
  "cmsRemote.settings.deleteFieldBody": "It is removed from the content config, and its value from every item.",
  "cmsRemote.settings.deleteFieldTitle": "Delete the {name} field?",
  "cmsRemote.settings.duplicateField": "Duplicate field",
  "cmsRemote.settings.fields": "Fields",
  "cmsRemote.settings.newField": "New {kind} field",
  "cmsRemote.settings.renameHint": "Renaming updates the content config and the code that reads this collection.",
  "cmsRemote.settings.renameHintSource": "Renaming updates the content config, {source} and the code that reads this collection.",
  "cmsRemote.settings.required": "Required",
  "cmsRemote.settings.save": "Save collection",
  "cmsRemote.settings.saveField": "Save field",
  "cmsRemote.settings.saving": "Saving\u2026",
  "cmsRemote.settings.selectFieldType": "Select field type",
  "cmsRemote.settings.title": "{collection} settings",
  "cmsRemote.source.astro": "Content Collections",
  "cmsRemote.source.custom": "Custom CMS",
  "cmsRemote.status.changed": "Edited",
  "cmsRemote.status.draft": "Draft",
  "cmsRemote.status.published": "Published",
  "cmsRemote.time.hoursAgo": "{count} h ago",
  "cmsRemote.time.justNow": "just now",
  "cmsRemote.time.minutesAgo": "{count} min ago",
  "cmsRemote.validation.atLeastCharacters": { one: "At least {count} characters", other: "At least {count} characters" },
  "cmsRemote.validation.atLeastItems": { one: "At least {count} items", other: "At least {count} items" },
  "cmsRemote.validation.atLeastValue": "At least {limit}",
  "cmsRemote.validation.atMostCharacters": { one: "At most {count} characters", other: "At most {count} characters" },
  "cmsRemote.validation.atMostItems": { one: "At most {count} items", other: "At most {count} items" },
  "cmsRemote.validation.atMostValue": "At most {limit}",
  "cmsRemote.validation.email": "Not an email address",
  "cmsRemote.validation.exactlyCharacters": { one: "Exactly {count} characters", other: "Exactly {count} characters" },
  "cmsRemote.validation.exactlyItems": { one: "Exactly {count} items", other: "Exactly {count} items" },
  "cmsRemote.validation.exactlyValue": "Exactly {limit}",
  "cmsRemote.validation.fieldProblem": "{field}: {problem}",
  "cmsRemote.validation.integer": "Must be a whole number",
  "cmsRemote.validation.link": "Not a valid link",
  "cmsRemote.validation.positive": "Must be positive",
  "cmsRemote.validation.required": "Required",
  "cmsRemote.validation.requiredField": "{field} is required",
  "cmsRemote.validation.unique": "Items must be unique",
  "cmsRemote.value.latitude": "Latitude",
  "cmsRemote.value.longitude": "Longitude",
  "cmsRemote.view.chooseEvery": "Choose every item",
  "cmsRemote.view.clearSearch": "Clear search",
  "cmsRemote.view.columnName": "Name",
  "cmsRemote.view.columnStatus": "Status",
  "cmsRemote.view.columnUpdated": "Updated",
  "cmsRemote.view.emptyFirstBody": "Add the first item to start filling this collection.",
  "cmsRemote.view.emptyNoMatch": "No items match \u201C{query}\u201D",
  "cmsRemote.view.emptyNone": "No {collection} yet",
  "cmsRemote.view.emptySearchBody": "Try another word, or clear the search to see every item.",
  "cmsRemote.view.newItem": "New item",
  "cmsRemote.view.search": "Search {collection}\u2026",
  "cmsRemote.view.select": "Select\u2026",
  "cmsRemote.view.selectCollection": "Select {collection}\u2026",
  "cmsRemote.view.selected": "{count} {collection} selected",
  "cmsRemote.view.sortLargest": "Largest first",
  "cmsRemote.view.sortSmallest": "Smallest first"
};

// vendor/stacki/shared/properties/i18n/messages/en/componentProps.ts
var messages10 = {
  "componentProps.attributes.addDefault": "Add default attribute",
  "componentProps.attributes.connections": "Connections",
  "componentProps.attributes.connectionsCount": { one: "Connections: {count} element", other: "Connections: {count} elements" },
  "componentProps.attributes.defaultName": "Default attribute {number} name",
  "componentProps.attributes.defaultValue": "Default attribute {number} value",
  "componentProps.attributes.defaults": "Default attributes",
  "componentProps.attributes.defaultsDiffer": "The connected elements have different defaults; editing one gives every one of them these.",
  "componentProps.attributes.name": "Name",
  "componentProps.attributes.namePlaceholder": "name",
  "componentProps.attributes.noSpread": "No element spreads {spread} yet. Connect one from its Attributes bind dot.",
  "componentProps.attributes.passThrough": "Passes any other attributes through {spread}.",
  "componentProps.attributes.removeDefault": "Remove default attribute {name}",
  "componentProps.attributes.rowKind": { one: "Attributes \xB7 {count} element", other: "Attributes \xB7 {count} elements" },
  "componentProps.attributes.select": "Select {name}",
  "componentProps.attributes.title": "Attributes property",
  "componentProps.attributes.tooltipDefault": "Attributes an instance adds to the connected elements",
  "componentProps.attributes.valuePlaceholder": "value",
  "componentProps.autosave.conflict": "This file changed on disk, so the form reloaded. Your edit was kept.",
  "componentProps.declaration.default": "Default (line {line}): {expression}",
  "componentProps.declaration.details": "Declaration details",
  "componentProps.declaration.source": "{label} (line {line}): {expression}",
  "componentProps.declaration.variantRules": "Variant rules",
  "componentProps.default.none": "No default",
  "componentProps.default.number": "Default number",
  "componentProps.default.search": "Search defaults\u2026",
  "componentProps.default.text": "Default text",
  "componentProps.default.useControl": "Use the default value control",
  "componentProps.default.value": "Default value",
  "componentProps.default.writeExpression": "Write a default expression",
  "componentProps.defaults.badCode": "The default for {value} is not valid code.",
  "componentProps.defaults.computed": "Computed",
  "componentProps.defaults.conditional": "Set by conditions",
  "componentProps.defaults.discard": "Discard changes",
  "componentProps.defaults.entryRead": "The code reads {value} from {name} directly. Change it in source.",
  "componentProps.defaults.missingTable": "{name} has no per-option defaults to edit.",
  "componentProps.defaults.perOption": "Start each group with {controller} and one option.",
  "componentProps.defaults.return": "Return to defaults",
  "componentProps.defaults.saveFailed": "Could not save component defaults.",
  "componentProps.defaults.saved": "Defaults saved to this project.",
  "componentProps.defaults.tableReset": "The component computes this default from its own table: change each option\u2019s default in the conditions, or the table in source.",
  "componentProps.dialog.close": "Close property settings",
  "componentProps.dialog.loading": "Loading property\u2026",
  "componentProps.dialog.title": "Property settings",
  "componentProps.editor.delete": "Delete property",
  "componentProps.editor.deleteNamed": "Delete {name}",
  "componentProps.editor.name": "Name",
  "componentProps.editor.newProperty": "New property",
  "componentProps.editor.renameHelp": "Renaming updates this component\u2019s prop, the variable that reads it, and its instances across the website.",
  "componentProps.editor.renameShared": "Renaming rewrites {typeName} and every read of it, in these files:",
  "componentProps.kind.attributes": "Attributes",
  "componentProps.kind.choice": "Choice",
  "componentProps.kind.code": "Code type\u2026",
  "componentProps.kind.color": "Color",
  "componentProps.kind.curated": "Selected items",
  "componentProps.kind.date": "Date",
  "componentProps.kind.filter": "Filter",
  "componentProps.kind.group": "Group",
  "componentProps.kind.image": "Image",
  "componentProps.kind.link": "Link",
  "componentProps.kind.list": "List",
  "componentProps.kind.number": "Number",
  "componentProps.kind.record": "Key\u2013value list",
  "componentProps.kind.sort": "Sort",
  "componentProps.kind.switch": "Switch",
  "componentProps.kind.text": "Text",
  "componentProps.kindHint.attributes": "From an element\u2019s Attributes",
  "componentProps.kindHint.choice": "One of a list",
  "componentProps.kindHint.code": "Write a TypeScript type",
  "componentProps.kindHint.curated": "Collection list picks",
  "componentProps.kindHint.filter": "Collection list filters",
  "componentProps.kindHint.group": "Fields in an object",
  "componentProps.kindHint.list": "Items with fields",
  "componentProps.kindHint.sort": "Collection list sort",
  "componentProps.kindSection.advanced": "Advanced",
  "componentProps.kindSection.basic": "Basic",
  "componentProps.kindSection.collection": "Collection list",
  "componentProps.kindSection.element": "Element",
  "componentProps.kindSection.media": "Media & links",
  "componentProps.kindSection.structure": "Structure",
  "componentProps.options.title": "Options",
  "componentProps.panel.add": "Add property",
  "componentProps.panel.deletedIn": "{name} is deleted in {path}",
  "componentProps.panel.empty": "No properties yet. Add a property to define what each instance can customize.",
  "componentProps.panel.from": "From {typeName}",
  "componentProps.panel.label": "Component properties",
  "componentProps.panel.loading": "Loading properties\u2026",
  "componentProps.panel.openFile": "Open {path}",
  "componentProps.panel.propertyGone": "This component no longer has a {name} property.",
  "componentProps.panel.required": "Required",
  "componentProps.panel.saveBusy": "Another save is still running. Try again.",
  "componentProps.panel.title": "Properties",
  "componentProps.panel.unused": "Not used in this component",
  "componentProps.problem.decimalsRange": "Decimals is between 0 and {max}.",
  "componentProps.problem.decimalsWhole": "Decimals is a whole number.",
  "componentProps.problem.minAboveMax": "The minimum is above the maximum.",
  "componentProps.problem.nameShape": "Use a name such as title, imageUrl, or isVisible.",
  "componentProps.problem.typeMissing": "Give the property a type.",
  "componentProps.reorder.hint": "Drag to reorder (or use arrow keys)",
  "componentProps.reorder.label": "Reorder {name}",
  "componentProps.settings.auto": "Auto",
  "componentProps.settings.decimals": "Decimals",
  "componentProps.settings.decimalsHint": "How many decimals the number keeps: 0 is a whole number, at most {max}.",
  "componentProps.settings.defaultNote": "The default: {note}",
  "componentProps.settings.legacyRemove": { one: "Remove it", other: "Remove them" },
  "componentProps.settings.legacyTags": {
    one: "This doc has an unused switch label tag nothing reads.",
    other: "This doc has unused switch label tags nothing reads."
  },
  "componentProps.settings.max": "Max",
  "componentProps.settings.min": "Min",
  "componentProps.settings.none": "None",
  "componentProps.settings.numberGroup": "Number settings",
  "componentProps.settings.numberMalformed": "Enter a number, or leave it empty for none.",
  "componentProps.settings.tooltip": "Tooltip",
  "componentProps.settings.tooltipPlaceholder": "Describe how to use this property\u2026",
  "componentProps.settings.useControls": "Use the controls",
  "componentProps.settings.viewCode": "View the TypeScript",
  "componentProps.share.components": "Components",
  "componentProps.share.declaredIn": "Declared in",
  "componentProps.share.defaults": "Defaults",
  "componentProps.share.instancesIn": "Instances in",
  "componentProps.share.summary": {
    one: "Shared: edits {typeName} in {path}, used by {count} component ({names}) and their instances.",
    other: "Shared: edits {typeName} in {path}, used by {count} components ({names}) and their instances."
  },
  "componentProps.tooltips.perOption": "A tooltip can depend on {controller} only.",
  "componentProps.type.attributesNote": "An Attributes property is made from an element: open the bind dot on its Attributes.",
  "componentProps.type.codeType": "Code type",
  "componentProps.type.controllerKind": "Its options decide its kind",
  "componentProps.type.defaultCleared": "The default was cleared: it does not fit {kind}.",
  "componentProps.type.kind": "Kind",
  "componentProps.type.noType": "No type",
  "componentProps.type.search": "Search kinds\u2026",
  "componentProps.type.typescript": "TypeScript",
  "componentProps.variants.badIndex": "That position is outside the options.",
  "componentProps.variants.badValue": "Use a short name without quotes or backslashes.",
  "componentProps.variants.booleanOptions": "{name} is true or false: its two options cannot be added, renamed or removed.",
  "componentProps.variants.cannotAttach": "{name} is not declared in the props every option shares, so it cannot get variant rules here.",
  "componentProps.variants.cannotGroup": "Props is not written as a type Stacki can add variant rules to.",
  "componentProps.variants.condition": "{controller}: {options}",
  "componentProps.variants.conditional": "Conditional",
  "componentProps.variants.duplicateOption": "There is already an option {value}.",
  "componentProps.variants.forbiddenPassed": "{file} passes {name} with {controller} {value}. Change that instance first.",
  "componentProps.variants.lastOptions": "Keep at least two options.",
  "componentProps.variants.missingGroup": "No variant rules are controlled by {name}.",
  "componentProps.variants.missingOption": "There is no option {value}.",
  "componentProps.variants.missingProp": "{name} is not one of these variant rules.",
  "componentProps.variants.noDestructure": "The component reads its props without one destructure, so the property cannot be added here.",
  "componentProps.variants.noRuntimeType": "The component\u2019s runtime type cannot take a new property here.",
  "componentProps.variants.noType": "{name} has no type to allow. Give it a type first.",
  "componentProps.variants.notAllowedThere": "{name} is not allowed for {value}.",
  "componentProps.variants.optionInCode": "The component\u2019s code uses {value} in a way Stacki cannot update. Change it in source.",
  "componentProps.variants.optionPassed": "{file} passes {value} as {name}. Change that instance first.",
  "componentProps.variants.optionsLimit": "A property can have at most {max} options.",
  "componentProps.variants.readOnly": "The variant rules controlled by {name} can only be changed in source.",
  "componentProps.variants.reason.nested": "Nested",
  "componentProps.variants.reason.runtime": "Runtime",
  "componentProps.variants.reason.shape": "Complex",
  "componentProps.variants.reason.shared": "Shared",
  "componentProps.variants.removeFallback": "{value} is the default. Make another option the default first.",
  "componentProps.variants.state.forbidden": "Hide",
  "componentProps.variants.state.optional": "Show",
  "componentProps.variants.state.required": "Required",
  "componentProps.variants.switchForbidsAll": "No option of {name} would allow this property.",
  "componentProps.visibility.combination": "TypeScript cannot say this combination. Give each choice its own groups.",
  "componentProps.visibility.hideNeedsCondition": "Hide needs a condition: add a prop of choices or a switch to hide it by.",
  "componentProps.visibility.otherwise": "{state} otherwise",
  "componentProps.visibility.shape": "Each group needs one condition on a choice or a switch.",
  "componentProps.visibility.subject": "{name} is not a choice or a switch.",
  "componentProps.visibility.title": "Visibility",
  "componentProps.visibility.when": "{state} when {conditions}"
};

// vendor/stacki/shared/properties/i18n/messages/en/contentUi.ts
var messages11 = {
  "contentUi.body.note": "Markdown, written to the file exactly as it is typed here.",
  "contentUi.body.title": "Body",
  "contentUi.collection.noFields": "This collection has no fields.",
  "contentUi.entry.builtOnly": "Nothing to show \u2014 this collection is built, not stored.",
  "contentUi.entry.id": "Id",
  "contentUi.entry.idTitle": "The id other entries point at",
  "contentUi.entry.noneYet": "No entries yet.",
  "contentUi.entry.rename.check": "Check",
  "contentUi.entry.rename.imagePaths": { one: "{count} image path rewritten for the new folder.", other: "{count} image paths rewritten for the new folder." },
  "contentUi.entry.rename.moveFile": "The file becomes {path}.",
  "contentUi.entry.rename.moveInData": "The id is written inside its data file.",
  "contentUi.entry.rename.pointers": { one: "{count} reference will be updated:", other: "{count} references will be updated:" },
  "contentUi.entry.rename.pointersMore": "and {count} more",
  "contentUi.entry.rename.pointersNone": "Nothing else points at this entry.",
  "contentUi.entry.rename.submit": { one: "Rename and update {count} pointer", other: "Rename and update {count} pointers" },
  "contentUi.entry.saved": "Saved",
  "contentUi.entry.search": "Search entries",
  "contentUi.entry.select": "Select an entry to edit it.",
  "contentUi.field.add": "Add",
  "contentUi.field.addItem": "Add item",
  "contentUi.field.addNamed": "Add {name}",
  "contentUi.field.addPlaceholder": "Add\u2026",
  "contentUi.field.addTo": "Add to {name}",
  "contentUi.field.chooseEntry": "Choose an entry\u2026",
  "contentUi.field.defaultsTo": "defaults to {value}",
  "contentUi.field.fromParser": "from the parser",
  "contentUi.field.itemNumber": "Item {number}",
  "contentUi.field.missing": "{id} (missing)",
  "contentUi.field.newKey": "New key\u2026",
  "contentUi.field.none": "None",
  "contentUi.field.noneTitle": "Write null \u2014 the key stays, with no value",
  "contentUi.field.notSet": "Not set",
  "contentUi.field.nothingIn": "Nothing in {target} has the id \u201C{id}\u201D.",
  "contentUi.field.nothingLeft": "Nothing left to add",
  "contentUi.field.off": "Off",
  "contentUi.field.on": "On",
  "contentUi.field.required": "Required",
  "contentUi.field.value": "Value",
  "contentUi.form.fields": "Fields",
  "contentUi.form.frontmatter": "Frontmatter",
  "contentUi.hint.charactersMax": "up to {max} characters",
  "contentUi.hint.charactersMin": "at least {min} characters",
  "contentUi.hint.charactersRange": "{min}\u2013{max} characters",
  "contentUi.hint.itemsMax": "up to {max} items",
  "contentUi.hint.itemsMin": "at least {min}",
  "contentUi.hint.itemsRange": "{min}\u2013{max} items",
  "contentUi.hint.matches": "matches {pattern}",
  "contentUi.hint.orMore": "{min} or more",
  "contentUi.hint.range": "{min}\u2013{max}",
  "contentUi.hint.stored": "stored differently in the file than it reads here",
  "contentUi.hint.upTo": "up to {max}",
  "contentUi.issue.atLeastCharacters": { one: "At least {count} character", other: "At least {count} characters" },
  "contentUi.issue.atLeastValue": "At least {value}",
  "contentUi.issue.atMostCharacters": { one: "At most {count} character", other: "At most {count} characters" },
  "contentUi.issue.atMostValue": "At most {value}",
  "contentUi.issue.doesNotMatch": "Does not match {pattern}",
  "contentUi.issue.needsEmail": "Needs an email address",
  "contentUi.issue.needsHint": "Needs {hint}",
  "contentUi.issue.needsURL": "Needs a full URL, starting with http",
  "contentUi.issue.wholeNumbers": "Whole numbers only"
};

// vendor/stacki/shared/properties/i18n/messages/en/dialog.ts
var messages12 = {
  "dialog.open.apps.button": "Choose",
  "dialog.open.apps.filter": "Stacki app",
  "dialog.open.apps.title": "Install an app",
  "dialog.open.assets.title": "Upload assets",
  "dialog.open.cmsFile.title": "Choose a file",
  "dialog.open.cmsImage.filter": "Images",
  "dialog.open.cmsImage.title": "Choose an image",
  "dialog.open.mediaUpload.title": "Upload media",
  "dialog.open.project.title": "Open an Astro project",
  "dialog.open.projectFile.title": "Choose a file in this project",
  "dialog.open.projectFolder.title": "Choose a folder in this project",
  "dialog.open.replace.title": "Replace {name}",
  "dialog.open.repositoryTarget.title": "Choose where to download the repository",
  "dialog.open.siteTarget.title": "Choose where the site should go",
  "dialog.open.studioRelease.filter": "Studio release",
  "dialog.open.studioRelease.title": "Choose a trusted Stacki Studio release bundle",
  "dialog.privacy.notSaved.detail": "The change applies for this session. Check available disk space and try again.",
  "dialog.privacy.notSaved.message": "Stacki could not save your usage-count preference.",
  "dialog.privacy.notSaved.title": "Privacy Setting Not Saved",
  "dialog.update.available.detail": "You\u2019ll be asked whether to restart once it has finished.",
  "dialog.update.check.alreadyChecking": "Already checking for updates.",
  "dialog.update.check.failed": "Stacki could not check for updates.",
  "dialog.update.check.latest": "Stacki {version} is the latest version.",
  "dialog.update.check.title": "Check for Updates",
  "dialog.update.development.detail": "This is a development build ({version}), which updates when you rebuild it.",
  "dialog.update.development.message": "Updates are only checked in the installed app.",
  "dialog.update.download.failed": "The Stacki update could not be downloaded.",
  "dialog.update.downloading.counter": "{transferred} of {total} MB",
  "dialog.update.downloading.counterUnknown": "{transferred} MB downloaded",
  "dialog.update.downloading.hide": "Hide",
  "dialog.update.downloading.percent": "{percent}%",
  "dialog.update.downloading.progressLabel": "Download progress",
  "dialog.update.downloading.title": "Downloading Stacki {version}",
  "dialog.update.downloading.titleUnnamed": "Downloading the Stacki update",
  "dialog.update.ready.detail": "Restart Stacki to install the update.",
  "dialog.update.ready.heading": "Stacki {version} is ready",
  "dialog.update.ready.later": "Later",
  "dialog.update.ready.restartNow": "Restart Now",
  "dialog.update.upToDate.title": "You\u2019re up to date",
  "dialog.usage.continue": "Continue",
  "dialog.usage.detail": "Stacki sends one count on days you open a project. It sends no project names, file contents, device identifier, or activity history. Daily totals are kept on Cloudflare for up to 366 days; its network sees the connection IP, but the usage database does not store it. Turn this off any time in File \u2192 Settings.",
  "dialog.usage.message": "Help us understand how many Stacki installations are active.",
  "dialog.usage.optOut": "Turn off anonymous usage counts",
  "dialog.usage.title": "Anonymous Usage Counts"
};

// vendor/stacki/shared/properties/i18n/messages/en/editor.ts
var messages13 = {
  "editor.dataTree.collection": "collection",
  "editor.dataTree.collectionEntries": "{name} entries",
  "editor.dataTree.collectionEntry": "{name} entry",
  "editor.dataTree.deeper": "deeper\u2026",
  "editor.dataTree.entryCount": { one: "{count} entry", other: "{count} entries" },
  "editor.dataTree.fields": { one: "{count} field", other: "{count} fields" },
  "editor.dataTree.from": "from {path}",
  "editor.dataTree.function": "function",
  "editor.dataTree.functionFrom": "function \xB7 {path}",
  "editor.dataTree.items": { one: "{count} item", other: "{count} items" },
  "editor.dataTree.kind.boolean": "boolean",
  "editor.dataTree.kind.date": "date",
  "editor.dataTree.kind.empty": "empty",
  "editor.dataTree.kind.function": "function",
  "editor.dataTree.kind.imageUrl": "image url",
  "editor.dataTree.kind.imported": "imported",
  "editor.dataTree.kind.list": "list",
  "editor.dataTree.kind.loopItem": "loop item",
  "editor.dataTree.kind.number": "number",
  "editor.dataTree.kind.object": "object",
  "editor.dataTree.kind.text": "text",
  "editor.dataTree.kind.value": "value",
  "editor.dataTree.lists": { one: "{count} list", other: "{count} lists" },
  "editor.dataTree.more": "{count} more",
  "editor.dataTree.noItems": "no items",
  "editor.dataTree.noSample": "no sample",
  "editor.dataTree.notSet": "not set",
  "editor.dataTree.unbindable": "{name} is a function: call it in the frontmatter (const value = {name}(\u2026)) and bind to what it returns",
  "editor.extract.astroMember.component": "It reads the parent component\u2019s Astro.{member}, which the new component can\u2019t see.",
  "editor.extract.astroMember.page": "It reads this page\u2019s Astro.{member}, which the new component can\u2019t see.",
  "editor.extract.astroOnly": "Only an .astro file\u2019s code can move.",
  "editor.extract.astroWhole.component": "It reads the parent component\u2019s Astro, which the new component can\u2019t see.",
  "editor.extract.astroWhole.page": "It reads this page\u2019s Astro, which the new component can\u2019t see.",
  "editor.extract.changed.component": "It\u2019s changed elsewhere in the parent component, so it can\u2019t move safely.",
  "editor.extract.changed.page": "It\u2019s changed elsewhere on this page, so it can\u2019t move safely.",
  "editor.extract.copyStays.component": "A copy stays in the parent component because it\u2019s also used there.",
  "editor.extract.copyStays.page": "A copy stays on this page because it\u2019s also used here.",
  "editor.extract.declaredTogether": "It\u2019s declared together with {name}, which is passed in as a prop.",
  "editor.extract.effect": "It\u2019s set by code that does other work too, so it can\u2019t move on its own.",
  "editor.extract.exported.component": "It\u2019s exported, so other files can ask for it in the parent component.",
  "editor.extract.exported.page": "It\u2019s exported, so other files can ask for it on this page.",
  "editor.extract.fromLoop": "It comes from the loop around this element, so it\u2019s passed in for each item.",
  "editor.extract.importMeta.component": "It finds files from where it\u2019s written in the parent component, so it would look in the wrong place.",
  "editor.extract.importMeta.page": "It finds files from where it\u2019s written on this page, so it would look in the wrong place.",
  "editor.extract.inLoop": "This sits inside a loop, so it would run again for every item.",
  "editor.extract.needs.component": "It needs {name}, which has to stay in the parent component.",
  "editor.extract.needs.page": "It needs {name}, which has to stay on this page.",
  "editor.extract.otherCode.component": "Other code at the top in the parent component also works with it, so it can\u2019t move safely.",
  "editor.extract.otherCode.page": "Other code at the top on this page also works with it, so it can\u2019t move safely.",
  "editor.extract.partial": "Part of this page can\u2019t be read, so its code can\u2019t move.",
  "editor.extract.saving": "This page is still saving, so its code can\u2019t move yet.",
  "editor.extract.syntaxError": "The frontmatter has a syntax error, so its code can\u2019t move. Fix it first.",
  "editor.extract.untraceable.component": "It can\u2019t be traced to a line of code in the parent component.",
  "editor.extract.untraceable.page": "It can\u2019t be traced to a line of code on this page.",
  "editor.extract.usedTwice.component": "It\u2019s also used in the parent component, and running it twice could give a different result.",
  "editor.extract.usedTwice.page": "It\u2019s also used on this page, and running it twice could give a different result.",
  "editor.extract.usesCaptured.component": "It\u2019s a function that uses {name} in the parent component.",
  "editor.extract.usesCaptured.page": "It\u2019s a function that uses {name} on this page.",
  "editor.htmlAttributes.notOnTag": "{name} isn\u2019t an attribute of <{tag}>.",
  "editor.htmlAttributes.reserved": "This is a reserved name.",
  "editor.htmlAttributes.taken": "{name} is already on this element.",
  "editor.htmlAttributes.useStylePanel": "Classes are edited in the Style panel.",
  "editor.imageDefault.choose": "Choose a default image.",
  "editor.imageDefault.chooseOrUrl": "Choose an image from the project, or enter its URL.",
  "editor.imageDefault.invalid": "That is not an image address.",
  "editor.imageDefault.notImportable": "Only an image file can be imported as an image.",
  "editor.imageDefault.tooLong": "That image address is too long.",
  "editor.itemFields.fields.duplicateName": "Each field has to have its own name.",
  "editor.itemFields.fields.none": "Add at least one field to each item.",
  "editor.itemFields.fields.tooDeep": "A list can hold lists {depth} levels deep, no more.",
  "editor.itemFields.fields.tooMany": "That is too many fields.",
  "editor.itemFields.fields.tooManyInAll": "That is too many fields in all.",
  "editor.itemFields.kind.color": "Color",
  "editor.itemFields.kind.date": "Date",
  "editor.itemFields.kind.email": "Email",
  "editor.itemFields.kind.file": "File",
  "editor.itemFields.kind.group": "Group",
  "editor.itemFields.kind.image": "Image",
  "editor.itemFields.kind.link": "Link",
  "editor.itemFields.kind.list": "List",
  "editor.itemFields.kind.longText": "Long text",
  "editor.itemFields.kind.number": "Number",
  "editor.itemFields.kind.option": "Option",
  "editor.itemFields.kind.phone": "Phone",
  "editor.itemFields.kind.richText": "Rich text",
  "editor.itemFields.kind.switch": "Switch",
  "editor.itemFields.kind.text": "Text",
  "editor.itemFields.kind.video": "Video link",
  "editor.itemFields.name.empty": "Each field needs a name.",
  "editor.itemFields.name.invalid": "{name} is not a field name: use letters and numbers, starting with a letter.",
  "editor.itemFields.name.reserved": "{name} is reserved: JavaScript gives it a meaning of its own.",
  "editor.itemFields.name.tooLong": "A field name is too long.",
  "editor.itemFields.options.duplicate": "{name} has an option twice.",
  "editor.itemFields.options.empty": "An option of {name} is empty.",
  "editor.itemFields.options.tooFew": "{name} needs at least two options.",
  "editor.itemFields.options.tooLong": "An option of {name} is too long.",
  "editor.itemFields.options.tooMany": "{name} has too many options.",
  "editor.listType.item.notList": "The {name} of item {number} has to be a list.",
  "editor.listType.item.notNumber": "The {name} of item {number} has to be a number.",
  "editor.listType.item.notObject": "The {name} of item {number} has to be an object.",
  "editor.listType.item.notOption": "The {name} of item {number} has to be one of its options.",
  "editor.listType.item.notSwitch": "The {name} of item {number} is on or off.",
  "editor.listType.item.tooLong": "The {name} of item {number} is too long.",
  "editor.listType.items.tooMany": "That is too many items.",
  "editor.loopPlan.bindingInPlace": "A binding change is planned in place.",
  "editor.loopPlan.customCode": "This loop is written as custom code. Edit it in the Code field.",
  "editor.loopPlan.helperTaken": "This file already has its own {name}. Rename it to link list settings to properties.",
  "editor.loopPlan.needSanity": "Add the @sanity/astro integration to this project to loop over Sanity content.",
  "editor.loopPlan.noShuffleOrDate": "This list\u2019s settings can\u2019t shuffle or compare with today\u2019s date.",
  "editor.loopPlan.onlyData": "Only a list whose settings are kept as data can link them to properties.",
  "editor.loopPlan.sectionInPlace": "A section is planned in place.",
  "editor.loopPlan.settingsChanged": "The list settings changed in the code since they were read. Select the loop again.",
  "editor.loopPlan.wouldBreak": "This code would break the loop, so it was not written.",
  "editor.loopRead.collectionNamed": "The collection is named by code.",
  "editor.loopRead.filterShape": "Its filter is written in a way the list settings cannot show.",
  "editor.loopRead.groqThenCode": "It is ordered by GROQ, then again by code.",
  "editor.loopRead.itemsChanged": "Its items are changed by code the list settings cannot show.",
  "editor.loopRead.itemsChangedAfterFetch": "Its items are changed by code after they are fetched.",
  "editor.loopRead.pickedChanged": "Its picked items are changed by code.",
  "editor.loopRead.pickedDocsChanged": "Its picked documents are changed by code after they are fetched.",
  "editor.loopRead.pickedOutside": "Its picked items are outside the list settings.",
  "editor.loopRead.reversedCollection": "It is shown in reverse of the collection\u2019s own order.",
  "editor.loopRead.reversedList": "It is shown in reverse of the list\u2019s own order.",
  "editor.loopRead.settingsOutside": "Its settings are outside what the list settings can show.",
  "editor.loopRead.slicedTwice": "It is sliced twice.",
  "editor.loopRead.sortComputed": "Its sort order is computed by code.",
  "editor.loopRead.sortComputedReversed": "Its sort order is computed by code, then reversed.",
  "editor.loopRead.sortedAfterFetch": "It is sorted by code after it is fetched.",
  "editor.loopSections.chainOnly.filter": "Only the filters go here: {example}.",
  "editor.loopSections.chainOnly.limit": "Only the limit goes here: {example}.",
  "editor.loopSections.chainOnly.sort": "Only the sort goes here: {example}.",
  "editor.loopSections.chainTooLong": "This chain is too long.",
  "editor.loopSections.codeTooLong": "This code is too long.",
  "editor.loopSections.filterIsFunction": "A filter is a function, such as (item) => item.number > 1.",
  "editor.loopSections.groq.filter": "This is not a GROQ condition.",
  "editor.loopSections.groq.limit": "Write a GROQ slice, such as [0...6].",
  "editor.loopSections.groq.sort": "Write a GROQ order, such as order(name asc), or a comparator, (a, b) => \u2026.",
  "editor.loopSections.late.filterAfterLimit": "This runs after the limit, which the filter controls cannot show, so it stays as code.",
  "editor.loopSections.late.filterAfterSort": "This runs after the sort, which the filter controls cannot show, so it stays as code.",
  "editor.loopSections.late.sortAfterLimit": "This runs after the limit, which the sort controls cannot show, so it stays as code.",
  "editor.loopSections.limitIsNumber": "A limit is a number, or code that gives one.",
  "editor.loopSections.notExpression": "This is not one JavaScript expression.",
  "editor.loopSections.oneFunction": "This list filters where it is read, which takes one function. Write these filters as one.",
  "editor.loopSections.shape.filter": "The filter controls cannot show this code, so it stays as code. Change it to what the filter controls can hold first.",
  "editor.loopSections.shape.limit": "The limit controls cannot show this code, so it stays as code. Change it to what the limit controls can hold first.",
  "editor.loopSections.shape.sort": "The sort controls cannot show this code, so it stays as code. Change it to what the sort controls can hold first.",
  "editor.loopSections.sharedStep": "Other code reads {names} too, so this step stays as it is. Edit it in the frontmatter.",
  "editor.loopSections.sortIsFunction": "A sort is a function, such as (a, b) => a.number - b.number.",
  "editor.loopSections.sortTwoItems": "A sort compares two items: write (a, b) => \u2026",
  "editor.optionsBinding.cannotHold.curated": "The {name} property can\u2019t hold this list\u2019s selected items.",
  "editor.optionsBinding.cannotHold.filter": "The {name} property can\u2019t hold this list\u2019s filters.",
  "editor.optionsBinding.cannotHold.limit": "The {name} property can\u2019t hold this list\u2019s show count.",
  "editor.optionsBinding.cannotHold.offset": "The {name} property can\u2019t hold this list\u2019s skip count.",
  "editor.optionsBinding.cannotHold.sort": "The {name} property can\u2019t hold this list\u2019s sort.",
  "editor.optionsBinding.defaultUnreadable": "That default is not a value the list can read.",
  "editor.optionsBinding.name.exists": "This component already has a {name} property.",
  "editor.optionsBinding.name.invalid": "Use letters and numbers, starting with a letter.",
  "editor.optionsBinding.name.tooLong": "That name is too long.",
  "editor.optionsBinding.notLinked": "This setting is not linked to a property.",
  "editor.optionsBinding.setting.curated": "Select items",
  "editor.optionsBinding.setting.filter": "Filters",
  "editor.optionsBinding.setting.limit": "Show",
  "editor.optionsBinding.setting.offset": "Skip",
  "editor.optionsBinding.setting.sort": "Sort",
  "editor.optionsQuery.customFilter": "A filter written as code can\u2019t be linked to a property. Remove it first.",
  "editor.optionsQuery.dateFilter": "A filter comparing with today\u2019s date can\u2019t be linked to a property.",
  "editor.optionsQuery.onlyCollections": "Only content collection lists can link their settings to properties.",
  "editor.optionsQuery.shuffled": "A shuffled list can\u2019t link its settings to properties.",
  "editor.paste.blocked.astro": "{name} reads the request this page is built for, which only its own file has.",
  "editor.paste.blocked.awaits": "{name} waits for data from somewhere else when the page builds.",
  "editor.paste.blocked.changed": "{name} is changed by other code in its file.",
  "editor.paste.blocked.effect": "{name} depends on code that does something when the page builds.",
  "editor.paste.blocked.environment": "{name} reads the computer\u2019s settings or secrets.",
  "editor.paste.blocked.exported": "{name} is something its file shares with Astro.",
  "editor.paste.blocked.importMeta": "{name} reads the project\u2019s settings or secrets.",
  "editor.paste.blocked.unreadable": "The code behind {name} has a mistake, so Stacki can\u2019t follow it.",
  "editor.paste.blocked.volatile": "{name} is different each time the page builds.",
  "editor.paste.brought": "Pasted. Also brought along: {list}.",
  "editor.paste.broughtCheck": "Pasted. Also brought along: {list}. Some values start empty: see What changed.",
  "editor.paste.change.filled": "{name} couldn\u2019t come along, so it starts as {value}.",
  "editor.paste.change.import": "Imported {name} from {path}.",
  "editor.paste.change.more": { one: "\u2026and {count} more change.", other: "\u2026and {count} more changes." },
  "editor.paste.change.propDefault": "{name} is set to {value}, the value it has in the component when nothing else is given.",
  "editor.paste.change.propPlaceholder": "{name} came from the component\u2019s settings, so it starts as {value}. Set it in the Code panel.",
  "editor.paste.change.renamed": "Renamed {from} to {to}, because this file already has a {from}.",
  "editor.paste.change.slot": {
    one: "Replaced {count} slot with its default content: slots only work inside a component.",
    other: "Replaced {count} slots with their default content: slots only work inside a component."
  },
  "editor.paste.change.style": "Brought the style for {selector}.",
  "editor.paste.change.styleLeft": "Left the style for {selector} behind: here it would restyle every {selector} in the file.",
  "editor.paste.change.variable": "Copied the value {name}.",
  "editor.paste.choice.body": "Some of what it shows can\u2019t be copied safely:",
  "editor.paste.choice.filled": "Paste the markup with values filled in",
  "editor.paste.choice.filledHint": "A copy you can change freely. Values that can\u2019t come along start empty.",
  "editor.paste.choice.instance": "Paste as a {name} component",
  "editor.paste.choice.instanceHint": "Stays connected to {name} and keeps its data.",
  "editor.paste.choice.title": "This element uses data that lives in {name}",
  "editor.paste.choice.titleFile": "This element uses data that lives in the file it came from",
  "editor.paste.countImports": { one: "{count} import", other: "{count} imports" },
  "editor.paste.countStyles": { one: "{count} style rule", other: "{count} style rules" },
  "editor.paste.countVariables": { one: "{count} value", other: "{count} values" },
  "editor.paste.filledOnly": "Pasted. Some values start empty: see What changed.",
  "editor.paste.undo": "Undo",
  "editor.paste.whatChanged": "What changed",
  "editor.paste.whatChangedTitle": "What the paste brought along",
  "editor.preflight.finding.defaultFromModule": "{subject} would be imported as a default, but its module only offers it by name.",
  "editor.preflight.finding.duplicateName": "this file would have two things called {subject}.",
  "editor.preflight.finding.frontmatterSyntax": "the code at the top of the file would have a mistake.",
  "editor.preflight.finding.missingComponent": "the {subject} component isn\u2019t imported in this file.",
  "editor.preflight.finding.missingFile": "{subject} doesn\u2019t exist.",
  "editor.preflight.finding.namedFromAstro": "{subject} would be imported by name from a component file, which only has a default.",
  "editor.preflight.finding.propsInPage": "a page doesn\u2019t receive settings, so these values would be empty.",
  "editor.preflight.finding.undefinedName": "{subject} isn\u2019t defined in this file.",
  "editor.preflight.refused": "Stacki didn\u2019t make this change because it would break the page.",
  "editor.preflight.refusedBecause": "Stacki didn\u2019t make this change because it would break the page: {reason}",
  "editor.propDeclaration.attributes.htmlOnly": "Only an HTML element can take an attributes property.",
  "editor.propDeclaration.attributes.nameDuplicate": "Each default attribute has to have its own name.",
  "editor.propDeclaration.attributes.nameEmpty": "Each default attribute needs a name.",
  "editor.propDeclaration.attributes.nameInvalid": "{name} is not an attribute name.",
  "editor.propDeclaration.attributes.restTaken": "This component already passes its other attributes on as {name}.",
  "editor.propDeclaration.attributes.tooMany": "That is too many attributes.",
  "editor.propDeclaration.attributes.valueTooLong": "The value of {name} is too long.",
  "editor.propDeclaration.codeType.multiline": "Write the code type on one line, without a semicolon.",
  "editor.propDeclaration.codeType.tooLong": "The code type is too long.",
  "editor.propDeclaration.default.atLeast": "The default has to be at least {min}.",
  "editor.propDeclaration.default.atMost": "The default has to be at most {max}.",
  "editor.propDeclaration.default.decimals": { one: "The default has at most {count} decimal.", other: "The default has at most {count} decimals." },
  "editor.propDeclaration.default.notNumber": "The default has to be a number.",
  "editor.propDeclaration.default.onOrOff": "The default is on or off.",
  "editor.propDeclaration.default.oneOfOptions": "The default has to be one of the options.",
  "editor.propDeclaration.default.whole": "The default has to be a whole number.",
  "editor.propDeclaration.frontmatter.exists": "This component already has a {name} property.",
  "editor.propDeclaration.frontmatter.tooLong": "This component\u2019s frontmatter is too long to edit here.",
  "editor.propDeclaration.frontmatter.typeProps": "This component declares its props as a type. Add the property in the code.",
  "editor.propDeclaration.noInterface": "This component has no interface Props to describe its attributes on.",
  "editor.propDeclaration.number.decimalsNotWhole": "Decimals has to be a whole number.",
  "editor.propDeclaration.number.decimalsRange": "Decimals goes from 0 to {max}.",
  "editor.propDeclaration.number.maxNotNumber": "Max has to be a number.",
  "editor.propDeclaration.number.minAboveMax": "Min has to be no more than Max.",
  "editor.propDeclaration.number.minNotNumber": "Min has to be a number.",
  "editor.propDeclaration.options.duplicate": "Each option has to be different.",
  "editor.propDeclaration.options.empty": "An option needs some words.",
  "editor.propDeclaration.options.none": "Add at least one option.",
  "editor.propDeclaration.options.tooLong": "An option is too long.",
  "editor.propDeclaration.options.tooMany": "That is too many options.",
  "editor.propDocumentation.decimals": { one: "This keeps {count} decimal.", other: "This keeps {count} decimals." },
  "editor.propDocumentation.deprecated": "Deprecated.",
  "editor.propDocumentation.deprecatedNote": "Deprecated: {note}",
  "editor.propDocumentation.enterNumber": "Enter a number.",
  "editor.propDocumentation.least": "The least this takes is {min}.",
  "editor.propDocumentation.most": "The most this takes is {max}.",
  "editor.propDocumentation.wholeNumbers": "This takes whole numbers.",
  "editor.rename.captured": "\u201C{to}\u201D is already a name inside a loop or function that reads \u201C{from}\u201D, so it would read that instead.",
  "editor.rename.exists": "\u201C{name}\u201D already exists in this file.",
  "editor.rename.existsSourceMenu": "\u201C{name}\u201D already exists in this file. To loop over it, choose it in the Source menu.",
  "editor.rename.exported": "\u201C{name}\u201D is exported, and other files can ask for it by name, so it can\u2019t be renamed here.",
  "editor.rename.frontmatterInvalid": "The frontmatter has a syntax error, so this can\u2019t be renamed safely. Fix it first.",
  "editor.rename.headUnparsed": "This code doesn\u2019t parse. A loop reads like items.map((item) => (.",
  "editor.rename.invalidName": "\u201C{name}\u201D isn\u2019t a valid variable name. Use letters, numbers, _ or $, and don\u2019t start with a number.",
  "editor.rename.notDeclared": "\u201C{name}\u201D isn\u2019t declared in this file\u2019s frontmatter, so it can\u2019t be renamed here.",
  "editor.rename.partial": "Part of this page isn\u2019t readable yet, so this can\u2019t be renamed safely. Try again once it has saved.",
  "editor.rename.reservedWord": "\u201C{name}\u201D is a reserved word in JavaScript. Pick another name.",
  "editor.rename.tooLarge": "This file is too large to rename in.",
  "editor.rename.undeclaredInHead": "\u201C{name}\u201D isn\u2019t declared in this file, so the page would crash. Declare it in the frontmatter, or choose a list in the Source menu.",
  "editor.rename.unreadableCode": "This code can\u2019t be read to rename it safely: {excerpt} Rename it in the code.",
  "editor.rename.usedAsTag": "\u201C{name}\u201D is used as a tag, <{name}>, so it can\u2019t be renamed here. Rename it in the code.",
  "editor.selectorRemoval.bound": "{name} is bound to {code}, so Stacki leaves it for you to change in code.",
  "editor.selectorRemoval.computed": "\u201C{name}\u201D may come from {code} in {attribute}, which Stacki can\u2019t rewrite safely. Change it in code.",
  "editor.selectorRemoval.notOneThing": "The {name} attribute holds more than one thing, so it can\u2019t be removed as one chip.",
  "editor.selectorRemoval.notWritten": "\u201C{name}\u201D isn\u2019t written on this element, so there is nothing here to remove.",
  "editor.selectorRemoval.notWrittenSpread": "\u201C{name}\u201D isn\u2019t written on this element; it may come from a spread or a component prop, so there is nothing here to remove.",
  "editor.selectorRemoval.showInCode": "Show in code",
  "editor.selectorRemoval.unreadable": "Stacki couldn\u2019t read {code} safely, so it left \u201C{name}\u201D as written. Change it in code."
};

// vendor/stacki/shared/properties/i18n/messages/en/emdash.ts
var messages14 = {
  "emdash.absent.title": "EmDash is not set up in this project",
  "emdash.binding.boolean": "Yes/No",
  "emdash.binding.data": "Data",
  "emdash.binding.date": "Date",
  "emdash.binding.file": "File",
  "emdash.binding.image": "Image",
  "emdash.binding.link": "Link",
  "emdash.binding.list": "List",
  "emdash.binding.number": "Number",
  "emdash.binding.reference": "Reference",
  "emdash.binding.richText": "Rich text",
  "emdash.binding.text": "Text",
  "emdash.button.connected": "Set up",
  "emdash.collection.fields": { one: "{count} field", other: "{count} fields" },
  "emdash.details": "Details",
  "emdash.field.required": "required",
  "emdash.field.unsupported": "Unknown type",
  "emdash.guide.analyze": "Check what will be imported (the local site must be empty):",
  "emdash.guide.export": "Export the customer\u2019s site. This only reads from it:",
  "emdash.guide.import": "Import it into your local copy:",
  "emdash.guide.login": "Sign in to the customer\u2019s EmDash site:",
  "emdash.guide.safe": "The local database and uploads stay on this computer and are never deployed. Only the customer changes their content, in their own EmDash admin.",
  "emdash.guide.title": "Preview with real customer content",
  "emdash.hint.definedInEmDash": "Content types and fields are defined only in EmDash. Change them in its admin; Stacki reads them and never edits them.",
  "emdash.install.changed": "Changed files ({count})",
  "emdash.install.changedNone": "No files changed.",
  "emdash.install.check.config": "Astro config updated",
  "emdash.install.check.database": "Database ready",
  "emdash.install.check.installed": "EmDash installed",
  "emdash.install.check.key": "Local key created",
  "emdash.install.command": "Command",
  "emdash.install.config.otherAdapter": "Your config has a different adapter, so Stacki left it. Add this:",
  "emdash.install.config.unusualShape": "Stacki could not edit this config safely. Add this:",
  "emdash.install.confirm": "Add EmDash to this project",
  "emdash.install.copy": "Copy",
  "emdash.install.details": "See what will change",
  "emdash.install.done.partial": "Packages installed. Still to do:",
  "emdash.install.failure.engineMismatch": "Node.js is too old for EmDash (22.16 or later).",
  "emdash.install.failure.managerMissing": "The package manager is not installed.",
  "emdash.install.failure.noNetwork": "Could not reach the package registry. Check your connection.",
  "emdash.install.failure.other": "The install did not finish. See the log.",
  "emdash.install.failure.peerConflict": "A package version conflicts with this project. The log shows which.",
  "emdash.install.failure.permission": "No permission to write in the project folder.",
  "emdash.install.failure.saveFailed": "Could not save your changes first, so nothing was installed.",
  "emdash.install.failure.timeout": "The install took too long and was stopped.",
  "emdash.install.file.create": "new",
  "emdash.install.file.edit": "changed",
  "emdash.install.files": "Files",
  "emdash.install.heading.cancelled": "Adding EmDash was cancelled",
  "emdash.install.heading.failed": "EmDash was not added",
  "emdash.install.heading.running": "Adding EmDash",
  "emdash.install.intro": "Add the CMS to this project without starting over.",
  "emdash.install.log": "Show log",
  "emdash.install.manual.admin": "Finish setup at /_emdash/admin",
  "emdash.install.manual.astroConfig": "Add EmDash to astro.config",
  "emdash.install.manual.liveConfig": "Add _emdash to src/live.config.ts",
  "emdash.install.manual.secrets": "Generate the local key",
  "emdash.install.notReverted": "Nothing was reverted.",
  "emdash.install.onDemand": "Your site now renders pages on request.",
  "emdash.install.openSetup": "Open EmDash setup",
  "emdash.install.planFailed": "Could not check this project.",
  "emdash.install.previewFailed": "The preview did not restart. Reopen the project.",
  "emdash.install.ready": "EmDash is ready",
  "emdash.install.refusal.alreadyInstalled": "The emdash package is already installed.",
  "emdash.install.refusal.astroTooOld": "EmDash needs Astro 6 or later.",
  "emdash.install.refusal.busy": "EmDash is already being added. Wait for it to finish.",
  "emdash.install.refusal.noPackageJson": "No readable package.json in this folder.",
  "emdash.install.refusal.notAstro": "This is not an Astro project.",
  "emdash.install.refusal.notConfirmed": "The command changed, so nothing ran. Review it again.",
  "emdash.install.retry": "Try again",
  "emdash.install.running": "Adding EmDash\u2026",
  "emdash.install.saveFirst": "Saves your current changes first, as a commit called \u201CBefore Adding EmDash\u201D",
  "emdash.install.savedNote": "Your earlier work is saved as \u201CBefore Adding EmDash\u201D in History.",
  "emdash.install.status.running": "Installing packages\u2026",
  "emdash.install.stopping": "Stopping\u2026",
  "emdash.install.summary": "Files: {count} \xB7 runs {manager}",
  "emdash.install.summarySaving": "Saves your changes \xB7 files: {count} \xB7 runs {manager}",
  "emdash.install.title": "Add EmDash to this project",
  "emdash.install.warning.otherAdapter": "You already use another adapter. Stacki keeps it and leaves the config for you.",
  "emdash.open.admin": "Open EmDash admin",
  "emdash.output.server": "when requested (server)",
  "emdash.output.static": "at build (static)",
  "emdash.output.unknown": "not set in the config",
  "emdash.problem.databaseTracked": "The local database is not in .gitignore. Add it so a deploy never carries your local content.",
  "emdash.problem.databaseUnreadable": "The local database could not be read. Stop the dev server if it is mid-migration, then reopen Settings.",
  "emdash.problem.noDatabase": "No local database yet. Run the dev server once and finish setup at /_emdash/admin.",
  "emdash.problem.noIntegration": "Add the emdash() integration from emdash/astro to astro.config.",
  "emdash.problem.noLiveCollection": "Register the _emdash live collection in src/live.config.ts with emdashLoader().",
  "emdash.problem.noSchema": "No content types found yet. Create them in the EmDash admin, or run emdash types to save a schema file.",
  "emdash.problem.notInstalled": "Install the emdash package (npm install emdash).",
  "emdash.problem.schemaUnreadable": "The schema file could not be read. Run emdash types again.",
  "emdash.problem.staticOutput": "EmDash reads content when a page is requested. Set output to server and add an adapter in astro.config.",
  "emdash.problem.uploadsTracked": "The uploads folder is not in .gitignore. Add it so media never travels with your code.",
  "emdash.schema.database": "Read from the local EmDash database",
  "emdash.schema.schemaJson": "Read from .emdash/schema.json",
  "emdash.schema.seed": "Read from the seed file",
  "emdash.status.line": { one: "{count} content type \xB7 {database} \xB7 {mode}", other: "{count} content types \xB7 {database} \xB7 {mode}" },
  "emdash.template.collection": "Content type",
  "emdash.template.create": "Create template",
  "emdash.template.empty": "No content types found. Define them in EmDash first.",
  "emdash.template.layout": "Layout",
  "emdash.template.menu": "EmDash page template",
  "emdash.template.noLayout": "No layout",
  "emdash.template.noSuchCollection": "The EmDash project has no content type named \u201C{collection}\u201D.",
  "emdash.template.notEmDash": "This project does not use EmDash yet.",
  "emdash.template.route": "Page address",
  "emdash.template.routeHint": "Every entry in EmDash gets its own page at this address, always showing its current content.",
  "emdash.template.title": "New EmDash page template",
  "emdash.title": "EmDash",
  "emdash.unavailable": "EmDash is read from the project folder, so it is available in Stacki Desktop for now."
};

// vendor/stacki/shared/properties/i18n/messages/en/error.ts
var messages15 = {
  "error.apps.fileTooLarge": "The app file exceeds {bytes} bytes",
  "error.apps.notInstalled": 'The app "{id}" is not installed.',
  "error.assets.missing": "{name} is no longer there.",
  "error.audit.renderTooLarge": "{route} renders more than {limit} characters",
  "error.bridge.accountUnreachable": "Could not reach account sign-in. Please try again.",
  "error.bridge.contentRequestFailed": "The content request failed.",
  "error.bridge.noFilePaths": "Those files have no path on this computer to upload from.",
  "error.bridge.sanityUnreachable": "Could not reach Sanity sign-in. Please try again.",
  "error.cms.connectionSaveFailed": "Could not save the connection.",
  "error.cms.fileTooLarge": "This file is too large to edit here (over 2 MB).",
  "error.cms.invalidJson": "Not valid JSON \u2014 {detail}",
  "error.component.alreadyThere": "a file is already there",
  "error.component.foreignFiles": "This folder holds files that are not components, so it is left alone.",
  "error.component.inUse": {
    one: "{name} is used in {count} place. Remove it from there first.",
    other: "{name} is used in {count} places. Remove it from there first."
  },
  "error.component.metadataBroken": "Fix {file} first: it cannot be read, so its entries for this component cannot be cleaned up.",
  "error.component.missing": "{name} is no longer there.",
  "error.component.nameUnavailable": "There is no free name for a copy of {name}.",
  "error.component.notComponent": "That is not a component.",
  "error.component.outside": "Only files in the project\u2019s component folders can be copied or deleted here.",
  "error.component.tooLarge": "This folder is too big to copy or delete in one step.",
  "error.component.unknownUndo": "That deletion can no longer be undone.",
  "error.component.writeFailed": "Could not write {file}: {reason}",
  "error.componentRemoval.changedSince": "{file} changed since. Nothing was changed; try again.",
  "error.componentRemoval.needsReview": { one: "Change {count} place first: {place}.", other: "Change {count} places first, starting with {place}." },
  "error.componentRemoval.wouldBreak": "{file} would not parse after the change, so nothing was deleted.",
  "error.componentRename.defaultsTaken": "The new location already has component defaults in .stacki/components.json. Remove them first.",
  "error.componentRename.destinationAppeared": "Something appeared at the new location, so nothing was renamed.",
  "error.componentRename.exists": "{file} already exists.",
  "error.componentRename.fileChanged": "{file} changed while the rename was being prepared. Try again.",
  "error.componentRename.missing": "{name} is no longer there.",
  "error.componentRename.name": "\u201C{name}\u201D cannot be a component name. Use letters and numbers, starting with a capital letter.",
  "error.componentRename.outside": "A component can only be renamed or moved within the project\u2019s component folders.",
  "error.componentRename.restoreFailed": "The rename failed and could not put back {files}: {detail}",
  "error.componentRename.restored": "The rename failed and every file was put back: {detail}",
  "error.componentRename.same": "Choose a different name or folder.",
  "error.componentRename.unreadable": "{file} mentions this component but cannot be read safely, so nothing was changed. Fix that file first.",
  "error.documents.createFailed": "Could not create {file}",
  "error.documents.createRaced": "{file} changed as it was created",
  "error.documents.exists": "{file} already exists",
  "error.documents.flushFailed": "{file} was saved, but its folder could not be flushed: {reason}",
  "error.documents.lockFailed": "Could not lock {file}: {reason}",
  "error.documents.lockHeld": "{file} is being saved by another program",
  "error.documents.lockLocate": "Could not locate lock: {reason}",
  "error.documents.lockTakenOver": "The lock on {file} was taken over",
  "error.documents.prepareFailed": "Could not prepare {folder}: {reason}",
  "error.documents.readFailed": "Could not read {file}: {reason}",
  "error.documents.saveFailed": "Could not save {file}: {reason}",
  "error.documents.saveFailedTemporary": "Could not save {file} or remove temporary file {temporary}: {reason}; {detail}",
  "error.documents.saveRejected": "Could not save {file} ({reason}).",
  "error.documents.saveUncertain": "{file} may not have been saved: {reason}",
  "error.documents.saveUncertainCheck": "{file} may not have been saved ({check}).",
  "error.documents.savesWaiting": "{file} has too many saves waiting; the edit was kept, save again.",
  "error.documents.sourceLimit": "{file} would exceed the 10 MB source limit",
  "error.documents.symlinkMissing": "{file} is a symlink to a missing file",
  "error.folderSettings.notFile": "Folder settings must be a file",
  "error.folderSettings.symlink": "Folder settings cannot be a symbolic link",
  "error.folderSettings.tooLong": "Folder settings exceed {limit} characters",
  "error.images.animated": "Animated and multipage images are not converted.",
  "error.images.changedDuringConversion": "An image changed during conversion. Both images were kept.",
  "error.images.convertedTooLarge": "The converted image exceeds 50 MB.",
  "error.images.dimensionsUnreadable": "The image dimensions could not be read.",
  "error.images.directoryMoved": "The image directory moved outside the project.",
  "error.images.outsideProject": "Linked images outside the project cannot be converted.",
  "error.images.referencesKept": "References updated, but the original was kept: {reason}",
  "error.images.rollbackFailed": "Could not update {file}: {reason}. {count} rollback failures.",
  "error.images.targetExists": "{name} already exists; nothing was changed.",
  "error.images.tooLarge": "Choose an image smaller than 50 MB.",
  "error.images.verificationFailed": "Converted image verification failed.",
  "error.images.verifyFailed": "Could not verify images; originals were not removed: {reason}",
  "error.instructions.frontmatterInvalid": "The frontmatter is not valid YAML: {reason}",
  "error.instructions.skillTooLarge": "This skill file is too large to read.",
  "error.media.hostSilent": "The media host did not answer.",
  "error.pageRename.notUtf8": "{file} is not UTF-8.",
  "error.pageTemplate.connectionGone": "That Sanity connection is no longer there. Connect Sanity again.",
  "error.pageTemplate.generic": "Stacki could not finish that.",
  "error.pageTemplate.keyUnreadable": "Stacki could not read this connection\u2019s key. Connect Sanity again.",
  "error.pages.devServerStatus": "Dev server returned {status}",
  "error.project.chooseInside": "Choose something inside the project, not the project itself.",
  "error.project.gone": "That is no longer there.",
  "error.project.outside": "That is outside the project.",
  "error.projectSettings.changed": "Project settings changed. Reload before saving.",
  "error.projectSettings.changedDuringSave": "Project settings changed during save. Reload to inspect them.",
  "error.projectSettings.inaccessible": "Could not access project settings.",
  "error.projectSettings.symlink": "Project settings cannot be symbolic links.",
  "error.publish.anotherRunning": "Another project is publishing. Wait for it to finish.",
  "error.publish.chooseBranch": "Choose a branch before publishing to GitHub.",
  "error.publish.chooseHosting": "Choose a hosting provider in Publish settings.",
  "error.publish.commandFailed": "Git {command} failed. Check access and try again.",
  "error.publish.commitMessageMissing": "Enter a commit message before publishing changes to GitHub.",
  "error.publish.hooksChangedSource": "Commit hooks changed the publish source. Review it and publish again.",
  "error.publish.incomingChanges": "GitHub has incoming changes. Use Pull from GitHub in the branch menu, then publish again.",
  "error.publish.localStatusStale": "Saved to GitHub, but local push status could not be updated. Refresh Git.",
  "error.publish.preparing": "Preparing publish\u2026",
  "error.publish.projectChanged": "Project or branch changed while publishing. Publish again to include the latest edits.",
  "error.publish.repositoriesBusy": "Wait for publishing to finish before changing repositories.",
  "error.publish.reviewBranchChanged": "The review branch was changed externally. Review it on GitHub before retrying.",
  "error.publish.reviewHint": "Submit changes for review and deploy the merged branch through your repository workflow.",
  "error.publish.reviewInvalidCredential": "Invalid GitHub review credential.",
  "error.publish.reviewNeedsBase": "Reviews require a committed local base.",
  "error.publish.reviewNeedsPull": "Pull the latest base branch before submitting a review.",
  "error.publish.reviewNeedsPush": "Push an initial base branch before opening a review.",
  "error.publish.reviewNeedsRepository": "Reviews require a GitHub repository.",
  "error.publish.reviewNeedsSignIn": "Sign in to GitHub before opening a review.",
  "error.publish.reviewNoChanges": "There are no changes to submit for review.",
  "error.publish.snapshotFileLimit": "Publish exceeds the 10,000-file snapshot limit.",
  "error.publish.snapshotSizeLimit": "Publish exceeds the 256 MiB snapshot limit.",
  "error.publish.sourceFileLimit": "Git inspection exceeds the 100,000-file limit.",
  "error.publish.sourceSizeLimit": "Git inspection exceeds the 8 GiB source limit.",
  "error.selectors.stylesInvalid": ".stacki/styles.json is invalid: {reason}",
  "error.studio.authNotInstalled": "Studio is not installed in this project.",
  "error.studio.authWrite": "The sign-in settings could not be written to studio/cloudflare/wrangler.jsonc.",
  "error.studio.devBundleMissing": "Build the development Studio bundle with npm run studio:release, then retry.",
  "error.studio.devVersionMismatch": "Development Studio version does not match Stacki. Run npm run studio:release.",
  "error.studio.downloadFailed": "Could not download Studio {version}. Check your connection and try again. If the Studio bundle is not published yet, use the agent setup prompt in Go live.",
  "error.studio.exists": "Studio already exists. Setup does not replace existing files.",
  "error.studio.folderExists": "A studio folder already exists. Setup will not overwrite it. Ask your agent to inspect it.",
  "error.studio.nodeMissing": "Install Node.js 22.19 or newer, then reopen Stacki and retry.",
  "error.studio.nodeOutdated": "Studio needs Node.js 22.19 or newer. Update Node.js and retry.",
  "error.studio.npmFailed": "Studio could not finish npm {command}. See the output above. Your project was not replaced.",
  "error.studio.releaseFileTooLarge": "Choose a Studio release JSON file smaller than 32 MB.",
  "error.terminal.missingId": "Missing terminal id.",
  "error.terminal.outsideProject": "Terminal can only open inside the current project.",
  "error.thumbnails.devServerSlow": "the dev server did not start in time",
  "error.thumbnails.noDependencies": "This project has no dependencies installed yet."
};

// vendor/stacki/shared/properties/i18n/messages/en/git.ts
var messages16 = {
  "git.action.delete.anyway": "Delete anyway",
  "git.action.delete.body": "Anything saved only on {branch} goes with it.",
  "git.action.delete.bodyParked": `Anything saved only on {branch} goes with it.

Changes are waiting on it. They stay parked and won\u2019t be deleted, but nothing will bring them back once the branch is gone.`,
  "git.action.delete.confirm": "Delete branch",
  "git.action.delete.done": "Deleted {branch}",
  "git.action.delete.loseTitle": "This would lose work",
  "git.action.delete.title": "Delete the branch \u201C{branch}\u201D?",
  "git.action.delete.unmerged": "\u201C{branch}\u201D has commits that aren\u2019t on any other branch. Deleting it loses them.",
  "git.action.dirty.body": {
    one: "{files} has changes that aren\u2019t saved, and the merge needs to write there. Your work can be set aside and put back afterwards \u2014 nothing is lost either way.",
    other: "{files} have changes that aren\u2019t saved, and the merge needs to write there. Your work can be set aside and put back afterwards \u2014 nothing is lost either way."
  },
  "git.action.dirty.bodyUnknown": "A file the merge needs has changes that aren\u2019t saved, and the merge needs to write there. Your work can be set aside and put back afterwards \u2014 nothing is lost either way.",
  "git.action.dirty.confirm": "Set it aside and merge",
  "git.action.dirty.parkFailed": "Could not set your work aside.",
  "git.action.dirty.stillBlocked": "Still blocked \u2014 your work is back where it was.",
  "git.action.dirty.title": "You have unsaved work in the way",
  "git.action.merge.alreadyHad": "{into} already had everything from {branch}",
  "git.action.merge.alreadyHas": "{into} already has everything from {branch}",
  "git.action.merge.confirm": "Merge into {into}",
  "git.action.merge.deleteAfter": "Delete \u201C{branch}\u201D afterwards",
  "git.action.merge.deleteHint": "Merged changes stay in {into}.",
  "git.action.merge.done": "Merged {branch} into {into}",
  "git.action.merge.doneBack": "Merged {branch} into {into} \u2014 your work is back",
  "git.action.merge.title": "Merge \u201C{branch}\u201D into \u201C{into}\u201D?",
  "git.action.tidy.deletedChanged": "Merged {branch} into {into}, and deleted {branch}",
  "git.action.tidy.deletedUnchanged": "{into} already had everything from {branch}, and deleted {branch}",
  "git.action.tidy.failedChanged": "Merged {branch} into {into}. {branch} could not be deleted: {message}",
  "git.action.tidy.failedUnchanged": "{into} already had everything from {branch}. {branch} could not be deleted: {message}",
  "git.action.tidy.keptChanged": "Merged {branch} into {into}. {branch} was kept \u2014 it still has commits of its own.",
  "git.action.tidy.keptUnchanged": "{into} already had everything from {branch}. {branch} was kept \u2014 it still has commits of its own.",
  "git.branch.aiChanged": "The AI created or switched to branch {name}.",
  "git.branch.aiDetached": "The AI moved this project off any branch (detached HEAD).",
  "git.branch.closeNew": "Close new branch",
  "git.branch.create": "Create",
  "git.branch.currentLabel": "{branch}, current branch",
  "git.branch.delete": "Delete {branch}",
  "git.branch.error.at": "\u201C@\u201D is git\u2019s own name for the current branch.",
  "git.branch.error.endsDot": "A name can\u2019t end with \u201C.\u201D.",
  "git.branch.error.endsSlash": "A name can\u2019t end with \u201C/\u201D.",
  "git.branch.error.exists": "{branch} already exists.",
  "git.branch.error.existsCase": "{branch} already exists, and names differing only in case are the same branch here.",
  "git.branch.error.lock": "\u201C.lock\u201D is reserved by git.",
  "git.branch.heading": "Branches",
  "git.branch.indicator.detached": "Detached HEAD",
  "git.branch.indicator.detachedTooltip": "Not on a branch (detached HEAD). Work done here is easy to lose.",
  "git.branch.indicator.tooltip": "Current branch: {name}",
  "git.branch.localCount": { one: "{count} local", other: "{count} local" },
  "git.branch.mergeInto": "Merge {branch} into {current}",
  "git.branch.name": "Branch name",
  "git.branch.new": "New branch",
  "git.branch.newNameLabel": "New branch name",
  "git.branch.parkedLabel": "Saved changes",
  "git.branch.parkedTitle": "Changes waiting on this branch",
  "git.branch.switchTo": "Switch to {branch}",
  "git.browser.clear": "Clear",
  "git.browser.clearAll": "Clear all",
  "git.browser.noFiles": "No files.",
  "git.browser.noMatches": "Nothing matches \u201C{query}\u201D.",
  "git.browser.search": "Search files\u2026",
  "git.browser.selectAll": "Select all",
  "git.browser.selectedOf": "{selected} of {total}",
  "git.busy.committing": "Committing\u2026",
  "git.busy.creating": "Creating branch\u2026",
  "git.busy.deleting": "Deleting branch\u2026",
  "git.busy.initializing": "Initializing\u2026",
  "git.busy.merging": "Merging\u2026",
  "git.busy.pulling": "Pulling\u2026",
  "git.busy.switching": "Switching\u2026",
  "git.busy.working": "Working\u2026",
  "git.chip.committed": "Changes committed",
  "git.chip.committedSwitched": "Committed to {from}, now on {branch}",
  "git.chip.controls": "Repository controls",
  "git.chip.created": "Created branch {branch}",
  "git.chip.initialize": "Initialize Git",
  "git.chip.initialized": "Initialized git repository",
  "git.chip.pickedUp": "Picked your changes back up on {branch}",
  "git.chip.reading": "Reading repository\u2026",
  "git.chip.savedFiles": { one: "Saved {count} file", other: "Saved {count} files" },
  "git.chip.switched": "Switched to {branch}",
  "git.chip.waiting": "On {branch} \u2014 your changes are waiting on {from}",
  "git.commit.all": "Commit all changes",
  "git.commit.chooseFiles": "Choose files to commit",
  "git.commit.chooseWhat": "Choose what to commit",
  "git.commit.closeSelection": "Close file selection",
  "git.commit.files": { one: "Commit {count} file", other: "Commit {count} files" },
  "git.commit.filesButton": "Files",
  "git.commit.filesButtonCount": "Files ({count})",
  "git.commit.loadingFiles": "Loading changed files\u2026",
  "git.commit.message": "Commit message",
  "git.commit.nothing": "Nothing to commit",
  "git.commit.nothingChanged": "Nothing has changed.",
  "git.commit.selectedCount": { one: "{count} file selected", other: "{count} files selected" },
  "git.commit.to": "Commit to",
  "git.commit.useAll": "Use all files",
  "git.conflict.changeOf": "Change {index} of {total}",
  "git.conflict.changedFiles": "Changed files",
  "git.conflict.choicesToReview": { one: "{count} choice to review", other: "{count} choices to review" },
  "git.conflict.chooseVersion": "Choose a version to keep.",
  "git.conflict.combine": "Combine edits",
  "git.conflict.currentBranch": "Current branch",
  "git.conflict.filesLabel": "Files to merge",
  "git.conflict.finalCode": "Final code",
  "git.conflict.finalMerged": "Final merged code",
  "git.conflict.from": "From {branch}",
  "git.conflict.into": "into",
  "git.conflict.intro": "Independent changes are combined. Review highlights or edit the final code.",
  "git.conflict.keep": "Keep {branch}",
  "git.conflict.keepBoth": "Keep both blocks",
  "git.conflict.label.both": "Both branches changed this",
  "git.conflict.label.bothDifferent": "Both branches changed this line, in different places",
  "git.conflict.label.only": "Only {branch} changed this",
  "git.conflict.mergeResult": "Merge result",
  "git.conflict.next": "Next change",
  "git.conflict.notText": "This file cannot be compared as text. Choose the version to keep.",
  "git.conflict.previous": "Previous change",
  "git.conflict.ready": "Ready",
  "git.conflict.readyToMerge": "Ready to merge",
  "git.conflict.removeText": "Remove this text",
  "git.conflict.review": "Review merge",
  "git.conflict.spansMultiple": "Your edit spans multiple changes. Undo in the code editor to restore individual choices.",
  "git.conflict.status.both": "Keeping both blocks",
  "git.conflict.status.choose": "Choose which version to keep",
  "git.conflict.status.combined": "Independent edits combined",
  "git.conflict.status.keeping": "Keeping {branch}",
  "git.conflict.status.manual": "Manually edited",
  "git.conflict.toReview": "{count} to review",
  "git.conflict.yourEdit": "Your edit",
  "git.conflict.yourEdits": "Your edits",
  "git.done": "Done",
  "git.error.cloneNotAstro": "Downloaded to {path}, but its root is not an Astro project. Use Open Project to choose the Astro folder inside it.",
  "git.error.commitNothingPicked": "Nothing was picked to save \u2014 choose at least one file.",
  "git.error.deleteFailed": 'Could not delete "{branch}".',
  "git.error.deleteSelf": '"{branch}" is the branch you are on \u2014 switch to another one first.',
  "git.error.deleteTrunk": '"{branch}" is the branch everything comes back to. Deleting it would leave the project without its main line of work.',
  "git.error.deleteWorktree": '"{branch}" is checked out in another worktree ({path}). Close or switch that one first.',
  "git.error.mergeBranchChanged": "The current branch changed. Reopen the merge to review it again.",
  "git.error.mergeChangedSinceReview": "The merge changed since review. Reopen it to review the new result.",
  "git.error.mergeFailed": 'Could not merge "{branch}" into "{into}".',
  "git.error.mergeFileChanged": "The file changed since review. Reopen the merge to review it again.",
  "git.error.mergeFilesChanged": "The conflicted files changed. Reopen the merge to review them again.",
  "git.error.mergeFinishFailed": 'Could not finish merging "{branch}".',
  "git.error.mergeSelf": '"{branch}" is the branch you are on \u2014 there is nothing to merge into.',
  "git.error.originExists": "This project already has an origin remote. It was left unchanged.",
  "git.error.pullBranchChanged": "The current branch changed. Refresh Git and try pulling again.",
  "git.error.restoreMissing": "That version doesn\u2019t have this file \u2014 it was added later.",
  "git.error.restoreUnsaved": "There are unsaved changes here. Save them first \u2014 going back would write over them.",
  "git.error.switchFailed": 'Could not switch to "{branch}".',
  "git.error.unparkDirty": 'Your work on "{branch}" is still parked because this branch has local changes.',
  "git.error.unparkFailed": 'Your work on "{branch}" is still parked \u2014 it could not be put back automatically because the branch has changed underneath it. It is safe: recover it with `git stash list` and `git stash pop`.',
  "git.file.changed": "Changed",
  "git.file.changed.inVersion": "Changed in this version",
  "git.file.changed.why": "This file has changes that aren\u2019t saved yet",
  "git.file.clashing": "Clashing",
  "git.file.clashing.inVersion": "Clashing in this version",
  "git.file.clashing.why": "Two branches changed this file and it needs sorting out",
  "git.file.copied": "Copied",
  "git.file.copied.inVersion": "Copied in this version",
  "git.file.copied.why": "This file was copied from another one",
  "git.file.deleted": "Deleted",
  "git.file.deleted.inVersion": "Deleted in this version",
  "git.file.deleted.why": "This file has been deleted",
  "git.file.moved": "Moved",
  "git.file.moved.inVersion": "Moved in this version",
  "git.file.moved.why": "This file has been moved or renamed",
  "git.file.new": "New",
  "git.file.new.inVersion": "New in this version",
  "git.file.new.why": "This file is new \u2014 it isn\u2019t in the last saved version",
  "git.file.unknownWhy": "git calls this \u201C{status}\u201D",
  "git.publish.checkingCli": "Checking GitHub CLI\u2026",
  "git.publish.cliMissing": "GitHub CLI (gh) isn\u2019t installed. Install it from cli.github.com, then run gh auth login.",
  "git.publish.cliSignedOut": "GitHub CLI isn\u2019t signed in. Run gh auth login in a terminal, then reopen this dialog.",
  "git.publish.currentBranch": "current branch",
  "git.publish.destination": "Repository destination",
  "git.publish.destinationExisting": "Use an existing repository",
  "git.publish.destinationNew": "Create a new repository",
  "git.publish.doneBody": "{name} is on GitHub and <strong>{branch}</strong> has been pushed.",
  "git.publish.enterName": "Enter a repository name.",
  "git.publish.hasRemote": "This project already has a remote. Use Push to publish changes.",
  "git.publish.hintExisting": "Commits changes and pushes without overwriting remote history.",
  "git.publish.hintPrivate": "Creates a private repository and pushes <strong>{branch}</strong>.",
  "git.publish.hintPrivateTo": "Creates a private repository and pushes <strong>{branch}</strong> to {user}.",
  "git.publish.hintPublic": "Creates a public repository and pushes <strong>{branch}</strong>.",
  "git.publish.hintPublicTo": "Creates a public repository and pushes <strong>{branch}</strong> to {user}.",
  "git.publish.initializeFirst": "Initialize a Git repository before publishing.",
  "git.publish.invalidRepository": "Enter a repository as owner/name.",
  "git.publish.preparing": "Preparing\u2026",
  "git.publish.private": "Private repository",
  "git.publish.published": "Published to GitHub",
  "git.publish.repositoryName": "Repository name",
  "git.publish.step.committing": "Committing changes\u2026",
  "git.publish.step.connecting": "Connecting repository and pushing\u2026",
  "git.publish.step.creating": "Creating repository and pushing\u2026",
  "git.publish.submit": "Publish",
  "git.publish.submitting": "Publishing\u2026",
  "git.publish.title": "Publish to GitHub",
  "git.publish.tryAgain": "Try again",
  "git.pull.checking": "Checking GitHub for incoming changes\u2026",
  "git.pull.commits": { one: "{count} commit to pull", other: "{count} commits to pull" },
  "git.pull.dirty": "Commit your local changes before pulling: incoming changes affect the same files.",
  "git.pull.done": "Pulled changes from GitHub",
  "git.pull.label": "Pull from GitHub",
  "git.pull.none": "No changes to pull",
  "git.pull.unavailable": "Could not check GitHub. Retrying automatically. {message}",
  "git.pull.upToDate": "Already up to date with GitHub",
  "git.studio.branchExists": "This branch already exists.",
  "git.studio.branchGone": "This branch no longer exists.",
  "git.studio.branchLimit": "Studio supports at most {max} branches.",
  "git.studio.branchMissing": "The configured Git branch no longer exists.",
  "git.studio.commandFailed": "Git failed.",
  "git.studio.connectGitHub": "Connect GitHub first.",
  "git.studio.deleteProtected": "The active branch and main branch cannot be deleted.",
  "git.studio.fileChanged": "A selected file changed. Refresh the file list before committing.",
  "git.studio.githubChanged": "GitHub changed. Pull from GitHub before publishing.",
  "git.studio.historyBranchGone": "The configured branch is no longer available.",
  "git.studio.historyBranchLimit": "This repository exceeds the {max}-branch history limit.",
  "git.studio.historyCommitGone": "This commit is no longer available in the fetched history.",
  "git.studio.historyNotConnected": "Connect a GitHub repository to view published history.",
  "git.studio.historyUnreadable": "Could not read repository history.",
  "git.studio.noChanges": "There are no changes to commit.",
  "git.studio.notPushed": "This branch has not been pushed to GitHub yet.",
  "git.studio.parkedConflict": "Parked changes conflict with this branch. They are still saved.",
  "git.studio.parkedExists": "This branch already has parked changes. Restore them first.",
  "git.studio.publishBehind": "Pull from GitHub before publishing; the remote has changes this branch lacks.",
  "git.studio.publishCheckpoint": "Saved to GitHub, but the local Git checkpoint could not be updated. Let Studio restart to recover its checkpoint before publishing again.",
  "git.studio.publishingBusy": "Wait for publishing to finish before changing Git.",
  "git.studio.pullReviewChanged": "The pull review changed. Pull again to review its current conflicts.",
  "git.studio.repositoryChanged": "The repository changed. Recover your existing Git workspace first.",
  "git.studio.selectFile": "Select at least one changed file.",
  "git.studio.sharedBranchChanged": "The shared branch changed. Reload Studio before editing.",
  "git.studio.sharedBranchChangedSave": "The shared branch changed before this edit could be saved. Reload Studio.",
  "git.studio.storageNeedsRecovery": "Git storage needs recovery. Leave Studio idle so its container can restart.",
  "git.studio.tooManyCommits": "Too many unpublished Git commits. Push your changes first.",
  "git.studio.tooManyWorkspaces": "Too many active Git workspaces.",
  "git.studio.unpublishedTooLarge": "Unpublished Git work exceeds {size}. Push your changes first.",
  "git.switch.body": {
    one: "{from} and {to} have different versions of this file, so your unsaved work can\u2019t follow you across. It can wait here until you come back \u2014 no commit needed.",
    other: "{from} and {to} have different versions of these files, so your unsaved work can\u2019t follow you across. It can wait here until you come back \u2014 no commit needed."
  },
  "git.switch.commitFirst": "Commit first",
  "git.switch.commitFirstLabel": "Or commit them first",
  "git.switch.commitFirstTitle": "Commit to {from}, then switch",
  "git.switch.leave": "Leave them on {from}",
  "git.switch.leaveTitle": "Set them aside on {from} and pick them up when you return",
  "git.switch.more": "+{count} more",
  "git.switch.title": "These changes can\u2019t come with you",
  "git.sync.conflict": "GitHub and the draft changed the same content. Choose which version to keep for these files.",
  "git.sync.keepDraft": "Keep draft versions",
  "git.sync.useGitHub": "Use GitHub versions",
  "git.type.breaking": "Breaking",
  "git.type.breakingHint": "Adds ! to mark a change that breaks something people rely on",
  "git.type.description.build": "build setup or dependencies",
  "git.type.description.chore": "upkeep, nothing visible changes",
  "git.type.description.ci": "automation and checks",
  "git.type.description.content": "copy, images or data",
  "git.type.description.docs": "documentation only",
  "git.type.description.feat": "a new feature",
  "git.type.description.fix": "a bug fix",
  "git.type.description.perf": "faster or lighter",
  "git.type.description.refactor": "restructure without changing behaviour",
  "git.type.description.revert": "undo an earlier commit",
  "git.type.description.style": "visual or CSS change",
  "git.type.description.test": "tests only",
  "git.type.label": "Commit type",
  "git.type.none": "No type",
  "git.type.noneDescription": "the message as typed",
  "git.type.scopeInvalid": "A scope has no spaces, parentheses or colons.",
  "git.type.scopeLabel": "Commit scope",
  "git.type.scopePlaceholder": "Scope, e.g. nav",
  "git.type.scopeTooLong": "A scope is at most {max} characters.",
  "git.type.search": "Search types"
};

// vendor/stacki/shared/properties/i18n/messages/en/history.ts
var messages17 = {
  "history.backToNow": "Back to now",
  "history.commit.actions": "Commit actions",
  "history.commit.merge": "Merge commit",
  "history.commit.preview": "Preview",
  "history.commit.restoreProject": "Restore project to this commit\u2026",
  "history.commit.you": "You",
  "history.day.today": "Today",
  "history.day.yesterday": "Yesterday",
  "history.dialog.close": "Close changed files",
  "history.dialog.title": "Changed files ({count})",
  "history.diff.allFiles": "All files",
  "history.diff.emptyTree": "Empty tree",
  "history.diff.firstParent": "compared with first parent",
  "history.diff.label": "File diff",
  "history.diff.loading": "Loading diff\u2026",
  "history.diff.noTextChanges": "No text changes in this file.",
  "history.diff.restoreFile": "Restore file\u2026",
  "history.error.diffUnreadable": "Could not read this commit\u2019s diff.",
  "history.files.added": {
    one: "{count} file added",
    other: "{count} files added"
  },
  "history.files.changedLabel": "changed files",
  "history.files.count": {
    one: "{count} file",
    other: "{count} files"
  },
  "history.files.deleted": {
    one: "{count} file deleted",
    other: "{count} files deleted"
  },
  "history.files.from": "From {path}",
  "history.files.listLabel": "Changed files list",
  "history.files.noMatch": "No files match this filter.",
  "history.files.none": "No files changed.",
  "history.files.unavailable": "Changed files are unavailable for this commit.",
  "history.files.updated": {
    one: "{count} file updated",
    other: "{count} files updated"
  },
  "history.files.view": "View changed files ({count})",
  "history.files.viewDiff": "View diff for {path}",
  "history.filter.added": "New",
  "history.filter.all": "All",
  "history.filter.deleted": "Deleted",
  "history.filter.label": "Filter changed files",
  "history.filter.updated": "Changed",
  "history.scope.all": "All branches",
  "history.scope.ariaLabel": "Filter commits by branch",
  "history.scope.current": "Current branch",
  "history.scope.label": "Filter commits",
  "history.scope.showing": "Showing commits on {branch}",
  "history.sort.ariaLabel": "Sort changed files",
  "history.sort.label": "Sort",
  "history.sort.path": "File path",
  "history.sort.status": "Status",
  "history.summary.moreFiles": {
    one: "{first} and {count} other file",
    other: "{first} and {count} other files"
  },
  "history.summary.morePages": {
    one: "{first} and {count} other page",
    other: "{first} and {count} other pages"
  },
  "history.summary.none": "No files changed",
  "history.summary.two": "{first} and {second}",
  "history.time.daysAgo": {
    one: "{count} day ago",
    other: "{count} days ago"
  },
  "history.time.hoursAgo": {
    one: "{count} hour ago",
    other: "{count} hours ago"
  },
  "history.time.justNow": "just now",
  "history.time.minutesAgo": {
    one: "{count} minute ago",
    other: "{count} minutes ago"
  },
  "history.time.yesterday": "yesterday",
  "history.timeline.empty": "Nothing saved yet. Once you save your first version it shows up here, and you can come back to it whenever you like.",
  "history.timeline.label": "Git history",
  "history.timeline.showOlder": "Show older",
  "history.versionHistory": "Version history"
};

// vendor/stacki/shared/properties/i18n/messages/en/instructionsPanel.ts
var messages18 = {
  "instructionsPanel.conflict.blocked": "Both changed the same lines; pick one version.",
  "instructionsPanel.conflict.merge": "Merge both",
  "instructionsPanel.conflict.mergeTip": "Keep both changes",
  "instructionsPanel.conflict.message": "This file changed on disk while you were editing. Your edits are kept here and are not being saved.",
  "instructionsPanel.conflict.mine": "Keep mine",
  "instructionsPanel.conflict.theirs": "Use disk version",
  "instructionsPanel.docs.empty": "No other Markdown files in this project.",
  "instructionsPanel.docs.new": "New doc",
  "instructionsPanel.docs.title": "Docs",
  "instructionsPanel.form.create": "Create",
  "instructionsPanel.form.docPath": "Doc path",
  "instructionsPanel.form.folder": "Folder",
  "instructionsPanel.form.folderName": "Folder name",
  "instructionsPanel.form.projectRoot": "Project root",
  "instructionsPanel.form.ruleName": "Rule name",
  "instructionsPanel.form.savedAs": "Saved as {path}",
  "instructionsPanel.form.skillDescription": "Skill description",
  "instructionsPanel.form.skillName": "Skill name",
  "instructionsPanel.form.skillNeedsWhen": "Say when an agent should use this skill.",
  "instructionsPanel.form.skillPlaceholder": "What it does, and when an agent should use it",
  "instructionsPanel.hidden": "Hidden {pattern}. Settings \u2192 Instructions shows it again.",
  "instructionsPanel.menu.copyPath": "Copy path",
  "instructionsPanel.menu.hideFile": "Hide file",
  "instructionsPanel.menu.hideFolder": "Hide folder",
  "instructionsPanel.menu.reveal": "Reveal in Finder",
  "instructionsPanel.rowOptions": "{label} options",
  "instructionsPanel.rules.empty": "No rules yet. Add an AGENTS.md or a rule file to tell AI how this project is built.",
  "instructionsPanel.rules.new": "New rule",
  "instructionsPanel.rules.newFolder": "New rule folder",
  "instructionsPanel.rules.title": "Rules",
  "instructionsPanel.skills.empty": "No skills yet. Create your first skill to give AI the context it needs to do its best work.",
  "instructionsPanel.skills.new": "New skill",
  "instructionsPanel.skills.title": "Skills",
  "instructionsPanel.truncated": "This project has more Markdown than the panel lists. Hide folders in Settings \u2192 Instructions to see the rest.",
  "instructionsPanel.view.closeFile": "Close file",
  "instructionsPanel.view.edited": "Edited",
  "instructionsPanel.view.fields": "Fields",
  "instructionsPanel.view.label": "View",
  "instructionsPanel.view.opening": "Opening {file}\u2026",
  "instructionsPanel.view.readOnly": "Read only",
  "instructionsPanel.view.region": "Instructions: {file}",
  "instructionsPanel.view.saved": "Saved",
  "instructionsPanel.view.saving": "Saving\u2026",
  "instructionsPanel.view.source": "Source",
  "instructionsPanel.problem.skillNameEmpty": "Give the skill a name.",
  "instructionsPanel.problem.skillNameLong": "A skill name is at most {max} characters.",
  "instructionsPanel.problem.skillNameFormat": 'Use lowercase letters, numbers and single hyphens, like "write-tests".',
  "instructionsPanel.problem.fileNameEmpty": "Give it a name.",
  "instructionsPanel.problem.fileNameLong": "A name is at most {max} characters.",
  "instructionsPanel.problem.fileNameChars": 'A name cannot hold / \\ : * ? " < > or |.',
  "instructionsPanel.problem.fileNameDot": "A name cannot start with a dot."
};

// vendor/stacki/shared/properties/i18n/messages/en/menu.ts
var messages19 = {
  "menu.app.about": "About Stacki",
  "menu.app.hide": "Hide Stacki",
  "menu.app.hideOthers": "Hide Others",
  "menu.app.quit": "Quit Stacki",
  "menu.app.services": "Services",
  "menu.app.showAll": "Show All",
  "menu.edit.copy": "Copy",
  "menu.edit.copySelection": "Copy Selection",
  "menu.edit.cut": "Cut",
  "menu.edit.insertElement": "Insert Element\u2026",
  "menu.edit.paste": "Paste",
  "menu.edit.redo": "Redo",
  "menu.edit.selectAll": "Select All",
  "menu.edit.title": "Edit",
  "menu.edit.undo": "Undo",
  "menu.file.checkForUpdates": "Check for Updates\u2026",
  "menu.file.closeProject": "Close Project",
  "menu.file.closeWindow": "Close Window",
  "menu.file.openProject": "Open Project\u2026",
  "menu.file.quit": "Quit",
  "menu.file.settings": "Settings\u2026",
  "menu.file.title": "File",
  "menu.view.actualSize": "Actual Size",
  "menu.view.forceReload": "Force Reload",
  "menu.view.fullScreen": "Toggle Full Screen",
  "menu.view.reload": "Reload",
  "menu.view.reloadAllCode": "Reload All Code",
  "menu.view.reloadWindow": "Reload Window Only",
  "menu.view.title": "View",
  "menu.view.toggleDevTools": "Toggle Developer Tools",
  "menu.view.zoomIn": "Zoom In",
  "menu.view.zoomOut": "Zoom Out",
  "menu.window.bringAllToFront": "Bring All to Front",
  "menu.window.close": "Close",
  "menu.window.minimize": "Minimize",
  "menu.window.title": "Window",
  "menu.window.zoom": "Zoom"
};

// vendor/stacki/shared/properties/i18n/messages/en/pages.ts
var messages20 = {
  "pages.create.page": "Create page",
  "pages.create.template": "Create page template",
  "pages.folder.count": { one: "{count} page", other: "{count} pages" },
  "pages.folder.new": "New folder",
  "pages.injected.count": "{count} \xB7 preview only",
  "pages.injected.from": "From {source}",
  "pages.injected.integrations": "integrations",
  "pages.layout": "Layout",
  "pages.new.button": "New page",
  "pages.new.create": "Create Page",
  "pages.new.nameLabel": 'Page name (e.g. "about" or "blog/post-1")',
  "pages.new.namePlaceholder": "about",
  "pages.new.noLayout": "(no layout)",
  "pages.new.title": "New Page",
  "pages.order.reload": "Reload page order",
  "pages.panel.empty": "No pages yet. Create one with +.",
  "pages.panel.noMatch": "No pages match \u201C{query}\u201D.",
  "pages.panel.search": "Search pages and folders",
  "pages.rename.applying": "Applying\u2026",
  "pages.rename.error.changedDuring": "{file} changed during the rename.",
  "pages.rename.error.conflictUrl": "The URL {url} is already used by another page or folder.",
  "pages.rename.error.destinationAppeared": "The destination appeared during the rename.",
  "pages.rename.error.dynamicParameters": "Keep dynamic route parameters unchanged; rename their surrounding folders.",
  "pages.rename.error.exists": "That page or folder already exists.",
  "pages.rename.error.fileChanged": "{file} changed. Retry the rename.",
  "pages.rename.error.insideItself": "A folder cannot be moved inside itself.",
  "pages.rename.error.invalidPath": "Enter a valid page or folder path.",
  "pages.rename.error.missing": "This page or folder no longer exists. Refresh the list.",
  "pages.rename.error.nothingChosen": "Choose a page or folder to rename.",
  "pages.rename.error.outsidePages": "Page paths must stay inside the pages folder.",
  "pages.rename.error.pageExtension": "Pages must keep an Astro or Markdown extension.",
  "pages.rename.error.pathCharacters": "Use letters, numbers, spaces or dashes in page paths.",
  "pages.rename.error.reconnect": "Reconnect the project repository before renaming pages.",
  "pages.rename.error.restoreFailed": "{detail} Could not restore: {files}. Check these files before retrying.",
  "pages.rename.error.restored": "{detail} Link changes were restored.",
  "pages.rename.folder": "Rename folder",
  "pages.rename.page": "Rename page",
  "pages.rename.separators": "Enter a name without folder separators.",
  "pages.rename.urlName": "URL name",
  "pages.sample.address": "Web address",
  "pages.sample.cleanedUp": "Cleaned up: {address}",
  "pages.sample.deselectAll": "Deselect all",
  "pages.sample.eachItem": { one: "The item", other: "Each of the {count} items" },
  "pages.sample.fieldCount": { one: "{count} field", other: "{count} fields" },
  "pages.sample.fields": "Fields",
  "pages.sample.itemCount": { one: "{count} item", other: "{count} items" },
  "pages.sample.noMatch": "Nothing matches",
  "pages.sample.search": "Search data",
  "pages.sample.selectAll": "Select all",
  "pages.select.all": "Select all pages",
  "pages.select.both": "{pages} and {folders}",
  "pages.select.confirm.errorPage": "This includes the site\u2019s error page. Without it, a missing address shows Astro\u2019s default page.",
  "pages.select.confirm.files": {
    one: "{count} file in src/pages is deleted. Undo puts it back.",
    other: "{count} files in src/pages are deleted. Undo puts them all back in one step."
  },
  "pages.select.confirm.links": { one: "{count} link points to these pages and will break:", other: "{count} links point to these pages and will break:" },
  "pages.select.confirm.noLinks": "No links point to these pages.",
  "pages.select.confirm.title": "Delete {what}?",
  "pages.select.count": "{count} selected",
  "pages.select.delete": "Delete",
  "pages.select.done": "Deleted {what}.",
  "pages.select.error.otherFiles": "The folder \u201C{folder}\u201D holds {file}, which is not a page. Move or delete it first.",
  "pages.select.error.tooMany": "Select at most {pages} pages and {folders} folders at a time.",
  "pages.select.folderRow": "Select the folder {name}",
  "pages.select.folderToggle": "Show or hide this folder\u2019s pages",
  "pages.select.foldersCount": { one: "{count} folder", other: "{count} folders" },
  "pages.select.pagesCount": { one: "{count} page", other: "{count} pages" },
  "pages.select.row": "Select {name}",
  "pages.select.start": "Select",
  "pages.select.startTitle": "Select pages and folders to delete together",
  "pages.select.stop": "Done",
  "pages.select.stopTitle": "Leave select mode",
  "pages.select.undo": "Delete {what}",
  "pages.settings.confirm.confirm": "Confirm",
  "pages.settings.confirm.delete": "Delete page",
  "pages.settings.confirm.deleteErrorPage": "This is the site\u2019s error page. Without it, a missing address shows Astro\u2019s default page.",
  "pages.settings.confirm.deleteFile": "{file} is deleted. Undo puts it back.",
  "pages.settings.confirm.deleteLinks": { one: "{count} link points to this page and will break:", other: "{count} links point to this page and will break:" },
  "pages.settings.confirm.deleteNoLinks": "No links point to this page.",
  "pages.settings.confirm.deleteTitle": "Delete \u201C{name}\u201D?",
  "pages.settings.confirm.fileCount": { one: "{count} file", other: "{count} files" },
  "pages.settings.confirm.homeBecomes": "{name} becomes the homepage, at / ({file}).",
  "pages.settings.confirm.homeTitle": "Make \u201C{name}\u201D the homepage?",
  "pages.settings.confirm.links": { one: "{count} link in {files} is updated.", other: "{count} links in {files} are updated." },
  "pages.settings.confirm.noLinks": "No links need updating.",
  "pages.settings.confirm.nothingElse": "Nothing else changes, and one Undo puts it all back.",
  "pages.settings.confirm.oldHomeBecomes": "{name} moves to {url} ({file}).",
  "pages.settings.confirm.renameMoves": "{from} becomes {to}.",
  "pages.settings.confirm.renameTitle": "Change the address to {url}?",
  "pages.settings.confirm.review": "Check these lines by hand:",
  "pages.settings.confirm.reviewMore": { one: "\u2026and {count} more", other: "\u2026and {count} more" },
  "pages.settings.delete": "Delete this page",
  "pages.settings.delete.homeRefused": "The homepage can\u2019t be deleted. Make another page the homepage first.",
  "pages.settings.done.delete": "Deleted {name}.",
  "pages.settings.done.duplicate": "Duplicated as {name}.",
  "pages.settings.done.home": "{name} is now the homepage.",
  "pages.settings.done.rename": "Renamed {name}.",
  "pages.settings.done.template": "Updated the template of {name}.",
  "pages.settings.duplicate": "Duplicate this page",
  "pages.settings.error.noCopyName": "There is no free name for a copy of this page.",
  "pages.settings.error.notText": "{file} is not UTF-8 text, so Stacki will not rewrite it.",
  "pages.settings.error.templateChanged": "The template changed since the dialog read it. Close settings and open them again.",
  "pages.settings.error.undoGone": "This step can no longer be undone.",
  "pages.settings.error.unparsable": "{file} does not parse after the change, so nothing was changed. Fix the file and try again.",
  "pages.settings.folder": "Folder",
  "pages.settings.folder.empty": "Enter a folder name.",
  "pages.settings.folder.exists": "A folder named {name} already exists.",
  "pages.settings.folder.new": "New folder\u2026",
  "pages.settings.folder.placeholder": "Folder name",
  "pages.settings.folder.root": "Pages (root)",
  "pages.settings.home.confirm": "Make homepage",
  "pages.settings.home.isHome": "This page is the homepage, served at /.",
  "pages.settings.home.label": "Convert to home",
  "pages.settings.home.make": "Make this page the homepage",
  "pages.settings.home.refusal.alreadyHome": "This page is already the homepage.",
  "pages.settings.home.refusal.collision": "Another page already answers at this page\u2019s address. Resolve that first.",
  "pages.settings.home.refusal.dynamic": "Dynamic pages can\u2019t be the homepage.",
  "pages.settings.home.refusal.errorPage": "Error pages (404, 500) can\u2019t be the homepage.",
  "pages.settings.home.refusal.locale": "Pages in a language folder can\u2019t be the homepage.",
  "pages.settings.home.refusal.noHome": "This site has no homepage file (src/pages/index.astro) to swap with.",
  "pages.settings.home.refusal.notAPage": "Only Astro and Markdown pages can be the homepage.",
  "pages.settings.home.refusal.twoHomes": "Both index.astro and index.md exist. Keep one homepage file, then try again.",
  "pages.settings.home.replaces": "Replaces {name} as the homepage",
  "pages.settings.homeBadge": "Homepage",
  "pages.settings.layout.add": "Add a prop to {name}",
  "pages.settings.layout.empty": "{name} has no props yet.",
  "pages.settings.layout.none": "This page has no layout component.",
  "pages.settings.move.confirm": "Move page",
  "pages.settings.open": "Page settings",
  "pages.settings.section.general": "General",
  "pages.settings.section.layout": "Layout props",
  "pages.settings.section.template": "Template",
  "pages.settings.slug.dynamic": "This template\u2019s address pattern comes from its file name. Rename its folder to move it.",
  "pages.settings.slug.empty": "Enter a URL name.",
  "pages.settings.slug.reservedIndex": "\u201Cindex\u201D is the homepage\u2019s file name. Use \u201CMake this page the homepage\u201D instead.",
  "pages.settings.template.apply": "Apply template settings",
  "pages.settings.template.custom": "Custom template",
  "pages.settings.template.customBody": "This template\u2019s code was changed by hand, so Stacki shows it as code instead of rewriting it.",
  "pages.settings.template.editCode": "Edit code",
  "pages.settings.template.newCollection": "Create a new collection from Create page template first.",
  "pages.settings.template.showCode": "Show the code",
  "pages.settings.title": "{name} settings",
  "pages.settings.unavailable": "Available in Stacki Desktop.",
  "pages.settings.undo.delete": "Delete {name}",
  "pages.settings.undo.duplicate": "Duplicate {name}",
  "pages.settings.undo.home": "Make {name} the homepage",
  "pages.settings.undo.rename": "Rename {name}",
  "pages.settings.undo.template": "Change the template of {name}",
  "pages.studio.collections": "Collections",
  "pages.studio.collectionsEmpty": "JSON and Markdown files in {content} and {data} appear here.",
  "pages.studio.createItem": "Create item",
  "pages.studio.creating": "Creating\u2026",
  "pages.studio.duplicate": "Duplicate current",
  "pages.studio.fileName": "New file name",
  "pages.studio.itemPath": "Item path",
  "pages.studio.newItem": "New item",
  "pages.studio.noMatchItems": "No matching items",
  "pages.studio.noMatchPages": "No matching pages",
  "pages.studio.noPages": "No pages found.",
  "pages.studio.presence": "On this page: {names}",
  "pages.studio.searchCollections": "Search collections\u2026",
  "pages.studio.searchFiles": "Search files",
  "pages.switcher.current": "Current page",
  "pages.switcher.empty": "No matching pages",
  "pages.switcher.none": "No page",
  "pages.switcher.search": "Search pages",
  "pages.switcher.searchPlaceholder": "Search pages\u2026",
  "pages.switcher.switch": "Switch page",
  "pages.template.addedTo": "Added to {path}",
  "pages.template.address.noLetters": "Some values have no letters or numbers",
  "pages.template.address.noValue": "Some entries have no value",
  "pages.template.address.repeated": "Two entries would share the address {address}",
  "pages.template.address.tooLong": "Too long for a page address",
  "pages.template.addressChoose": "Choose what makes it unique",
  "pages.template.addressPattern": "Address pattern",
  "pages.template.addressUses": "Each page\u2019s web address uses",
  "pages.template.collection": "Collection",
  "pages.template.collection.choose": "Choose a collection",
  "pages.template.collection.hint": "Stacki adds it to your content config with a title field and a first entry to preview.",
  "pages.template.collection.name": "Collection name",
  "pages.template.collection.namePlaceholder": "Blog posts",
  "pages.template.collection.new": "New collection\u2026",
  "pages.template.collection.reading": "Reading collections\u2026",
  "pages.template.create": "Create template",
  "pages.template.done": "Done",
  "pages.template.edit": "Edit",
  "pages.template.entryId": "Entry id",
  "pages.template.env.copyKey": "This dataset is private. Copy the connection\u2019s Editor key to .env as {name}, which stays out of Git, so the site can build.",
  "pages.template.env.unset": "Still to set in .env: {names}. The page shows an error until it is.",
  "pages.template.fieldsTitle": "Fields for the template",
  "pages.template.header.bearer": "Put \u201CBearer\u201D before the key",
  "pages.template.header.how": "How the value is sent",
  "pages.template.header.name": "Header name",
  "pages.template.header.plain": "Send the key as it is",
  "pages.template.header.remove": "Remove header",
  "pages.template.header.variable": "Variable holding its value",
  "pages.template.http.addHeader": "Add header",
  "pages.template.http.fetching": "Fetching a sample",
  "pages.template.http.headers": "Headers ({count})",
  "pages.template.http.headersHint": "Only needed if your link requires a key.",
  "pages.template.http.link": "Link to your data",
  "pages.template.http.listOfItems": "List of items",
  "pages.template.http.noList": "That address has no list of items.",
  "pages.template.http.reading": "Reading your data",
  "pages.template.http.refetch": "Fetch the sample again",
  "pages.template.http.requestHeaders": "Request headers",
  "pages.template.http.wholeReply": "The whole reply",
  "pages.template.newFile": "New file {path}",
  "pages.template.previewCount": { one: "{count} page", other: "{count} pages" },
  "pages.template.previewLike": { one: "{count} page, like: {title}", other: "{count} pages, like: {title}" },
  "pages.template.sanity.asking": "Asking Sanity\u2026",
  "pages.template.sanity.chooseType": "Choose a type",
  "pages.template.sanity.connect": "Connect Sanity",
  "pages.template.sanity.connectHint": "Connect this project to Sanity to build a template from its content.",
  "pages.template.sanity.connection": "Sanity connection",
  "pages.template.sanity.documentType": "Document type",
  "pages.template.sanity.looking": "Looking for a Sanity connection\u2026",
  "pages.template.sanity.noDocuments": "This Sanity dataset has no documents yet.",
  "pages.template.sanity.noTypes": "Sanity listed no document types.",
  "pages.template.sanity.sentNone": "Sanity sent no documents.",
  "pages.template.sanity.using": "Using {label}: {projectId}, {dataset}.",
  "pages.template.secret.save": "Save to .env",
  "pages.template.secret.saved": "Saved to {file}, which stays out of Git.",
  "pages.template.secret.value": "Value of {name}",
  "pages.template.showCode": "Show the code that will be written",
  "pages.template.source": "Data source",
  "pages.template.source.collection": "Content collection",
  "pages.template.source.link": "Data from a link",
  "pages.template.title": "Create page template",
  "pages.template.unexpected": "Something went wrong on Stacki\u2019s side. Restart Stacki and try again.",
  "pages.title": "Pages"
};

// vendor/stacki/shared/properties/i18n/messages/en/palette.ts
var messages21 = {
  "palette.apps.action.browse": "Open Apps panel",
  "palette.apps.action.buildApp": "Build an app",
  "palette.apps.action.connect": "Load App From GitHub",
  "palette.apps.by": "by {login}",
  "palette.apps.empty.note": "Apps add tools to Stacki: audits, heat maps, content helpers and more.",
  "palette.apps.empty.title": "No apps yet",
  "palette.apps.loading": "Loading apps\u2026",
  "palette.apps.marketplace": "Marketplace",
  "palette.create.folderRoot": "{folder} (root)",
  "palette.create.taken": "{file} already exists.",
  "palette.create.hint": "{label} becomes {tag}, saved as {file}",
  "palette.create.name": "Name",
  "palette.create.styles.alsoUsed": "Also used elsewhere",
  "palette.create.styles.checkAria": "Move the styles of .{name}",
  "palette.create.styles.failed": "Couldn\u2019t read the styles, so none will move.",
  "palette.create.styles.foot": "Checked styles move into a new style tag in the component. Don\u2019t edit these files in another app until it\u2019s done.",
  "palette.create.styles.inFiles": "Also used in {files}.",
  "palette.create.styles.loading": "Looking for this markup\u2019s styles\u2026",
  "palette.create.styles.onPage": "Another element of this page uses it.",
  "palette.create.styles.page": "This page",
  "palette.create.styles.title": "Move styles",
  "palette.create.submit": "Create",
  "palette.create.title": "Create component",
  "palette.create.value.alsoUsed": "Also used here",
  "palette.create.value.bulkAria": "Set every value at once",
  "palette.create.value.bulkMove": "Move all",
  "palette.create.value.bulkProp": "Pass all as props",
  "palette.create.value.choiceAria": "What to do with {name}",
  "palette.create.value.counts": "{moved} moving in, {props} passed as props",
  "palette.create.value.move": "Move in",
  "palette.create.value.passed": "Passed in as a prop",
  "palette.create.value.prop": "Pass as prop",
  "palette.create.value.reads": { one: "Reads {count} value", other: "Reads {count} values" },
  "palette.element.content": "rendered Markdown entry",
  "palette.element.fragment": "group without a wrapper element",
  "palette.element.slot": "what the caller passes in",
  "palette.folder.absolute": "Start inside the components folder: no / or drive at the front.",
  "palette.folder.emptyLevel": "Each level needs a name: remove the extra /.",
  "palette.folder.parent": "\u201C..\u201D can\u2019t be used: the folder stays inside the components folder.",
  "palette.folder.tooDeep": "That folder is nested too deeply.",
  "palette.folder.tooLong": "That folder path is too long.",
  "palette.insert.folders": "Component folders",
  "palette.insert.hint": "insert",
  "palette.instances.looking": "Looking\u2026",
  "palette.instances.nowhereElse": "Nowhere else.",
  "palette.instances.onPage": "On this page",
  "palette.instances.otherFiles": "Other files with instances",
  "palette.instances.readFailed": "Couldn\u2019t read the project \u2014 {message}",
  "palette.instances.title": "{name} instances",
  "palette.instances.unused": "Not used anywhere yet.",
  "palette.instances.usedIn": "Used in",
  "palette.manage.deleteConfirm": "Delete",
  "palette.manage.deleteDone": "Deleted {name}",
  "palette.manage.deleteTitle": "Delete {name}?",
  "palette.manage.duplicateBody": { one: "This copies {count} component into a new folder.", other: "This copies {count} components into a new folder." },
  "palette.manage.duplicateConfirm": "Duplicate",
  "palette.manage.duplicateDone": "Created {name}",
  "palette.manage.duplicateTitle": "Duplicate {name}?",
  "palette.manage.labelDelete": "Delete {name}",
  "palette.manage.labelDuplicate": "Duplicate {name}",
  "palette.manage.undoMetadataKept": "Restored the files. Project settings changed since, so their entries were left as they are.",
  "palette.remove.blocked": "These places use it in a way Stacki can\u2019t rewrite. Change them first; nothing was deleted.",
  "palette.remove.blockedTitle": "{name} can\u2019t be deleted yet",
  "palette.remove.files": { one: "{name} moves to the Trash.", other: "{name} and its {count} components move to the Trash." },
  "palette.remove.imports": { one: "{count} import of it is removed:", other: "{count} imports of it are removed:" },
  "palette.remove.instances": {
    one: "{count} instance is removed, with everything inside it:",
    other: "{count} instances are removed, with everything inside them:"
  },
  "palette.remove.more": { one: "and {count} more file", other: "and {count} more files" },
  "palette.remove.place": "{path}: {count}",
  "palette.remove.reason.content": "an instance in Markdown",
  "palette.remove.reason.dynamicImport": "a dynamic import",
  "palette.remove.reason.expression": "an instance inside an expression",
  "palette.remove.reason.glob": "a glob that matches it",
  "palette.remove.reason.layout": "a Markdown layout",
  "palette.remove.reason.reExport": "a re-export",
  "palette.remove.reason.unreadable": "a file that can\u2019t be read",
  "palette.remove.reason.value": "used as a value",
  "palette.remove.reviewLine": "{path}:{line}, {reason}",
  "palette.remove.settings": "Its entries in {files} are removed.",
  "palette.remove.undo": "One Undo brings all of it back.",
  "palette.remove.unused": "Nothing uses it.",
  "palette.menu.delete": "Delete",
  "palette.menu.duplicate": "Duplicate",
  "palette.menu.editSettings": "Edit settings",
  "palette.name.empty": "Give the component a name.",
  "palette.name.lettersOnly": "Use letters and numbers only.",
  "palette.name.noLetters": "Use letters or numbers for the name.",
  "palette.name.reserved": "{name} already means something in Astro.",
  "palette.name.startsWithNumber": "A name can\u2019t start with a number.",
  "palette.name.taken": "There\u2019s already a component called {name}.",
  "palette.other.comment": "Comment",
  "palette.other.condition": "Condition",
  "palette.other.doctype": "Doctype",
  "palette.other.expression": "Code Expression",
  "palette.other.loop": "Loop",
  "palette.other.script": "Script Block",
  "palette.other.style": "Style Block",
  "palette.other.text": "Text",
  "palette.panel.checking": "Checking instances...",
  "palette.panel.instances": { one: "{count} instance", other: "{count} instances" },
  "palette.roles.menu": "Roles",
  "palette.roles.hiddenByFolder": "hidden by folder {folder}",
  "palette.roles.showInstances": "Show instances",
  "palette.roles.someVisible": "{visible} of {total} visible",
  "palette.roles.options": "Options for {name}",
  "palette.panel.itemHint": "Drag into the Navigator, or double-click to add to the page",
  "palette.panel.new": "New component",
  "palette.panel.newShortcut": "New component ({shortcut})",
  "palette.panel.noMatch": "No components match \u201C{query}\u201D.",
  "palette.panel.none": "No components found in {folder}.",
  "palette.panel.search": "Search components",
  "palette.panel.title": "Components",
  "palette.preview.clientOnly": "This component only works in the browser, so it cannot be drawn ahead of time.",
  "palette.preview.loading": "Loading preview\u2026",
  "palette.preview.needsProps": "Needs a value for: {names}. Open an instance on a page to preview it.",
  "palette.preview.noFile": "This component has no file the preview can load.",
  "palette.preview.noServer": "The project dev server is not running.",
  "palette.preview.rendered": "The component rendered nothing.",
  "palette.preview.retry": "Try with sample data",
  "palette.preview.silent": "The preview page loaded but did not render the component; it may have thrown an error. Open it on a page to see the error.",
  "palette.preview.threw": "The component threw an error: {message}",
  "palette.preview.timeout": "The preview took too long to render.",
  "palette.preview.tooLarge": "The preview is too large to keep.",
  "palette.preview.unavailable": "No preview available",
  "palette.preview.unresolved": "The preview could not be opened: the preview session is not available.",
  "palette.search.noMatches": "No matches.",
  "palette.search.placeholder": "Search components, elements\u2026",
  "palette.search.placeholderApps": "Search components, elements, apps\u2026",
  "palette.tab.all": "All results",
  "palette.tab.apps": "Apps",
  "palette.tab.aria": "Insert results",
  "palette.tab.components": "Components",
  "palette.tab.elements": "Elements",
  "palette.tab.other": "Other",
  "palette.manage.labelMove": "Move {name}",
  "palette.manage.labelRename": "Rename {name}",
  "palette.manage.moveDone": "Moved {name}",
  "palette.manage.renameDone": "Renamed {name}",
  "palette.menu.move": "Move to folder\u2026",
  "palette.menu.rename": "Rename",
  "palette.rename.available": "Available",
  "palette.rename.checking": "Checking which files will change\u2026",
  "palette.rename.extension": "Leave out \u201C.astro\u201D: it is added for you.",
  "palette.rename.files": { one: "{count} file will be updated", other: "{count} files will be updated" },
  "palette.rename.folder": "Folder",
  "palette.rename.folderInvalid": "Use letters, numbers, dashes and underscores for a folder, with / between levels.",
  "palette.rename.hideFiles": "Hide files",
  "palette.rename.name": "Name",
  "palette.rename.newFolder": "New folder\u2026",
  "palette.rename.newFolderName": "New folder name",
  "palette.rename.notice.keptLocalName": "{file} keeps its local name because it already uses the new one",
  "palette.rename.notice.mention": "{file} still names the old file",
  "palette.rename.notice.namespace": "{file} uses a namespaced tag, which was not renamed",
  "palette.rename.notice.unparsed": "{file} could not be read, so it was skipped",
  "palette.rename.notices": "Not changed",
  "palette.rename.onlyFile": "Only this component\u2019s own file changes.",
  "palette.rename.path": "Will be saved as",
  "palette.rename.sameNameElsewhere": "Another component is also called {name} ({file}). A page that imports both needs to give one of them another name.",
  "palette.rename.separator": "A name can\u2019t contain / or \\. Choose the folder below.",
  "palette.rename.showFiles": "Show files",
  "palette.rename.submitBoth": "Rename and move",
  "palette.rename.submitMove": "Move",
  "palette.rename.submitRename": "Rename",
  "palette.rename.taken": "Already taken by {file}",
  "palette.rename.title": "Rename or move {name}",
  "palette.rename.unchanged": "This is the current name and folder.",
  "palette.rename.badCharacter": "\u201C{character}\u201D can\u2019t be used in a name.",
  "palette.rename.spacesRemoved": "Spaces removed: {name}",
  "palette.rename.normalized": "Saved as {name}"
};

// vendor/stacki/shared/properties/i18n/messages/en/preview.ts
var messages22 = {
  "preview.canvas.desktop": "Desktop",
  "preview.canvas.fit": "Fit",
  "preview.canvas.fitAll": "Fit all breakpoints",
  "preview.canvas.frameLabel": "{device} \xB7 {width}px",
  "preview.canvas.frameTitle": "{device} preview",
  "preview.canvas.zoomIn": "Zoom in",
  "preview.canvas.zoomOut": "Zoom out",
  "preview.canvas.zoomReset": "Zoom to 100%",
  "preview.crumbs.more": "Show {count} more: {names}",
  "preview.device.canvas": "Canvas \u2014 all breakpoints \u2014 {key}",
  "preview.device.canvasNoKey": "Canvas \u2014 all breakpoints",
  "preview.device.desktop": "Desktop \u2014 {key}",
  "preview.device.desktopNoKey": "Desktop",
  "preview.device.group": "Preview device",
  "preview.device.item": "{name} ({width}px) \u2014 {key}",
  "preview.device.itemNoKey": "{name} ({width}px)",
  "preview.drag.adding": "Adding {name}",
  "preview.drag.dropHere": "Drop here",
  "preview.drag.intoLoop": "Inside the loop: repeats for every item",
  "preview.drag.moving.component": "Moving entire component",
  "preview.drag.moving.element": "Moving element",
  "preview.drag.moving.loop": "Moving loop",
  "preview.drag.moving.text": "Moving text",
  "preview.drag.noSlot": "{name} has no slot, so nothing can go inside it. Open the component to add elements.",
  "preview.drag.outside": "Release to cancel",
  "preview.drag.page": "Page",
  "preview.drag.self": "An element can't go inside itself",
  "preview.frame.previous": "{title} (previous page)",
  "preview.guide.color": "Color",
  "preview.guide.colorLabel": "Guide color",
  "preview.guide.columnCount": "Column count",
  "preview.guide.columns": "Columns",
  "preview.guide.connectCount": "Connect the column count to a variable",
  "preview.guide.connectSize": "Connect {label} to a variable",
  "preview.guide.countRange": "A whole number from {minimum} to {maximum}. Or connect a project variable.",
  "preview.guide.gutter": "Gutter",
  "preview.guide.label": "Column guide",
  "preview.guide.margin": "Margin",
  "preview.guide.numbers": "Numbers",
  "preview.guide.off": "Off",
  "preview.guide.on": "On",
  "preview.guide.opacity": "Opacity",
  "preview.guide.opacityLabel": "Guide opacity",
  "preview.guide.outside": "{name} is outside {range}, so its default is used.",
  "preview.guide.size.accepts": "A length (32px, 2rem) or a project variable (--name).",
  "preview.guide.size.default": `Default: {px}px at this width.
A length (32px, 2rem) or a project variable (--name).`,
  "preview.guide.size.fixed": `{px}px at this width.
A length (32px, 2rem) or a project variable (--name).`,
  "preview.guide.size.project": `From the project's {variable}: {px}px at this width.
A length (32px, 2rem) or a project variable (--name).`,
  "preview.guide.size.variable": `{name}: {px}px at this width.
A length (32px, 2rem) or a project variable (--name).`,
  "preview.guide.size.variableFallback": "Variable",
  "preview.guide.switch": "Guide",
  "preview.guide.tip": "Column guide \u2014 \u21E7G",
  "preview.guide.tipUnavailable": "Column guide \u2014 not shown in Canvas",
  "preview.guide.undeclared": "{name} is not declared on this page, so its default is used.",
  "preview.guide.undeclaredCount": "{name} is not declared on this page, or is not a whole number, so its default is used.",
  "preview.guide.widthMax": "Max width",
  "preview.image.alt.blocked": "The alt text is computed ({expression}), so it cannot be edited here.",
  "preview.image.alt.fixed": "The alt text is written in {file}, the same for every instance.",
  "preview.image.alt.none": "This component prints no alt text from a property, so there is none to edit here.",
  "preview.image.close": "Close",
  "preview.image.refused.bound": "This image comes from code ({expression}), which is not a value this popup can change. Edit it in the source.",
  "preview.image.refused.computed": "This image is computed in {file} ({expression}), so no property decides it. Edit it there.",
  "preview.image.refused.fixed": "This image is written in {file}, so it is the same for every instance. Open the component to change it.",
  "preview.image.refused.loop": "This image is drawn once for each pass of a loop, so one change would apply to all of them. Edit the loop\u2019s data instead.",
  "preview.image.refused.outside": "This image belongs to {file}, which this file only embeds. Open that file to change it.",
  "preview.image.refused.unknown": "The editor cannot tell where this image comes from.",
  "preview.image.refused.unreadable": "The editor cannot read {file}, so it cannot tell where this image comes from.",
  "preview.image.title": "{name} Properties",
  "preview.image.titleFallback": "Image Properties",
  "preview.inspector.hide": "Hide style and settings panel",
  "preview.inspector.show": "Show style and settings panel",
  "preview.interact.label": "Interact with canvas",
  "preview.interact.tip": "Interact with canvas \u2014 links, buttons and forms",
  "preview.offline.diagnostics": "Show diagnostics",
  "preview.offline.getNode": "Get Node.js",
  "preview.offline.noDeps.detail": "Astro was not found in node_modules. Starting the server installs them automatically \u2014 if that keeps failing, use Show diagnostics for details.",
  "preview.offline.noDeps.title": "This project's dependencies aren't installed.",
  "preview.offline.noNode.detail": "Astro needs Node.js to run. Stacki looks on the system path, your login shell\u2019s path, and the usual Homebrew, nvm, fnm, volta, asdf and mise locations, and found nothing. Install Node, then start the server again.",
  "preview.offline.noNode.title": "Node.js isn't installed \u2014 or isn't where this app can see it.",
  "preview.offline.nodeOld.detail": "astro {astroVersion} needs Node {requires}. Install a newer Node \u2014 if you use a version manager, the one it picks in this project's folder is the one Stacki will use.",
  "preview.offline.nodeOld.title": "Node {version} is too old for this project.",
  "preview.offline.start": "Start dev server",
  "preview.offline.title": "Preview is offline.",
  "preview.offline.usingNode": "Using Node {version} \u2014 {path}",
  "preview.overlay.editComponent": "Edit {name} component",
  "preview.overlay.editTip": "Edit component",
  "preview.pane.empty": "Nothing selected to preview. Pick a page on the left.",
  "preview.pane.starting": "Starting Astro dev server\u2026",
  "preview.pane.title": "Site preview",
  "preview.reload": "Reload preview",
  "preview.reload.diffOverCap": "The canvas reloaded: the change was too large to update in place.",
  "preview.reload.markersOverCap": "The canvas reloaded: this page has more elements than it updates in place.",
  "preview.size.fitTip": "Reset canvas to available width",
  "preview.size.scale": "Canvas scale",
  "preview.size.scaleTip": "Preview scaled to fit the available space",
  "preview.size.width": "Canvas width",
  "preview.size.widthHint": "Enter {minimum}\u2013{maximum}px",
  "preview.size.widthTip": "Canvas width in pixels",
  "preview.studio.exit": "Exit preview (Esc)",
  "preview.studio.frameTitle": "Site preview (interactive)",
  "preview.studio.loading": "Loading preview\u2026",
  "preview.studio.loadingYours": "Loading your preview\u2026",
  "preview.studio.retry": "Retry preview",
  "preview.studio.slow": "Your preview is taking a little longer to start\u2026",
  "preview.studio.waitAddress": "No preview address has been granted yet.",
  "preview.studio.waitFrame": "The page is still loading in the frame.",
  "preview.studio.waitScript": "The page loaded, but its editor script has not answered.",
  "preview.studio.start": "Preview the site",
  "preview.spacing.collapsedNext": "Margin collapses with the next element",
  "preview.spacing.collapsedParent": "Margin collapses with the parent's margin",
  "preview.spacing.collapsedPrevious": "Margin collapses with the previous element",
  "preview.text.cannotFormat": "This text can\u2019t be formatted here. Use the Content field in Settings.",
  "preview.text.pageChanged": "The page changed while editing. The text was not saved; select it again.",
  "preview.text.selectionReaches": "This selection reaches text that cannot be changed along with it.",
  "preview.text.source.blocked.ambiguous": "{path} is written more than once in {file}.",
  "preview.text.source.blocked.call": "This text is returned by {name}() in {file}, which the editor cannot follow to one string: edit it there.",
  "preview.text.source.blocked.computed": "This text is computed in {file}: edit it there.",
  "preview.text.source.blocked.concatenation": "This text is joined from pieces in {file}: edit it there.",
  "preview.text.source.blocked.duplicate": "Several places print the same words here, so the right one cannot be told apart: edit it in {file}.",
  "preview.text.source.blocked.missing": "The value {path} is not written in {file}.",
  "preview.text.source.blocked.multiline": "This text is a YAML value written over several lines in {file}: edit it there.",
  "preview.text.source.blocked.mutable": "This text comes from a variable that can change (let or var) in {file}: edit it there.",
  "preview.text.source.blocked.notText": "{path} is not a string.",
  "preview.text.source.blocked.prop": "This text comes from a prop; edit it where the component is used.",
  "preview.text.source.blocked.template": "This text is built from a template with expressions in {file}: edit it there.",
  "preview.text.source.blocked.unreadable": "The data file {file} could not be read.",
  "preview.text.source.blocked.unsupported": "{file} is not a project script or JSON file this editor can write.",
  "preview.text.source.label": "Editing source",
  "preview.text.source.pageFile": "this page",
  "preview.text.source.saved": "Updated {path} in {file}",
  "preview.text.source.undo": "Undo",
  "preview.text.source.uses": { one: "1 place", other: "Used in {count} places" },
  "preview.text.sourceChanged": "The data changed on disk while editing. The text was not saved; select it again.",
  "preview.text.unsafe": "This text cannot be edited safely.",
  "preview.text.waitingRender": "Text editing is waiting for the current source render.",
  "preview.toolbar.more": "More preview actions"
};

// vendor/stacki/shared/properties/i18n/messages/en/props.ts
var messages23 = {
  "props.attributeText.spreadEmpty": "Type the value to spread, such as {{...rest}} or {{...Astro.props}}.",
  "props.attributeText.spreadNotName": "A spread passes one name in scope, such as {{...rest}} or {{...Astro.props}}.",
  "props.attributeText.spreadTooLong": "A spread passes one name in scope, such as {{...rest}}.",
  "props.attributes.add": "Add attribute",
  "props.attributes.chooseFile": "Choose a file from public/",
  "props.attributes.delete": "Delete attribute",
  "props.attributes.deleteSpread": "Delete spread",
  "props.attributes.deleteSpreadNamed": "Delete {spread}",
  "props.attributes.expand": "Expand value",
  "props.attributes.name": "Name",
  "props.attributes.plainValue": "Edit as a plain value",
  "props.attributes.spreadAdded": "A spread is added as a new attribute of an element.",
  "props.attributes.spreadName": "A spread\u2019s Name is its code, such as {{...rest}}.",
  "props.attributes.spreadPasses": "Spread: passes every property of {path}",
  "props.attributes.spreadTitle": "Spread: passes every attribute this value holds",
  "props.attributes.title": "Attributes",
  "props.attributes.typeOrInsert": "Type, or insert data",
  "props.attributes.value": "Value",
  "props.attributesBinding.closeSettings": "Close property settings",
  "props.attributesBinding.connect": "Connect",
  "props.attributesBinding.defaults": "Default Attributes",
  "props.attributesBinding.disconnect": "Disconnect",
  "props.attributesBinding.editSettings": "Edit settings",
  "props.attributesBinding.newProperty": "New Attributes property",
  "props.attributesBinding.passesOnce": "A component passes its other attributes on once, as {local}.",
  "props.attributesBinding.property": "Attributes property",
  "props.attributesBinding.through": "Instances add attributes through {local}",
  "props.binding.createConditional": "Create conditional",
  "props.binding.edit": "Edit {name}",
  "props.binding.exampleCondition": "e.g. logo.src",
  "props.binding.inComponent": "In the component {name}",
  "props.binding.inPage": "In the page {name}",
  "props.binding.insertData": "Insert data",
  "props.binding.insertDataTitle": "Insert data \u2014 a component prop, a CMS field",
  "props.binding.newProperty": "New {kind} property",
  "props.binding.openDefinition": "Open where {name} is defined",
  "props.bounds.accepts": "Accepts {parts}",
  "props.bounds.greaterThan": "greater than {min}",
  "props.bounds.lessThan": "less than {max}",
  "props.bounds.orLess": "{max} or less",
  "props.bounds.orMore": "{min} or more",
  "props.bounds.steps": "steps of {step}",
  "props.bounds.wholeNumbers": "whole numbers",
  "props.classInput.caretTitle": "Click to place the caret after this class",
  "props.classInput.create": "Create {name}",
  "props.classInput.switchTitle": "Click to switch to a related class",
  "props.classList.add": "Add class",
  "props.classList.class": "Class",
  "props.classList.className": "Class name",
  "props.classList.close": "Close class list",
  "props.classList.drag": "Drag to reorder class {number}",
  "props.classList.edit": "Edit the classes",
  "props.classList.entry": "Class {number}",
  "props.classList.remove": "Remove class",
  "props.classList.title": "Class list",
  "props.classListProp.refusal.component": "Only an HTML element can take a class list property: a component reads its class its own way.",
  "props.classListProp.refusal.shape": "The class value doesn\u2019t read as one expression, so it can\u2019t be moved into a class list safely.",
  "props.classListProp.refusal.spread": "A spread here could pass a class of its own, so the classes can\u2019t be moved into a class list safely.",
  "props.classListProp.refusal.taken": "This component already has a class property. Connect it from the list below.",
  "props.cleanup.changedSince": "{file} changed since it was checked. Check again before cleaning up.",
  "props.cleanup.keptCleanup": "These files kept the cleanup and need checking: {files}.",
  "props.cleanup.noLongerUnused": "A selector is no longer unused. Check again before cleaning up.",
  "props.cleanup.notChecked": "{file} was not part of the checked files.",
  "props.bindingRemoved.notice": "Binding removed",
  "props.bindingRemoved.undo": "Undo",
  "props.codeCleared.notice": "Code cleared. Undo to restore.",
  "props.codeCleared.restore": "Restore code",
  "props.condition.asCode": "Condition as code",
  "props.condition.chooseData": "Choose data",
  "props.condition.chooseValue": "Choose a value",
  "props.condition.operator.atLeast": "is at least",
  "props.condition.operator.atMost": "is at most",
  "props.condition.operator.contains": "contains",
  "props.condition.operator.endsWith": "ends with",
  "props.condition.operator.equals": "equals",
  "props.condition.operator.greaterThan": "is greater than",
  "props.condition.operator.isEmpty": "is empty",
  "props.condition.operator.isFalse": "is false",
  "props.condition.operator.isNotEmpty": "is not empty",
  "props.condition.operator.isNotNull": "is not null",
  "props.condition.operator.isNotSet": "is not set",
  "props.condition.operator.isNull": "is null",
  "props.condition.operator.isSet": "is set",
  "props.condition.operator.isTrue": "is true",
  "props.condition.operator.lengthEquals": "length equals",
  "props.condition.operator.lengthGreaterThan": "length is greater than",
  "props.condition.operator.lessThan": "is less than",
  "props.condition.operator.notContains": "does not contain",
  "props.condition.operator.notEquals": "does not equal",
  "props.condition.operator.startsWith": "starts with",
  "props.condition.otherwise": "Otherwise",
  "props.condition.tooComplexBlocked": "This condition uses code the visual editor cannot show, so it stays code.",
  "props.condition.typeNumber": "Type a number",
  "props.condition.typeValue": "Type a value",
  "props.condition.useControls": "Use the condition controls",
  "props.condition.value": "Value",
  "props.condition.writeCode": "Write the condition as code",
  "props.conditional.always": "Always",
  "props.conditional.computed": "Computed",
  "props.conditional.computedDefinition": `{name} is computed in code: {definition}
{code}`,
  "props.conditional.computedGroup": "Computed in code",
  "props.conditional.computedTitle": "Computed by code the conditions cannot show",
  "props.conditional.computedWhy": "{name} is computed in code: {definition}",
  "props.conditional.chip": "Conditional",
  "props.conditional.dragGroup": "Drag to reorder group {number}",
  "props.conditional.edit": "Edit the conditions",
  "props.conditional.editorTitle": "Value conditions",
  "props.conditional.elseValue": "Else value",
  "props.conditional.empty": "Empty",
  "props.conditional.group": "Group {number}",
  "props.conditional.groupPhrase": "conditions in this group are true",
  "props.conditional.if": "If",
  "props.conditional.joinAnd": "{left} and {right}",
  "props.conditional.joinOr": "{left} or {right}",
  "props.conditional.leaveOut": "Leave out",
  "props.conditional.leftOutNote": "(left out)",
  "props.conditional.match": "Match",
  "props.conditional.match.all": "all",
  "props.conditional.match.any": "any",
  "props.conditional.newCondition": "New condition",
  "props.conditional.newGroup": "New group",
  "props.conditional.operator.equals": "equals",
  "props.conditional.operator.isAny": "is any",
  "props.conditional.operator.isEmpty": "is empty",
  "props.conditional.operator.isFalse": "is false",
  "props.conditional.operator.isNotAny": "is not any",
  "props.conditional.operator.isSet": "is set",
  "props.conditional.operator.isTrue": "is true",
  "props.conditional.operator.label": "Operator",
  "props.conditional.operator.notEquals": "does not equal",
  "props.conditional.or": "or",
  "props.conditional.property": "Property",
  "props.conditional.remove": "Remove conditional",
  "props.conditional.removeCondition": "Remove condition",
  "props.conditional.removeGroup": "Remove group",
  "props.conditional.summary.allTrue": "If all are true",
  "props.conditional.summary.anyTrue": "If any are true",
  "props.conditional.summary.else": "Else",
  "props.conditional.summary.if": "If {condition}",
  "props.conditional.typeValue": "Type a value",
  "props.conditional.value": "Conditional value",
  "props.conditional.sameAs": "Same as: {condition}",
  "props.conditional.switchPlainer": "Switch",
  "props.conditional.switchPlainerTip": "Replace this condition with {condition} (same result, editable with dropdowns)",
  "props.conditional.valueLabel": "Value",
  "props.conditional.values": "Values",
  "props.conditional.when": "only when {conditions}",
  "props.conditional.words.equals": "{subject} = {value}",
  "props.conditional.words.isAnyOf": "{subject} is any of {values}",
  "props.conditional.words.isEmpty": "{subject} is empty",
  "props.conditional.words.isFalse": "{subject} is false",
  "props.conditional.words.isNoneOf": "{subject} is none of {values}",
  "props.conditional.words.isSet": "{subject} is set",
  "props.conditional.words.isTrue": "{subject} is true",
  "props.conditional.words.notEquals": "{subject} \u2260 {value}",
  "props.contract.aliasExported": "{name} is exported, so other files may use it. Changing its options changes them too.",
  "props.contract.aliasUsed": "{name} is used {uses} times in this file. Changing its options changes all of them.",
  "props.contract.condition.namedNever": "{branch}: not allowed",
  "props.contract.condition.namedOptional": "{branch}: optional",
  "props.contract.condition.namedRequired": "{branch}: required",
  "props.contract.condition.namedUndeclared": "{branch}: not declared",
  "props.contract.condition.numberedNever": "Variant branch {number}: not allowed",
  "props.contract.condition.numberedOptional": "Variant branch {number}: optional",
  "props.contract.condition.numberedRequired": "Variant branch {number}: required",
  "props.contract.condition.numberedUndeclared": "Variant branch {number}: not declared",
  "props.contract.override": "This HTML attribute will be declared locally when you save it.",
  "props.control.assetPicker": "Use the asset picker",
  "props.control.cssEditor": "Use the CSS editor",
  "props.control.fields": "Use the fields",
  "props.control.linkSettings": "Use the link settings",
  "props.control.list": "Use the list",
  "props.control.normal": "Use the normal field",
  "props.control.normalRequired": "Required \u2014 this value can only be written as code",
  "props.control.optionsList": "Use the options list",
  "props.control.resetAlready": "Already at its default value",
  "props.control.resetNoEmpty": "Required \u2014 there is no empty value to reset to",
  "props.control.toggle": "Use the toggle",
  "props.dataPicker.contentCollection": "Content collection",
  "props.dataPicker.edit": "Edit",
  "props.dataPicker.editPropSettings": "Edit {name} settings",
  "props.dataPicker.editSettings": "Edit settings",
  "props.dataPicker.empty": "No data in scope here \u2014 add a prop to this file, or a const to its frontmatter.",
  "props.dataPicker.kind.attributes": "Attributes",
  "props.dataPicker.kind.image": "Image",
  "props.dataPicker.kind.list": "List",
  "props.dataPicker.kind.number": "Number",
  "props.dataPicker.kind.switch": "Switch",
  "props.dataPicker.kind.text": "Text",
  "props.dataPicker.missing.fieldsUnknown": "fields not known",
  "props.dataPicker.missing.noSuchField": "no such field",
  "props.dataPicker.missing.notInEntry": "not in this entry",
  "props.dataPicker.missing.notInScope": "not in scope",
  "props.dataPicker.nextEntry": "Next entry",
  "props.dataPicker.noMatch": "Nothing matches",
  "props.dataPicker.previousEntry": "Previous entry",
  "props.dataPicker.reading": "Reading one entry\u2026",
  "props.dataPicker.search": "Search data",
  "props.dataPicker.section.collections": "Content Collections",
  "props.dataPicker.section.fileFrontmatter": "{file} frontmatter",
  "props.dataPicker.section.fileProps": "{file} props",
  "props.dataPicker.section.frontmatter": "Frontmatter",
  "props.dataPicker.section.loopItem": "Loop item",
  "props.dataPicker.section.onPage": "On this page",
  "props.dataPicker.section.projectData": "Project data",
  "props.dataPicker.section.props": "Props",
  "props.dataPicker.writeExpression": "Write an expression\u2026",
  "props.edit.badPath": "Select an Astro component inside this project\u2019s src folder.",
  "props.edit.batchLimit": "Property batch exceeds the shared document limit",
  "props.edit.changedDuringRename": "{file} changed during the rename. Try again.",
  "props.edit.changedRefresh": "{file} changed. Refresh before saving properties.",
  "props.edit.changedWhileRenaming": "{file} changed during the rename.",
  "props.edit.conflict": "This component changed on disk. Reload before saving.",
  "props.edit.couldNotSave": "Could not save {file}",
  "props.edit.detail": "{detail}",
  "props.edit.duplicate": "A property named {name} already exists.",
  "props.edit.expired": "This property change can no longer be undone.",
  "props.edit.inFile": "{file}:",
  "props.edit.inUse": "This property is still referenced. Remove its component usages before deleting it.",
  "props.edit.limit": "The component property limit has been reached.",
  "props.edit.missing": "This property no longer exists. Reload the panel.",
  "props.edit.nameInScope": "The name {name} is already in scope. Add an aliased default in TypeScript source.",
  "props.edit.notFound": "Property not found.",
  "props.edit.optionMismatch": "An option rename does not match the saved union.",
  "props.edit.optionNeedsExisting": "Only an existing property can rename options.",
  "props.edit.optionNeedsUnion": "Option renames require an editable literal union.",
  "props.edit.raced": "{file} was changed by another writer during the save",
  "props.edit.readsInCode": "This component\u2019s code still reads {name} (line {lines}). Remove those reads before deleting it.",
  "props.edit.reorder": "Reorder must include every declared property exactly once.",
  "props.edit.restored": "Save failed; changes restored.",
  "props.edit.rollbackBoth": "Save failed and recovery failed for: {failed}; changed by another program, left as is: {changed}.",
  "props.edit.rollbackChanged": "Save failed and these were changed by another program, so they were left as is: {changed}.",
  "props.edit.rollbackFailed": "Save failed and recovery failed for: {failed}.",
  "props.edit.stillPasses": "{file} still passes {name}. Remove that instance value before deleting the prop.",
  "props.edit.studioRecoveryFailed": "Property save failed; recovery failed for {files}. {detail}",
  "props.edit.uncertain": "{file} may not have been saved. {detail}",
  "props.edit.uncertainBare": "{file} may not have been saved.",
  "props.element.content": "Content",
  "props.element.fallback": "Fallback",
  "props.element.fallbackNote": "Shown only when whatever uses this component passes nothing for the slot.",
  "props.element.looseText": "Text alongside the children below",
  "props.element.resetHint": "\u2325-click to reset to default",
  "props.element.settings": "Settings",
  "props.field.actionInCode": "Action, set in code",
  "props.field.chooseColor": "Choose the colour for {name}",
  "props.field.clickForOptions": "Click for options",
  "props.field.deprecated": "Deprecated",
  "props.field.deprecatedNote": "Deprecated: {note}",
  "props.field.ignored": "ignored",
  "props.field.notSet": "(not set)",
  "props.field.noteWithType": "{note}: {type}",
  "props.field.overridden": "Overridden \u2014 click to reset, \u2325-click resets at once",
  "props.field.publicAsIs": "Files in public/ are served as-is \u2014 import from src/assets to optimize.",
  "props.field.requiredNeeds": "Required \u2014 the component needs a value",
  "props.field.requiredNotSet": "Required, not set",
  "props.field.setInCode": "Set in code",
  "props.field.svgNoEffect": "SVG sources are passed through unoptimized, so this has no effect.",
  "props.field.writeExpression": "Write an expression",
  "props.itemKinds.group.contact": "Contact",
  "props.itemKinds.group.media": "Media",
  "props.itemKinds.group.structure": "Structure",
  "props.itemKinds.group.text": "Text",
  "props.itemKinds.group.values": "Values",
  "props.jsCheck.mistake": "There\u2019s a mistake.",
  "props.jsCheck.mistakeOnLine": "There\u2019s a mistake on line {line}.",
  "props.jsCheck.tooLong": "This statement exceeds the editor size limit.",
  "props.jsCheck.unexpected": "Unexpected \u201C{token}\u201D.",
  "props.jsCheck.unexpectedOnLine": "Unexpected \u201C{token}\u201D on line {line}.",
  "props.jsCheck.unfinished": "This looks unfinished \u2014 the statement stops early.",
  "props.link.choosePage": "Choose a page\u2026",
  "props.link.chooseSection": "Choose a section\u2026",
  "props.link.exampleEmail": "e.g. bob@gmail.com",
  "props.link.examplePhone": "e.g. +14155551212",
  "props.link.noSections": "No elements on this page have an <code>id</code> yet \u2014 set one in an element\u2019s attributes to anchor-link to it.",
  "props.link.searchPages": "Search pages\u2026",
  "props.link.subject": "Subject (optional)",
  "props.link.templateUnresolved": "Entries unavailable",
  "props.link.type.asset": "File / asset",
  "props.link.type.email": "Email",
  "props.link.type.page": "Page",
  "props.link.type.phone": "Phone",
  "props.link.type.section": "Page section",
  "props.link.type.url": "URL",
  "props.list.addItem": "Add item",
  "props.list.groupInCode": "This group is set in code.",
  "props.list.item": "Item",
  "props.list.itemCount": { one: "{count} item", other: "{count} items" },
  "props.list.listInCode": "This list is set in code.",
  "props.list.nestedLabel": "{key}, {kind}",
  "props.list.noItems": "No items",
  "props.list.removeItem": "Remove {item}",
  "props.list.value": "Value",
  "props.loop.binding.closeSettings": "Close property settings",
  "props.loop.binding.comesFrom": "{title} come from the {name} property",
  "props.loop.binding.component": "Component",
  "props.loop.binding.connect": "Connect",
  "props.loop.binding.create": "Create",
  "props.loop.binding.default": "Default {title}",
  "props.loop.binding.disconnect": "Disconnect",
  "props.loop.binding.editSettings": "Edit settings",
  "props.loop.binding.link": "Link {title} to a component property",
  "props.loop.binding.name": "Name",
  "props.loop.binding.nameRequired": "Give the property a name.",
  "props.loop.binding.newProperty": "New {title} property",
  "props.loop.binding.propertyOf": "{title} property",
  "props.loop.binding.renameNote": "Renaming updates every page that sets this property.",
  "props.loop.binding.settings": "Property settings",
  "props.loop.binding.tooltip": "Tooltip",
  "props.loop.binding.tooltipPlaceholder": "Describe how to use this property\u2026",
  "props.loop.condition.custom": "Custom",
  "props.loop.customCode": "Custom code",
  "props.loop.details.chain": "Applied to {list}, kept as written.",
  "props.loop.details.defaults": "{titles} are this component\u2019s defaults; a page using it can set its own.",
  "props.loop.details.saved": "Saved in this file, in the settings {reader}() applies.",
  "props.loop.details.stillWorks": "It still works; edit it in the code.",
  "props.loop.field": "Field",
  "props.loop.filters.code": "Filter code",
  "props.loop.filters.discard": "Discard filter",
  "props.loop.filters.match": "Match",
  "props.loop.filters.matchAll": "Match all",
  "props.loop.filters.matchAny": "Match any",
  "props.loop.filters.new": "New filter",
  "props.loop.filters.remove": "Remove filter",
  "props.loop.filters.title": "Filters",
  "props.loop.items.empty": "This collection has no items.",
  "props.loop.items.loading": "Loading items\u2026",
  "props.loop.items.noMatch": "No items match.",
  "props.loop.items.notFound": "{id} (not found)",
  "props.loop.items.remove": "Remove item",
  "props.loop.items.search": "Search items",
  "props.loop.items.select": "Select items",
  "props.loop.items.selectAll": "Select all",
  "props.loop.limit.all": "All",
  "props.loop.limit.decrease": "Decrease",
  "props.loop.limit.decreaseTitle": "Decrease \u2014 \u21E7 by 10",
  "props.loop.limit.increase": "Increase",
  "props.loop.limit.increaseTitle": "Increase \u2014 \u21E7 by 10",
  "props.loop.limit.show": "Show",
  "props.loop.limit.skip": "Skip",
  "props.loop.limit.title": "Limit items",
  "props.loop.lineage.comesFrom": "Comes from",
  "props.loop.lineage.contentCollection": "Content collection",
  "props.loop.lineage.first": "First {count}",
  "props.loop.lineage.following": "Following the code\u2026",
  "props.loop.lineage.groqQuery": "GROQ query",
  "props.loop.lineage.liveIn": "These settings live in {file}. Edit them there, or choose a collection above to set filters here.",
  "props.loop.lineage.query": "Query",
  "props.loop.lineage.reshaped": "Reshaped in code ({methods}).",
  "props.loop.lineage.savedFunction": "Filters, sort and limit below are saved to {file}, and apply everywhere {name} is used.",
  "props.loop.lineage.savedIt": "Filters, sort and limit below are saved to {file}, and apply everywhere it is used.",
  "props.loop.lineage.sortedBy": "Sorted by {sort}",
  "props.loop.lineage.thisPage": "This page",
  "props.loop.lineage.unrecognised": "The code doesn\u2019t read a collection Stacki recognises.",
  "props.loop.literal.areCode": "These items are code",
  "props.loop.literal.empty": "No items yet.",
  "props.loop.literal.item": "Item",
  "props.loop.literal.items": "Items",
  "props.loop.literal.itemsAsCode": "Items as code",
  "props.loop.literal.newItem": "Item {number}",
  "props.loop.literal.notList": "Write the items as a list: [ \u2026 ].",
  "props.loop.literal.placeholder": '["Item 1", "Item 2"] or [{{ title: "A" }}]',
  "props.loop.literal.useRows": "Use the item rows",
  "props.loop.literal.writeCode": "Write the items as code",
  "props.loop.notice.dismiss": "Dismiss",
  "props.loop.notice.relinked": "Bindings inside are linked again, as they were for this list.",
  "props.loop.notice.switchBack": { one: "Switch back to {name} to link it again.", other: "Switch back to {name} to link them again." },
  "props.loop.notice.unlinked": {
    one: "Unlinked {count} binding{names}: this list doesn\u2019t have that field.",
    other: "Unlinked {count} bindings{names}: this list doesn\u2019t have those fields."
  },
  "props.loop.operator.after": "Is after",
  "props.loop.operator.atLeast": "At least",
  "props.loop.operator.atMost": "At most",
  "props.loop.operator.before": "Is before",
  "props.loop.operator.contains": "Contains",
  "props.loop.operator.greater": "Greater than",
  "props.loop.operator.has": "Includes",
  "props.loop.operator.inFuture": "Is in the future",
  "props.loop.operator.inPast": "Is in the past",
  "props.loop.operator.is": "Equals",
  "props.loop.operator.isEmpty": "Is not set",
  "props.loop.operator.isFalse": "Is off",
  "props.loop.operator.isNot": "Does not equal",
  "props.loop.operator.isSet": "Is set",
  "props.loop.operator.isTrue": "Is on",
  "props.loop.operator.less": "Less than",
  "props.loop.order.boolean.ascending": "Is Off First",
  "props.loop.order.boolean.descending": "Is On First",
  "props.loop.order.count.ascending": "Fewest items first",
  "props.loop.order.count.descending": "Most items first",
  "props.loop.order.date.ascending": "Oldest to newest",
  "props.loop.order.date.descending": "Newest to oldest",
  "props.loop.order.fileSize.ascending": "Smallest file first",
  "props.loop.order.fileSize.descending": "Largest file first",
  "props.loop.order.length.ascending": "Shortest first",
  "props.loop.order.length.descending": "Longest first",
  "props.loop.order.natural.ascending": "A to Z, numbers in order",
  "props.loop.order.natural.descending": "Z to A, numbers in order",
  "props.loop.order.number.ascending": "Smallest to largest",
  "props.loop.order.number.descending": "Largest to smallest",
  "props.loop.order.text.ascending": "A to Z",
  "props.loop.order.text.descending": "Z to A",
  "props.loop.partial.confirm": "Click again to replace the code",
  "props.loop.partial.title": "Custom code shapes this list",
  "props.loop.partial.use": "Use list settings instead",
  "props.loop.problem.filterEmpty": "Type a condition.",
  "props.loop.problem.filterNotGroq": "This is not a GROQ condition.",
  "props.loop.problem.filterTooLong": "This condition is too long.",
  "props.loop.problem.notExpression": "This is not one JavaScript expression.",
  "props.loop.problem.sortEmpty": "Type a comparator, such as (a, b) => a.data.order - b.data.order.",
  "props.loop.problem.sortNotComparator": "A sort compares two items: write (a, b) => \u2026",
  "props.loop.problem.sortTooLong": "This sort is too long.",
  "props.loop.removed.emptied": { one: "{count} had no value to keep", other: "{count} had no value to keep" },
  "props.loop.removed.replaced": { one: "{count} binding replaced with its current value", other: "{count} bindings replaced with their current values" },
  "props.loop.removed.title": "Loop removed",
  "props.loop.rows.add": "Add {title}",
  "props.loop.rows.details": "Details",
  "props.loop.rows.edit": "Edit",
  "props.loop.save.changed": "{file} changed since it was read, so nothing was saved. Its settings are shown again as they are now.",
  "props.loop.save.failed": "Couldn\u2019t save {file}: {detail}",
  "props.loop.section.asCode": "{title} as code",
  "props.loop.section.useControls": "Use the controls",
  "props.loop.section.writeCode": "Write as code",
  "props.loop.settings.dynamic": "Dynamic",
  "props.loop.settings.items": "Items",
  "props.loop.settings.selected": "Selected",
  "props.loop.settings.selectedCustom": "Custom code shapes this list, so its items cannot be picked by hand.",
  "props.loop.settings.selectedTraced": "This list is edited where its query lives.",
  "props.loop.settings.selectedUnknown": "The items of this list are not known here, so there is nothing to pick from.",
  "props.loop.sort.code": "Sort code",
  "props.loop.sort.order": "Order",
  "props.loop.sort.random": "Random order",
  "props.loop.sort.remove": "Remove sort",
  "props.loop.sort.shuffled": "shuffled when the page is built",
  "props.loop.sort.title": "Sort",
  "props.loop.source.collection": "collection",
  "props.loop.source.contentCollections": "Content collections",
  "props.loop.source.customList": "Custom list",
  "props.loop.source.editBelow": "edit below",
  "props.loop.source.import": "import",
  "props.loop.source.items": { one: "{count} item", other: "{count} items" },
  "props.loop.source.itemsSeed": "items",
  "props.loop.source.needsIntegration": "needs @sanity/astro",
  "props.loop.source.needsSanityAstro": "Add the @sanity/astro integration to this project to loop over Sanity content.",
  "props.loop.source.newList": "New List property",
  "props.loop.source.none": "None",
  "props.loop.source.thisFile": "this file",
  "props.loop.source.title": "Source",
  "props.loop.source.typeItems": "type the items",
  "props.loop.source.via": "via {name}",
  "props.loop.note.kept": "This list already has code that the controls cannot show. It stays as written; what you set here applies after it.",
  "props.loop.note.unknownShape": "Stacki cannot see what this list holds. Type the field names to filter and sort by; the list itself is kept as written.",
  "props.loop.typed.boolean": "On or off",
  "props.loop.typed.date": "Date",
  "props.loop.typed.invalid": "Use a field name such as title or author.name.",
  "props.loop.typed.number": "Number",
  "props.loop.typed.open": "Use a custom field name\u2026",
  "props.loop.typed.path": "Field name",
  "props.loop.typed.placeholder": "title or author.name",
  "props.loop.typed.text": "Text",
  "props.loop.typed.type": "Type",
  "props.loop.typed.use": "Use field",
  "props.loop.value": "Value",
  "props.loop.when": "When",
  "props.map.code": "Code",
  "props.map.customLoop": "Custom loop code \u2014 edit it below.",
  "props.map.tag": "Tag",
  "props.map.tooLong": "This code is too long.",
  "props.newProp.form.attributeName": "Attribute name",
  "props.newProp.form.attributeNameHint": "name",
  "props.newProp.form.attributeValue": "Attribute value",
  "props.newProp.form.attributeValueHint": "value",
  "props.newProp.form.auto": "Auto",
  "props.newProp.form.create": "Create",
  "props.newProp.form.decimals": "Decimals",
  "props.newProp.form.default": "Default",
  "props.newProp.form.defaultKind": "Default {kind}",
  "props.newProp.form.false": "False",
  "props.newProp.form.imagePlaceholder": "https://\u2026 or ../assets/image.png",
  "props.newProp.form.max": "Max",
  "props.newProp.form.min": "Min",
  "props.newProp.form.name": "Name",
  "props.newProp.form.none": "None",
  "props.newProp.form.numberSettings": "Number settings",
  "props.newProp.form.options": "Options",
  "props.newProp.form.removeAttribute": "Remove attribute",
  "props.newProp.form.settings": "Property settings",
  "props.newProp.form.tooltip": "Tooltip",
  "props.newProp.form.tooltipPlaceholder": "Describe how to use this property\u2026",
  "props.newProp.form.true": "True",
  "props.newProp.form.type": "Type",
  "props.newProp.kind.attributes": "Attributes",
  "props.newProp.kind.boolean": "Switch",
  "props.newProp.kind.image": "Image",
  "props.newProp.kind.list": "List",
  "props.newProp.kind.number": "Number",
  "props.newProp.kind.option": "Option",
  "props.newProp.kind.string": "Text",
  "props.newProp.name.empty": "Give the property a name.",
  "props.newProp.name.invalid": "Use letters and numbers, starting with a letter.",
  "props.newProp.name.taken": "This component already has a {name} property.",
  "props.newProp.name.tooLong": "That name is too long.",
  "props.newProp.title.attributes": "Attributes",
  "props.newProp.title.boolean": "Switch",
  "props.newProp.title.classList": "Class list",
  "props.newProp.title.content": "Text",
  "props.newProp.title.image": "Image",
  "props.newProp.title.list": "List",
  "props.newProp.title.number": "Number",
  "props.newProp.title.text": "Plain Text",
  "props.number.decrease": "Decrease",
  "props.number.decreaseTitle": "Decrease \u2014 \u21E7 by 10, \u2325 by 0.1",
  "props.number.increase": "Increase",
  "props.number.increaseTitle": "Increase \u2014 \u21E7 by 10, \u2325 by 0.1",
  "props.override.choosing": "Choosing in {owner}\u2026",
  "props.override.useStacki": "Use Stacki\u2019s picker",
  "props.panel.noAttributes": "This HTML element has no attributes set.",
  "props.panel.fromContent": "What this part shows comes from Content. Open Content to change it.",
  "props.panel.nothingToEdit": "Nothing to edit here. Click a text, an image or a link on the page.",
  "props.people.text": "Text",
  "props.people.link": "Link",
  "props.people.image": "Image",
  "props.people.description": "Description",
  "props.panel.noProps": "This component declares no props (add an interface Props or an Astro.props destructure to expose some).",
  "props.remove.blockedTitle": "{name} can\u2019t be deleted yet",
  "props.remove.checkFailed": "Stacki could not check where {name} is used:",
  "props.remove.component": "Removes {name} from {component}, every variant included.",
  "props.remove.confirm": "Delete property",
  "props.remove.kept": { one: "Kept as a constant: {constant} (read on line {lines}).", other: "Kept as a constant: {constant} (read on lines {lines})." },
  "props.remove.keptUndefined": "It had no default, so the constant is undefined, as when nothing passed it.",
  "props.remove.keptZero": "It had no default, so the constant holds its first value.",
  "props.remove.moreFiles": { one: "and {count} more file", other: "and {count} more files" },
  "props.remove.noUsages": "No instance passes it.",
  "props.remove.reads": "Its own code still reads it. Remove these reads first:",
  "props.remove.reviewLine": "{path}, line {line}",
  "props.remove.spreads": "Check by hand: these spreads may still pass it.",
  "props.remove.title": "Delete {name}?",
  "props.remove.undo": "One Undo restores everything.",
  "props.remove.usageFile": "{path} \xB7 {count}",
  "props.remove.usages": { one: "Removes its value from {count} instance:", other: "Removes its value from {count} instances:" },
  "props.rename.aliased": "Astro.props is forwarded or aliased. Update that code explicitly before editing this property.",
  "props.rename.computed": "Astro.props has a computed key. Make that access explicit before editing this property.",
  "props.rename.consumerDynamicImport": "{file} imports it dynamically. Update that consumer explicitly before changing the prop name.",
  "props.rename.consumerLayout": "{file} passes layout props through Markdown frontmatter. Update that consumer explicitly before changing the prop name.",
  "props.rename.consumerOutsideAstro": "{file} uses this component outside Astro or MDX. Update that consumer explicitly before changing the prop name.",
  "props.rename.consumerReExport": "{file} re-exports this component. Update that consumer explicitly before changing the prop name.",
  "props.rename.consumerUsesInCode": "{file} uses this component in frontmatter or JavaScript. Update that consumer explicitly before changing the prop name.",
  "props.rename.defaultOrder": "A prop read precedes its default. Move the Astro.props binding before that read in source.",
  "props.rename.dynamicSpreadEdit": "An instance uses a dynamic prop spread. Make its props explicit before editing this property.",
  "props.rename.dynamicSpreadOption": "An instance uses a dynamic prop spread. Make its props explicit before renaming this option.",
  "props.rename.fileLimit": "Project exceeds the prop rename file limit.",
  "props.rename.fileTooLarge": "{file} exceeds the component source limit.",
  "props.rename.instanceCollision": "An instance already passes {name}.",
  "props.rename.optionDuplicate": "An option value is renamed more than once.",
  "props.rename.optionLiterals": "Option renames require literal values.",
  "props.rename.position": "Could not locate a source range safely; no files changed.",
  "props.rename.restComputed": "{rest} is read with a computed key. Make that read explicit before renaming {from}.",
  "props.rename.restInCode": "{rest} is used in code in a way a rename cannot follow. Rename {from} there in source.",
  "props.rename.restInTemplate": "{rest} is used in the template in a way a rename cannot follow. Rename {from} there in source.",
  "props.rename.sourceLimit": "Project exceeds the prop rename source limit.",
  "props.rename.spreadCollision": "A spread already contains {name}.",
  "props.rename.symlink": "Project sources contain a symbolic link. Resolve it before a project-wide rename.",
  "props.rename.unreadable": "This component can\u2019t be read to rename \u201C{name}\u201D safely. {detail}",
  "props.sections.addField": "Add field",
  "props.sections.codeType": "Code type",
  "props.sections.defaultItems": "Default items",
  "props.sections.eachItemHas": "Each {name} item has",
  "props.sections.editCodeType": "Edit the code type",
  "props.sections.fieldName": "Field name",
  "props.sections.fieldType": "Field type",
  "props.sections.fieldsOf": "Fields of {name}",
  "props.sections.flags": "Property flags",
  "props.sections.groupHas": "{name} has",
  "props.sections.itemFields": "Item fields",
  "props.sections.optionsOf": "Options of {name}",
  "props.sections.removeField": "Remove field",
  "props.sections.required": "Required",
  "props.sections.useControls": "Use the controls",
  "props.shared.declared": "{name} is declared in {type} ({path}). Delete it there in source.",
  "props.shared.duplicateType": "{type} already declares {name}.",
  "props.shared.duplicateUser": "{file} already declares a prop named {name}.",
  "props.shared.noDefault": "This component passes {name} on to {type}'s other users without destructuring it, so it has no default of its own.",
  "props.shared.noDefaultElsewhere": "This component passes {name} on to {type}'s other users without destructuring it, so it has no default of its own. It has one in {where}.",
  "props.shared.sourceLimit": "Project exceeds the shared property source limit.",
  "props.sources.code": "Code",
  "props.sources.comment": "Comment",
  "props.sources.commentPlaceholder": "Note above this element\u2026",
  "props.sources.condition": "Condition",
  "props.sources.conditionNote": "True renders <strong>then</strong>; nothing renders otherwise. Drop elements into either branch in the navigator.",
  "props.sources.conditionNoteElse": "True renders <strong>then</strong>, false renders <strong>else</strong>. Drop elements into either branch in the navigator.",
  "props.sources.doctype": "Doctype",
  "props.sources.doctypeNote": "Written out verbatim at the top of the page. Not an element \u2014 it has no tag or attributes.",
  "props.sources.editCode": "Edit code",
  "props.sources.elseBranch": "Else branch",
  "props.sources.elseBranchTip": "Render another branch when the condition is false",
  "props.sources.elseNone": "Nothing",
  "props.sources.elseNoneTip": "Nothing renders when the condition is false",
  "props.sources.expression": "Expression",
  "props.sources.binding": "Data",
  "props.sources.frontmatter": "Frontmatter",
  "props.sources.frontmatterNote": "Imports, constants, and data for this page. Opens in a floating editor you can move and resize while working with the canvas.",
  "props.sources.line": "Line",
  "props.sources.lineNote": "Written out verbatim, exactly as typed.",
  "props.sources.loop": "Loop",
  "props.sources.rawNote": "Opens the {language} in a floating editor you can move and resize while working with the canvas.",
  "props.sources.renderedFalse": "When false",
  "props.sources.renderedTrue": "When true",
  "props.sources.selectComponent": "Select a component to edit its props.",
  "props.sources.settings": "Settings",
  "props.sources.showWhen": "Show when",
  "props.sources.sourceLine": "Source line",
  "props.sources.text": "Text",
  "props.syntax.defaultSingle": "Enter one default expression, without declarations.",
  "props.syntax.typeEmpty": "Enter a TypeScript type.",
  "props.syntax.typeSingle": "Enter one TypeScript type, without declarations.",
  "props.textConnect.disconnectHint": "Click to disconnect, \u2325-click disconnects at once"
};

// vendor/stacki/shared/properties/i18n/messages/en/publish.ts
var messages24 = {
  "publish.account.addTitle": "Add {provider} account",
  "publish.account.browser.intro": "Sign in to {provider} and approve access to connect your accounts.",
  "publish.account.browser.switchHint": "To use a different login, switch accounts in {provider} before approving access. This updates the {provider} login used by local publishing.",
  "publish.account.cancelled": "Sign-in cancelled.",
  "publish.account.cloudflare.installed": "Wrangler was added to this site\u2019s development dependencies.",
  "publish.account.cloudflare.installing": "Installing Wrangler in this site\u2026 Cancelling skips sign-in but lets the installation finish.",
  "publish.account.connected": "Account connected.",
  "publish.account.continueBrowser": "Continue in browser",
  "publish.account.deviceCode.hint": "Choose the account you want to add on GitHub. You can sign in with another account there.",
  "publish.account.deviceCode.intro": "Enter this one-time code on GitHub to connect your account.",
  "publish.account.deviceCode.label": "One-time code",
  "publish.account.deviceCode.openFailed": "Could not open the browser. Visit github.com/login/device and enter the code.",
  "publish.account.error.inProgress": "Finish or cancel the account sign-in already in progress.",
  "publish.account.error.installFailedAccess": "Could not install {tool}. Check your connection and project access, then retry.",
  "publish.account.error.installFailedDisk": "Could not install {tool}. Check your connection and disk space, then retry.",
  "publish.account.error.installOutputLarge": "{tool} installation returned too much output.",
  "publish.account.error.installTimedOut": "{tool} installation timed out. Check your connection and try again.",
  "publish.account.error.launchInstall": "Could not run {manager} to install {tool}. Install {manager}, then try again.",
  "publish.account.error.providerSignInExpired": "{provider} sign-in expired. Please try again.",
  "publish.account.error.sessionEnded": "This sign-in session has ended. Please try again.",
  "publish.account.error.signInIncomplete": "{provider} sign-in did not complete. Check CLI authentication and try again.",
  "publish.account.error.signInOutputLarge": "{provider} sign-in returned too much output.",
  "publish.account.error.startCloudflare": "Could not start Cloudflare sign-in. Install Wrangler and try again.",
  "publish.account.error.startGitHub": "Could not start GitHub sign-in. Install gh and try again.",
  "publish.account.error.startVercel": "Could not start Vercel sign-in. Install the Vercel CLI and try again.",
  "publish.account.error.stillInstalling": "{tool} is still installing in the background. Try again in a moment.",
  "publish.account.expired": "Account sign-in expired. Please try again.",
  "publish.account.openFailed": "Could not open {provider} sign-in. Please try again.",
  "publish.account.signInTitle": "Sign in to {provider}",
  "publish.account.starting": "Starting {provider} sign-in\u2026",
  "publish.account.unfinished": "Sign-in did not finish.",
  "publish.account.vercel.installed": "The Vercel CLI was installed for your user account.",
  "publish.account.vercel.installing": "Installing the Vercel CLI\u2026 Cancelling skips sign-in but lets the installation finish.",
  "publish.account.waiting": "Waiting for sign-in\u2026",
  "publish.branchWarning.body": "You are on {branch}, not {default}. Publishing sends this branch.",
  "publish.branchWarning.bodyDetached": "You are not on {default} or any other branch (detached HEAD). Publishing sends this exact point.",
  "publish.branchWarning.confirm": "Publish from {branch}",
  "publish.branchWarning.confirmDetached": "Publish from here",
  "publish.branchWarning.dirty": "You have changes on {branch} that are not committed. Commit or park them in History, then switch.",
  "publish.branchWarning.remember": "Don\u2019t warn me again for this branch",
  "publish.branchWarning.switch": "Switch to {default} first",
  "publish.branchWarning.switchFailed": "Could not switch to {default}: {message}",
  "publish.branchWarning.title": "Publish from {branch}?",
  "publish.branchWarning.titleDetached": "Publish from here?",
  "publish.busy": "Publishing\u2026",
  "publish.command.exitFailed": "{executable} failed (exit {code}). Check its setup.",
  "publish.command.hooksLimit": "Publish hook exceeds eight scripts.",
  "publish.command.installTool": "Install {executable} in this project\u2019s development dependencies.",
  "publish.command.outputLimit": "Command exceeded the 1 MiB output limit.",
  "publish.command.startFailed": "Could not start {executable}. Install and authenticate it first.",
  "publish.command.timeLimit": "Command exceeded the ten-minute time limit.",
  "publish.common.addAccount": "Add account",
  "publish.common.advanced": "Advanced",
  "publish.common.done": "Done",
  "publish.common.githubAccount": "GitHub account",
  "publish.common.loading": "Loading\u2026",
  "publish.common.loadingAccounts": "Loading accounts\u2026",
  "publish.common.save": "Save",
  "publish.common.saving": "Saving\u2026",
  "publish.common.tryAgain": "Try again",
  "publish.connection.checking": "Checking connection\u2026",
  "publish.connection.failure.expired": "{provider} sign-in expired or was revoked. Sign in again.",
  "publish.connection.failure.missingCli": "The {provider} command-line tool is not installed on this computer.",
  "publish.connection.failure.network": "Could not reach {provider}. Check your internet connection, then refresh.",
  "publish.connection.failure.signedOut": "You are not signed in to {provider}.",
  "publish.connection.failure.unknown": "Could not load {provider} accounts. Refresh to try again, or enter the IDs manually.",
  "publish.connection.githubAccount.refresh": "Refresh GitHub account",
  "publish.connection.help.body": "Run {command}, then refresh.",
  "publish.connection.help.title": "Connection help",
  "publish.connection.noAccounts": "No connected accounts",
  "publish.connection.recovery.connect": "Connect {provider}",
  "publish.connection.recovery.installVercel": "Install Vercel",
  "publish.connection.recovery.refresh": "Refresh connection",
  "publish.connection.recovery.signIn": "Sign in to {provider}",
  "publish.connection.recovery.signInAgain": "Sign in again",
  "publish.git.error.badFilename": "Git filename is not valid UTF-8.",
  "publish.git.error.badTreeEntry": "Unsupported or malformed Git tree entry.",
  "publish.git.error.chunkLimit": "Git listing exceeded its chunk limit.",
  "publish.git.error.diagnosticsLimit": "Git diagnostics exceeded the 1 MiB limit.",
  "publish.git.error.differentRemote": "Git returned a different remote branch.",
  "publish.git.error.emptyRecord": "Git returned an empty file record.",
  "publish.git.error.filesystem": "Could not access the publishing files.",
  "publish.git.error.incompleteListing": "Git returned an incomplete file listing.",
  "publish.git.error.invalidChunk": "Git returned an oversized or invalid chunk.",
  "publish.git.error.invalidObject": "Git returned an invalid object identifier.",
  "publish.git.error.invalidSize": "Git returned an invalid file size.",
  "publish.git.error.listingFailed": "Git listing failed.",
  "publish.git.error.listingUnreadable": "Could not read the Git file listing.",
  "publish.git.error.pathOutside": "Git returned a path outside the project.",
  "publish.git.error.recordTooLarge": "Git record exceeds the 16 KiB limit.",
  "publish.git.error.startFailed": "Could not start Git.",
  "publish.git.error.timeLimit": "Git inspection exceeded the ten-minute limit.",
  "publish.github.connectRepository": "Connect a github.com repository from the branch menu before publishing.",
  "publish.github.invalidCredential": "GitHub CLI returned an invalid credential.",
  "publish.github.signInOnce": "Sign in once with gh auth login for {account}.",
  "publish.hosting.accountNameLoading": "Loading account name\u2026",
  "publish.hosting.accountNameUnavailable": "Account name unavailable",
  "publish.hosting.accountUnverified": "Account unverified",
  "publish.hosting.addWorker": "Add Worker",
  "publish.hosting.chooseAccount": "Choose account\u2026",
  "publish.hosting.chooseCloudflareFirst": "Choose a Cloudflare account first",
  "publish.hosting.chooseProject": "Choose project\u2026",
  "publish.hosting.cloudflareAccount": "Cloudflare account",
  "publish.hosting.findProject": "Find project\u2026",
  "publish.hosting.loadingProjects": "Loading projects\u2026",
  "publish.hosting.pages": "Pages",
  "publish.hosting.project": "Hosting project",
  "publish.hosting.refreshCloudflareAccount": "Refresh Cloudflare account",
  "publish.hosting.refreshProject": "Refresh hosting project",
  "publish.hosting.saved": "Saved",
  "publish.hosting.savedVercelProject": "Saved Vercel project",
  "publish.hosting.worker": "Worker",
  "publish.label": "Publish",
  "publish.menu.commitsToPush": { one: "{count} commit to push", other: "{count} commits to push" },
  "publish.menu.commitsUnavailable": "Commit count unavailable",
  "publish.menu.deploy": "Deploy to hosting",
  "publish.menu.hostingChoose": "Choose a hosting provider",
  "publish.menu.hostingCurrent": "Up to date",
  "publish.menu.hostingPending": "Changes to deploy",
  "publish.menu.hostingUnknown": "Deployment status unavailable",
  "publish.menu.noChangesToPush": "No changes to push",
  "publish.menu.openRepository": "Open GitHub repository",
  "publish.menu.openSite": "Open published site",
  "publish.menu.openUrl": "Open {url}",
  "publish.menu.options": "Publish options",
  "publish.menu.pushToGitHub": "Push to GitHub",
  "publish.menu.settings": "Publish settings\u2026",
  "publish.moreOptions": "More publish options",
  "publish.repositories.add": "Add repo",
  "publish.repositories.choose": "Choose repository\u2026",
  "publish.repositories.chooseAccountFirst": "Choose a GitHub account first",
  "publish.repositories.create.creating": "Creating\u2026",
  "publish.repositories.create.hint": "Creates an empty repo in {owner}. Save Publish settings to connect it.",
  "publish.repositories.create.name": "Repository name",
  "publish.repositories.create.orgAccessFailed": "Could not list your organizations. Refresh and try again.",
  "publish.repositories.create.orgAccessNeeded": "Your organizations are hidden. Grant access in a terminal, then refresh:",
  "publish.repositories.create.orgMissing": "Missing an organization? Its owners may need to approve the GitHub CLI.",
  "publish.repositories.create.owner": "Owner",
  "publish.repositories.create.ownerLabel": "Repository owner",
  "publish.repositories.create.personal": "{account} (you)",
  "publish.repositories.create.submit": "Create repo",
  "publish.repositories.create.title": "Create repository",
  "publish.repositories.error.accessFailed": "Could not access GitHub repositories. Refresh or reconnect this GitHub account.",
  "publish.repositories.error.changed": "The connected repository changed. Refresh before saving.",
  "publish.repositories.error.changedWhileSaving": "The repository connection changed while saving. Refresh to review it.",
  "publish.repositories.error.createFailed": "Could not create the repository. Check the name, account permissions, and connection.",
  "publish.repositories.error.exists": "{repository} already exists. Choose another name.",
  "publish.repositories.error.listFailed": "Could not list repositories for this account. Refresh or reconnect the account.",
  "publish.repositories.error.noWriteAccess": "This account does not have write access to that repository.",
  "publish.repositories.error.organizationApproval": "{owner} needs to approve this app or require your single sign-on before you can create a repository there. Ask an owner, then try again.",
  "publish.repositories.error.organizationForbids": "{owner} does not let you create repositories. Ask an owner for permission, or choose another owner.",
  "publish.repositories.find": "Find repository\u2026",
  "publish.repositories.loading": "Loading repositories\u2026",
  "publish.repositories.managedLinked": "This Studio deployment is linked to its installed GitHub repository.",
  "publish.repositories.managedNotice": "Managed by this Studio deployment.",
  "publish.repositories.private": "Private",
  "publish.repositories.public": "Public",
  "publish.repositories.refresh": "Refresh repos",
  "publish.repositories.title": "GitHub repository",
  "publish.repositories.visibility": "Visibility",
  "publish.repositories.visibilityLabel": "Repository visibility",
  "publish.review.error.closed": "This snapshot already has a closed review. Sync the base branch or make a new change before submitting.",
  "publish.review.error.differentRepository": "GitHub returned a different repository review.",
  "publish.review.error.emptyResponse": "GitHub returned an empty review response.",
  "publish.review.error.incompleteList": "GitHub returned an incomplete review list.",
  "publish.review.error.interrupted": "Review request interrupted. Retry to recover the existing branch or pull request.",
  "publish.review.error.invalidChunk": "GitHub returned an invalid response chunk.",
  "publish.review.error.invalidReceipt": "GitHub returned an invalid review receipt.",
  "publish.review.error.invalidRepository": "Invalid review repository.",
  "publish.review.error.requestFailed": "GitHub review request failed ({status}). Check pull request write permission, then retry.",
  "publish.review.error.responseLimit": "GitHub review response exceeds its limit.",
  "publish.review.error.unreadable": "GitHub returned an unreadable review response.",
  "publish.settings.advanced.afterPublish": "After publish",
  "publish.settings.advanced.beforePublish": "Before publish",
  "publish.settings.advanced.buildScript": "Build script",
  "publish.settings.advanced.outputDirectory": "Build output directory",
  "publish.settings.advanced.pagesProject": "Pages project name",
  "publish.settings.advanced.productionBranch": "Production branch",
  "publish.settings.advanced.scriptsHint": "Scripts run only when deploying to hosting. Push to GitHub skips the build and both hooks. Use npm script names, separated by commas.",
  "publish.settings.advanced.vercelOrganization": "Vercel organization / team ID",
  "publish.settings.advanced.vercelProject": "Vercel project ID",
  "publish.settings.chooseProviderFirst": "Choose a hosting provider first",
  "publish.settings.chooseWorker": "Choose the Worker under its Cloudflare account before saving.",
  "publish.settings.hosting": "Hosting",
  "publish.settings.keepOneDestination": "Keep at least one publish destination enabled",
  "publish.settings.loadingLabel": "Loading publish settings",
  "publish.settings.noneGitHubOnly": "None (GitHub only)",
  "publish.settings.provider": "Hosting provider",
  "publish.settings.providerChecking": "Checking hosting\u2026",
  "publish.settings.publishButton": "Publish button",
  "publish.settings.reloadNeeded": "Desktop needs to reload its new publishing support. Use View \u2192 Reload All Code, then open Publish settings to configure your provider.",
  "publish.settings.savedWithError": "Settings saved. {message}",
  "publish.settings.targetAction": "Main publish button action",
  "publish.settings.title": "Publish settings",
  "publish.site.hint": "Optional. Used by the open-site arrow, even when hosting discovery is unavailable.",
  "publish.site.label": "Published site URL",
  "publish.site.saveFailed": "Could not save the published site link. Reopen Publish options to retry.",
  "publish.status.close": "Close",
  "publish.status.githubDone": "Changes pushed to GitHub",
  "publish.status.hostingDone": "Hosting deployment completed",
  "publish.status.keepOpen": "Keep Stacki open until publishing finishes.",
  "publish.status.openPullRequest": "Open pull request",
  "publish.status.preparing": "Preparing publish\u2026",
  "publish.status.preparingProject": "Preparing your project",
  "publish.status.progress": "Publish progress",
  "publish.status.step.afterScripts": "Running after-publish scripts\u2026",
  "publish.status.step.building": "Building website\u2026",
  "publish.status.step.checkingIncoming": "Checking GitHub for incoming changes\u2026",
  "publish.status.step.cleanup": "Cleaning up storage\u2026",
  "publish.status.step.committingAndPushing": "Committing and pushing to GitHub\u2026",
  "publish.status.step.deploying": "Deploying live website\u2026",
  "publish.status.step.deployingTo": "Deploying to {provider}\u2026",
  "publish.status.step.preparingFiles": "Preparing files\u2026",
  "publish.status.step.runningHooks": "Running hooks and building website\u2026",
  "publish.status.step.savingToGitHub": "Saving to GitHub\u2026",
  "publish.status.stepOf": "Step {current} of {total}",
  "publish.status.title.done": "Published successfully",
  "publish.status.title.failed": "Publish needs attention",
  "publish.status.title.review": "Ready for review",
  "publish.status.title.running": "Publishing",
  "publish.status.unchanged": "Your live site and current branch are unchanged.",
  "publish.studio.accountUnreachable": "Could not reach account sign-in. Please try again.",
  "publish.studio.error.alreadySyncing": "Publishing is already syncing GitHub. Wait until publishing finishes.",
  "publish.studio.error.baselineMissing": "Missing repository baseline.",
  "publish.studio.error.cleanupRetry": "Published successfully. Storage cleanup will retry after the next GitHub publish.",
  "publish.studio.error.componentChanged": "This component changed. Reload before saving.",
  "publish.studio.error.copyTimeout": "Hosting copy exceeded ten minutes.",
  "publish.studio.error.directoryLimit": "Publish exceeds 10,000 directories.",
  "publish.studio.error.diskInspect": "Could not inspect available disk space.",
  "publish.studio.error.diskLow": "Not enough disk space. Use a larger Studio container and retry.",
  "publish.studio.error.diskLowPublishing": "Not enough disk space for publishing. Use a larger Studio container and retry.",
  "publish.studio.error.failed": "Publish failed.",
  "publish.studio.error.fileBudget": "Publish exceeds the file/directory budget.",
  "publish.studio.error.fileInvalid": "Invalid publish file or file exceeds 100 MiB.",
  "publish.studio.error.gitBusy": "Wait for the Git operation to finish before publishing.",
  "publish.studio.error.gitFailed": "Git {command} failed. Check repository access and retry.",
  "publish.studio.error.gitFailedDetail": "Git {command} failed. Check repository access and retry. Git said: {detail}",
  "publish.studio.error.gitOutputLimit": "Git exceeded the 1 MiB output limit.",
  "publish.studio.error.gitPushUnconfirmed": "Git push was not confirmed. Check GitHub before retrying.",
  "publish.studio.error.gitPushUnconfirmedDetail": "Git push was not confirmed. Check GitHub before retrying. Git said: {detail}",
  "publish.studio.error.gitStartFailed": "Could not start Git. Install Git and retry.",
  "publish.studio.error.gitTimeLimit": "Git exceeded the ten-minute time limit.",
  "publish.studio.error.gitWriteFailed": "Could not write to Git.",
  "publish.studio.error.hostingDoneThen": "Hosting deployment completed. {message}",
  "publish.studio.error.inspectTimeout": "Publish inspection exceeded ten minutes.",
  "publish.studio.error.managedAuto": "This site deploys automatically from GitHub. Use Publish to save and deploy changes together.",
  "publish.studio.error.managedCredentials": "This Studio uses managed publishing credentials. Add accounts in Desktop or local Studio.",
  "publish.studio.error.managedScripts": "This site builds through GitHub. Configure custom publish scripts in Cloudflare Workers Builds.",
  "publish.studio.error.managedUrl": "GitHub hosting requires a deployment confirmation URL.",
  "publish.studio.error.noLinks": "Publish requires regular files, not links.",
  "publish.studio.error.noReview": "This repository connection does not support pull request review.",
  "publish.studio.error.regularFile": "Publish requires regular files: {path}",
  "publish.studio.error.runtimeState": "Repository cannot contain Studio runtime state.",
  "publish.studio.error.savedThenFailed": "Saved to GitHub. Remaining publish steps failed: {message}",
  "publish.studio.error.sourceLimit": "Publish exceeds its source, file count or 100 MiB file limit.",
  "publish.studio.error.sourceTooLarge": "Captured source exceeds 8 GiB.",
  "publish.studio.error.symbolicLink": "Publish cannot include symbolic links: {path}",
  "publish.studio.error.tooFast": "GitHub is changing too quickly. Try publishing again.",
  "publish.studio.interrupted": "Publishing did not finish. Please try again.",
  "publish.studio.note.notConnected": "Live deployment is not connected in this Studio.",
  "publish.studio.note.unconfirmed": "Deployment is still unconfirmed. Check your hosting provider before publishing again.",
  "publish.studio.runningNote": "Publishing continues if you switch tabs.",
  "publish.studio.toast.live": "Published. Your changes are live.",
  "publish.studio.toast.notConnected": "Saved to GitHub. Automatic live deployment is not connected.",
  "publish.studio.toast.reviewReady": "Pull request ready for review.",
  "publish.studio.toast.started": "Publish started",
  "publish.studio.toast.unconfirmed": "Saved to GitHub. Live deployment is still unconfirmed; check your hosting provider.",
  "publish.upToDate": "All changes are up to date",
  "publish.worker.account": "Account: {account}",
  "publish.worker.add": "Add Worker",
  "publish.worker.error.configOutside": "Wrangler configuration must stay inside the publish snapshot.",
  "publish.worker.error.configTooLarge": "Wrangler configuration exceeds 64 KiB.",
  "publish.worker.error.configUnreadable": "Cannot read Wrangler configuration.",
  "publish.worker.error.configure": "Configure this project for Cloudflare Workers before publishing.",
  "publish.worker.exists": "This Worker already exists. Choose it from Hosting project.",
  "publish.worker.name": "Worker name",
  "publish.worker.nameRule": "Use lowercase letters, numbers, and hyphens. Start with a letter or number.",
  "publish.worker.saveHint": "Save Publish settings to select this destination. Your next publish creates the Worker using this project\u2019s Cloudflare configuration.",
  "publish.worker.title": "Add Cloudflare Worker",
  "publish.workflow.direct": "Publish to the current branch",
  "publish.workflow.label": "GitHub workflow",
  "publish.workflow.pullRequest": "Open a pull request for review",
  "publish.workflow.reviewNote": "Review submissions stay off the live site. Merge and deploy through GitHub."
};

// vendor/stacki/shared/properties/i18n/messages/en/recovery.ts
var messages25 = {
  "recovery.dev.crashed.detail": "The dev server stopped on its own (exit code {code}). The end of its output is below.",
  "recovery.dev.crashed.title": "The dev server stopped.",
  "recovery.dev.installDependencies": "Install dependencies",
  "recovery.dev.logLabel": "Dev server output",
  "recovery.dev.missingDependencies.detail": "Install them with the project\u2019s package manager and the preview starts. Your pages are still listed and editable as code.",
  "recovery.dev.missingDependencies.title": "This project\u2019s dependencies are not installed.",
  "recovery.dev.nodeVersion.detail": "This project needs Node {required}. Stacki is using Node {current}.",
  "recovery.dev.nodeVersion.title": "This project needs a different Node version.",
  "recovery.dev.portInUse.detail": "Another program is using the port. Stop it, or restart the preview so Stacki picks a free port.",
  "recovery.dev.portInUse.title": "The dev server port is already in use.",
  "recovery.dev.restart": "Restart dev server",
  "recovery.dev.restartLoop.detail": "It was restarted {count} times in a row and Stacki stopped it. The end of its output is below.",
  "recovery.dev.restartLoop.title": "The dev server keeps stopping.",
  "recovery.pane.canvas": "The canvas",
  "recovery.pane.codeView": "The code view",
  "recovery.pane.leftPanel": "This panel",
  "recovery.pane.rightPanel": "This panel",
  "recovery.preview.copyDetails": "Copy details",
  "recovery.preview.detail.dropped": "The dev server closed the connection while it was sending the page, which usually means it crashed while building it.",
  "recovery.preview.detail.empty": "The dev server answered, but the page has no content. The page may have thrown while it rendered.",
  "recovery.preview.detail.errorOverlay": "The dev server replaced the page with its own error screen.",
  "recovery.preview.detail.serverError": "The dev server answered with status {status} instead of the page.",
  "recovery.preview.detail.truncated": "The page stopped before its closing html tag, so part of it never arrived. It most likely threw while rendering.",
  "recovery.preview.detail.unreachable": "The dev server did not answer. It may have stopped or still be starting.",
  "recovery.preview.logLabel": "Error from the dev server",
  "recovery.preview.openBrowser": "Open in browser",
  "recovery.preview.reload": "Reload preview",
  "recovery.preview.title.dropped": "The page was cut off.",
  "recovery.preview.title.empty": "The page is empty.",
  "recovery.preview.title.errorOverlay": "The page failed to build.",
  "recovery.preview.title.serverError": "The dev server returned an error.",
  "recovery.preview.title.truncated": "The page is incomplete.",
  "recovery.preview.title.unreachable": "The dev server is not answering.",
  "recovery.reason.childGone": "A helper process ({type}) stopped: {reason}.",
  "recovery.reason.loadFailed": "The app window could not load ({description}, code {code}).",
  "recovery.reason.loopGuard": "It was reloaded {count} times and kept failing, so Stacki stopped trying.",
  "recovery.reason.mainError": "Stacki hit an unexpected error: {message}",
  "recovery.reason.renderError": "The interface crashed while drawing: {message}",
  "recovery.reason.rendererGone": "The app window stopped unexpectedly ({reason}).",
  "recovery.reason.unresponsive": "The app window stopped responding.",
  "recovery.screen.copied": "Copied",
  "recovery.screen.copyDetails": "Copy details",
  "recovery.screen.filesSafe": "Your project files on disk were not changed.",
  "recovery.screen.openProject": "Open another project",
  "recovery.screen.reload": "Reload",
  "recovery.screen.title": "Stacki needs to recover",
  "recovery.stage.dismiss": "Dismiss",
  "recovery.stage.failed": "Something went wrong while {stage}. The project is open without it.",
  "recovery.stage.name.firstRender": "rendering the first page",
  "recovery.stage.name.parse": "reading the page",
  "recovery.stage.name.readConfig": "reading the project settings",
  "recovery.stage.name.scan": "scanning the project",
  "recovery.stage.name.startDevServer": "starting the dev server",
  "recovery.stage.retry": "Retry",
  "recovery.stage.stalled": "Opening is taking too long while {stage}. The project is open without it; the code and the page list still work."
};

// vendor/stacki/shared/properties/i18n/messages/en/rail.ts
var messages26 = {
  "rail.ai": "AI chat",
  "rail.appWaiting": "{name}: {count} waiting",
  "rail.apps": "Apps",
  "rail.assets": "Assets",
  "rail.audits": "Audits",
  "rail.cms": "CMS",
  "rail.code": "Code",
  "rail.collections": "Collections",
  "rail.components": "Components",
  "rail.editorPanels": "Editor panels",
  "rail.history": "Git",
  "rail.more": "More",
  "rail.moveToBottom": "Move to bottom group",
  "rail.moveToTop": "Move to top group",
  "rail.movedBottom": "{label}: bottom group, position {position} of {count}",
  "rail.movedTop": "{label}: top group, position {position} of {count}",
  "rail.navigator": "Navigator",
  "rail.orderMenu": "Rail order",
  "rail.pages": "Pages",
  "rail.properties": "Properties",
  "rail.reset": "Reset rail order",
  "rail.resetDone": "Rail order reset",
  "rail.selectors": "Style selectors",
  "rail.settings": "Settings",
  "rail.settingsOrder.description": "Drag icons in the sidebar to reorder them. Reset to the default order.",
  "rail.settingsOrder.done": "Sidebar order reset",
  "rail.settingsOrder.label": "Sidebar icon order",
  "rail.settingsOrder.reset": "Reset to default",
  "rail.variables": "Variables",
  "rail.withShortcut": "{label} ({shortcut})"
};

// vendor/stacki/shared/properties/i18n/messages/en/roles.ts
var messages27 = {
  "roles.feature.settingsBreakpoints": "Breakpoints",
  "roles.group.panels": "Panels",
  "roles.group.pages": "Pages",
  "roles.group.components": "Components",
  "roles.group.codeAndPublishing": "Code and publishing",
  "roles.group.apps": "Apps",
  "roles.group.settings": "Settings",
  "roles.group.cli": "Command line",
  "roles.feature.cliRead": "Read settings",
  "roles.feature.cliConfig": "Change settings files",
  "roles.feature.cliGuides": "Edit column guides",
  "roles.feature.cliBreakpoints": "Edit breakpoints",
  "roles.feature.cliFolders": "Edit folders",
  "roles.feature.cliComponents": "Manage components",
  "roles.feature.cliApps": "Manage apps",
  "roles.feature.panelPages": "Pages",
  "roles.feature.panelNavigator": "Navigator",
  "roles.feature.panelProperties": "Component properties",
  "roles.feature.panelComponents": "Components",
  "roles.feature.panelAssets": "Assets",
  "roles.feature.panelCms": "CMS",
  "roles.feature.panelVariables": "Variables",
  "roles.feature.panelSelectors": "Style selectors",
  "roles.feature.panelCode": "Code",
  "roles.feature.panelHistory": "Git",
  "roles.feature.panelApps": "Apps",
  "roles.feature.panelAi": "AI chat",
  "roles.feature.panelInstructions": "Instructions (in Settings)",
  "roles.feature.panelAudits": "Audits",
  "roles.feature.panelProjectSettings": "Project settings (secrets, MCP servers)",
  "roles.feature.panelStyle": "Style panel",
  "roles.feature.panelSettings": "Settings panel",
  "roles.feature.pageCreate": "Create pages",
  "roles.feature.pageDelete": "Delete pages",
  "roles.feature.pageRename": "Rename and move pages",
  "roles.feature.pageLayout": "Edit the layout and outside it",
  "roles.feature.componentCreate": "Create components",
  "roles.feature.componentEdit": "Edit component source",
  "roles.feature.codeEdit": "Edit code",
  "roles.feature.instructionsEdit": "Edit instructions",
  "roles.feature.publish": "Publish",
  "roles.feature.marketplaceView": "See the marketplace",
  "roles.feature.marketplaceInstall": "Install from the marketplace",
  "roles.feature.marketplacePublish": "Publish to the marketplace",
  "roles.feature.appsShare": "Share apps to GitHub",
  "roles.feature.settingsEditor": "Editor settings",
  "roles.feature.settingsFolders": "Folders",
  "roles.feature.settingsCms": "CMS and media connections",
  "roles.feature.settingsStudio": "Stacki Studio",
  "roles.feature.settingsInstructions": "Hidden instructions",
  "roles.feature.settingsAudits": "Audit checks",
  "roles.delete.noMembers": "It has no members.",
  "roles.delete.members": { one: "Its member ({members}) becomes a person in no role.", other: "Its {count} members ({members}) become people in no role." },
  "roles.delete.defaultRole": "It is the role for people in no role, so that becomes Admin.",
  "roles.delete.viewing": "You are viewing as it, so the view goes back to Admin.",
  "roles.copy.name": "{name} copy",
  "roles.copy.numbered": "{name} copy {number}",
  "roles.invite.error.identifier": "Enter who to invite",
  "roles.invite.error.login": "Enter a GitHub username",
  "roles.invite.error.email": "Enter an email address",
  "roles.invite.error.handle": "Use lowercase letters, digits, dots, hyphens and underscores (up to 64)",
  "roles.invite.error.role": "Choose a role that exists",
  "roles.invite.error.notMember": "That person is not in any role",
  "roles.studio.title": "Roles",
  "roles.studio.readOnly": "Only admins can invite or change members.",
  "roles.studio.empty": "No members yet.",
  "roles.studio.you": "you",
  "roles.studio.unavailable": "Roles could not be loaded.",
  "roles.studio.invite": "Invite member",
  "roles.studio.inviteTitle": "Invite member",
  "roles.studio.field.github": "GitHub username",
  "roles.studio.field.email": "Email address",
  "roles.studio.field.handle": "Handle",
  "roles.studio.field.custom": "{name} identifier",
  "roles.studio.field.displayName": "Display name (optional)",
  "roles.studio.role": "Role",
  "roles.studio.submit": "Invite",
  "roles.studio.cancel": "Cancel",
  "roles.studio.noEmail": "Stacki sends no email. Copy the link and send it yourself.",
  "roles.studio.signIn": "They sign in at {link} with that {provider} account.",
  "roles.studio.accessReminder": "Also allow this person in your Cloudflare Zero Trust Access policy. Stacki cannot edit it.",
  "roles.studio.passkeyLink": "One-time invite link, valid until {date}. It is shown only now.",
  "roles.studio.copy": "Copy link",
  "roles.studio.copied": "Copied",
  "roles.studio.revoke": "Revoke invite",
  "roles.studio.pending": "Pending invites",
  "roles.studio.pendingBy": "{handle}, by {name}, expires {date}",
  "roles.studio.passkeys": "Passkeys",
  "roles.studio.removePasskey": "Remove passkey",
  "roles.studio.lock": "Lock out",
  "roles.studio.lockHint": "Ends this person\u2019s access within seconds and blocks new invites for 8 hours.",
  "roles.studio.remove": "Remove {name}",
  "roles.studio.changeRole": "Role of {name}",
  "roles.studio.noFile": "There is no roles file yet. Inviting someone creates it with you as admin.",
  "roles.studio.saved": "Saved",
  "roles.studio.failed": "Could not save the change.",
  "roles.studio.close": "Close",
  "roles.error.rolesMax": { one: "A project has at most {count} role", other: "A project has at most {count} roles" },
  "roles.error.nameEmpty": "A role needs a name",
  "roles.error.nameLong": "A role name is at most {max} characters",
  "roles.error.nameTaken": "There is already a role named {name}",
  "roles.error.memberListed": "{login} is already in {role}",
  "roles.error.membersMax": { one: "A role has at most {count} member", other: "A role has at most {count} members" },
  "roles.error.lastAdmin": "At least one person must be an admin",
  "roles.error.appsMax": {
    one: "A role holds app permissions for at most {count} app. Remove a role's settings for apps no longer installed in roles.json.",
    other: "A role holds app permissions for at most {count} apps. Remove a role's settings for apps no longer installed in roles.json."
  },
  "roles.error.permissionsMax": { one: "A role holds at most {count} permission for one app", other: "A role holds at most {count} permissions for one app" },
  "roles.error.pinsMax": { one: "A role pins at most {count} app", other: "A role pins at most {count} apps" },
  "roles.error.componentRulesMax": "A role has at most {count} component rules. Hide whole folders instead of single components.",
  "roles.error.componentHidden": "Your role ({role}) cannot add {name}. Ask an admin to show it.",
  "roles.error.loginLength": "A GitHub username is 1 to {max} characters",
  "roles.error.loginInvalid": '"{login}" is not a GitHub username',
  "roles.menu.yours": "Your role",
  "roles.menu.viewAs": "View as",
  "roles.menu.waitForSave": "Wait for your edits to finish saving"
};

// vendor/stacki/shared/properties/i18n/messages/en/selectors.ts
var messages28 = {
  "selectors.banner.checking": "Checking installed packages\u2026",
  "selectors.banner.unknown": "These may be in use, so they are never removed.",
  "selectors.bridge.unreadable": "The style check returned an unreadable answer: {detail}",
  "selectors.cleanup.action": "Clean up unused styles",
  "selectors.cleanup.confirm": {
    one: "This style will be removed from {files}. Undo puts it back.",
    other: "These {count} styles will be removed from {files}. Undo puts them back."
  },
  "selectors.cleanup.confirmButton": { one: "Remove style", other: "Remove {count} styles" },
  "selectors.cleanup.none": "No unused styles to clean up",
  "selectors.cleanup.removed": { one: "Removed 1 unused style", other: "Removed {count} unused styles" },
  "selectors.cleanup.removing": "Removing\u2026",
  "selectors.cleanup.title": "Remove unused styles",
  "selectors.deleteCleanup.namedMore": { one: "{names} and 1 more", other: "{names} and {count} more" },
  "selectors.deleteCleanup.remove": { one: "Remove style", other: "Remove styles" },
  "selectors.deleteCleanup.removed": { one: "Removed 1 unused selector", other: "Removed {count} unused selectors" },
  "selectors.deleteCleanup.unused": "Nothing uses {names} any more.",
  "selectors.empty.certain": "Nothing is uncertain: every style was checked.",
  "selectors.empty.noLocked": "No locked styles. Lock a style from its row, or a stylesheet from its heading, to keep it through every clean-up.",
  "selectors.empty.noMatch": "No selectors match.",
  "selectors.empty.noSelectors": "No class or id selectors in this project\u2019s stylesheets.",
  "selectors.empty.noUnused": "No unused styles. Every style is used, locked, or might be in use.",
  "selectors.fileCount": { one: "1 file", other: "{count} files" },
  "selectors.filter.all": "All",
  "selectors.filter.kept": "Locked",
  "selectors.filter.label": "Show selectors",
  "selectors.filter.unknown": "Can\u2019t tell",
  "selectors.filter.unused": "Unused",
  "selectors.folder.root": "Project root",
  "selectors.keepList.readError": "Could not read .stacki/styles.json: {error}",
  "selectors.lock.changeSheet": "Change stylesheet lock",
  "selectors.lock.tooMany": {
    one: "Unlocking {selector} would lock 1 other style in {where} one by one, past the {limit}-name limit of .stacki/styles.json. Unlock {where} instead.",
    other: "Unlocking {selector} would lock {count} other styles in {where} one by one, past the {limit}-name limit of .stacki/styles.json. Unlock {where} instead."
  },
  "selectors.lock.unlockStyle": "Unlock style",
  "selectors.more": "Show more",
  "selectors.notes": { one: "1 file not checked", other: "{count} files not checked" },
  "selectors.panelLabel": "style selectors",
  "selectors.problem.blockOpen": "A {tag} block is never closed",
  "selectors.problem.braceClose": "Its template has a }} with no matching {{",
  "selectors.problem.braceOpen": "Its template has a {{ that is never closed",
  "selectors.problem.bytesBudget": "There is more than {size} MB to check",
  "selectors.problem.commentOpen": "An HTML comment is never closed",
  "selectors.problem.cssUnreadable": "CSS could not be read: {detail}",
  "selectors.problem.fileCount": "The project has more than {count} files to check",
  "selectors.problem.fileLarge": "{name} is larger than {size} MB",
  "selectors.problem.nesting": "Folder nesting exceeds the limit",
  "selectors.problem.ruleNoPosition": "CSS rule has no source position",
  "selectors.problem.selectorUnreadable": "Selector \u201C{selector}\u201D could not be read",
  "selectors.problem.styleLang": "A {tag} block is not plain CSS",
  "selectors.problem.styleMoved": "A {tag} block was not where the parser placed it",
  "selectors.problem.styleNoClosing": "A {tag} block has no closing tag where the parser placed it",
  "selectors.problem.styleNoPosition": "A {tag} block has no source position",
  "selectors.problem.tagOpen": "A tag is never closed with >",
  "selectors.problem.tooManySelectors": "The project has too many selectors",
  "selectors.problem.tooManyToCheck": "Too many selectors to check",
  "selectors.reason.computedClasses": "{to} computes classes from data {from} loads from outside the project",
  "selectors.reason.injectedHtml": "{to} inserts HTML that {from} can supply from outside the project",
  "selectors.reason.packageFile": "An installed package file could not be read: {detail}",
  "selectors.reason.packagesDeep": "Installed packages are nested too deeply to check",
  "selectors.reason.packagesMany": "Installed packages hold more than {count} files to check",
  "selectors.reason.packagesMissing": "Dependencies are not installed, so packages could not be checked",
  "selectors.reason.packagesUnreadable": "Installed packages could not be read: {detail}",
  "selectors.reason.selectorComment": "Its selector contains a comment",
  "selectors.reason.unreadable": "{file} could not be read",
  "selectors.reason.unreadableAndPackageFile": "{file} could not be read; and an installed package file could not be read: {detail}",
  "selectors.reason.unreadableAndPackagesDeep": "{file} could not be read; and installed packages are nested too deeply to check",
  "selectors.reason.unreadableAndPackagesMany": "{file} could not be read; and installed packages hold more than {count} files to check",
  "selectors.reason.unreadableAndPackagesMissing": "{file} could not be read; and dependencies are not installed, so packages could not be checked",
  "selectors.reason.unreadableAndPackagesUnreadable": "{file} could not be read; and installed packages could not be read: {detail}",
  "selectors.row.lock": "Lock {names} so clean-ups keep it",
  "selectors.row.remove": "Remove {selector}",
  "selectors.row.unlock": "Unlock {names}",
  "selectors.search.label": "Search styles",
  "selectors.search.placeholder": "Search",
  "selectors.sheet.lock": "Lock {name} from cleanup",
  "selectors.sheet.lockedWith": "Locked with {name}",
  "selectors.sheet.unlock": "Unlock {name}",
  "selectors.sheet.unlockTip": "Unlock",
  "selectors.title": "Style selectors"
};

// vendor/stacki/shared/properties/i18n/messages/en/settings.ts
var messages29 = {
  "settings.audits.rules.px": "px outside variables",
  "settings.audits.phrases.info": "A single word must be the whole text to count; several words may be part of it.",
  "settings.breakpoints.add": "Add breakpoint",
  "settings.breakpoints.addConfirm": "Add",
  "settings.breakpoints.canvas": "{width}px canvas",
  "settings.breakpoints.defaultName.down0": "Small",
  "settings.breakpoints.defaultName.down1": "Smaller",
  "settings.breakpoints.defaultName.down2": "Tiny",
  "settings.breakpoints.defaultName.up0": "Large",
  "settings.breakpoints.defaultName.up1": "Extra large",
  "settings.breakpoints.defaultName.up2": "Ultra",
  "settings.breakpoints.desktop": "Desktop",
  "settings.breakpoints.desktopNote": "Desktop width on the canvas and side by side, scaled to fit. Never used as a media query.",
  "settings.breakpoints.error.desktopFlips": "{name} ({limit}) would end up on the other side of Desktop.",
  "settings.breakpoints.error.file": "The breakpoints file could not be used, so the defaults are shown and the file is left as it is. {message}",
  "settings.breakpoints.error.name": "A name is 1 to {maximum} characters, and each one is different.",
  "settings.breakpoints.error.order": "{row} must be smaller than {above} ({limit}).",
  "settings.breakpoints.error.orderBelow": "{row} must be larger than {below} ({limit}).",
  "settings.breakpoints.error.pxWhole": "px widths are whole numbers. Use rem for decimals, such as 62.5rem.",
  "settings.breakpoints.error.range": "Use a width from {minimum} to {maximum}, in px or rem.",
  "settings.breakpoints.error.same": "{other} already uses {value}.",
  "settings.breakpoints.error.sameAsDesktop": "It must differ from Desktop ({value}).",
  "settings.breakpoints.error.save": "Could not save the breakpoints: {message}",
  "settings.breakpoints.error.syntax": "Type a width like 64rem, 62.5rem or 1024px. A bare number is px.",
  "settings.breakpoints.explain": "A number wider than Desktop is a width >= value query; a narrower one is width < value. The preview jumps to the width it starts at: 64rem is 1023px, 100rem is 1600px (1rem is 16px). Type rem or px, a bare number is px, and the numbers must go down the list. Desktop is only the frame width in the side-by-side view.",
  "settings.breakpoints.frame": "{width}px frame",
  "settings.breakpoints.full": "You can have up to {count} breakpoints.",
  "settings.breakpoints.intro": "Saved in .stacki/breakpoints.json, so Stacki Desktop and Studio share them.",
  "settings.breakpoints.laptop": "Laptop",
  "settings.breakpoints.nameLabel": "Name of {device}",
  "settings.breakpoints.phone": "Phone",
  "settings.breakpoints.query": "Matches {condition}",
  "settings.breakpoints.remove": "Remove {name}",
  "settings.breakpoints.removeBody": {
    one: "{count} media query was synced with this breakpoint. It stays as it is.",
    other: "{count} media queries were synced with this breakpoint. They stay as they are."
  },
  "settings.breakpoints.removeConfirm": "Remove",
  "settings.breakpoints.removeNote": "Removing a breakpoint does not change your CSS.",
  "settings.breakpoints.removeTitle": "Remove {name}?",
  "settings.breakpoints.side.down": "narrower than Desktop",
  "settings.breakpoints.side.up": "wider than Desktop",
  "settings.breakpoints.sync.all": "All",
  "settings.breakpoints.sync.apply": { one: "Update {count} place", other: "Update {count} places" },
  "settings.breakpoints.sync.checkFile": "Update places in {file}",
  "settings.breakpoints.sync.checkPlace": "Update line {line}",
  "settings.breakpoints.sync.done": { one: "Updated {count} place.", other: "Updated {count} places." },
  "settings.breakpoints.sync.exclusive": "Exclusive form",
  "settings.breakpoints.sync.failed": "Could not update the files: {message}",
  "settings.breakpoints.sync.inclusive": "Inclusive 1px form",
  "settings.breakpoints.sync.kind.component": "Component",
  "settings.breakpoints.sync.kind.css": "CSS file",
  "settings.breakpoints.sync.kind.page": "Page",
  "settings.breakpoints.sync.kind.style": "Style tag",
  "settings.breakpoints.sync.line": "Line {line}",
  "settings.breakpoints.sync.none": "None",
  "settings.breakpoints.sync.notSynced": "Not synced",
  "settings.breakpoints.sync.open": "Show places in {file}",
  "settings.breakpoints.sync.recordProblem": "The sync record could not be used, so nothing is remembered. {message}",
  "settings.breakpoints.sync.scanning": "Looking for media queries\u2026",
  "settings.breakpoints.sync.skip": "Just save the number",
  "settings.breakpoints.sync.skippedFiles": {
    one: "{count} file changed since the scan and was left alone.",
    other: "{count} files changed since the scan and were left alone."
  },
  "settings.breakpoints.sync.skippedLarge": "Large files were not read.",
  "settings.breakpoints.sync.title": { one: "Update {count} media query?", other: "Update {count} media queries?" },
  "settings.breakpoints.sync.truncated": "The project is large, so some files were not read.",
  "settings.breakpoints.sync.undoLabel": "Sync breakpoint queries",
  "settings.breakpoints.tablet": "Tablet",
  "settings.breakpoints.undoLabel": "Edit breakpoints",
  "settings.breakpoints.usage.expand": "Show where {name} is used",
  "settings.breakpoints.usage.files": { one: "{count} file", other: "{count} files" },
  "settings.breakpoints.usage.inFiles": { one: "in {count} file", other: "in {count} files" },
  "settings.breakpoints.usage.none": "Not used in any media query",
  "settings.breakpoints.usage.open": "Open {file}",
  "settings.breakpoints.usage.places": { one: "Used in {count} place", other: "Used in {count} places" },
  "settings.breakpoints.usage.problem": "Could not look for where this is used. {message}",
  "settings.breakpoints.usage.willPlaces": { one: "Will update {count} place", other: "Will update {count} places" },
  "settings.breakpoints.widthLabel": "{device} width in pixels",
  "settings.close": "Close settings",
  "settings.cms.empty": "No CMS connected yet.",
  "settings.cms.payload.liveIn": "Edits apply live in: {names}",
  "settings.cms.payload.status.failed": "Not connected",
  "settings.cms.payload.address": "Payload address",
  "settings.cms.payload.addressHint": "The CMS server\u2019s own address, not the website\u2019s and not /admin.",
  "settings.cms.payload.apiKey": "API key",
  "settings.cms.payload.authCollection": "Auth collection",
  "settings.cms.payload.collections": "Collections (optional)",
  "settings.cms.payload.collectionsHint": "Slugs separated by commas. Leave empty to detect them.",
  "settings.cms.payload.connect": "Connect Payload",
  "settings.cms.payload.detect": "Detect",
  "settings.cms.payload.detected": { one: "{count} collection found", other: "{count} collections found" },
  "settings.cms.payload.detecting": "Detecting\u2026",
  "settings.cms.payload.disconnect": "Disconnect",
  "settings.cms.payload.email": "Email",
  "settings.cms.payload.error.badAddress": "No Payload API at {address}. Use the CMS server\u2019s own address (not the website or /admin), and the collection that holds the account (usually \u201Cusers\u201D).",
  "settings.cms.payload.error.certificate": "{address} uses a certificate this computer does not trust ({code}). Use a trusted https address.",
  "settings.cms.payload.error.cutOff": "The connection to {address} was cut off. Try again.",
  "settings.cms.payload.error.forbidden": "This Payload account is not allowed to do that. Check its access rules.",
  "settings.cms.payload.error.invalid": "Payload rejected this: {detail}",
  "settings.cms.payload.error.locked": "Too many attempts; try again in about 10 minutes.",
  "settings.cms.payload.error.login": "Payload did not accept that email and password.",
  "settings.cms.payload.error.loginPaused": "Stacki is not trying to sign in again yet, so the account is not locked. Check the email and password, then try again in a minute.",
  "settings.cms.payload.error.malformed": "{address} answered, but not like Payload. Use the CMS server\u2019s address, not the website\u2019s.",
  "settings.cms.payload.error.network": "Can\u2019t reach the CMS. Check your internet connection and try again.",
  "settings.cms.payload.error.noUser": "Payload did not accept this key. Check the key, that \u201CEnable API key\u201D is on for that user, and that \u201C{collection}\u201D is the collection it belongs to.",
  "settings.cms.payload.error.notFound": "Payload has no such document or collection.",
  "settings.cms.payload.error.rateLimited": "Payload says there are too many requests. Wait a moment and try again.",
  "settings.cms.payload.error.redirect": "Payload moved: {address} redirects to {location}. Use that address instead.",
  "settings.cms.payload.error.refused": "Nothing is answering at {address}. Is the CMS running, and is the port right?",
  "settings.cms.payload.error.server": "Payload answered with a server error ({status}). Check the CMS server and try again.",
  "settings.cms.payload.error.timeout": "The CMS took too long to answer. Check your connection and try again.",
  "settings.cms.payload.error.tooLarge": "That is larger than Payload or Stacki accepts ({limit}).",
  "settings.cms.payload.error.tooLargeReply": "Payload\u2019s reply is larger than Stacki reads.",
  "settings.cms.payload.error.unauthorized": "Payload refused this key or login. Check it, and that the account may edit this content.",
  "settings.cms.payload.error.unresolved": "Can\u2019t find {address}. Check the address and your internet connection.",
  "settings.cms.payload.error.wrongProtocol": "{address} does not speak https. Use http for a local server, or fix its address.",
  "settings.cms.payload.hint.apiKey": "Turn on \u201CuseAPIKey\u201D on the auth collection and \u201CEnable API key\u201D for the user. Collections with drafts are edited as drafts; collections without drafts change live content.",
  "settings.cms.payload.hint.password": "Stacki signs in once and keeps the session in memory only. Prefer an API key: five wrong passwords lock the account for ten minutes.",
  "settings.cms.payload.liveNotice": "This collection keeps no drafts: edits are saved live.",
  "settings.cms.payload.mode": "Sign in with",
  "settings.cms.payload.mode.apiKey": "API key",
  "settings.cms.payload.mode.password": "Email and password",
  "settings.cms.payload.name": "Name",
  "settings.cms.payload.noSecrets": "Stacki could not read this connection\u2019s key. Reconnect it in Settings.",
  "settings.cms.payload.password": "Password",
  "settings.cms.payload.save": "Save connection",
  "settings.cms.payload.saving": "Saving\u2026",
  "settings.cms.payload.snippet.info": "Add these to your site\u2019s .env, then fetch the content in an Astro page.",
  "settings.cms.payload.snippet.title": "Use it in your site",
  "settings.cms.payload.status.apiKey": "API key valid",
  "settings.cms.payload.status.checked": "Checked {time}",
  "settings.cms.payload.status.connectedAs": "Connected as {user}",
  "settings.cms.payload.status.unchecked": "Not checked yet",
  "settings.cms.payload.test": "Test connection",
  "settings.cms.payload.testing": "Testing\u2026",
  "settings.editor.ai.askBeforeTrust.info": "Off: opening AI chat in a project lets Claude and Codex work there, remembered. Agents also run the project\u2019s hooks and .mcp.json servers.",
  "settings.editor.ai.askBeforeTrust.label": "Ask before allowing agents in a new project",
  "settings.editor.ai.reviewChanges.info": "Off: AI edits apply at once and show \u201CApplied\u201D, with Undo. On: each changed file waits for Keep or Undo.",
  "settings.editor.ai.reviewChanges.label": "Ask me to keep AI changes",
  "settings.editor.ai.trackChanges.info": "Saves a hidden snapshot before and after each AI turn to show changes. Adds no commits to your history. Off is faster on big projects.",
  "settings.editor.ai.trackChanges.label": "Snapshot before & after each AI change",
  "settings.editor.loading": "Loading preferences\u2026",
  "settings.editor.preferences": "App preferences",
  "settings.editor.privacy.hideDetails.info": "Apps see only a per-project ID, not your Git name, email or GitHub account.",
  "settings.editor.privacy.hideDetails.label": "Hide my details from apps",
  "settings.editor.privacy.usageCounts.info": "One count on days you open a project. No names, file contents, device ID or history. Kept up to 366 days.",
  "settings.editor.privacy.usageCounts.label": "Anonymous usage counts",
  "settings.editor.saveFailed": "Applied for this session, but could not save. Check disk space and try again.",
  "settings.editor.section.ai": "AI",
  "settings.editor.section.general": "General",
  "settings.editor.section.privacy": "Privacy",
  "settings.editor.sound.label": "Interface sounds",
  "settings.empty.audits": "Open a project to configure its audits.",
  "settings.empty.breakpoints": "Open a project to set its breakpoints.",
  "settings.empty.cms": "Open a project to connect a CMS.",
  "settings.empty.folders": "Open a project to choose its folders.",
  "settings.empty.instructions": "Open a project to choose what the Instructions panel hides.",
  "settings.empty.roles": "Open a project to set its roles.",
  "settings.empty.styles": "Open a project to set where its new styles go.",
  "settings.empty.studio": "Open a project to add Stacki Studio.",
  "settings.folders.cms.info": "Collections and data files the CMS panel lists.",
  "settings.folders.collections.info": "Read from Astro\u2019s content config.",
  "settings.folders.picker.info": "Switched off, a source leaves the data picker only. The CMS panel still lists it.",
  "settings.info.label": "More information",
  "settings.instructions.hidden.duplicate": "{pattern} is already hidden.",
  "settings.instructions.hidden.empty.hint": "Hide folders or files from Instructions.",
  "settings.instructions.hidden.empty.title": "Nothing hidden",
  "settings.instructions.hidden.hide": "Hide",
  "settings.instructions.hidden.info": "Paths start at the project root: docs/archive hides a folder, **/CHANGELOG.md every changelog. Build output and node_modules are always hidden. Shared via .stacki/instructions.json.",
  "settings.instructions.hidden.input": "Path or pattern to hide",
  "settings.instructions.hidden.placeholder": "Path or glob, e.g. docs/archive",
  "settings.instructions.hidden.show": "Show {pattern} again",
  "settings.instructions.hidden.show.title": "Show again",
  "settings.instructions.hidden.title": "Hidden paths",
  "settings.language.info": "Language of menus and labels.",
  "settings.language.label": "Language",
  "settings.language.system": "System default",
  "settings.retry": "Retry",
  "settings.roles.apps.all": "All permissions",
  "settings.roles.apps.allOf": "All {app} permissions",
  "settings.roles.apps.canUse": "{role} can use {app}",
  "settings.roles.apps.everyAppOn": "Every app is on",
  "settings.roles.apps.group": "{app} permissions",
  "settings.roles.card.label": "{name} role",
  "settings.roles.defaultRole.aria": "Role for people in no role",
  "settings.roles.defaultRole.info": "The role Studio gives anyone who is in no role.",
  "settings.roles.defaultRole.label": "People in no role",
  "settings.roles.delete.confirm": "Delete role",
  "settings.roles.delete.title": "Delete {name}?",
  "settings.roles.duplicate.label": "Duplicate {name}",
  "settings.roles.duplicate.tip": "Duplicate {name} as a new role, without its members",
  "settings.roles.fileUnreadable": "The roles file could not be read: {message}. Your next change replaces it.",
  "settings.roles.members.add.button": "Add",
  "settings.roles.members.add.label": "Add a GitHub username to {name}",
  "settings.roles.members.add.placeholder": "Add GitHub username",
  "settings.roles.members.count": { one: "{count} member", other: "{count} members" },
  "settings.roles.members.info": "Members are GitHub usernames. Admin always has full access.",
  "settings.roles.members.list": "{name} members",
  "settings.roles.members.noMatches": "No matches",
  "settings.roles.members.none": "No members yet",
  "settings.roles.members.remove": "Remove {member}",
  "settings.roles.members.removeTip": "Remove",
  "settings.roles.members.suggestions": "GitHub users matching {query}",
  "settings.roles.members.unavailable": "Can't search GitHub right now",
  "settings.roles.members.you": "You",
  "settings.roles.menu.delete": "Delete",
  "settings.roles.menu.label": "More actions for {name}",
  "settings.roles.menu.rename": "Rename",
  "settings.roles.name.label": "Role name",
  "settings.roles.name.rename": "Rename {name}",
  "settings.roles.newRole.add": "Add role",
  "settings.roles.newRole.label": "New role name",
  "settings.roles.notSaved": "Not saved: {message}",
  "settings.roles.components.copy": "Copy from role",
  "settings.roles.components.count": "{visible} of {total} visible",
  "settings.roles.components.expand": "Open or close {name}",
  "settings.roles.components.folderCount": "{visible} of {total}",
  "settings.roles.components.hiddenBy": "hidden by folder {folder}",
  "settings.roles.components.hiddenOwn": "hidden",
  "settings.roles.components.hide": "Hide {name}",
  "settings.roles.components.info": "This role can\u2019t add hidden components from the palette or the Components panel. Ones already on a page stay editable. New components are visible to every role.",
  "settings.roles.components.missing": "Rules for paths that no longer exist",
  "settings.roles.components.noMatch": "No components match.",
  "settings.roles.components.none": "This project has no components yet.",
  "settings.roles.components.removeRule": "Remove the rule for {path}",
  "settings.roles.components.search": "Search components",
  "settings.roles.components.show": "Show {name}",
  "settings.roles.components.shownBy": "shown by folder {folder}",
  "settings.roles.components.shownOwn": "shown despite its folder",
  "settings.roles.components.title": "Components",
  "settings.roles.detail.back": "Back to roles",
  "settings.roles.detail.label": "{section} \xB7 {name}",
  "settings.roles.detail.noMatch": "Nothing matches \u201C{query}\u201D",
  "settings.roles.detail.search.members": "Search members",
  "settings.roles.detail.search.pins": "Search apps",
  "settings.roles.detail.search.permissions": "Search permissions",
  "settings.roles.summary.ofTotal": "{count} of {total}",
  "settings.roles.members.title": "Members",
  "settings.roles.components.showAll": "Show all",
  "settings.roles.components.hideAll": "Hide all",
  "settings.roles.summary.open": "Open {section} for {name}",
  "settings.roles.invite.passkeyNote": "Passkey invites are created in Studio",
  "settings.roles.invite.email.label": "Add an email address to {name}",
  "settings.roles.invite.email.placeholder": "Add email address",
  "settings.roles.permissions.all": "All",
  "settings.roles.permissions.allLabel": "All {group}",
  "settings.roles.permissions.count": "On {granted} of {total}",
  "settings.roles.permissions.everyApp": "Every app",
  "settings.roles.permissions.title": "Permissions",
  "settings.roles.pins.add": "Add app",
  "settings.roles.pins.addLabel": "Pin an app to the sidebar for {name}",
  "settings.roles.pins.alsoGives": "Also gives {name} access",
  "settings.roles.pins.drag": "Drag to reorder {app}",
  "settings.roles.pins.full": "At most {max} pinned apps",
  "settings.roles.pins.group": "{name} apps pinned to the sidebar",
  "settings.roles.pins.ignored.noAccess": "No access",
  "settings.roles.pins.ignored.notInstalled": "Not installed",
  "settings.roles.pins.list": "{name} pinned apps, in sidebar order",
  "settings.roles.pins.noneInstalled": "No apps installed",
  "settings.roles.pins.rowIgnored": "{app}, {reason}",
  "settings.roles.pins.title": "Sidebar apps",
  "settings.roles.pins.unpin": "Unpin {app}",
  "settings.roles.screen.label": "Project roles",
  "settings.roles.section.access": "Access",
  "settings.roles.section.roles": "Roles",
  "settings.roles.signedOut": "Signed out: you are admin here.",
  "settings.roles.viewAs.info": "Preview Stacki as another role. Only this window changes.",
  "settings.roles.viewAs.label": "View as",
  "settings.saved": "Saved",
  "settings.saving": "Saving\u2026",
  "settings.newStyles.component.info": "Where new styles go in a component: a project CSS file or a style tag. Rules go in the last @layer or @media block, or at /* stacki:rules */.",
  "settings.newStyles.component.title": "Styles created in a component",
  "settings.newStyles.createTag": "Create a style tag",
  "settings.newStyles.location.label": "New styles go in",
  "settings.newStyles.missing": "{path} was not found. New styles use a style tag until you pick another file.",
  "settings.newStyles.missingHint": "Not found",
  "settings.newStyles.page.info": "Where new styles go in a page: a project CSS file or a style tag. Rules go in the last @layer or @media block, or at /* stacki:rules */.",
  "settings.newStyles.page.title": "Styles created in a page",
  "settings.secrets.empty.noFileBody": "No {file} file yet. Adding a secret creates it.",
  "settings.secrets.error.tooLarge": "The {file} file is too large to edit here.",
  "settings.secrets.error.notText": "Not valid UTF-8, so Stacki leaves {file} alone.",
  "settings.secrets.error.denied": "Cannot read {file}. Check its permissions.",
  "settings.secrets.unavailable": "Restart Stacki to use secrets.",
  "settings.secrets.add": "Add secret",
  "settings.secrets.cancel": "Cancel",
  "settings.secrets.delete.action": "Delete {name}",
  "settings.secrets.delete.body": "Removes the line from {file}. This cannot be undone.",
  "settings.secrets.delete.confirm": "Delete",
  "settings.secrets.delete.title": "Delete {name}?",
  "settings.secrets.duplicate": "Set twice in {file}. The last one wins.",
  "settings.secrets.edit.action": "Edit {name}",
  "settings.secrets.empty.body": "{file} is empty.",
  "settings.secrets.empty.title": "No secrets yet",
  "settings.secrets.error.changed": "{file} changed on disk. Reload to see it.",
  "settings.secrets.error.filesystem": "The {file} file could not be saved.",
  "settings.secrets.error.invalidName": "Use letters, numbers and underscores, and do not start with a number.",
  "settings.secrets.error.invalidValue": "This value cannot be saved.",
  "settings.secrets.error.limit": "The {file} file is full. Remove a secret first.",
  "settings.secrets.error.nameEmpty": "Enter a name.",
  "settings.secrets.error.nameTaken": "A secret with this name already exists.",
  "settings.secrets.error.nameTooLong": "Names can be up to {max} characters.",
  "settings.secrets.error.notFound": "That secret is no longer in the file. Reload to see the latest.",
  "settings.secrets.error.readOnly": "Several lines. Edit it in {file}.",
  "settings.secrets.error.unreadable": "The {file} file could not be read.",
  "settings.secrets.error.valueTooLong": "Values can be up to {max} KB.",
  "settings.secrets.file": "Env file",
  "settings.secrets.hide.action": "Hide {name}",
  "settings.secrets.hideAll": "Hide all",
  "settings.secrets.ignore.action": "Add to .gitignore",
  "settings.secrets.ignore.body": "Adds one line, {file}, to .gitignore.",
  "settings.secrets.ignore.confirm": "Add line",
  "settings.secrets.ignore.title": "Add {file} to .gitignore?",
  "settings.secrets.ignore.warning": "{file} is not in .gitignore: secrets could be committed",
  "settings.secrets.info": "Values stay hidden until you reveal them.",
  "settings.secrets.invalidLines": "{count} unreadable {file} lines are kept as written.",
  "settings.secrets.multiline": "Several lines. Edit it in {file}.",
  "settings.secrets.name": "Name",
  "settings.secrets.overridden": "Dev uses the value in {file}",
  "settings.secrets.reload": "Reload",
  "settings.secrets.reveal.action": "Reveal {name}",
  "settings.secrets.revealAll": "Reveal all",
  "settings.secrets.save": "Save",
  "settings.secrets.title": "Secrets",
  "settings.secrets.tracked.warning": "{file} is committed to Git",
  "settings.secrets.value": "Value",
  "settings.secrets.valueHidden": "Hidden value",
  "settings.back": "Back to settings",
  "settings.collapseAll": "Collapse all",
  "settings.expandAll": "Expand all",
  "settings.options": "Settings options",
  "settings.refresh": "Refresh",
  "settings.instructions.search.noMatch": "No instructions match",
  "settings.instructions.search.placeholder": "Search instructions",
  "settings.section.mcp": "MCP",
  "settings.section.instructions": "Instructions",
  "settings.section.secrets": "Secrets",
  "settings.sections": "Settings sections",
  "settings.studio.info": "Browser editing and collaboration for this project. Setup installs Studio locally, then guides cloud deployment.",
  "settings.styleTags.error.save": "The style tag settings could not be saved. {message}",
  "settings.styleTags.invalid": "Invalid",
  "settings.tab.audits": "Audits",
  "settings.tab.breakpoints": "Breakpoints",
  "settings.tab.cms": "CMS connections",
  "settings.tab.editor": "Editor settings",
  "settings.tab.folders": "Folders",
  "settings.tab.instructions": "Instructions",
  "settings.tab.roles": "Roles",
  "settings.tab.styles": "New style locations",
  "settings.tab.studio": "Stacki Studio",
  "settings.title": "Settings",
  "settings.mcp.add.docs": "{name} setup guide",
  "settings.mcp.add.name": "Server name",
  "settings.mcp.add.option.projectRef": "Project reference (optional)",
  "settings.mcp.add.paste.placeholder": "Or paste a command, URL or npx line",
  "settings.mcp.add.option.url": "Your server URL",
  "settings.mcp.add.provider.label": "Add from a provider",
  "settings.mcp.add.provider.placeholder": "Provider",
  "settings.mcp.add.provider.search": "Search providers",
  "settings.mcp.add.secret": "Secret: {name}",
  "settings.mcp.add.secret.note": "Saved in .env, referenced by name.",
  "settings.mcp.add.secret.optional": "Optional",
  "settings.mcp.add.secret.placeholder": "Paste the value",
  "settings.mcp.add.secret.required": "A value is required.",
  "settings.mcp.add.secret.saved": "Already in .env.",
  "settings.mcp.add.submit": "Add",
  "settings.mcp.add.title": "Add a server",
  "settings.mcp.agent.claude": "Claude Code",
  "settings.mcp.cancel": "Cancel",
  "settings.mcp.codex.add.body": "Edits ~/.codex/config.toml, shared by all projects. Only this entry changes.",
  "settings.mcp.codex.add.confirm": "Add to Codex",
  "settings.mcp.codex.add.title": "Add {name} to Codex?",
  "settings.mcp.codex.addAction": "Add {name} to Codex",
  "settings.mcp.codex.missing": "Codex not found",
  "settings.mcp.codex.off": "Codex: off",
  "settings.mcp.codex.on": "Codex: on",
  "settings.mcp.codex.remove.body": "Edits ~/.codex/config.toml, shared by all projects. Removes only this entry.",
  "settings.mcp.codex.remove.confirm": "Remove from Codex",
  "settings.mcp.codex.remove.title": "Remove {name} from Codex?",
  "settings.mcp.codex.removeAction": "Remove {name} from Codex",
  "settings.mcp.codex.unreadable": "Codex settings unreadable",
  "settings.mcp.codex.unsupported": "Codex settings not editable here",
  "settings.mcp.codexOnly.add": "Add to project",
  "settings.mcp.codexOnly.body": "In your Codex settings, not in this project.",
  "settings.mcp.codexOnly.confirm.body": "Copies it into .mcp.json. Secret values move to .env.",
  "settings.mcp.codexOnly.confirm.title": "Add {name} to this project?",
  "settings.mcp.codexOnly.title": "Only in Codex",
  "settings.mcp.codexOnly.unreadable": "Cannot be shown here",
  "settings.mcp.connected.empty.body": "Add one below, or paste a command.",
  "settings.mcp.connected.empty.title": "No MCP servers yet",
  "settings.mcp.connected.title": "In this project",
  "settings.mcp.copied": "Copied. Secrets are hidden.",
  "settings.mcp.custom.hint": "Paste a command, URL or npx line. It is never run.",
  "settings.mcp.custom.label": "Paste a command",
  "settings.mcp.custom.leftLiteral": "Too long for .env, kept in .mcp.json: {names}.",
  "settings.mcp.custom.moves": "Saved to .env: {names}.",
  "settings.mcp.custom.name": "Name",
  "settings.mcp.custom.preview": "Will add {name} \xB7 {kind} \xB7 {target}",
  "settings.mcp.custom.scopeLocal": "Local scope: added to this project.",
  "settings.mcp.custom.scopeUser": "User scope: added to this project instead.",
  "settings.mcp.edit.addPair": "Add",
  "settings.mcp.edit.args": "Arguments (one per line)",
  "settings.mcp.edit.command": "Command",
  "settings.mcp.edit.env": "Environment variables",
  "settings.mcp.edit.headers": "Headers",
  "settings.mcp.edit.pairName": "Name",
  "settings.mcp.edit.pairValue": "Value",
  "settings.mcp.edit.removePair": "Remove {name}",
  "settings.mcp.edit.save": "Save",
  "settings.mcp.edit.transport": "Connection",
  "settings.mcp.edit.transport.http": "Remote (HTTP)",
  "settings.mcp.edit.transport.sse": "Remote (SSE)",
  "settings.mcp.edit.transport.stdio": "Runs a command",
  "settings.mcp.edit.url": "URL",
  "settings.mcp.error.changed": "The file changed on disk. Reload to see the latest.",
  "settings.mcp.error.codexUnavailable": "The Codex settings file is not available.",
  "settings.mcp.error.codexUnsupported": "The Codex settings file is written in a way Stacki will not edit.",
  "settings.mcp.error.copy": "Could not copy to the clipboard.",
  "settings.mcp.error.denied": "Stacki cannot read the file. Check permissions.",
  "settings.mcp.error.filesystem": "The file could not be saved.",
  "settings.mcp.error.invalid": "That configuration cannot be saved.",
  "settings.mcp.error.invalidName": "Use letters, numbers, dots, dashes and underscores, up to 64 characters.",
  "settings.mcp.error.limit": "The file is at its limit of 64 servers.",
  "settings.mcp.error.nameTaken": "A server with this name already exists.",
  "settings.mcp.error.notFound": "That server is no longer in the file. Reload to see the latest.",
  "settings.mcp.error.notText": "The file is not valid UTF-8 text, so Stacki will not touch it.",
  "settings.mcp.error.tooLarge": "The file is too large to edit here.",
  "settings.mcp.error.unmappable": "Codex cannot use this connection type or secret reference.",
  "settings.mcp.error.unreadable": "Cannot read the file. Fix it in the JSON view.",
  "settings.mcp.intro": "Stored in .mcp.json",
  "settings.mcp.info": "MCP servers give your AI tools extra abilities, like reading your CMS or your designs.",
  "settings.mcp.invalid.line": "This entry cannot be shown here",
  "settings.mcp.invalid.open": "Open the JSON view",
  "settings.mcp.issue.badNumber": "Not a valid number",
  "settings.mcp.issue.badServerName": "Server names use letters, numbers, dots, dashes and underscores, up to 64 characters",
  "settings.mcp.issue.badString": "Not a valid text value",
  "settings.mcp.issue.duplicateKey": "This name is used twice in the same object",
  "settings.mcp.issue.expectedColon": "Expected a colon after the name",
  "settings.mcp.issue.expectedKey": "Expected a name in quotes",
  "settings.mcp.issue.notObject": "The file must hold one object",
  "settings.mcp.issue.serversNotObject": "mcpServers must be an object",
  "settings.mcp.issue.tooDeep": "Nested too deeply",
  "settings.mcp.issue.tooLarge": "The file is too large",
  "settings.mcp.issue.tooManyServers": "More than 64 servers",
  "settings.mcp.issue.trailingComma": "Remove the comma before the closing bracket",
  "settings.mcp.issue.trailingContent": "Unexpected text after the end of the file",
  "settings.mcp.issue.unexpectedEnd": "The file ends too early",
  "settings.mcp.issue.unexpectedToken": "Unexpected character",
  "settings.mcp.issue.unterminatedString": "Text in quotes is not closed",
  "settings.mcp.json.conflict": "The file changed on disk.",
  "settings.mcp.json.discard.body": "Unsaved JSON edits will be lost.",
  "settings.mcp.json.discard.confirm": "Discard changes",
  "settings.mcp.json.discard.keep": "Keep editing",
  "settings.mcp.json.discard.title": "Discard your JSON changes?",
  "settings.mcp.json.empty": "No .mcp.json yet. Saving creates it.",
  "settings.mcp.json.issue": "Line {line}, column {column}: {message}",
  "settings.mcp.json.issuePath": "Line {line}, column {column} \xB7 {path}: {message}",
  "settings.mcp.json.label": "Contents of .mcp.json",
  "settings.mcp.json.reload": "Reload",
  "settings.mcp.json.revert": "Revert",
  "settings.mcp.json.save": "Save",
  "settings.mcp.kind.command": "Runs a command",
  "settings.mcp.kind.remote": "Remote server",
  "settings.mcp.kind.remoteSse": "Remote server (SSE)",
  "settings.mcp.menu.copy": "Copy config",
  "settings.mcp.menu.edit": "Edit",
  "settings.mcp.menu.label": "Options for {name}",
  "settings.mcp.menu.remove": "Remove",
  "settings.mcp.paste.badConfig": "That command does not describe a server Stacki can add.",
  "settings.mcp.paste.badJson": "The JSON in that command could not be read.",
  "settings.mcp.paste.badName": "The server name is not valid. Use letters, numbers, dots, dashes and underscores.",
  "settings.mcp.paste.badPair": "A variable or header in that command is not written as NAME=value or Name: value.",
  "settings.mcp.paste.badScope": "The scope must be local, project or user.",
  "settings.mcp.paste.badTransport": "The connection type must be stdio, http or sse.",
  "settings.mcp.paste.badUrl": "That address is not a valid http or https URL.",
  "settings.mcp.paste.conflicting": "The connection type does not match the address or command.",
  "settings.mcp.paste.empty": "Paste a command to see what it would add.",
  "settings.mcp.paste.missingName": "That command has no server name.",
  "settings.mcp.paste.missingTarget": "That command has no address or program to run.",
  "settings.mcp.paste.notMcpCommand": "Not an MCP command. Try claude mcp add, codex mcp add, a URL or npx.",
  "settings.mcp.paste.tooLong": "That is too long to read.",
  "settings.mcp.paste.tooMany": "That command has too many parts.",
  "settings.mcp.paste.unknownFlag": "Unknown option {detail}. Nothing was added.",
  "settings.mcp.paste.unsupportedFlag": "Option {detail} is not supported. Nothing was added.",
  "settings.mcp.paste.unsupportedSyntax": "Only one plain command is read, not {detail}.",
  "settings.mcp.paste.unterminatedQuote": "A quote in that command is never closed.",
  "settings.mcp.problem.badName": "This name is not valid",
  "settings.mcp.problem.badOption": "This value is not valid",
  "settings.mcp.problem.badPair": "This value must be text",
  "settings.mcp.problem.badSecretName": "This provider asks for a secret with an invalid name",
  "settings.mcp.problem.badUrl": "Enter a valid http or https address",
  "settings.mcp.problem.bothTargets": "A server cannot have both an address and a command",
  "settings.mcp.problem.controlCharacters": "Remove the line breaks and control characters",
  "settings.mcp.problem.duplicatePair": "This name is used twice",
  "settings.mcp.problem.expectedArray": "Expected a list",
  "settings.mcp.problem.expectedObject": "Expected an object",
  "settings.mcp.problem.expectedString": "Expected text",
  "settings.mcp.problem.missingOption": "Fill in the missing field",
  "settings.mcp.problem.missingTarget": "Enter an address or a command",
  "settings.mcp.problem.tooLong": "This is too long",
  "settings.mcp.problem.tooMany": "There are too many entries",
  "settings.mcp.problem.unknownTransport": "The connection type must be stdio, http or sse",
  "settings.mcp.reload": "Reload",
  "settings.mcp.remove.body": "Removes it from .mcp.json. A Codex entry stays until removed there.",
  "settings.mcp.remove.confirm": "Remove",
  "settings.mcp.remove.title": "Remove {name}?",
  "settings.mcp.secrets.needs": "Needs secrets missing from .env ({count})",
  "settings.mcp.secrets.uses": "Uses secrets from .env ({count})",
  "settings.mcp.status.configured": "Configured",
  "settings.mcp.status.invalid": "Needs attention",
  "settings.mcp.status.needsSecrets": "Needs secrets",
  "settings.mcp.summary.command": "Runs a command \xB7 {command}",
  "settings.mcp.summary.remote": "Remote server \xB7 {host}",
  "settings.mcp.summary.remoteSse": "Remote server (SSE) \xB7 {host}",
  "settings.mcp.title": "MCP servers",
  "settings.mcp.unavailable": "Restart Stacki to use MCP servers.",
  "settings.mcp.value.hide": "Hide {name}",
  "settings.mcp.value.show": "Show {name}",
  "settings.mcp.view.json": "JSON",
  "settings.mcp.view.label": "View",
  "settings.mcp.view.ui": "Servers",
  "settings.hosted.mcp.info": "MCP servers live in the project\u2019s .mcp.json, which agents on your computer read. Hosted Studio cannot show or edit them yet.",
  "settings.hosted.mcp.line": "Not available in hosted Studio yet. Use Stacki Desktop.",
  "settings.hosted.secrets.info": "Secrets live in the project\u2019s .env file, which is never committed, so hosted Studio cannot read or change them.",
  "settings.hosted.secrets.line": "Not available in hosted Studio. Use Stacki Desktop.",
  "settings.folders.loading": "Loading folders\u2026",
  "settings.folders.aria": "Project folders",
  "settings.folders.panels": "Panels",
  "settings.folders.unreadable": "The folder settings could not be read ({message}). Every panel uses its defaults; a change here replaces the file.",
  "settings.folders.kind.components": "Components",
  "settings.folders.kind.layouts": "Layouts",
  "settings.folders.kind.assets": "Assets",
  "settings.folders.kind.styles": "Styles",
  "settings.folders.kind.variables": "Variables",
  "settings.folders.restart": "Restart Stacki to edit folders.",
  "settings.folders.defaults": "Default folders.",
  "settings.folders.pages": "Pages",
  "settings.folders.pagesFollow": "Follows {srcDir} in astro.config.",
  "settings.folders.openAstroConfig": "Open astro.config",
  "settings.folders.rowLabel": "{label} folders",
  "settings.folders.add": "Add folder",
  "settings.folders.addTip": "A folder inside {roots}",
  "settings.folders.remove": "Remove {folder} from {label}",
  "settings.folders.none": "No folders: this panel lists nothing.",
  "settings.folders.cms.loading": "Loading CMS sources\u2026",
  "settings.folders.cms.collections": "CMS collections",
  "settings.folders.cms.collectionsNone": "The content config declares no collections.",
  "settings.folders.cms.showCollection": "Show {name} in the CMS panel",
  "settings.folders.cms.openConfig": "Open content config",
  "settings.folders.cms.dataFiles": "CMS data files",
  "settings.folders.cms.addFile": "Add file",
  "settings.folders.cms.addFileTip": "A .ts, .js, .json or .astro file under src/",
  "settings.folders.cms.removeFile": "Remove {file} from CMS data files",
  "settings.folders.cms.noFiles": "No data files: the CMS panel lists only collections.",
  "settings.folders.cms.picker": "Data picker",
  "settings.folders.cms.pickerAria": "Data picker sources",
  "settings.folders.cms.pickerNone": "No data files or collections to bind to.",
  "settings.folders.cms.showInPicker": "Show {name} in data picker",
  "settings.folders.problem.outside.components": "{folder} is outside src/, where components must live",
  "settings.folders.problem.outside.layouts": "{folder} is outside src/, where layouts must live",
  "settings.folders.problem.outside.assets": "{folder} is outside public/ and src/, where assets must live",
  "settings.folders.problem.outside.styles": "{folder} is outside src/ and public/ and styles/, where styles must live",
  "settings.folders.problem.outside.variables": "{folder} is outside src/ and public/ and styles/, where variables must live",
  "settings.folders.problem.insidePages": "{folder} is inside {pages}, where every file is a page",
  "settings.folders.problem.srcPages.components": "src holds the pages too; choose the folder components live in",
  "settings.folders.problem.srcPages.layouts": "src holds the pages too; choose the folder layouts live in",
  "settings.folders.problem.listed": "{item} is already in the list",
  "settings.folders.problem.covered": "{folder} is already covered by {other}",
  "settings.folders.problem.wouldCover": "{folder} would cover {other}; remove {other} first",
  "settings.folders.problem.foldersMax": { one: "At most {count} folder", other: "At most {count} folders" },
  "settings.folders.problem.cms.outside": "{file} is outside src/, where the CMS panel reads data",
  "settings.folders.problem.cms.notEditable": "{file} is not a file the CMS can edit: choose a .ts, .js, .json or .astro file",
  "settings.folders.problem.cms.astro": "{file} is an Astro file: the CMS includes the open one automatically",
  "settings.folders.problem.cms.filesMax": { one: "At most {count} file", other: "At most {count} files" },
  "settings.folders.path.notText": "A folder is a project-relative path",
  "settings.folders.path.empty": "A folder needs a path",
  "settings.folders.path.tooLong": "A folder path exceeds {max} characters",
  "settings.folders.path.absolute": "A folder is relative to the project, not absolute",
  "settings.folders.path.backslash": "A folder path uses / between folders",
  "settings.folders.path.drive": "A folder is relative to the project, not a drive",
  "settings.folders.path.tooDeep": "A folder is at most {max} levels deep",
  "settings.folders.path.emptyName": "A folder path has an empty folder name",
  "settings.folders.path.stepOut": "A folder path cannot step out with . or ..",
  "settings.folders.path.nameTooLong": "A folder name exceeds {max} characters",
  "settings.folders.path.hidden": "Hidden folders hold tools\u2019 settings, not project files",
  "settings.folders.path.badChars": "Folder name {name} uses characters a folder path cannot hold",
  "settings.folders.path.trailingSpace": "A folder name cannot end with a space",
  "settings.folders.path.reserved": "{name} holds installed or built files, not the project\u2019s own",
  "settings.audits.category.accessibility": "Accessibility",
  "settings.audits.category.seo": "SEO and launch",
  "settings.audits.category.content": "Placeholders",
  "settings.audits.category.tokens": "Design tokens",
  "settings.audits.category.performance": "Speed",
  "settings.audits.priority.high": "High",
  "settings.audits.priority.medium": "Medium",
  "settings.audits.priority.low": "Low",
  "settings.audits.priority.default": "Default ({priority})",
  "settings.audits.priority.title": "{name} priority",
  "settings.audits.summary": "{on} of {total} on",
  "settings.audits.all": "All",
  "settings.audits.allLabel": "All {title}",
  "settings.audits.phrases.title": "Phrases",
  "settings.audits.phrases.add": "Add a phrase",
  "settings.audits.rules.title": "Rules",
  "settings.audits.rules.colors": "Raw colours",
  "settings.audits.rules.colorsInfo": "Hex, rgb() and hsl() outside variables",
  "settings.audits.rules.pxLabel": "Flag px",
  "settings.audits.rules.remLabel": "Flag rem outside variables",
  "settings.audits.rules.remInfo": "rem belongs in variable definitions only",
  "settings.audits.properties.title": "Properties that need variables",
  "settings.audits.properties.add": "Add a property, or padding* for every padding",
  "settings.audits.allowed.title": "Raw values that are fine",
  "settings.audits.allowed.add": "Add a value, such as 1px",
  "settings.audits.chip.remove": "Remove {item}",
  "settings.roles.loading": "Loading roles\u2026",
  "settings.element.lockedAria": "Element editing status",
  "settings.element.currentlyEditing": "Currently editing",
  "settings.element.beingEdited": "This element is being edited",
  "settings.element.takeOver": "You can still select it and add elements inside. Take over to change its settings.",
  "settings.element.anotherEditor": "Another editor",
  "settings.element.notUsed": "Not used by this variant",
  "settings.element.resetTip": "Reset to default",
  "settings.element.resetLabel": "Reset {name}",
  "settings.element.expressionTip": "JavaScript expression",
  "settings.element.expressionLabel": "Expression {name}",
  "settings.element.true": "True",
  "settings.element.false": "False",
  "settings.element.default": "Default",
  "settings.element.defaultWith": "Default ({value})",
  "settings.element.notSet": "Not set",
  "settings.element.sound": "Sound effects",
  "settings.element.loopAddProp": "Add the List property in Code, then choose it here.",
  "settings.element.loopFailed": "This loop could not be changed. Edit it in Code.",
  "settings.element.loopDifferent": "This loop is written differently from how Stacki writes one. Change its list in Code.",
  "settings.element.attr.ambiguous": "This attribute is written more than once. Edit it in Code.",
  "settings.element.attr.code": "This attribute is code here. Edit it in Code.",
  "settings.element.attr.unsafe": "Cannot change this attribute safely: {reason}",
  "settings.element.usesExpression": "This value uses an expression. Switch to {{}} to edit its source.",
  "settings.element.renameLoop": "Rename loop bindings and their references together in Code."
};

// vendor/stacki/shared/properties/i18n/messages/en/shell.ts
var messages30 = {
  "shell.ai.beforeAgent": "Before the agent",
  "shell.ai.openTerminal": "Open the terminal and run {command} to sign in.",
  "shell.ai.ownWindow": "The AI chat is in its own window.",
  "shell.ai.yourFileNow": "Your file now",
  "shell.apps.tooLargeToUndo": "{label}: too large to undo",
  "shell.canvas.copyDetails": "Copy details",
  "shell.canvas.errorShown": "The page can\u2019t be shown: {message}",
  "shell.canvas.otherPage": "The canvas isn\u2019t showing {file} right now. It may be showing an error, a redirect or another page, so clicks select the page instead of elements in it.",
  "shell.canvas.outOfStep": "The canvas didn\u2019t catch up with your files in time, so that click didn\u2019t select anything. Reload the canvas to bring it back in step.",
  "shell.canvas.recovered": "Fixed: the page is back",
  "shell.canvas.reload": "Reload canvas",
  "shell.canvas.tooLarge": "This page is larger than the canvas can match to its files, so clicks on it can\u2019t select. Select elements in the Navigator instead.",
  "shell.canvas.unmarked": "The canvas rendered {file} without Stacki\u2019s markers, so clicks select the page instead of elements in it. Another plugin in the project may be loading .astro files before Stacki marks them. Reload the canvas, and use Copy details if it persists.",
  "shell.canvas.unreachable": "The canvas stopped answering, so that click didn\u2019t select anything. Reload the canvas to start it again.",
  "shell.canvasText.componentText": "Component text \xB7 this instance",
  "shell.canvasText.sharedContent": "Shared CMS content \xB7 changes other uses too",
  "shell.component.codeChanged": "The page\u2019s code changed while the component was being made. Try again.",
  "shell.component.created": "Created {rel}",
  "shell.component.createdStranded": "Created {rel} \u2014 it reads page data, so it will need props.",
  "shell.component.createdWithOne": "Created {rel} with {first}.",
  "shell.component.createdWithTwo": "Created {rel} with {first} and {second}.",
  "shell.component.createdWithThree": "Created {rel} with {first}, {second} and {third}.",
  "shell.component.deleteBody": "It has changed since it was created. Undo has restored the page either way.",
  "shell.component.deleteConfirm": "Delete file",
  "shell.component.deleteKeep": "Keep file",
  "shell.component.deleteTitle": "Delete {rel}?",
  "shell.component.movedValues": { one: "{count} moved value", other: "{count} moved values" },
  "shell.component.movedStyles": { one: "the styles of {count} class", other: "the styles of {count} classes" },
  "shell.component.stylesChanged": "The page\u2019s styles changed meanwhile, so the component was not created. Try again.",
  "shell.component.sheetsChanged": "Stopped, because {files} changed in the meantime. Nothing was changed.",
  "shell.component.movingStyles": "Moving styles into the component\u2026",
  "shell.component.movedStylesUnverified": "Couldn\u2019t confirm the styles in {rel}, so nothing was moved.",
  "shell.component.sheetsNotCleaned": "The page isn\u2019t saved yet, so the moved styles are still in {files} as well. Nothing is lost.",
  "shell.styleMove.title": "A style move was interrupted",
  "shell.styleMove.interrupted": "Creating the {name} component stopped part way. No style was lost.",
  "shell.styleMove.changed": "Creating the {name} component stopped part way, and some of its files changed since, so Stacki can\u2019t finish or undo it exactly. Nothing will be overwritten.",
  "shell.styleMove.files": "See the files",
  "shell.styleMove.left": "Not done yet:",
  "shell.styleMove.done": "Done:",
  "shell.styleMove.edited": "Changed since:",
  "shell.styleMove.finish": "Finish the move",
  "shell.styleMove.finishHint": "The styles end up only in the component, as you asked.",
  "shell.styleMove.undo": "Undo the move",
  "shell.styleMove.undoHint": "Every file goes back exactly as it was before.",
  "shell.styleMove.dismiss": "Dismiss",
  "shell.styleMove.dismissHint": "Forget this move. Your files stay as they are.",
  "shell.styleMove.later": "Ask me later",
  "shell.styleMove.finished": "The move of {name} is finished.",
  "shell.styleMove.undone": "The move of {name} is undone.",
  "shell.component.propCount": { one: "{count} prop", other: "{count} props" },
  "shell.copy.done": "Selection copied \u2014 paste it into your AI chat.",
  "shell.copy.failed": "Couldn\u2019t copy the selection: {message}",
  "shell.copy.nothing": "Nothing selected to copy.",
  "shell.create.layout": "A layout is already a component of its own.",
  "shell.create.openPage": "Open a page to make components from it.",
  "shell.create.pseudo": "::{pseudo} is drawn by CSS. Select its element to make a component.",
  "shell.create.selectAround": "Select the element around this, not the text itself.",
  "shell.create.selectElement": "Select an element on the canvas first.",
  "shell.defaults.openFailed": "Could not open the defaults canvas.",
  "shell.defaults.pageName": "{name} defaults",
  "shell.defaults.returnFailed": "Could not return to the previous page. Your defaults canvas is still open.",
  "shell.defaults.returnFirst": "Return to the defaults canvas before saving.",
  "shell.defaults.selectComponent": "Select a component in an open page.",
  "shell.duplicate.chunkSections": "Chunk sections are defined in the page frontmatter and cannot be duplicated here.",
  "shell.dynamicPicker.loadFailed": "Could not load dynamic page paths: {error}",
  "shell.dynamicPicker.noPaths": "No paths",
  "shell.dynamicPicker.noPathsTitle": "{pattern} has no paths to preview \u2014 getStaticPaths returned nothing.",
  "shell.dynamicPicker.search": "Search entries\u2026",
  "shell.dynamicPicker.title": "Which entry the canvas is showing",
  "shell.flush.conflictNamed": "{name} has unsaved edits that conflict with a change on disk. Reload it or review it in code first.",
  "shell.flush.conflictPage": "This page has unsaved edits that conflict with a change on disk. Reload it or review it in code first.",
  "shell.history.codeUpdateFailed": "Couldn\u2019t update code: {message}",
  "shell.history.filesFailed": "The page was restored, but its component file was not: {message}",
  "shell.history.inlineStylesIn": "inline styles in {name}",
  "shell.history.propertyChange": "the property change",
  "shell.history.redid": "Redid {label}",
  "shell.history.redoFailed": "Couldn\u2019t redo: {message}",
  "shell.history.redoFailedNamed": "Couldn\u2019t redo {label}: {message}",
  "shell.history.showVersionFailed": "Couldn\u2019t show your version: {message}",
  "shell.history.stylesIn": "styles in {name}",
  "shell.history.tooManyEdits": "Too many edits are waiting to be saved \u2014 try again in a moment.",
  "shell.history.undid": "Undid {label}",
  "shell.history.undoFailed": "Couldn\u2019t undo: {message}",
  "shell.history.undoFailedNamed": "Couldn\u2019t undo {label}: {message}",
  "shell.history.unsavedRedo": "Couldn\u2019t redo: this page has edits that are not saved yet.",
  "shell.history.unsavedUndo": "Couldn\u2019t undo: this page has edits that are not saved yet.",
  "shell.history.waitForSave": "Wait for the current code change to finish saving, then try again.",
  "shell.instructions.body": "Body",
  "shell.instructions.yamlHelp": "YAML that is not a flat list of fields, edited as written.",
  "shell.loop.gone": "That loop is no longer on the page.",
  "shell.loop.removeUnreadable": "This loop\u2019s body has code that reads each item, so the loop cannot be removed here.",
  "shell.loop.notEditable": "This page can\u2019t be edited right now.",
  "shell.loop.openComponent": "Open the component first.",
  "shell.loop.propertyGone": "This component no longer has a {name} property.",
  "shell.loop.selectFirst": "Select the loop first.",
  "shell.navigation.editDefaults": "Edit this instance\u2019s props and children, then save its defaults.",
  "shell.navigation.islandComponent": "<{name}> is a {extension} component \u2014 edit it in code.",
  "shell.navigation.noComponentFile": "Can\u2019t find a file for <{name}>.",
  "shell.navigation.noPageMatches": "No page matches {route}",
  "shell.navigation.versionReady": "Getting that version ready\u2026",
  "shell.navigation.watchFailed": "Couldn\u2019t watch project files: {message}",
  "shell.navigation.watchFailedHint": "Couldn\u2019t watch project files. External edits may need a refresh.",
  "shell.navigator.panelName": "The Navigator",
  "shell.oldVersion.backToNow": "Back to now",
  "shell.oldVersion.banner": "You\u2019re looking at {subject} \u2014 how the site was {when}. This is a look, not a place to work.",
  "shell.oldVersion.frameTitle": "An earlier version of the site",
  "shell.pages.created": "Created {name}",
  "shell.pages.noLongerExists": "This page no longer exists.",
  "shell.pages.openProjectFirst": "Open a project first.",
  "shell.pages.openProjectToRename": "Open a project before renaming.",
  "shell.panel.resizeHint": "Drag to resize; use arrow keys when focused",
  "shell.panel.resizeLeft": "Resize left panel",
  "shell.panel.resizeRight": "Resize right panel",
  "shell.paste.bindingsRemoved": { one: "Removed {count} binding that referenced {names}.", other: "Removed {count} bindings that referenced {names}." },
  "shell.paste.brought": "Brought {names} across from the page it was copied from.",
  "shell.preview.backToNow": "Back to now ({shortcut})",
  "shell.preview.enter": "Preview ({shortcut})",
  "shell.preview.exit": "Exit preview ({shortcut})",
  "shell.preview.failedToStart": "Preview failed to start: {message}",
  "shell.preview.interactiveTitle": "Site preview (interactive)",
  "shell.preview.offline": "Preview offline",
  "shell.preview.reusing": "Reusing the dev server already running for this project ({url}) \u2014 canvas outlines need the app\u2019s own server, so stop that one to enable them.",
  "shell.preview.starting": "Starting Astro dev server\u2026",
  "shell.project.closeFailed": "Couldn\u2019t close the project: {message}",
  "shell.project.openFailed": "Couldn\u2019t open {name}: {message}",
  "shell.prop.astroOnly": "Only an Astro component takes properties.",
  "shell.publish.commitAndPush": "Commit and push",
  "shell.publish.commitBody": "Describe your changes before pushing them to GitHub.",
  "shell.publish.commitMessage": "Commit message",
  "shell.publish.commitPlaceholder": "Describe your changes",
  "shell.publish.commitTitle": "Commit changes",
  "shell.publish.preparing": "Preparing publish\u2026",
  "shell.refusal.classAdd": "Stacki couldn\u2019t add the class \u201C{name}\u201D. Check the class name and retry.",
  "shell.refusal.elementGone": "The element is gone",
  "shell.refusal.noElement": "No element is selected",
  "shell.refusal.notQueued": "The edit could not be queued",
  "shell.refusal.plainText": "Plain text has no tag to hold a class. Right-click it and use Convert to first.",
  "shell.rejection.anchorAmbiguous": "The file changed and several elements now match the one you edited.",
  "shell.rejection.anchorMoved": "The element you edited is no longer where it was.",
  "shell.rejection.couldntApply": "Stacki couldn\u2019t apply this edit. {reason}",
  "shell.rejection.invalidPlacement": "That change would put something where it cannot go and break the page, so nothing was written.",
  "shell.rejection.mergeConflict": "Your code edit overlaps another change to the file, so it was not merged.",
  "shell.rejection.regionExternallyModified": "That part of the file was changed outside Stacki.",
  "shell.rejection.resourceLimit": "The change exceeds a size limit.",
  "shell.rejection.sourceInvalid": "The page contains a syntax error that Stacki needs resolved before saving this edit.",
  "shell.rejection.unsupportedOperation": "Stacki encountered an editor error while applying the change.",
  "shell.rejection.writeFailed": "The file could not be written.",
  "shell.rejection.writeRace": "Another program wrote the file at the same moment.",
  "shell.remove.alsoRemoved": {
    one: "Also removed {names} from the frontmatter \u2014 nothing was reading it any more.",
    other: "Also removed {names} from the frontmatter \u2014 nothing was reading them any more."
  },
  "shell.remove.fromFrontmatter": "This section comes from the page frontmatter \u2014 remove it from the code instead.",
  "shell.restore.fileBody": "It goes back to how it was in \u201C{subject}\u201D, and lands as an unsaved change \u2014 so you can look at it and undo it like any other edit.",
  "shell.restore.fileConfirm": "Put it back",
  "shell.restore.fileDone": "{name} is back to how it was",
  "shell.restore.fileMissing": "That version no longer contains the file.",
  "shell.restore.fileTitle": "Put {name} back?",
  "shell.restore.going": "Going back\u2026",
  "shell.restore.projectBody": "Anything you haven\u2019t saved is put aside first, so nothing is lost. Your saved history stays exactly as it is \u2014 this lands as a set of unsaved changes you can look over, keep, or undo.",
  "shell.restore.projectConfirm": "Take it back",
  "shell.restore.projectDone": "The project is back to how it was",
  "shell.restore.projectParked": "The project is back \u2014 your unsaved work is waiting on this branch",
  "shell.restore.projectTitle": "Take everything back to \u201C{subject}\u201D?",
  "shell.rightTabs.settings": "Settings",
  "shell.rightTabs.settingsPanel": "The Settings panel",
  "shell.rightTabs.style": "Style",
  "shell.rightTabs.stylePanel": "The Style panel",
  "shell.save.failed": "Save failed: {message}",
  "shell.save.failedFile": "This file has not been saved. {message}",
  "shell.save.failedNamed": "{name} has not been saved. {message}",
  "shell.save.retry": "Retry save",
  "shell.saveConflict.changedOnDisk": "changed on disk while you were editing.",
  "shell.saveConflict.keep": "Save this version",
  "shell.saveConflict.message": "{fileName}: {detail} Your edits are kept here and are not being saved.",
  "shell.saveConflict.reload": "Reload from disk",
  "shell.saveConflict.review": "Review in code",
  "shell.saving.properties": "Saving component properties\u2026",
  "shell.symbol.notFound": "Couldn\u2019t find where {name} is defined ({spec}).",
  "shell.symbol.tooLarge": "That file is too large to edit in the app.",
  "shell.titleBar.back": "Back (Esc)",
  "shell.titleBar.backToProjects": "Back to all projects",
  "shell.titleBar.backToProjectsFailed": "Could not return to projects: {message}",
  "shell.titleBar.closeDefaults": "Close defaults",
  "shell.titleBar.openInBrowser": "Open in browser",
  "shell.titleBar.terminalHide": "Hide terminal ({shortcut})",
  "shell.titleBar.terminalShow": "Show terminal ({shortcut})",
  "shell.viewAs.back": "Back to Admin",
  "shell.viewAs.stop": "Stop viewing as another role",
  "shell.viewAs.viewing": "Viewing as {name}"
};

// vendor/stacki/shared/properties/i18n/messages/en/structure.ts
var messages31 = {
  "structure.collapseAll": "Collapse all",
  "structure.cond.and": "and",
  "structure.cond.if": "if {condition}",
  "structure.cond.not": "not {subject}",
  "structure.cond.or": "or",
  "structure.dragHere": "Drag components here",
  "structure.error.needsDeveloper": "This page needs a Developer to fix its source before editing.",
  "structure.error.openCode": "Open code panel",
  "structure.error.syntax": "This page contains a syntax error.",
  "structure.error.syntaxNear": "{message} Near {near}",
  "structure.expandAll": "Expand all",
  "structure.frontmatter": "Frontmatter",
  "structure.imports": { one: "1 import", other: "{count} imports" },
  "structure.menu.convertTo": "Convert to",
  "structure.menu.copy": "Copy",
  "structure.menu.cut": "Cut",
  "structure.menu.delete": "Delete",
  "structure.menu.duplicate": "Duplicate",
  "structure.menu.label": "Element actions",
  "structure.menu.openComponent": "Open component",
  "structure.menu.paste": "Paste",
  "structure.menu.setDefaults": "Set component defaults",
  "structure.menu.wrapIn": "Wrap in",
  "structure.missing.injected": "{route} comes from {from}, not from this project \u2014 it can be previewed here, but its markup lives in a dependency and isn\u2019t editable.",
  "structure.missing.integration": "an integration",
  "structure.missing.select": "Select a page to edit.",
  "structure.placement.bodyDuplicate": "A page can only have one \u201Cbody\u201D.",
  "structure.placement.bodyInComponent": "\u201Cbody\u201D inside a component only works when the component is the page\u2019s layout.",
  "structure.placement.bodyOrder": "\u201Chead\u201D has to come before \u201Cbody\u201D.",
  "structure.placement.bodyPosition": "\u201Cbody\u201D goes directly inside \u201Chtml\u201D.",
  "structure.placement.compileFailed": "The page stopped compiling after your last change: {message}",
  "structure.placement.contentModel": "\u201C{child}\u201D can\u2019t go inside \u201C{parent}\u201D.",
  "structure.placement.doctypeDuplicate": "A page can only have one doctype.",
  "structure.placement.doctypePosition": "A doctype can only be the first thing in a page.",
  "structure.placement.firstChild": "\u201C{child}\u201D has to be the first thing inside \u201C{parent}\u201D.",
  "structure.placement.frontmatter": "The frontmatter is code, not a place for elements.",
  "structure.placement.headContent": "\u201Chead\u201D only holds titles, metadata, links, scripts and styles.",
  "structure.placement.headDuplicate": "A page can only have one \u201Chead\u201D.",
  "structure.placement.headInComponent": "\u201Chead\u201D inside a component only works when the component is the page\u2019s layout.",
  "structure.placement.headPosition": "\u201Chead\u201D goes directly inside \u201Chtml\u201D.",
  "structure.placement.htmlContent": "Only \u201Chead\u201D and \u201Cbody\u201D go directly inside \u201Chtml\u201D.",
  "structure.placement.htmlDuplicate": "A page can only have one \u201Chtml\u201D.",
  "structure.placement.htmlPosition": "\u201Chtml\u201D can only be at the top of a page, after the doctype.",
  "structure.placement.metadataInBody": "\u201C{child}\u201D inside \u201C{parent}\u201D only works with certain attributes.",
  "structure.placement.metadataPosition": "\u201C{child}\u201D belongs in \u201Chead\u201D, not inside \u201C{parent}\u201D.",
  "structure.placement.needsParent": "\u201C{child}\u201D can only go inside {parent}.",
  "structure.placement.nestedForm": "A form can\u2019t go inside another form.",
  "structure.placement.nestedInteractive": "A \u201C{child}\u201D can\u2019t go inside a \u201C{parent}\u201D.",
  "structure.placement.selfDrop": "An element can\u2019t go inside itself.",
  "structure.placement.slotInPage": "A slot only works in a component or layout, not in a page.",
  "structure.placement.snapped": "{reason} Dropping here puts it at the nearest valid place.",
  "structure.placement.textInList": "Text directly inside \u201C{parent}\u201D isn\u2019t valid HTML.",
  "structure.placement.textPosition": "Text can\u2019t go directly inside \u201C{parent}\u201D.",
  "structure.placement.undoLast": "Undo last change",
  "structure.placement.unknownComponentChild": "Check that this component renders something \u201C{parent}\u201D accepts.",
  "structure.placement.unknownComponentParent": "\u201C{child}\u201D belongs inside {parent}. Check that this component renders one.",
  "structure.placement.voidParent": "\u201C{parent}\u201D can\u2019t have anything inside it.",
  "structure.row.imported": "Imported from {file}",
  "structure.binding.label": "Data binding {path}",
  "structure.search.capped": "Showing the first {count} matches. Type more to narrow them.",
  "structure.search.hint": "Words, .class, #id, [attr=value], <tag>, /* comment",
  "structure.search.noMatch": "No elements match",
  "structure.search.placeholder": "Search layers",
  "structure.status.empty": "Renders nothing on the page with its current props",
  "structure.status.hidden": "display: none \u2014 on the page, not drawn",
  "structure.status.inert": "pointer-events: none \u2014 drawn, but takes no clicks"
};

// vendor/stacki/shared/properties/i18n/messages/en/studio.ts
var messages32 = {
  "studio.access.notInFront": "Cloudflare Access did not authenticate this request. Check that the Access application covers this hostname and the /studio path, then try again.",
  "studio.account.buildMode": "Build mode",
  "studio.account.buildModeHint": "Stacki\u2019s developer editor, dark and dense. Off: the design editor.",
  "studio.account.cursorChat": "Cursor chat",
  "studio.account.cursorChatShortcut": "Cursor chat (/)",
  "studio.account.cursorChatUnavailable": "Available in the page editing preview",
  "studio.account.github": "GitHub account",
  "studio.account.label": "Stacki account",
  "studio.account.loading": "Loading account\u2026",
  "studio.account.local": "Local development \xB7 no sign-in required",
  "studio.account.menu": "Stacki account menu",
  "studio.account.signOut": "Sign out",
  "studio.account.signOutTitle": "Sign out of this studio",
  "studio.account.signOutWait": "Wait for your edits to finish saving",
  "studio.account.version": "Stacki Studio {version}",
  "studio.attention.draftFailed.action": "Retry save",
  "studio.attention.draftFailed.text": "The server could not store your draft. Your edits are kept in this browser.",
  "studio.attention.draftFailed.title": "Draft not saved",
  "studio.attention.draftReplaced.action": "Copy my draft",
  "studio.attention.draftReplaced.text": "The server\u2019s draft was replaced, and this browser still holds the earlier one. Saving is paused so neither overwrites the other.",
  "studio.attention.draftReplaced.title": "Draft replaced",
  "studio.attention.editFailed.action": "Retry save",
  "studio.attention.editFailed.text": "The server could not apply your last edit: {detail}",
  "studio.attention.editFailed.title": "Edit failed",
  "studio.attention.fileRemoved.text": "This file was removed on GitHub. Open another page.",
  "studio.attention.fileRemoved.title": "File removed",
  "studio.attention.menu": "What needs attention",
  "studio.attention.saveUnconfirmed.action": "Retry save",
  "studio.attention.saveUnconfirmed.text": "The server did not confirm your last save. Your edits are kept in this browser.",
  "studio.attention.saveUnconfirmed.title": "Save not confirmed",
  "studio.boot.checkingSession": "Checking your session\u2026",
  "studio.boot.loading": "Loading your pages and components\u2026",
  "studio.boot.opening": "Opening your studio\u2026",
  "studio.boot.openingLabel": "Opening Studio",
  "studio.boot.reconnecting": "Reconnecting to your workspace\u2026 (attempt {attempt} of 3)",
  "studio.boot.retry": "Retry opening Studio",
  "studio.boot.slow": "This is taking longer than usual. {seconds}s elapsed.",
  "studio.boot.stage.compile": "Compiling your first page\u2026",
  "studio.boot.stage.container": "Starting your workspace\u2026",
  "studio.boot.stage.dependencies": "Preparing your site\u2019s dependencies\u2026",
  "studio.boot.stage.drafts": "Restoring your drafts\u2026",
  "studio.boot.stage.ready": "Loading your pages and components\u2026",
  "studio.boot.stage.repository": "Restoring your repository\u2026",
  "studio.boot.stage.server": "Starting the preview server\u2026",
  "studio.boot.stage.step": "Step {step} of {total}",
  "studio.collab.draftFailed": "Draft persistence failed. Keep the studio open and reconnect to retry.",
  "studio.collab.draftReplaced": "The server draft was replaced. This browser still has the previous draft; export its source before clearing this site\u2019s stored data.",
  "studio.collab.editFailed": "Edit failed",
  "studio.collab.fileRemoved": "This file was removed on GitHub. Open another page.",
  "studio.collab.invalidMessage": "Invalid collaboration message",
  "studio.collab.offlineStorage": "Offline storage unavailable: {message}",
  "studio.collab.pageChanged": "The page changed; repeat the action",
  "studio.collab.reconnectFirst": "Reconnect before rearranging the page",
  "studio.collab.saveUnconfirmed": "Save confirmation did not arrive. Your local edits are preserved. Reload Studio to retry.",
  "studio.collab.saveUnfinished": "The save did not finish.",
  "studio.collab.selectionLocked": "{name} is editing this element. You can select it and add elements inside it. Take over to edit its settings.",
  "studio.collab.sessionChanged": "The session changed. Select the element again.",
  "studio.collab.sessionExpired": "Your session expired or repository access changed. Your local edits are preserved. Sign in again.",
  "studio.collab.sourceProtected": "Component source is protected in Client mode.",
  "studio.collab.takeOver": "Take over",
  "studio.component.packageReadOnly": "Package components are read-only. Edit instance properties on the page.",
  "studio.components.createInSource": "Create component templates in the project source.",
  "studio.dashboard.back": "Back to the site",
  "studio.dashboard.here": "This project",
  "studio.dashboard.lede": "Each project has its own Studio. A row opens it.",
  "studio.dashboard.loading": "Reading the projects",
  "studio.dashboard.none": "No other project is listed yet.",
  "studio.dashboard.open": "Open",
  "studio.dashboard.others": "Other projects",
  "studio.dashboard.problem": "The list of projects could not be read: {reason}",
  "studio.dashboard.show": "All projects",
  "studio.dashboard.title": "Projects",
  "studio.draft.queueFull": "Draft save queue is full. Pause typing and retry.",
  "studio.gateway.unavailable": "The studio is not available yet. Deployment setup is still in progress.",
  "studio.header.backToPage": "Back to page",
  "studio.header.goToSelection": "Go to {name}\u2019s selection",
  "studio.inspector.close": "Close settings",
  "studio.inspector.label": "Element inspector",
  "studio.login.button": "Sign in with GitHub",
  "studio.login.buttonPasskey": "Sign in with a passkey",
  "studio.login.buttonProvider": "Continue with {provider}",
  "studio.login.failedHeading": "Unable to sign in",
  "studio.login.neutral.access": "Your account is not allowed to edit this website. Ask the site owner for access, then sign in again.",
  "studio.login.neutral.cancelled": "Sign-in was cancelled. Try again below.",
  "studio.login.neutral.configuration": "Sign-in needs attention from the site owner. Please ask them to check the sign-in configuration.",
  "studio.login.neutral.email": "Your email address could not be verified. Verify it with your sign-in provider, then try again.",
  "studio.login.neutral.expired": "This sign-in link expired or was already used. Start a new sign-in below.",
  "studio.login.neutral.rateLimit": "Sign-in is temporarily limited. Please wait before trying again.",
  "studio.login.neutral.unavailable": "Sign-in is temporarily unavailable. Please try again below. If it continues, contact the site owner.",
  "studio.login.problem.access": "Your GitHub account needs Write access to this repository. Accept its invitation, then sign in again.",
  "studio.login.problem.cancelled": "GitHub authorization was cancelled. Try again and authorize Stacki Studio.",
  "studio.login.problem.configuration": "GitHub sign-in needs attention from the site owner. Please ask them to check the GitHub App credentials and callback URL.",
  "studio.login.problem.email": "GitHub requires you to verify your primary email address before signing in. Open GitHub Settings \u2192 Emails, verify the address, then try again.",
  "studio.login.problem.expired": "This sign-in link expired or was already used. Start a new GitHub sign-in below.",
  "studio.login.problem.rateLimit": "GitHub is temporarily limiting sign-in requests. Please wait before trying again.",
  "studio.login.problem.unavailable": "GitHub sign-in is temporarily unavailable. Please try again below. If it continues, contact the site owner.",
  "studio.login.prompt": "Sign in to edit and publish your website.",
  "studio.login.ready": "You can try signing in again below.",
  "studio.login.reference": "Reference: {reference}",
  "studio.login.title": "Sign in \xB7 Stacki Studio",
  "studio.login.waitMany": "Wait at least {seconds} seconds, then start a new sign-in below.",
  "studio.login.waitOne": "Wait at least 1 second, then start a new sign-in below.",
  "studio.login.welcomeHeading": "Welcome to your studio",
  "studio.modeBar.browse": "Browse",
  "studio.modeBar.comment": "Comment",
  "studio.modeBar.edit": "Edit",
  "studio.modeBar.label": "How the site answers a click",
  "studio.pagesMenu.loading": "Reading the items",
  "studio.pagesMenu.more": "{count} more pages",
  "studio.pagesMenu.noItems": "No items yet",
  "studio.pagesMenu.system": "System",
  "studio.pagesMenu.templates": "Templates",
  "studio.panel.close": "Close panel",
  "studio.passkey.enrol.button": "Create passkey",
  "studio.passkey.enrol.continue": "Continue to sign in",
  "studio.passkey.enrol.done": "Passkey saved. You can sign in now.",
  "studio.passkey.enrol.failed": "The passkey could not be created. Try again, or ask the site owner for a new invite.",
  "studio.passkey.enrol.heading": "Create your passkey",
  "studio.passkey.enrol.invalid": "This invite expired or was already used. Ask the site owner for a new one.",
  "studio.passkey.enrol.prompt": "A passkey replaces a password. Your device asks you to confirm with your fingerprint, face or screen lock.",
  "studio.passkey.signIn.button": "Use my passkey",
  "studio.passkey.signIn.failed": "The passkey was not accepted. Try again, or ask the site owner for a new invite.",
  "studio.passkey.signIn.prompt": "Use your passkey to sign in. Your device asks you to confirm with your fingerprint, face or screen lock.",
  "studio.passkey.signIn.unsupported": "This browser cannot use passkeys. Open Studio in a current version of Chrome, Safari, Edge or Firefox.",
  "studio.passkey.setup.code": "Setup code",
  "studio.passkey.setup.heading": "First admin setup",
  "studio.passkey.setup.prompt": "Create the first passkey for this site\u2019s owner. Enter the setup code you set with wrangler secret put AUTH_SETUP_CODE.",
  "studio.paused.body": "Your saved draft is safe.",
  "studio.paused.resume": "Resume editing",
  "studio.paused.title": "Studio paused to save hosting costs.",
  "studio.project.openFailed": "Unable to open your studio.",
  "studio.chat.you": "You",
  "studio.chat.working": "Working on it",
  "studio.chat.history": "Chats",
  "studio.rail.claude": "Claude",
  "studio.rail.content": "Content",
  "studio.rail.files": "Files",
  "studio.request.branchChanged": "The shared branch changed while loading. Please retry.",
  "studio.request.incomplete": "Studio returned an incomplete response. Refresh Studio and retry.",
  "studio.request.interrupted": "The connection to Studio was interrupted. Please retry shortly.",
  "studio.request.notAuthorized": "Studio could not authorize this request. Check your access and retry.",
  "studio.request.rateLimited": "Studio is temporarily rate limited. Please wait before retrying.",
  "studio.request.rateLimitedWait": "Studio is temporarily rate limited. Wait {seconds} seconds before retrying.",
  "studio.request.sessionExpired": "Your Studio session expired. Sign in again.",
  "studio.request.unavailable": "Studio is restarting or temporarily unavailable. Please retry shortly.",
  "studio.source.refused": "{reason} Make this change in Code.",
  "studio.status.connecting": "Connecting",
  "studio.status.needsAttention": "Needs attention",
  "studio.status.offline": "Offline \xB7 edits pending",
  "studio.status.reconnecting": "Reconnecting\u2026",
  "studio.status.saved": "Saved",
  "studio.status.saving": "Saving",
  "studio.status.signInRequired": "Sign-in required",
  "studio.storage.cleanupStopped": "Cleanup stopped; scan again",
  "studio.values.deeplyNested": "Open source to edit deeply nested content.",
  "studio.values.drag": "Drag {label}"
};

// vendor/stacki/shared/properties/i18n/messages/en/studioSetup.ts
var messages33 = {
  "studioSetup.auth.add": "Add Studio",
  "studioSetup.auth.change": "Change",
  "studioSetup.auth.change.saved": "Saved. Deploy Studio to apply it.",
  "studioSetup.auth.change.title": "Change sign-in type",
  "studioSetup.auth.change.warning": "After switching, people need new credentials or invites, and existing sessions stop working on the next deploy.",
  "studioSetup.auth.current": "Sign-in: {type}",
  "studioSetup.auth.currentCustom": "Custom provider",
  "studioSetup.auth.dialogLabel": "Sign-in type for Studio",
  "studioSetup.auth.field.adminEmail": "First administrator email",
  "studioSetup.auth.field.adminHandle": "First administrator name",
  "studioSetup.auth.field.allowedDomains": "Allowed email domains (optional)",
  "studioSetup.auth.field.allowedEmails": "Allowed emails (optional)",
  "studioSetup.auth.field.aud": "Application AUD tag",
  "studioSetup.auth.field.clientId": "Client ID",
  "studioSetup.auth.field.customDomain": "Use this domain even though it does not end in .cloudflareaccess.com",
  "studioSetup.auth.field.issuer": "Issuer URL",
  "studioSetup.auth.field.listHint": "Separate several with commas.",
  "studioSetup.auth.field.name": "Button name",
  "studioSetup.auth.field.teamDomain": "Access team domain",
  "studioSetup.auth.groupLabel": "Sign-in type",
  "studioSetup.auth.intro": "Choose how people sign in to the hosted Studio. You can change this later in Settings.",
  "studioSetup.auth.kind.access.hint": "Put Studio behind Cloudflare Zero Trust Access",
  "studioSetup.auth.kind.access.label": "Cloudflare Access",
  "studioSetup.auth.kind.github.hint": "People sign in with their GitHub account. The default.",
  "studioSetup.auth.kind.github.label": "GitHub",
  "studioSetup.auth.kind.google.hint": "Google accounts. Limit access by email or domain.",
  "studioSetup.auth.kind.google.label": "Google",
  "studioSetup.auth.kind.oidc.hint": "Okta, Entra ID, Auth0, Keycloak and other identity providers.",
  "studioSetup.auth.kind.oidc.label": "SSO (OpenID Connect)",
  "studioSetup.auth.kind.passkey.hint": "No accounts to connect. The first admin invites people.",
  "studioSetup.auth.kind.passkey.label": "Passkeys",
  "studioSetup.auth.problem.customDomain": "Not a cloudflareaccess.com domain. Tick the box below to use it anyway.",
  "studioSetup.auth.problem.invalid": "Not valid.",
  "studioSetup.auth.problem.required": "Required.",
  "studioSetup.auth.problem.tooLong": "Too long.",
  "studioSetup.auth.problem.tooMany": "Too many entries.",
  "studioSetup.auth.problem.tooShort": "Too short.",
  "studioSetup.auth.redirect.copy": "Copy URI",
  "studioSetup.auth.redirect.note": "Register this at your identity service, with your site\u2019s real address in place of the placeholder.",
  "studioSetup.auth.redirect.title": "Redirect URI to register",
  "studioSetup.auth.save": "Save sign-in type",
  "studioSetup.auth.secrets.copied": "Copied",
  "studioSetup.auth.secrets.copy": "Copy commands",
  "studioSetup.auth.secrets.copyFailed": "Could not copy. Select the text and copy it yourself.",
  "studioSetup.auth.secrets.intro": "Secrets never pass through Stacki. Run these in your project; Wrangler asks for the value.",
  "studioSetup.auth.secrets.title": "Add these yourself after setup",
  "studioSetup.auth.steps.access": "No secrets. In Cloudflare Zero Trust, create an Access application covering your site\u2019s hostname and the path /studio* with a policy that allows your team, then paste its AUD tag above. People must be allowed in Access and listed in the Roles panel.",
  "studioSetup.auth.steps.github": "Uses the GitHub App you set up in the cloud step. Nothing else to choose.",
  "studioSetup.auth.steps.google": "Create an OAuth client (Web application) in the Google Cloud console, register the redirect URI below, then add its secret yourself.",
  "studioSetup.auth.steps.oidc": "Create an application at your identity provider, register the redirect URI below, then add its client secret yourself (a public PKCE client has none).",
  "studioSetup.auth.steps.passkey": "The first administrator creates the first passkey: choose a long random code (16 to 200 characters) for AUTH_SETUP_CODE and add it yourself, deploy, then open https://<your-site>/studio/auth/passkey/bootstrap once. Afterwards, invite everyone else from Studio\u2019s Roles view.",
  "studioSetup.auth.title": "How should people sign in?",
  "studioSetup.back": "Back",
  "studioSetup.closeLabel": "Close Studio setup",
  "studioSetup.cloud.agentIntro": "Paste these instructions into your coding agent, in this project.",
  "studioSetup.cloud.agentNote": "Your agent guides account connection and deployment approval.",
  "studioSetup.cloud.agentTitle": "Let your agent handle setup",
  "studioSetup.cloud.checking": "Checking Studio before preparing your instructions\u2026",
  "studioSetup.cloud.cloudflareGuide": "Cloudflare guide",
  "studioSetup.cloud.cloudflareNote": "Hosts Studio \xB7 Workers Paid plan",
  "studioSetup.cloud.copiedInstructions": "Instructions copied",
  "studioSetup.cloud.copiedStatus": "Setup instructions copied.",
  "studioSetup.cloud.copyFailed": "Could not copy. Copy the instructions manually.",
  "studioSetup.cloud.copyInstructions": "Copy setup instructions",
  "studioSetup.cloud.details": "View instructions & guides",
  "studioSetup.cloud.githubGuide": "GitHub App guide",
  "studioSetup.cloud.githubNote": "Your website\u2019s repository",
  "studioSetup.cloud.intro": "Give your team a shared editor they can access in a browser.",
  "studioSetup.cloud.need": "You\u2019ll need",
  "studioSetup.cloud.openFailed": "Could not open the browser. Open this address: {url}",
  "studioSetup.cloud.promptLabel": "Agent setup prompt",
  "studioSetup.cloud.title": "Bring Studio online",
  "studioSetup.command.copiedStatus": "Command copied to clipboard.",
  "studioSetup.command.copyAria": "Copy npm install command",
  "studioSetup.command.copyTitle": "Copy command",
  "studioSetup.command.runHere": "Or run in your project folder:",
  "studioSetup.copied": "Copied",
  "studioSetup.copy": "Copy",
  "studioSetup.copyCommandFailed": "Could not copy. Select the command and copy it manually.",
  "studioSetup.entry.add": "Add to project",
  "studioSetup.entry.blocked": "Existing studio folder needs review",
  "studioSetup.entry.checking": "Checking installation\u2026",
  "studioSetup.entry.checkingLabel": "Checking Studio\u2026",
  "studioSetup.entry.failed": "Could not check installation",
  "studioSetup.entry.installed": "Installed \xB7 {version}",
  "studioSetup.entry.manage": "Manage Stacki Studio",
  "studioSetup.entry.missing": "Not installed",
  "studioSetup.entry.open": "Open Studio setup",
  "studioSetup.entry.review": "Review Studio setup",
  "studioSetup.eyebrow": "OPTIONAL PROJECT ADD-ON",
  "studioSetup.install.checking": "Checking this project\u2026",
  "studioSetup.install.hint": "Browser editing and collaboration, installed in /studio.",
  "studioSetup.install.installed": "Studio is installed",
  "studioSetup.install.retry": "Retry installation",
  "studioSetup.install.title": "Studio installation",
  "studioSetup.install.version": "Version {version}. Continue to local preview or cloud setup.",
  "studioSetup.install.versionShort": "Version {version}",
  "studioSetup.local.copiedStatus": "Launch command copied.",
  "studioSetup.local.copyLaunch": "Copy launch command",
  "studioSetup.local.edit": "Try an edit",
  "studioSetup.local.editHint": "Choose a page and make a change. Edits save directly to your project files.",
  "studioSetup.local.folder": "From your project folder",
  "studioSetup.local.installed": "Studio runs with your website. No Cloudflare setup needed.",
  "studioSetup.local.later": "Run it yourself later",
  "studioSetup.local.launch": "Launch command",
  "studioSetup.local.manual": "Manual startup",
  "studioSetup.local.notInstalled": "Install Studio first, or use an agent in Go live.",
  "studioSetup.local.open": "Open Studio",
  "studioSetup.local.openFailed": "Could not open your browser.",
  "studioSetup.local.startPreview": "Start your website preview to open Studio.",
  "studioSetup.local.title": "Try your editor locally",
  "studioSetup.name": "Stacki Studio",
  "studioSetup.progress.keepOpen": "Keep Stacki open while installation runs.",
  "studioSetup.progress.label": "Studio installation progress",
  "studioSetup.progress.output": "Installation output",
  "studioSetup.progress.preparing": "Preparing installation\u2026",
  "studioSetup.progress.step": "Step {current} of {total}",
  "studioSetup.progress.stopped": "Stopped: {stage}",
  "studioSetup.setUp": "Set up Stacki Studio",
  "studioSetup.setUpWithAgent": "Set up with an agent",
  "studioSetup.stage.activate": "Finishing installation",
  "studioSetup.stage.build": "Building Studio",
  "studioSetup.stage.check": "Checking Studio",
  "studioSetup.stage.complete": "Studio is ready",
  "studioSetup.stage.dependencies": "Installing dependencies",
  "studioSetup.stage.files": "Preparing project files",
  "studioSetup.stage.release": "Preparing Studio release",
  "studioSetup.steps.install": "Install",
  "studioSetup.steps.label": "Setup steps",
  "studioSetup.steps.live": "Go live",
  "studioSetup.steps.local": "Local preview"
};

// vendor/stacki/shared/properties/i18n/messages/en/style.ts
var messages34 = {
  "style.alignControl.alignAt": "Align {horizontal} {vertical}",
  "style.alignControl.alignHere": "Double-click to align here",
  "style.alignControl.alignment": "Alignment",
  "style.alignControl.baseline": "Baseline",
  "style.alignControl.bottom": "Bottom",
  "style.alignControl.center": "Center",
  "style.alignControl.custom": "Custom",
  "style.alignControl.horizontalAlignment": "Horizontal alignment",
  "style.alignControl.left": "Left",
  "style.alignControl.right": "Right",
  "style.alignControl.spaceAround": "Space around",
  "style.alignControl.spaceBetween": "Space between",
  "style.alignControl.spaceBetweenHint": "Double-click for Space between",
  "style.alignControl.spaceEvenly": "Space evenly",
  "style.alignControl.stretch": "Stretch",
  "style.alignControl.top": "Top",
  "style.alignControl.verticalAlignment": "Vertical alignment",
  "style.aspectRatioField.anamorphic": "Anamorphic (2.39:1)",
  "style.aspectRatioField.aspectRatio": "Aspect ratio",
  "style.aspectRatioField.auto": "Auto",
  "style.aspectRatioField.connect": "Connect {name} to a variable",
  "style.aspectRatioField.custom": "Custom",
  "style.aspectRatioField.height": "Height",
  "style.aspectRatioField.landscape": "Landscape (3:2)",
  "style.aspectRatioField.other": "Other",
  "style.aspectRatioField.portrait": "Portrait (2:3)",
  "style.aspectRatioField.ratio": "Ratio",
  "style.aspectRatioField.ratioHeight": "Ratio height",
  "style.aspectRatioField.ratioValue": "Aspect ratio value",
  "style.aspectRatioField.ratioWidth": "Ratio width",
  "style.aspectRatioField.square": "Square (1:1)",
  "style.aspectRatioField.univisium": "Univisium/Netflix (2:1)",
  "style.aspectRatioField.widescreen": "Widescreen (16:9)",
  "style.aspectRatioField.width": "Width",
  "style.backgroundKit.backgroundLayer": "Background layer",
  "style.backgroundKit.clear": "Clear",
  "style.backgroundKit.connect": "Connect {name} to a variable",
  "style.backgroundKit.overriddenBy": "Overridden by {selector}",
  "style.backgroundLayerEditor.color": "Color",
  "style.backgroundLayerEditor.fixed": "Fixed",
  "style.backgroundLayerEditor.gradient": "Gradient",
  "style.backgroundLayerEditor.image": "Image",
  "style.backgroundLayerEditor.layerFixed": "Layer fixed",
  "style.backgroundLayerEditor.layerTile": "Layer tile",
  "style.backgroundLayerEditor.layerType": "Layer type",
  "style.backgroundLayerEditor.layerValue": "Layer value",
  "style.backgroundLayerEditor.position": "Position",
  "style.backgroundLayerEditor.size": "Size",
  "style.backgroundLayerEditor.tile": "Tile",
  "style.backgroundLayerEditor.type": "Type",
  "style.backgroundLayerFields.backgroundSize": "Background size",
  "style.backgroundLayerFields.cellBottom": "bottom",
  "style.backgroundLayerFields.cellCenter": "Center",
  "style.backgroundLayerFields.cellLeft": "Left",
  "style.backgroundLayerFields.cellMiddle": "center",
  "style.backgroundLayerFields.cellRight": "Right",
  "style.backgroundLayerFields.cellTop": "top",
  "style.backgroundLayerFields.chooseImage": "Choose image\u2026",
  "style.backgroundLayerFields.connect": "Connect {name} to a variable",
  "style.backgroundLayerFields.connectOverlayColor": "Connect overlay color to a variable",
  "style.backgroundLayerFields.fixed": "Fixed",
  "style.backgroundLayerFields.height": "Height",
  "style.backgroundLayerFields.left": "Left",
  "style.backgroundLayerFields.noImage": "No image",
  "style.backgroundLayerFields.noTile": "No tile",
  "style.backgroundLayerFields.notFixed": "Not fixed",
  "style.backgroundLayerFields.overlayColor": "Overlay color",
  "style.backgroundLayerFields.positionCell": "{horizontal} {vertical}",
  "style.backgroundLayerFields.positionPreset": "Position preset",
  "style.backgroundLayerFields.replaceImage": "Replace image\u2026",
  "style.backgroundLayerFields.sizeContain": "Contain",
  "style.backgroundLayerFields.sizeCover": "Cover",
  "style.backgroundLayerFields.sizeCustom": "Custom",
  "style.backgroundLayerFields.tile": "Tile",
  "style.backgroundLayerFields.tileHorizontally": "Tile horizontally",
  "style.backgroundLayerFields.tileNone": "None",
  "style.backgroundLayerFields.tileVertically": "Tile vertically",
  "style.backgroundLayerFields.tileX": "Tile X",
  "style.backgroundLayerFields.tileY": "Tile Y",
  "style.backgroundLayerFields.top": "Top",
  "style.backgroundLayerFields.typeColor": "Color overlay",
  "style.backgroundLayerFields.typeImage": "Image",
  "style.backgroundLayerFields.typeLinear": "Linear gradient",
  "style.backgroundLayerFields.typeRadial": "Radial gradient",
  "style.backgroundLayerFields.width": "Width",
  "style.backgroundSection.addBackgroundLayer": "Add a background layer",
  "style.backgroundSection.addLayer": "Add a layer",
  "style.backgroundSection.backgroundClipping": "Background clipping",
  "style.backgroundSection.backgroundColor": "Background color",
  "style.backgroundSection.backgroundLayers": "Background layers",
  "style.backgroundSection.clipContent": "Clip background to content",
  "style.backgroundSection.clipNone": "None",
  "style.backgroundSection.clipPadding": "Clip background to padding",
  "style.backgroundSection.clipText": "Clip background to text",
  "style.backgroundSection.clipping": "Clipping",
  "style.backgroundSection.color": "Color",
  "style.backgroundSection.imageAndGradient": "Image & gradient",
  "style.bordersKit.clear": "Clear",
  "style.bordersKit.overriddenBy": "Overridden by {selector}",
  "style.bordersKit.overriddenBySelector": "Overridden by a more specific selector:",
  "style.bordersKit.selectSelector": "Select this selector",
  "style.bordersSection.all": "All",
  "style.bordersSection.allBorders": "All borders",
  "style.bordersSection.borderSide": "Border side",
  "style.bordersSection.borderStyle": "Border style",
  "style.bordersSection.borderStyleValue": "Border style value",
  "style.bordersSection.borders": "Borders",
  "style.bordersSection.bottom": "Bottom",
  "style.bordersSection.color": "Color",
  "style.bordersSection.connectBorderStyle": "Connect border style to a variable",
  "style.bordersSection.custom": "Custom",
  "style.bordersSection.customValuePlaceholder": "custom value",
  "style.bordersSection.left": "Left",
  "style.bordersSection.moreStyleOptions": "More border style options",
  "style.bordersSection.right": "Right",
  "style.bordersSection.sideBorder": "{side} border",
  "style.bordersSection.sideBorderColor": "{side} border color",
  "style.bordersSection.sideBorderWidth": "{side} border width",
  "style.bordersSection.sideNameAll": "all",
  "style.bordersSection.sideNameBottom": "bottom",
  "style.bordersSection.sideNameLeft": "left",
  "style.bordersSection.sideNameRight": "right",
  "style.bordersSection.sideNameTop": "top",
  "style.bordersSection.style": "Style",
  "style.bordersSection.styleDashed": "Dashed",
  "style.bordersSection.styleDotted": "Dotted",
  "style.bordersSection.styleNone": "None",
  "style.bordersSection.styleSolid": "Solid",
  "style.bordersSection.top": "Top",
  "style.bordersSection.width": "Width",
  "style.boxShadowsRow.addBoxShadow": "Add a box shadow",
  "style.boxShadowsRow.addShadow": "Add a shadow",
  "style.boxShadowsRow.blur": "Blur",
  "style.boxShadowsRow.boxShadow": "Box shadow",
  "style.boxShadowsRow.boxShadows": "Box shadows",
  "style.boxShadowsRow.inside": "Inside",
  "style.boxShadowsRow.outside": "Outside",
  "style.boxShadowsRow.shadowType": "Shadow type",
  "style.boxShadowsRow.size": "Size",
  "style.boxShadowsRow.type": "Type",
  "style.clipPathRow.clip": "Clip",
  "style.clipPathRow.clipPath": "Clip path",
  "style.clipPathRow.typeCircle": "Circle",
  "style.clipPathRow.typeCustom": "Custom",
  "style.clipPathRow.typeEllipse": "Ellipse",
  "style.clipPathRow.typeInset": "Inset",
  "style.clipPathRow.typeNone": "None",
  "style.clipPathRow.typePath": "Path",
  "style.clipPathRow.typePolygon": "Polygon",
  "style.clipPathRow.typeShape": "Shape",
  "style.clipPathRow.typeVariable": "Variable",
  "style.customValueEditor.customValue": "Custom value",
  "style.customValueEditor.hint": "Enter to save \xB7 Escape to cancel",
  "style.decorationPopover.color": "Color",
  "style.decorationPopover.decorationColor": "Decoration color",
  "style.decorationPopover.decorationLine": "Decoration line",
  "style.decorationPopover.decorationStyle": "Decoration style",
  "style.decorationPopover.line": "Line",
  "style.decorationPopover.lineAll": "All",
  "style.decorationPopover.lineNone": "None",
  "style.decorationPopover.lineOverStrike": "Overline + Strikethrough",
  "style.decorationPopover.lineOverline": "Overline",
  "style.decorationPopover.lineStrike": "Strikethrough",
  "style.decorationPopover.lineUnderOver": "Underline + Overline",
  "style.decorationPopover.lineUnderStrike": "Underline + Strikethrough",
  "style.decorationPopover.lineUnderline": "Underline",
  "style.decorationPopover.note": "The browser will try to interrupt overlines and underlines to prevent drawing over glyphs.",
  "style.decorationPopover.setColor": "Set a color",
  "style.decorationPopover.skipAuto": "Auto",
  "style.decorationPopover.skipInk": "Skip ink",
  "style.decorationPopover.skipNone": "None",
  "style.decorationPopover.style": "Style",
  "style.decorationPopover.styleDashed": "Dashed",
  "style.decorationPopover.styleDotted": "Dotted",
  "style.decorationPopover.styleDouble": "Double",
  "style.decorationPopover.styleSolid": "Solid",
  "style.decorationPopover.styleWavy": "Wavy",
  "style.decorationPopover.thick": "Thick",
  "style.directionControl.custom": "Custom",
  "style.directionControl.customValuePlaceholder": "custom value",
  "style.directionControl.direction": "Direction",
  "style.directionControl.directionValue": "Direction value",
  "style.directionControl.headerBottomToTop": "Bottom to top",
  "style.directionControl.headerLeftToRight": "Left to right",
  "style.directionControl.headerRightToLeft": "Right to left",
  "style.directionControl.headerTopToBottom": "Top to bottom",
  "style.directionControl.hoverHint": "Hover an option to see direction and wrap values.",
  "style.directionControl.moreOptions": "More direction options",
  "style.directionControl.phraseBottomToTop": "bottom to top",
  "style.directionControl.phraseLeftToRight": "left to right",
  "style.directionControl.phraseRightToLeft": "right to left",
  "style.directionControl.phraseTopToBottom": "top to bottom",
  "style.directionControl.singleColumn": "Single column",
  "style.directionControl.singleRow": "Single row",
  "style.directionControl.stackTip": "Stack children {direction}, {wrap}",
  "style.directionControl.tipSingleColumn": "single column",
  "style.directionControl.tipSingleRow": "single row",
  "style.directionControl.tipWrapDown": "wrap down",
  "style.directionControl.tipWrapLeft": "wrap left",
  "style.directionControl.tipWrapRight": "wrap right",
  "style.directionControl.tipWrapUp": "wrap up",
  "style.directionControl.wrapDown": "Wrap down",
  "style.directionControl.wrapLeft": "Wrap left",
  "style.directionControl.wrapRight": "Wrap right",
  "style.directionControl.wrapUp": "Wrap up",
  "style.displayControl.custom": "Custom",
  "style.displayControl.customValuePlaceholder": "custom value",
  "style.displayControl.display": "Display",
  "style.displayControl.moreOptions": "More display options",
  "style.displayControl.tooltipBlock": "<strong>Block</strong> elements start on a new line and take up the full available width.",
  "style.displayControl.tooltipContents": "<strong>Contents</strong> removes the element's own box. Its children stay, and lay out as though they were children of its parent.",
  "style.displayControl.tooltipFlex": "<strong>Flex</strong> lays out its child elements on a horizontal or vertical axis.",
  "style.displayControl.tooltipGrid": "<strong>Grid</strong> lets you place items within rows and columns.",
  "style.displayControl.tooltipInline": "<strong>Inline</strong> is the default for text content. The text's font size and line height determine its size.",
  "style.displayControl.tooltipInlineBlock": "<strong>Inline-block</strong> behaves like inline, but accepts width and height properties.",
  "style.displayControl.tooltipInlineFlex": "<strong>Inline-flex</strong> behaves as an inline element. It stacks its content horizontally or vertically.",
  "style.displayControl.tooltipInlineGrid": "<strong>Inline-grid</strong> behaves as an inline element. It stacks its content in rows and columns.",
  "style.displayControl.tooltipNone": "<strong>None</strong> hides elements.",
  "style.displayControl.value": "Value",
  "style.easingEditor.custom": "Custom",
  "style.easingEditor.defaultHeading": "Default",
  "style.easingEditor.easingEditor": "Easing editor",
  "style.easingEditor.pausePreview": "Pause preview",
  "style.easingEditor.previewEasing": "Preview easing",
  "style.easingEditor.timingFunction": "Timing function",
  "style.easingEditor.title": "Easing Editor",
  "style.effectsKit.clear": "Clear",
  "style.effectsKit.connect": "Connect {name} to a variable",
  "style.effectsKit.cursorDrag": "Drag & Drop",
  "style.effectsKit.cursorGeneral": "General",
  "style.effectsKit.cursorLinks": "Links & Status",
  "style.effectsKit.cursorResize": "Resize",
  "style.effectsKit.cursorSelection": "Selection",
  "style.effectsKit.cursorZoom": "Zoom",
  "style.effectsKit.custom": "Custom\u2026",
  "style.effectsKit.eventsAuto": "Auto",
  "style.effectsKit.eventsNone": "None",
  "style.effectsKit.outlineDashed": "Dashed",
  "style.effectsKit.outlineDotted": "Dotted",
  "style.effectsKit.outlineNone": "None",
  "style.effectsKit.outlineSolid": "Solid",
  "style.effectsKit.overriddenBy": "Overridden by {selector}",
  "style.effectsSection.backdropFilters": "Backdrop filters",
  "style.effectsSection.blending": "Blending",
  "style.effectsSection.color": "Color",
  "style.effectsSection.cursor": "Cursor",
  "style.effectsSection.events": "Events",
  "style.effectsSection.filters": "Filters",
  "style.effectsSection.offset": "Offset",
  "style.effectsSection.outline": "Outline",
  "style.effectsSection.outlineColor": "Outline color",
  "style.effectsSection.outlineStyle": "Outline style",
  "style.effectsSection.pointerEvents": "Pointer events",
  "style.effectsSection.width": "Width",
  "style.embedEditor.dismiss": "Dismiss",
  "style.embedEditor.noEmbeds": "No HTML embeds with {tag} blocks were found on this page.",
  "style.embedEditor.pendingNote": {
    one: "{count} change to the page's own {tag} block is held here \u2014 the canvas won't show it until you leave this component, and it saves when you do.",
    other: "{count} changes to the page's own {tag} blocks are held here \u2014 the canvas won't show them until you leave this component, and they save when you do."
  },
  "style.embedEditor.pendingTooltip": {
    one: "{count} change to the page's styles \u2014 not on the canvas until you leave this component",
    other: "{count} changes to the page's styles \u2014 not on the canvas until you leave this component"
  },
  "style.embedEditor.scanned": { one: "Scanned {count} embed, but none target this element.", other: "Scanned {count} embeds, but none target this element." },
  "style.embedEditor.scannedWithComponents": {
    one: "Scanned {count} embed ({components} in components), but none target this element.",
    other: "Scanned {count} embeds ({components} in components), but none target this element."
  },
  "style.filterFields.amount": "Amount",
  "style.filterFields.angle": "Angle",
  "style.filterFields.blur": "Blur",
  "style.filterFields.filter": "Filter",
  "style.filterFields.filterType": "Filter type",
  "style.flexChildSection.align": "Align",
  "style.flexChildSection.alignSelf": "Align self",
  "style.flexChildSection.auto": "Auto",
  "style.flexChildSection.baseline": "Baseline",
  "style.flexChildSection.basis": "Basis",
  "style.flexChildSection.center": "Center",
  "style.flexChildSection.column": "Column",
  "style.flexChildSection.custom": "Custom",
  "style.flexChildSection.customizeGrowShrink": "Customize grow and shrink behavior",
  "style.flexChildSection.defaultOrder": "Default order",
  "style.flexChildSection.end": "End",
  "style.flexChildSection.first": "First",
  "style.flexChildSection.flexSizing": "Flex sizing",
  "style.flexChildSection.grow": "Grow",
  "style.flexChildSection.growIfPossible": "Grow if possible",
  "style.flexChildSection.justify": "Justify",
  "style.flexChildSection.justifySelf": "Justify self",
  "style.flexChildSection.last": "Last",
  "style.flexChildSection.lineAria": "{axis} {caption}",
  "style.flexChildSection.moreSizingOptions": "More flex sizing options",
  "style.flexChildSection.noShrinkOrGrow": "Don't shrink or grow",
  "style.flexChildSection.order": "Order",
  "style.flexChildSection.row": "Row",
  "style.flexChildSection.shrink": "Shrink",
  "style.flexChildSection.shrinkIfNeeded": "Shrink if needed",
  "style.flexChildSection.sizing": "Sizing",
  "style.flexChildSection.start": "Start",
  "style.flexChildSection.stretch": "Stretch",
  "style.fontFields.custom": "Custom\u2026",
  "style.fontFields.customFonts": "Custom fonts",
  "style.fontFields.default": "Default",
  "style.fontFields.font": "Font",
  "style.fontFields.fontFamily": "Font family",
  "style.fontFields.fontWeight": "Font weight",
  "style.fontFields.googleFonts": "Google fonts",
  "style.fontFields.searchFonts": "Search fonts\u2026",
  "style.fontFields.webFonts": "Web fonts",
  "style.fontFields.weight": "Weight",
  "style.fontFields.weightDefault": "Default",
  "style.gapControl.columnGap": "Column gap",
  "style.gapControl.columns": "Columns",
  "style.gapControl.connect": "Connect {name} to a variable",
  "style.gapControl.gap": "Gap",
  "style.gapControl.linked": "Linked \u2014 one gap for rows and columns",
  "style.gapControl.rowGap": "Row gap",
  "style.gapControl.rows": "Rows",
  "style.gapControl.unlinked": "Unlinked \u2014 separate row and column gaps",
  "style.gradientCode.layerCode": "Layer code",
  "style.gradientCode.preview": "Preview",
  "style.gradientControls.closestCorner": "Closest corner",
  "style.gradientControls.closestSide": "Closest side",
  "style.gradientControls.dragAngle": "Drag to set the angle",
  "style.gradientControls.farthestCorner": "Farthest corner",
  "style.gradientControls.farthestSide": "Farthest side",
  "style.gradientControls.gradientAngle": "Gradient angle",
  "style.gradientControls.gradientSize": "Gradient size",
  "style.gradientControls.rotateCcw": "Rotate counterclockwise",
  "style.gradientControls.rotateCcwTitle": "Rotate \u221245\xB0",
  "style.gradientControls.rotateCw": "Rotate clockwise",
  "style.gradientControls.rotateCwTitle": "Rotate +45\xB0",
  "style.gradientControls.tipClosestCorner": "Closest corner extends the gradient from the defined position to the closest corner.",
  "style.gradientControls.tipClosestSide": "Closest side extends the gradient from the defined position to the closest side.",
  "style.gradientControls.tipFarthestCorner": "Farthest corner extends the gradient from the defined position to the farthest corner.",
  "style.gradientControls.tipFarthestSide": "Farthest side extends the gradient from the defined position to the farthest side.",
  "style.gradientEditor.angle": "Angle",
  "style.gradientEditor.color": "Color",
  "style.gradientEditor.gradientAngle": "Gradient angle",
  "style.gradientEditor.left": "Left",
  "style.gradientEditor.position": "Position",
  "style.gradientEditor.positionLeft": "Position left",
  "style.gradientEditor.positionTop": "Position top",
  "style.gradientEditor.repeat": "Repeat",
  "style.gradientEditor.reverseGradientStops": "Reverse gradient stops",
  "style.gradientEditor.reverseStops": "Reverse stops",
  "style.gradientEditor.size": "Size",
  "style.gradientEditor.stopAt": "Stop {number} at {percent}%",
  "style.gradientEditor.stopColor": "Stop color",
  "style.gradientEditor.stopPosition": "Stop position",
  "style.gradientEditor.top": "Top",
  "style.gridAreas.addArea": "Add an area",
  "style.gridAreas.areaName": "Area name",
  "style.gridAreas.areas": "Areas",
  "style.gridAreas.columnCaption": "Column: start/end",
  "style.gridAreas.columnEnd": "Column end",
  "style.gridAreas.columnStart": "Column start",
  "style.gridAreas.name": "Name",
  "style.gridAreas.noAreas": "No Areas",
  "style.gridAreas.position": "Position",
  "style.gridAreas.removeArea": "Remove area",
  "style.gridAreas.rowCaption": "Row: start/end",
  "style.gridAreas.rowEnd": "Row end",
  "style.gridAreas.rowStart": "Row start",
  "style.gridAutoSection.gridSettings": "Grid settings",
  "style.gridAutoSection.noteColumns": "Define the sizing for all automatically created columns.",
  "style.gridAutoSection.noteRows": "Define the sizing for all automatically created rows.",
  "style.gridAutoSection.okGotIt": "Ok, got it",
  "style.gridControls.align": "Align",
  "style.gridControls.alignAt": "Align {horizontal} {vertical}",
  "style.gridControls.alignAxis": "Align {axis}",
  "style.gridControls.columns": "Columns",
  "style.gridControls.configureGrid": "Configure grid",
  "style.gridControls.connectTracks": "Connect {name} to a variable",
  "style.gridControls.custom": "Custom",
  "style.gridControls.direction": "Direction",
  "style.gridControls.grid": "Grid",
  "style.gridControls.gridColumns": "Grid columns",
  "style.gridControls.gridRows": "Grid rows",
  "style.gridControls.rows": "Rows",
  "style.gridControls.switchToCount": "Switch to count",
  "style.gridControls.switchToCountBody": "Replace this value with {count} equal tracks? You can undo it.",
  "style.gridControls.switchToCountTitle": "Switch to a count?",
  "style.gridControls.trackExpressionEmpty": "Enter a track list, such as repeat(3, 1fr).",
  "style.gridControls.trackExpressionMalformed": "This is not a valid track list. Check the parentheses and brackets.",
  "style.gridFlowControls.autoFlow": "Grid auto flow",
  "style.gridFlowControls.autoFlowPlaceholder": "e.g. row dense",
  "style.gridFlowControls.custom": "Custom",
  "style.gridFlowControls.customValuePlaceholder": "custom value",
  "style.gridFlowControls.decrease": "Decrease",
  "style.gridFlowControls.dense": "Dense \u2014 backfill earlier gaps in the grid",
  "style.gridFlowControls.gridDirection": "Grid direction",
  "style.gridFlowControls.horizontal": "Horizontal",
  "style.gridFlowControls.increase": "Increase",
  "style.gridFlowControls.moreDirectionOptions": "More direction options",
  "style.gridFlowControls.moreOptions": "More {name} options",
  "style.gridFlowControls.vertical": "Vertical",
  "style.gridIcons.alignContent": "Align Content: {value}",
  "style.gridIcons.baseline": "Baseline",
  "style.gridIcons.bottom": "Bottom",
  "style.gridIcons.center": "Center",
  "style.gridIcons.end": "End",
  "style.gridIcons.horizontal": "Horizontal",
  "style.gridIcons.justifyContent": "Justify Content: {value}",
  "style.gridIcons.left": "Left",
  "style.gridIcons.right": "Right",
  "style.gridIcons.spaceAround": "Space around",
  "style.gridIcons.spaceBetween": "Space between",
  "style.gridIcons.spaceEvenly": "Space evenly",
  "style.gridIcons.start": "Start",
  "style.gridIcons.stretch": "Stretch",
  "style.gridIcons.top": "Top",
  "style.gridIcons.vertical": "Vertical",
  "style.gridSettings.autoColumns": "Auto-generated columns",
  "style.gridSettings.autoRows": "Auto-generated rows",
  "style.gridSettings.columns": "Columns",
  "style.gridSettings.countAria": "{title} count",
  "style.gridSettings.expressionAria": "{title} expression",
  "style.gridSettings.modeAria": "{title} mode",
  "style.gridSettings.modeCount": "Count",
  "style.gridSettings.modeCustom": "Custom",
  "style.gridSettings.modeSubgrid": "Subgrid",
  "style.gridSettings.rows": "Rows",
  "style.gridSettings.subgridOn": "These tracks come from the parent grid. It needs a grid parent, with this element spanning its tracks.",
  "style.keywordConnect.variable": "Variable\u2026",
  "style.layerList.dragToReorder": "Drag to reorder",
  "style.layerList.editLayer": "Edit layer",
  "style.layerList.hide": "Hide",
  "style.layerList.hideLayer": "Hide layer",
  "style.layerList.removeLayer": "Remove layer",
  "style.layerList.show": "Show",
  "style.layerList.showLayer": "Show layer",
  "style.liveTextInput.connect": "Connect {name} to a variable",
  "style.liveTextInput.value": "value",
  "style.objectFitFields.cellBottom": "bottom",
  "style.objectFitFields.cellCenter": "Center",
  "style.objectFitFields.cellLeft": "Left",
  "style.objectFitFields.cellMiddle": "center",
  "style.objectFitFields.cellRight": "Right",
  "style.objectFitFields.cellTop": "top",
  "style.objectFitFields.clear": "Clear",
  "style.objectFitFields.connect": "Connect {name} to a variable",
  "style.objectFitFields.custom": "Custom",
  "style.objectFitFields.imageFit": "Image fit",
  "style.objectFitFields.left": "Left",
  "style.objectFitFields.objectFit": "Object fit",
  "style.objectFitFields.objectFitValue": "Object fit value",
  "style.objectFitFields.objectPosition": "Object position",
  "style.objectFitFields.position": "Position",
  "style.objectFitFields.positionCell": "{horizontal} {vertical}",
  "style.objectFitFields.positionLeft": "Object position left",
  "style.objectFitFields.positionPreset": "Object position preset",
  "style.objectFitFields.positionSettings": "Object position settings",
  "style.objectFitFields.positionTop": "Object position top",
  "style.objectFitFields.top": "Top",
  "style.opacityRow.connectOpacity": "Connect Opacity to a variable",
  "style.opacityRow.opacity": "Opacity",
  "style.positionSection.bottomEdge": "Bottom edge",
  "style.positionSection.bottomLeft": "Bottom left",
  "style.positionSection.bottomRight": "Bottom right",
  "style.positionSection.clear": "Clear",
  "style.positionSection.clearProperty": "Clear",
  "style.positionSection.connect": "Connect {name} to a variable",
  "style.positionSection.connectPosition": "Connect Position to a variable",
  "style.positionSection.custom": "Custom",
  "style.positionSection.customValuePlaceholder": "custom value",
  "style.positionSection.fill": "Fill",
  "style.positionSection.float": "Float",
  "style.positionSection.leftEdge": "Left edge",
  "style.positionSection.pinTo": "Pin to",
  "style.positionSection.position": "Position",
  "style.positionSection.positionValue": "Position value",
  "style.positionSection.rightEdge": "Right edge",
  "style.positionSection.topEdge": "Top edge",
  "style.positionSection.topLeft": "Top left",
  "style.positionSection.topRight": "Top right",
  "style.positionSegments.clearBoth": "Clear both",
  "style.positionSegments.clearLeft": "Clear left",
  "style.positionSegments.clearNone": "None",
  "style.positionSegments.clearRight": "Clear right",
  "style.positionSegments.connect": "Connect {name} to a variable",
  "style.positionSegments.custom": "Custom",
  "style.positionSegments.customValuePlaceholder": "custom value",
  "style.positionSegments.floatLeft": "Float left",
  "style.positionSegments.floatNone": "None",
  "style.positionSegments.floatRight": "Float right",
  "style.positionSegments.moreOptions": "More {name} options",
  "style.provenanceList.edit": "Edit {selector}",
  "style.provenanceList.selectOnCanvas": "Select {name} on the canvas",
  "style.provenanceList.styleAttribute": "Style attribute",
  "style.provenanceList.loss.condition": "Not in use: its media query or condition does not match right now",
  "style.provenanceList.loss.importance": "Overridden by {selector}: that declaration is !important",
  "style.provenanceList.loss.inline": "Overridden by the element\u2019s style attribute",
  "style.provenanceList.loss.layer": "Overridden by {selector}: this one is in a lower layer",
  "style.provenanceList.loss.specificity": "Overridden by {selector}: lower specificity",
  "style.provenanceList.loss.order": "Overridden by {selector}: earlier in source order",
  "style.provenanceList.loss.other": "Overridden by {selector}: the page applies that declaration instead",
  "style.provenanceList.usedValue": "Used value (source not listed)",
  "style.provenanceList.usedValueIn": "Used value from {condition} (source not listed)",
  "style.provenanceList.usedValueTip": "The page uses this value, but no rule listed here produces it. It may come from the browser, a script, another query or a rule Stacki could not read.",
  "style.radiusControl.borderRadius": "Border radius",
  "style.radiusControl.bottomLeft": "Bottom left",
  "style.radiusControl.bottomRight": "Bottom right",
  "style.radiusControl.cornerRadius": "{corner} radius",
  "style.radiusControl.radius": "Radius",
  "style.radiusControl.topLeft": "Top left",
  "style.radiusControl.topRight": "Top right",
  "style.segmentedField.custom": "Custom",
  "style.segmentedField.customValuePlaceholder": "custom value",
  "style.segmentedField.moreOptions": "More options",
  "style.segmentedField.value": "Value",
  "style.shadowFields.color": "Color",
  "style.shadowFields.connect": "Connect {name} to a variable",
  "style.shadowFields.shadowColor": "Shadow color",
  "style.sizeKit.clear": "Clear",
  "style.sizeKit.connect": "Connect {name} to a variable",
  "style.sizeKit.height": "Height",
  "style.sizeKit.maxHeight": "Max H",
  "style.sizeKit.maxWidth": "Max W",
  "style.sizeKit.minHeight": "Min H",
  "style.sizeKit.minWidth": "Min W",
  "style.sizeKit.overriddenBy": "Overridden by {selector}",
  "style.sizeKit.width": "Width",
  "style.sizeSection.auto": "Auto",
  "style.sizeSection.borderBox": "Border box",
  "style.sizeSection.boxSize": "Box size",
  "style.sizeSection.boxSizing": "Box sizing",
  "style.sizeSection.boxSizingValue": "Box sizing value",
  "style.sizeSection.clip": "Clip",
  "style.sizeSection.contentBox": "Content box",
  "style.sizeSection.hidden": "Hidden",
  "style.sizeSection.hideAxes": "Hide overflow X and Y",
  "style.sizeSection.moreBoxSizingOptions": "More box-sizing options",
  "style.sizeSection.moreOverflowOptions": "More overflow options",
  "style.sizeSection.overflow": "Overflow",
  "style.sizeSection.overflowValue": "Overflow value",
  "style.sizeSection.overflowX": "Overflow X",
  "style.sizeSection.overflowY": "Overflow Y",
  "style.sizeSection.perAxis": "Per-axis overflow (X / Y)",
  "style.sizeSection.scroll": "Scroll",
  "style.sizeSection.showAxes": "Show overflow X and Y",
  "style.sizeSection.tooltipAuto": "<strong>Auto</strong> only displays a scrollbar when content overflows.",
  "style.sizeSection.tooltipBorderBox": "<strong>Border-box</strong> makes the width and height of the element include the content, padding, and border. The overall dimensions of the box do not increase regardless of padding and border sizes.",
  "style.sizeSection.tooltipClip": "<strong>Clip</strong> clips content to the element's padding box, similar to <strong>hidden</strong>, but it also prevents any scrolling of the overflowed content, including programmatic scrolling.",
  "style.sizeSection.tooltipContentBox": "<strong>Content-box</strong> makes the width and height of the element include only the content. Padding and border sizes are added to the outside of the box's dimensions.",
  "style.sizeSection.tooltipHidden": "<strong>Hidden</strong> hides overflowing content without adding a scrollbar.",
  "style.sizeSection.tooltipScroll": "<strong>Scroll</strong> always displays a scrollbar for overflowing content.",
  "style.sizeSection.tooltipVisible": "<strong>Visible</strong> shows content that overflows its container.",
  "style.sizeSection.visible": "Visible",
  "style.sizeSegmentBar.custom": "Custom",
  "style.sizeSegmentBar.customValuePlaceholder": "custom value",
  "style.spacingEditor.connect": "Connect {name} to a variable",
  "style.spacingEditor.optionClick": "Option + click",
  "style.spacingLabel.bottom": "Bottom",
  "style.spacingLabel.left": "Left",
  "style.spacingLabel.marginBottom": "Margin bottom",
  "style.spacingLabel.marginLeft": "Margin left",
  "style.spacingLabel.marginRight": "Margin right",
  "style.spacingLabel.marginTop": "Margin top",
  "style.spacingLabel.paddingBottom": "Padding bottom",
  "style.spacingLabel.paddingLeft": "Padding left",
  "style.spacingLabel.paddingRight": "Padding right",
  "style.spacingLabel.paddingTop": "Padding top",
  "style.spacingLabel.right": "Right",
  "style.spacingLabel.top": "Top",
  "style.spacingSection.centerAria": "Center horizontally (margin left and right auto)",
  "style.spacingSection.centerTitle": "Center element horizontally. Requires fixed width.",
  "style.spacingSection.margin": "Margin",
  "style.spacingSection.padding": "Padding",
  "style.stylePanel.loadError": "Could not load stylesheet sources. {error}",
  "style.stylePanel.elementChanged": "This element changed while the next one was loading, so nothing was written. Try again.",
  "style.stylePanel.selectElement": "Select an element to style it.",
  "style.textStrokeShadow.addShadow": "Add a shadow",
  "style.textStrokeShadow.addTextShadow": "Add a text shadow",
  "style.textStrokeShadow.blur": "Blur",
  "style.textStrokeShadow.color": "Color",
  "style.textStrokeShadow.stroke": "Stroke",
  "style.textStrokeShadow.strokeColor": "Stroke color",
  "style.textStrokeShadow.strokeWidth": "Stroke width",
  "style.textStrokeShadow.textShadow": "Text shadow",
  "style.textStrokeShadow.textShadows": "Text shadows",
  "style.textStrokeShadow.width": "Width",
  "style.textWrapRows.breaking": "Breaking",
  "style.textWrapRows.custom": "Custom\u2026",
  "style.textWrapRows.line": "Line",
  "style.textWrapRows.lineBreaking": "Line breaking",
  "style.textWrapRows.textWrap": "Text wrap",
  "style.textWrapRows.truncate": "Truncate",
  "style.textWrapRows.word": "Word",
  "style.textWrapRows.wordBreaking": "Word breaking",
  "style.textWrapRows.wrap": "Wrap",
  "style.trackEditor.autoFit": "Auto-fit",
  "style.trackEditor.autoFitWarning": "Auto-fit can\u2019t be enabled when there are auto, flexible (FR), minmax(auto, fr), minmax(auto, auto), or other auto-fit columns or rows.",
  "style.trackEditor.connect": "Connect {name} to a variable",
  "style.trackEditor.max": "Max",
  "style.trackEditor.min": "Min",
  "style.trackEditor.size": "Size",
  "style.trackEditor.sizing": "Sizing",
  "style.trackEditor.sizingDefault": "Default",
  "style.trackEditor.sizingMinMax": "Min/Max",
  "style.trackEditor.trackMax": "Track max",
  "style.trackEditor.trackMin": "Track min",
  "style.trackEditor.trackSize": "Track size",
  "style.trackEditor.trackSizing": "Track sizing",
  "style.transformSettings.backface": "Backface",
  "style.transformSettings.backfaceVisibility": "Backface visibility",
  "style.transformSettings.childrenPerspective": "Children perspective",
  "style.transformSettings.childrenPerspectiveDistance": "Children perspective distance",
  "style.transformSettings.childrenPerspectiveNote": "Depth for this element's CHILDREN, so they share one viewpoint. It does nothing to the element itself.",
  "style.transformSettings.clear": "Clear",
  "style.transformSettings.connect": "Connect {name} to a variable",
  "style.transformSettings.distance": "Distance",
  "style.transformSettings.hidden": "Hidden",
  "style.transformSettings.left": "Left",
  "style.transformSettings.origin": "Origin",
  "style.transformSettings.perspectiveOrigin": "Perspective origin",
  "style.transformSettings.selfPerspective": "Self perspective",
  "style.transformSettings.selfPerspectiveDistance": "Self perspective distance",
  "style.transformSettings.selfPerspectiveNote": "Depth for this element's own transform \u2014 written as perspective() at the front of the transform list.",
  "style.transformSettings.top": "Top",
  "style.transformSettings.transformOrigin": "Transform origin",
  "style.transformSettings.transformSettings": "Transform settings",
  "style.transformSettings.visible": "Visible",
  "style.transformsRow.addBackdropFilter": "Add a backdrop filter",
  "style.transformsRow.addFilter": "Add a filter",
  "style.transformsRow.addTransform": "Add a transform",
  "style.transformsRow.connect": "Connect {name} to a variable",
  "style.transformsRow.linkXY": "Link X & Y",
  "style.transformsRow.linkXYAria": "Link X and Y",
  "style.transformsRow.move": "Move",
  "style.transformsRow.rotate": "Rotate",
  "style.transformsRow.scale": "Scale",
  "style.transformsRow.skew": "Skew",
  "style.transformsRow.transform": "Transform",
  "style.transformsRow.transformSettings": "Transform settings",
  "style.transformsRow.transformType": "Transform type",
  "style.transformsRow.transforms": "Transforms",
  "style.transformsRow.transforms2d3d": "2D & 3D transforms",
  "style.transformsRow.type": "Type",
  "style.transformsRow.unlinkXY": "Unlink X & Y",
  "style.transformsRow.unlinkXYAria": "Unlink X and Y",
  "style.transitionsRow.addTransition": "Add transition",
  "style.transitionsRow.duration": "Duration",
  "style.transitionsRow.easing": "Easing",
  "style.transitionsRow.editEasing": "Edit easing",
  "style.transitionsRow.transition": "Transition",
  "style.transitionsRow.transitionType": "Transition type",
  "style.transitionsRow.transitions": "Transitions",
  "style.transitionsRow.type": "Type",
  "style.typographyColumns.clear": "Clear",
  "style.typographyColumns.close": "Close",
  "style.typographyColumns.color": "Color",
  "style.typographyColumns.columnChild": "Column child",
  "style.typographyColumns.columnSpan": "Column span",
  "style.typographyColumns.columns": "Columns",
  "style.typographyColumns.dividerColor": "Divider color",
  "style.typographyColumns.dividerSettings": "Divider settings",
  "style.typographyColumns.dividerStyle": "Divider style",
  "style.typographyColumns.gap": "Gap",
  "style.typographyColumns.letterSpacing": "Letter spacing",
  "style.typographyColumns.overriddenBy": "Overridden by {selector}",
  "style.typographyColumns.ruleDashed": "Dashed",
  "style.typographyColumns.ruleDotted": "Dotted",
  "style.typographyColumns.ruleNone": "None",
  "style.typographyColumns.ruleSolid": "Solid",
  "style.typographyColumns.setColor": "Set a color",
  "style.typographyColumns.span": "Span",
  "style.typographyColumns.spanNo": "Don't",
  "style.typographyColumns.spanYes": "Do",
  "style.typographyColumns.style": "Style",
  "style.typographyColumns.textIndent": "Text indent",
  "style.typographyColumns.width": "Width",
  "style.typographyKit.clear": "Clear",
  "style.typographyKit.custom": "Custom",
  "style.typographyKit.customAria": "Custom {name}",
  "style.typographyKit.customValuePlaceholder": "custom value",
  "style.typographyKit.moreOptions": "More {name} options",
  "style.typographyKit.overriddenBy": "Overridden by {selector}",
  "style.typographySection.align": "Align",
  "style.typographySection.alignCenter": "Center",
  "style.typographySection.alignJustify": "Justify",
  "style.typographySection.alignLeft": "Left",
  "style.typographySection.alignRight": "Right",
  "style.typographySection.capitalize": "Capitalize",
  "style.typographySection.color": "Color",
  "style.typographySection.decor": "Decor",
  "style.typographySection.decorNone": "None",
  "style.typographySection.decorOverline": "Overline",
  "style.typographySection.decorStrike": "Strikethrough",
  "style.typographySection.decorUnderline": "Underline",
  "style.typographySection.decorationTitle": "Decoration & underline",
  "style.typographySection.direction": "Direction",
  "style.typographySection.directionLtr": "Left to right",
  "style.typographySection.directionRtl": "Right to left",
  "style.typographySection.fontStyle": "Font style",
  "style.typographySection.height": "Height",
  "style.typographySection.italicize": "Italicize",
  "style.typographySection.size": "Size",
  "style.typographySection.styleItalic": "Italic",
  "style.typographySection.styleRegular": "Regular",
  "style.typographySection.textAlign": "Text align",
  "style.typographySection.textColor": "Text color",
  "style.typographySection.textDecoration": "Text decoration",
  "style.typographySection.textDirection": "Text direction",
  "style.typographySection.textTransform": "Text transform",
  "style.typographySection.transformCapitalize": "Capitalize Every Word",
  "style.typographySection.transformLower": "lowercase",
  "style.typographySection.transformNone": "None",
  "style.typographySection.transformUpper": "ALL CAPS",
  "style.variableHint.inheritedAria": "Inherited {name}: choose variable",
  "style.variableHint.inheritedTitle": "Inherited: {value}",
  "style.variablePicker.computesTo": "Computes to {value} on this element",
  "style.variablePicker.connectToVariable": "Connect to variable",
  "style.variablePicker.groupVariables": "Group variables",
  "style.variablePicker.declaredIn": "{name}: {value} (declared in {file} on {selector})",
  "style.variablePicker.declaredOn": "{name}: {value} (declared on {selector})",
  "style.variablePicker.localScope": "This element",
  "style.variablePicker.noVariables": "No variables found.",
  "style.variablePicker.notValidForProperty": "Not a valid value for this property",
  "style.variablePicker.otherGroup": "Other",
  "style.variablePicker.overriddenHere": "Overridden on this element",
  "style.variablePicker.search": "Search variables",
  "style.variablePicker.searchPlaceholder": "Search variables, functions",
  "style.variablePicker.showAll": "Show all variables",
  "style.variablePicker.viewOptions": "View options"
};

// vendor/stacki/shared/properties/i18n/messages/en/styleModel.ts
var messages35 = {
  "styleModel.background.layer.colorOverlay": "Color overlay",
  "styleModel.background.layer.conic": "Conic gradient",
  "styleModel.background.layer.image": "Image",
  "styleModel.background.layer.linear": "Linear gradient",
  "styleModel.background.layer.other": "Layer",
  "styleModel.background.layer.radial": "Radial gradient",
  "styleModel.boxShadow.inner": "Inner shadow: {lengths}",
  "styleModel.boxShadow.outer": "Outer shadow: {lengths}",
  "styleModel.breakpoint.large": "Desktop \u22651280",
  "styleModel.breakpoint.main": "Base",
  "styleModel.breakpoint.medium": "Tablet",
  "styleModel.breakpoint.small": "Mobile (L)",
  "styleModel.breakpoint.tiny": "Mobile",
  "styleModel.breakpoint.xl": "Desktop \u22651440",
  "styleModel.breakpoint.xxl": "Desktop \u22651920",
  "styleModel.clipPath.breakpoint.large": "1280px and up",
  "styleModel.clipPath.breakpoint.main": "Desktop",
  "styleModel.clipPath.breakpoint.medium": "Tablet",
  "styleModel.clipPath.breakpoint.small": "Mobile landscape",
  "styleModel.clipPath.breakpoint.tiny": "Mobile portrait",
  "styleModel.clipPath.breakpoint.xl": "1440px and up",
  "styleModel.clipPath.breakpoint.xxl": "1920px and up",
  "styleModel.clipPath.codeLabel": "Editable clip-path CSS",
  "styleModel.clipPath.corner.bottomLeft": "bottom left",
  "styleModel.clipPath.corner.bottomRight": "bottom right",
  "styleModel.clipPath.corner.topLeft": "top left",
  "styleModel.clipPath.corner.topRight": "top right",
  "styleModel.clipPath.edge.bottom": "bottom",
  "styleModel.clipPath.edge.left": "left",
  "styleModel.clipPath.edge.right": "right",
  "styleModel.clipPath.edge.top": "top",
  "styleModel.clipPath.fit": "Fit",
  "styleModel.clipPath.fit.containerHint": "Apply {code} to the parent",
  "styleModel.clipPath.fit.scale": "Scale",
  "styleModel.clipPath.fit.stretch": "Stretch",
  "styleModel.clipPath.handle.circleCenter": "Circle center. Drag or use arrow keys to move.",
  "styleModel.clipPath.handle.circleRadius": "Circle radius. Drag or use arrow keys to resize.",
  "styleModel.clipPath.handle.ellipseCenter": "Ellipse center. Drag or use arrow keys to move.",
  "styleModel.clipPath.handle.ellipseCenterAdjust": "Ellipse center. Drag or use arrow keys to adjust.",
  "styleModel.clipPath.handle.ellipseRx": "Ellipse horizontal radius. Drag or use any arrow key to resize.",
  "styleModel.clipPath.handle.ellipseRxAdjust": "Ellipse horizontal radius. Drag or use arrow keys to adjust.",
  "styleModel.clipPath.handle.ellipseRy": "Ellipse vertical radius. Drag or use any arrow key to resize.",
  "styleModel.clipPath.handle.ellipseRyAdjust": "Ellipse vertical radius. Drag or use arrow keys to adjust.",
  "styleModel.clipPath.handle.insetEdge": "Inset {edge} edge. Drag or use arrow keys to resize. Hold Shift for all sides or Option for this side and the opposite side.",
  "styleModel.clipPath.handle.insetEdgeRaw": "Inset edge. Drag or use arrow keys to resize.",
  "styleModel.clipPath.handle.insetRadius": "Inset {corner} corner radius. Drag or use arrow keys to adjust. Hold U to unlock separate horizontal and vertical radii. Hold Shift for all corners or Option for this corner and the opposite corner.",
  "styleModel.clipPath.handle.insetRadiusAdjust": "Inset {corner} corner radius. Drag or use arrow keys to adjust.",
  "styleModel.clipPath.handle.moveShape": "Move shape",
  "styleModel.clipPath.handle.pointMove": "Point {number}. Drag or use arrow keys to move.",
  "styleModel.clipPath.handle.pointRemove": "Point {number}. Drag to move, double-click to remove. Use arrow keys to move when selected.",
  "styleModel.clipPath.handle.resizeShape": "Resize shape from {corner} corner",
  "styleModel.clipPath.label": "Clip Path",
  "styleModel.clipPath.preset.circle": "Circle",
  "styleModel.clipPath.preset.custom": "Custom",
  "styleModel.clipPath.preset.ellipse": "Ellipse",
  "styleModel.clipPath.preset.inset": "Inset",
  "styleModel.clipPath.preset.none": "None",
  "styleModel.clipPath.preset.polygon": "Polygon",
  "styleModel.clipPath.preset.shape": "Shape",
  "styleModel.clipPath.shortcut.adjustAll": "Adjust all sides together.",
  "styleModel.clipPath.shortcut.adjustOpposite": "Adjust this side and its opposite side together.",
  "styleModel.clipPath.shortcut.adjustSide": "Adjust the selected side.",
  "styleModel.clipPath.shortcut.deletePoints": "Delete selected points (3 must remain).",
  "styleModel.clipPath.shortcut.dragSelectPoints": "Drag to select over multiple points.",
  "styleModel.clipPath.shortcut.duplicateDrag": "Duplicate a point by dragging it while holding option/alt.",
  "styleModel.clipPath.shortcut.duplicatePoint": "Duplicate the selected point.",
  "styleModel.clipPath.shortcut.editRaw": "Edit the raw clip-path value.",
  "styleModel.clipPath.shortcut.group.center": "Center",
  "styleModel.clipPath.shortcut.group.corners": "Corners",
  "styleModel.clipPath.shortcut.group.general": "General",
  "styleModel.clipPath.shortcut.group.radius": "Radius",
  "styleModel.clipPath.shortcut.group.sides": "Sides",
  "styleModel.clipPath.shortcut.keys.altDragArrows": "Option/Alt + drag/arrow keys",
  "styleModel.clipPath.shortcut.keys.altDragCorner": "Option/Alt + drag corner",
  "styleModel.clipPath.shortcut.keys.altDragPoint": "Option/Alt + drag point",
  "styleModel.clipPath.shortcut.keys.arrowKeys": "Arrow keys",
  "styleModel.clipPath.shortcut.keys.codeEditor": "Code editor",
  "styleModel.clipPath.shortcut.keys.dragArrows": "drag/arrow keys",
  "styleModel.clipPath.shortcut.keys.dragArrowsCapital": "Drag/arrow keys",
  "styleModel.clipPath.shortcut.keys.dragCorner": "Drag corner",
  "styleModel.clipPath.shortcut.keys.dragSelect": "Drag to select",
  "styleModel.clipPath.shortcut.keys.dropdown": "Dropdown",
  "styleModel.clipPath.shortcut.keys.pasteSvg": "Paste SVG",
  "styleModel.clipPath.shortcut.keys.shiftClickPoint": "Shift + click point",
  "styleModel.clipPath.shortcut.keys.shiftDragArrows": "Shift + drag/arrow keys",
  "styleModel.clipPath.shortcut.keys.spaceArrowKeys": "Space + Arrow keys",
  "styleModel.clipPath.shortcut.keys.stretchMode": "Stretch mode",
  "styleModel.clipPath.shortcut.keys.uDragArrows": "U + drag/arrow keys",
  "styleModel.clipPath.shortcut.matchCorners": "Match all corners to this one.",
  "styleModel.clipPath.shortcut.moveCenter": "Move the center.",
  "styleModel.clipPath.shortcut.moveHandle": "Move the selected handle by 1%.",
  "styleModel.clipPath.shortcut.moveShape": "Move the shape.",
  "styleModel.clipPath.shortcut.moveTen": "Move by 10% instead of 1%.",
  "styleModel.clipPath.shortcut.pasteBuild": "Paste an SVG to build a shape.",
  "styleModel.clipPath.shortcut.pasteEditable": "Paste an SVG to make it editable.",
  "styleModel.clipPath.shortcut.pickPreset": "Pick a preset to start editing.",
  "styleModel.clipPath.shortcut.redo": "Redo the last change.",
  "styleModel.clipPath.shortcut.resizeCenter": "Resize from the center.",
  "styleModel.clipPath.shortcut.resizeOpposite": "Resize toward the opposite corner.",
  "styleModel.clipPath.shortcut.resizeRadius": "Resize the radius.",
  "styleModel.clipPath.shortcut.resizeSelectedRadius": "Resize the selected radius.",
  "styleModel.clipPath.shortcut.roundCorner": "Round the selected corner.",
  "styleModel.clipPath.shortcut.roundOpposite": "Round this corner and its opposite together.",
  "styleModel.clipPath.shortcut.scaleRadii": "Scale both radii, keeping the aspect ratio.",
  "styleModel.clipPath.shortcut.selectMultiple": "Select multiple points.",
  "styleModel.clipPath.shortcut.separateRadii": "Set horizontal and vertical radius separately.",
  "styleModel.clipPath.shortcut.switchToScale": "Switch to Scale to move or resize.",
  "styleModel.clipPath.shortcut.undo": "Undo the last change.",
  "styleModel.clipPath.shortcuts.heading": "Shortcuts",
  "styleModel.clipPath.shortcuts.show": "Show Clip Path shortcuts",
  "styleModel.clipPath.shortcuts.title": "Clip Path shortcuts",
  "styleModel.clipPath.sourceLabel": "Clip path value source",
  "styleModel.clipPath.tagEdit": "Edit clip path on .{name} \u2014 Shift/Option-click to combine",
  "styleModel.clipPath.tagEditing": "Editing clip path on {selector}",
  "styleModel.clipPath.variable.offsetX": "Offset X",
  "styleModel.clipPath.variable.offsetXTip": "Optional variable to animate or shift the shape horizontally (0 = left, 1 = right).",
  "styleModel.clipPath.variable.offsetY": "Offset Y",
  "styleModel.clipPath.variable.offsetYTip": "Optional variable to animate or shift the shape vertically (0 = top, 1 = bottom).",
  "styleModel.clipPath.variable.size": "Size",
  "styleModel.clipPath.variable.sizeTip": "This optional variable allows us to animate shape size or change size based on screen size",
  "styleModel.components.classPicker.combine": "{name} \u2014 Shift-click to combine",
  "styleModel.components.classPicker.tokens": "Selected element tokens",
  "styleModel.components.colorPicker.channelLabel": "Written as {mode}. Press for {other}",
  "styleModel.components.colorPicker.channelTitle": "Toggle rgb() / hsl()",
  "styleModel.components.colorPicker.eyedropper": "Eyedropper",
  "styleModel.components.colorPicker.eyedropperTitle": "Pick a color from the screen",
  "styleModel.components.colorPicker.hexTitle": "Write this colour as hex",
  "styleModel.components.colorPicker.title": "Color picker",
  "styleModel.components.colorSwatch.label": "Choose color",
  "styleModel.components.inherited.label": "Inherited {property}",
  "styleModel.components.inherited.select": "Select {label}",
  "styleModel.components.position.cell": "Position {x} {y}",
  "styleModel.components.position.group": "Position",
  "styleModel.components.select.noMatches": "No matches",
  "styleModel.components.select.hasStyles": "Has styles here",
  "styleModel.components.select.search": "Search",
  "styleModel.components.select.searchNamed": "Search {label}",
  "styleModel.css.noRule": "No CSS rule found in the edited text.",
  "styleModel.embed.add.button": "Add property",
  "styleModel.embed.add.cancel": "Cancel adding property",
  "styleModel.embed.add.newName": "New property name",
  "styleModel.embed.add.newValue": "New value",
  "styleModel.embed.add.propertyPlaceholder": "property",
  "styleModel.embed.add.suggestions": "CSS properties",
  "styleModel.embed.add.value": "Value",
  "styleModel.embed.add.valuePlaceholder": "value",
  "styleModel.embed.branch.declarations": "Style declarations {branch}; changes save automatically",
  "styleModel.embed.branch.editing": "Editing: {branch}",
  "styleModel.embed.branch.pickerLabel": "Branch of the style attribute to edit",
  "styleModel.embed.card.addIn": "Add custom styles in:",
  "styleModel.embed.card.addQuery": "Add query",
  "styleModel.embed.card.followCanvas": "Follow canvas size",
  "styleModel.embed.card.followCanvasFollow": "Follow the canvas size (0)",
  "styleModel.embed.card.followCanvasHold": "Stop following the canvas size (0)",
  "styleModel.embed.card.other": "Other",
  "styleModel.embed.card.context": "Style context",
  "styleModel.embed.card.editQuery": "Edit {query}",
  "styleModel.embed.card.fetching": "Fetching embeds\u2026",
  "styleModel.embed.card.noElement": "No element selected",
  "styleModel.embed.card.searchEmbeds": "Search embeds\u2026",
  "styleModel.embed.card.source": "Style source \u2014 the Webflow class or embed edits go to",
  "styleModel.embed.card.styleTagDefaults": "New style locations\u2026",
  "styleModel.embed.card.unsaved": "Unsaved",
  "styleModel.embed.card.unsavedTip": "Not yet saved \u2014 applies when you exit the component",
  "styleModel.embed.chip.clear": "Clear inline styles",
  "styleModel.embed.chip.labelCode": "{label}, written as code",
  "styleModel.embed.chip.options": "Inline styles options",
  "styleModel.embed.chip.titleActive": "{label} \u2014 click to deselect",
  "styleModel.embed.chip.titleCode": "{label} \u2014 written as code, edited in Settings",
  "styleModel.embed.chip.titleIdle": "{label} \u2014 this element\u2019s style attribute",
  "styleModel.embed.hook.classNotOnElement": "{selector} is not on the element ({reason}), so its rule was not written.",
  "styleModel.embed.hook.invalidCss": "Invalid CSS: {reason}",
  "styleModel.embed.hook.nativeApplyFailed": "Webflow wouldn\u2019t apply {prop} to this class natively \u2014 saved it to the embed instead.",
  "styleModel.embed.hook.nativeApplyFailedReason": "Webflow wouldn\u2019t apply {prop} to this class natively ({reason}) \u2014 saved it to the embed instead.",
  "styleModel.embed.hook.nativeCreateFailed": "Webflow wouldn\u2019t create .{className} as a class \u2014 saved it to the embed instead.",
  "styleModel.embed.hook.nativeCreateFailedReason": "Webflow wouldn\u2019t create .{className} as a class ({reason}) \u2014 saved it to the embed instead.",
  "styleModel.embed.hook.pageCannotTakeClass": "This page cannot take a class here.",
  "styleModel.embed.inline.changedShape": "The style attribute changed shape; pick the chip again to edit it.",
  "styleModel.embed.inline.writesTo": "Edits {file} \xB7 all instances",
  "styleModel.embed.layout.align": "Align",
  "styleModel.embed.layout.categoriesAnd": "{rest} and {last}",
  "styleModel.embed.layout.category.component": "component",
  "styleModel.embed.layout.category.global": "global",
  "styleModel.embed.layout.category.inherited": "inherited",
  "styleModel.embed.layout.category.instance": "instance",
  "styleModel.embed.layout.direction": "Direction",
  "styleModel.embed.layout.flexSettings": "Flex settings",
  "styleModel.embed.layout.gridSettings": "Grid settings",
  "styleModel.embed.layout.inlineSettings": "Inline settings",
  "styleModel.embed.layout.selectorLabel": "{label}, {categories} selector",
  "styleModel.embed.picker.addLabel": "Add a selector",
  "styleModel.embed.picker.addPlaceholder": "Add a selector (e.g. {example})",
  "styleModel.embed.picker.chipDeselect": "click to deselect",
  "styleModel.embed.picker.chipInstance": "from this instance",
  "styleModel.embed.picker.chipInstancePending": "from this instance, no styles yet",
  "styleModel.embed.picker.chipOtherQuery": "styled in another query",
  "styleModel.embed.picker.chipPending": "no styles yet",
  "styleModel.embed.picker.chipRemoved": "Removed {name}",
  "styleModel.embed.picker.classRefusal": "Check the class name and retry.",
  "styleModel.embed.picker.create": "Create {name}",
  "styleModel.embed.picker.finding": "Finding the selectors that style this element\u2026",
  "styleModel.embed.picker.hideGlobals": "Hide global selectors ({count})",
  "styleModel.embed.picker.hideGlobalsPending": "Hide global selectors",
  "styleModel.embed.picker.hideGlobalsTip": "Tags, universal selectors, and broad states can match many elements",
  "styleModel.embed.picker.hideInherited": "Hide inherited styles ({count})",
  "styleModel.embed.picker.hideInheritedPending": "Hide inherited styles",
  "styleModel.embed.picker.hideInheritedTip": "Selectors that apply because this element is inside a matching parent or ancestor",
  "styleModel.embed.picker.kind.attribute": "attribute",
  "styleModel.embed.picker.kind.class": "class",
  "styleModel.embed.picker.kind.combo": "combo",
  "styleModel.embed.picker.kind.tag": "tag",
  "styleModel.embed.picker.suggestions": "Selector suggestions",
  "styleModel.embed.query.add": "Add",
  "styleModel.embed.query.mobileFirst": "Mobile first",
  "styleModel.embed.query.desktopFirst": "Desktop first",
  "styleModel.embed.query.direction": "Query direction",
  "styleModel.embed.query.breakpoints": "Breakpoints",
  "styleModel.embed.query.alreadyAdded": "Already added",
  "styleModel.embed.query.custom": "Custom",
  "styleModel.embed.query.customPlaceholder": "40rem or 1100px",
  "styleModel.embed.query.willAdd": "Will add {query}",
  "styleModel.embed.query.willAddRem": "Will add {query} (px written as rem)",
  "styleModel.embed.query.invalidSyntax": "Type a width such as 40rem or 1100px",
  "styleModel.embed.query.invalidPxWhole": "px widths are whole numbers; use rem for decimals",
  "styleModel.embed.query.invalidRange": "Out of range for a breakpoint",
  "styleModel.embed.query.attributeReadOnly": "The style attribute, read-only",
  "styleModel.embed.query.attributeSource": "style attribute",
  "styleModel.embed.query.blocksIn": { one: "{count} block in {source}", other: "{count} blocks in {source}" },
  "styleModel.embed.query.codeCollapse": "Collapse CSS Code",
  "styleModel.embed.query.codeExpand": "Expand CSS Code",
  "styleModel.embed.query.codeTitle": "CSS Code",
  "styleModel.embed.query.editableCss": "Editable CSS for {rule}; changes save automatically",
  "styleModel.embed.query.howToAdd": "How to add the query",
  "styleModel.embed.query.matching": "CSS matching this element",
  "styleModel.embed.query.nest": "Nest",
  "styleModel.embed.query.nestTip": "Inside the selector \u2014 {code}",
  "styleModel.embed.query.noRules": "No matching CSS rules.",
  "styleModel.embed.query.pickToNest": "Pick a selector to nest inside it.",
  "styleModel.embed.query.query": "Query",
  "styleModel.embed.query.rename": "Rename",
  "styleModel.embed.query.suggestions": "Query suggestions",
  "styleModel.embed.query.wrap": "Wrap",
  "styleModel.embed.query.wrapTip": "New block \u2014 {code}",
  "styleModel.embed.row.alignY": "Align Y",
  "styleModel.embed.row.alignYApplies": "Align Y applies when Display is inline or table-cell",
  "styleModel.embed.row.collapse": "Collapse {label}",
  "styleModel.embed.row.display": "Display",
  "styleModel.embed.row.expand": "Expand {label}",
  "styleModel.embed.row.hasOtherStyles": "{label} has styles from another selector",
  "styleModel.embed.row.hasOwnStyles": "{label} has styles on this selector",
  "styleModel.embed.row.overriddenBy": "Overridden by {selector}",
  "styleModel.embed.row.removeProperty": "Remove property",
  "styleModel.embed.row.selectorsSetting": "Selectors setting {property}",
  "styleModel.embed.row.setBy": "Set by {selector} \u2014 click to see all selectors",
  "styleModel.embed.row.setOnOther": "Set on another selector",
  "styleModel.embed.row.setOnThis": "Set on this selector",
  "styleModel.embed.row.valign.baseline": "Baseline",
  "styleModel.embed.row.valign.bottom": "Bottom",
  "styleModel.embed.row.valign.middle": "Middle",
  "styleModel.embed.row.valign.sub": "Sub",
  "styleModel.embed.row.valign.super": "Super",
  "styleModel.embed.row.valign.textBottom": "Text bottom",
  "styleModel.embed.row.valign.textTop": "Text top",
  "styleModel.embed.row.valign.top": "Top",
  "styleModel.embed.save.saved": "All changes saved",
  "styleModel.embed.save.saving": "Saving\u2026",
  "styleModel.embed.save.unsaved": "Unsaved changes",
  "styleModel.embed.source.createStyleTag": "Create {tag}",
  "styleModel.embed.source.component": "Component",
  "styleModel.filter.group.colorAdjustments": "Color adjustments",
  "styleModel.filter.group.colorEffects": "Color effects",
  "styleModel.filter.group.general": "General",
  "styleModel.filter.type.blur": "Blur",
  "styleModel.filter.type.brightness": "Brightness",
  "styleModel.filter.type.contrast": "Contrast",
  "styleModel.filter.type.dropShadow": "Drop shadow",
  "styleModel.filter.type.grayscale": "Grayscale",
  "styleModel.filter.type.hueRotate": "Hue rotate",
  "styleModel.filter.type.invert": "Invert",
  "styleModel.filter.type.saturate": "Saturation",
  "styleModel.filter.type.sepia": "Sepia",
  "styleModel.grid.area.position": "{name} Row {row} / Col {column}",
  "styleModel.grid.track.auto": "Auto",
  "styleModel.grid.track.minMax": "Min/Max: {min} / {max}",
  "styleModel.inline.branch.always": "always",
  "styleModel.inline.branch.otherwise": "otherwise",
  "styleModel.inline.branch.otherwiseWhen": "otherwise ({condition})",
  "styleModel.inline.branch.otherwiseWhenSet": "otherwise ({name} is set)",
  "styleModel.inline.branch.when": "when {condition}",
  "styleModel.inline.branch.whenSet": "when {name} is set",
  "styleModel.inline.label": "Inline styles",
  "styleModel.inline.reason.componentUnreadable": "The component that writes this style could not be read.",
  "styleModel.inline.reason.fromProp": "A branch gives a value from a prop rather than text, so it is edited in Settings.",
  "styleModel.inline.reason.onlyChain": "Only a chain of conditions, each giving a text or template, can be edited here.",
  "styleModel.inline.reason.rendersNothing": "This style attribute renders nothing.",
  "styleModel.inline.reason.tooLongToEdit": "This style attribute is too long to edit here.",
  "styleModel.inline.reason.unplaceable": "This conditional is written in a way the panel cannot place its branches in.",
  "styleModel.inline.reason.unreadable": "This style attribute is not a plain list of declarations.",
  "styleModel.inline.refusal.backtick": "A value cannot hold a ` here.",
  "styleModel.inline.refusal.breaksCode": "That edit would break the style attribute\u2019s code.",
  "styleModel.inline.refusal.declaredTwice": "{property} is declared twice in the style attribute. Edit it in Settings.",
  "styleModel.inline.refusal.notDeclarations": "The style attribute is not a list of declarations yet: check its colons, brackets and quotes.",
  "styleModel.inline.refusal.notPlainList": "The style attribute is not a plain list of declarations. Edit it in Settings.",
  "styleModel.inline.refusal.semicolon": "A value cannot hold a \u201C;\u201D of its own here.",
  "styleModel.inline.refusal.tooLong": "That would make the style attribute too long.",
  "styleModel.inline.refusal.tooLongToEdit": "This style attribute is too long to edit here. Edit it in Settings.",
  "styleModel.inline.refusal.valueBreaks": "That value would break the style attribute. Check its brackets and quotes.",
  "styleModel.native.cssProject": "This project styles with CSS \u2014 write to a stylesheet.",
  "styleModel.navigate.livesInComponent": "These styles live in {label} \u2014 open that component to see them in the tree.",
  "styleModel.navigate.livesInPage": "These styles live in {label} \u2014 open that page to see them in the tree.",
  "styleModel.navigate.nothing": "Nothing to select.",
  "styleModel.navigate.stylesheet": "{label} is a stylesheet \u2014 open it from the Assets panel.",
  "styleModel.sections.backgrounds": "Backgrounds",
  "styleModel.sections.borders": "Borders",
  "styleModel.sections.effects": "Effects",
  "styleModel.sections.flexChild": "Flex/Grid Child",
  "styleModel.sections.layout": "Layout",
  "styleModel.sections.other": "Other properties",
  "styleModel.sections.position": "Position",
  "styleModel.sections.size": "Size",
  "styleModel.sections.spacing": "Spacing",
  "styleModel.sections.typography": "Typography",
  "styleModel.shared.connectVariable": "Connect {label} to a variable",
  "styleModel.shared.optionClick": "Option + click",
  "styleModel.shared.valueComesFrom": "Value comes from:",
  "styleModel.textShadow.label": "Text shadow: {x} {y} {blur}",
  "styleModel.transform.origin.bottom": "Bottom",
  "styleModel.transform.origin.bottomLeft": "Bottom left",
  "styleModel.transform.origin.bottomRight": "Bottom right",
  "styleModel.transform.origin.center": "Center",
  "styleModel.transform.origin.left": "Left",
  "styleModel.transform.origin.right": "Right",
  "styleModel.transform.origin.top": "Top",
  "styleModel.transform.origin.topLeft": "Top left",
  "styleModel.transform.origin.topRight": "Top right",
  "styleModel.transform.type.move": "Move",
  "styleModel.transform.type.rotate": "Rotate",
  "styleModel.transform.type.scale": "Scale",
  "styleModel.transform.type.skew": "Skew",
  "styleModel.transition.group.advanced": "Advanced",
  "styleModel.transition.group.background": "Background",
  "styleModel.transition.group.borders": "Borders",
  "styleModel.transition.group.common": "Common",
  "styleModel.transition.group.flex": "Flex",
  "styleModel.transition.group.margin": "Margin",
  "styleModel.transition.group.padding": "Padding",
  "styleModel.transition.group.position": "Position",
  "styleModel.transition.group.size": "Size",
  "styleModel.transition.group.typography": "Typography",
  "styleModel.transition.prop.all": "All Properties",
  "styleModel.transition.prop.backgroundColor": "Background Color",
  "styleModel.transition.prop.backgroundPosition": "Background Position",
  "styleModel.transition.prop.border": "Border",
  "styleModel.transition.prop.borderColor": "Border Color",
  "styleModel.transition.prop.borderRadius": "Border Radius",
  "styleModel.transition.prop.borderWidth": "Border Width",
  "styleModel.transition.prop.bottom": "Bottom",
  "styleModel.transition.prop.boxShadow": "Box Shadow",
  "styleModel.transition.prop.color": "Font Color",
  "styleModel.transition.prop.filter": "Filter",
  "styleModel.transition.prop.flex": "Flex",
  "styleModel.transition.prop.flexBasis": "Flex Basis",
  "styleModel.transition.prop.flexGrow": "Flex Grow",
  "styleModel.transition.prop.flexShrink": "Flex Shrink",
  "styleModel.transition.prop.fontSize": "Font Size",
  "styleModel.transition.prop.fontVariationSettings": "Font Variations",
  "styleModel.transition.prop.height": "Height",
  "styleModel.transition.prop.left": "Left",
  "styleModel.transition.prop.letterSpacing": "Letter Spacing",
  "styleModel.transition.prop.lineHeight": "Line Height",
  "styleModel.transition.prop.margin": "Margin",
  "styleModel.transition.prop.marginBottom": "Margin Bottom",
  "styleModel.transition.prop.marginLeft": "Margin Left",
  "styleModel.transition.prop.marginRight": "Margin Right",
  "styleModel.transition.prop.marginTop": "Margin Top",
  "styleModel.transition.prop.maxHeight": "Max Height",
  "styleModel.transition.prop.maxWidth": "Max Width",
  "styleModel.transition.prop.minHeight": "Min Height",
  "styleModel.transition.prop.minWidth": "Min Width",
  "styleModel.transition.prop.opacity": "Opacity",
  "styleModel.transition.prop.padding": "Padding",
  "styleModel.transition.prop.paddingBottom": "Padding Bottom",
  "styleModel.transition.prop.paddingLeft": "Padding Left",
  "styleModel.transition.prop.paddingRight": "Padding Right",
  "styleModel.transition.prop.paddingTop": "Padding Top",
  "styleModel.transition.prop.right": "Right",
  "styleModel.transition.prop.textDecorationColor": "Text Decoration Color",
  "styleModel.transition.prop.textIndent": "Text Indent",
  "styleModel.transition.prop.textShadow": "Text Shadow",
  "styleModel.transition.prop.textUnderlineOffset": "Text Underline Offset",
  "styleModel.transition.prop.top": "Top",
  "styleModel.transition.prop.transform": "Transform",
  "styleModel.transition.prop.webkitTextStrokeColor": "Text Stroke Color",
  "styleModel.transition.prop.width": "Width",
  "styleModel.transition.prop.wordSpacing": "Word Spacing",
  "styleModel.transition.prop.zIndex": "z-Index",
  "styleModel.write.blockMissing": "Couldn\u2019t find that {tag} block in the open file.",
  "styleModel.write.noPage": "No page open to write into.",
  "styleModel.write.nothingToAdd": "There is no style to add yet.",
  "styleModel.write.pageCannotTakeBlock": "This page cannot take a style block here.",
  "styleModel.write.unsupportedFile": "This page has no place for a style block. Add a stylesheet to the project, or style it from an .astro page."
};

// vendor/stacki/shared/properties/i18n/messages/en/ui.ts
var messages36 = {
  "ui.apply": "Apply",
  "ui.assetField.chooseAsset": "Choose Asset\u2026",
  "ui.assetField.chooseAudio": "Choose Audio\u2026",
  "ui.assetField.chooseImage": "Choose Image\u2026",
  "ui.assetField.chooseVideo": "Choose Video\u2026",
  "ui.assetField.componentFallback": "Component fallback",
  "ui.assetField.external": "external",
  "ui.assetField.fileNotFound": "file not found",
  "ui.assetField.modeAsset": "Asset",
  "ui.assetField.modeAssetTitle": "Choose a file from this project",
  "ui.assetField.modePlainTitle": "Enter a plain value (external URL, expression, anything)",
  "ui.assetField.noneSelected": "No asset selected",
  "ui.assetField.notFoundIn": "not found in {folder}",
  "ui.assetPick.title.asset": "Choose a file",
  "ui.assetPick.title.audio": "Choose an audio file",
  "ui.assetPick.title.image": "Choose an image",
  "ui.assetPick.title.video": "Choose a video",
  "ui.cancel": "Cancel",
  "ui.choose": "Choose\u2026",
  "ui.close": "Close",
  "ui.codeAccess.managed": "Managed by Developer",
  "ui.continue": "Continue",
  "ui.dataTree.nextItem": "Next item",
  "ui.dataTree.previousItem": "Previous item",
  "ui.dataTree.search": "Search data\u2026",
  "ui.dateField.label": "Date",
  "ui.dateTime.choose": "Choose {label}",
  "ui.dateTime.goToToday": "Go to today",
  "ui.dateTime.hour": "Hour",
  "ui.dateTime.minute": "Minute",
  "ui.dateTime.nextMonth": "Next month",
  "ui.dateTime.noDate": "No date chosen",
  "ui.dateTime.openCalendar": "Open calendar",
  "ui.dateTime.openCalendarClock": "Open calendar and clock",
  "ui.dateTime.previousMonth": "Previous month",
  "ui.dateTime.tabDate": "Date",
  "ui.dateTime.tabTime": "Time",
  "ui.dateTime.today": "Today",
  "ui.dockableWindow.dock": "Dock window",
  "ui.dockableWindow.moveHint": "Move window with arrow keys",
  "ui.dockableWindow.undock": "Undock window",
  "ui.dropdown.more": "{count} more, keep typing",
  "ui.dropdown.noMatch": "Nothing matches",
  "ui.handoff.copied": "Prompt copied. Paste it into your coding agent.",
  "ui.handoff.failed": "Couldn\u2019t hand this off: {reason}",
  "ui.handoff.sent": "Sent to {where}.",
  "ui.htmlField.characters": { one: "{count} character", other: "{count} characters" },
  "ui.htmlField.hint": "## heading \xB7 - list \xB7 > quote \xB7 **bold** \xB7 `code` \xB7 {shortcut} link",
  "ui.htmlField.label": "Rich text",
  "ui.htmlField.placeholder": "Write, or type ## for a heading\u2026",
  "ui.htmlField.restricted": "This HTML includes markup that cannot be edited visually. Use HTML to preserve it.",
  "ui.htmlField.words": { one: "{count} word", other: "{count} words" },
  "ui.htmlLink.address": "Link address",
  "ui.htmlLink.edit": "Edit link",
  "ui.htmlLink.open": "Open link",
  "ui.htmlLink.placeholder": "Paste or type a link\u2026",
  "ui.htmlLink.remove": "Remove link",
  "ui.htmlSource.ariaLabel": "{label} HTML",
  "ui.htmlToolbar.ariaLabel": "Text formatting",
  "ui.htmlToolbar.backToVisual": "Back to the visual editor",
  "ui.htmlToolbar.bold": "Bold",
  "ui.htmlToolbar.bulletedList": "Bulleted list",
  "ui.htmlToolbar.clearFormatting": "Clear formatting",
  "ui.htmlToolbar.codeBlock": "Code block",
  "ui.htmlToolbar.divider": "Divider",
  "ui.htmlToolbar.editSource": "Edit the {source}",
  "ui.htmlToolbar.format": "Format",
  "ui.htmlToolbar.formatTitle": "Lay the HTML out to read",
  "ui.htmlToolbar.heading": "Heading {level}",
  "ui.htmlToolbar.inlineCode": "Inline code",
  "ui.htmlToolbar.italic": "Italic",
  "ui.htmlToolbar.link": "Link",
  "ui.htmlToolbar.numberedList": "Numbered list",
  "ui.htmlToolbar.paragraph": "Paragraph",
  "ui.htmlToolbar.quote": "Quote",
  "ui.htmlToolbar.redo": "Redo",
  "ui.htmlToolbar.strikethrough": "Strikethrough",
  "ui.htmlToolbar.subscript": "Subscript",
  "ui.htmlToolbar.superscript": "Superscript",
  "ui.htmlToolbar.textStyle": "Text style",
  "ui.htmlToolbar.underline": "Underline",
  "ui.htmlToolbar.undo": "Undo",
  "ui.htmlToolbar.visual": "Visual",
  "ui.infoLabel.about": "About {label}",
  "ui.loading": "Loading",
  "ui.multiSelect.closeOptions": "Close options",
  "ui.multiSelect.openOptions": "Open options",
  "ui.multiSelect.options": "Options",
  "ui.multiSelect.remove": "Remove {label}",
  "ui.multiSelect.typeToFilter": "{label}: type to filter",
  "ui.open": "Open",
  "ui.overrideNote.title": "Opens in {owner}. Alt-click for Stacki's own picker.",
  "ui.overrideNote.via": "via {owner}",
  "ui.page.fallback": "Page",
  "ui.page.home": "Home",
  "ui.page.template": "{name} Template",
  "ui.panelBoundary.retry": "Try again",
  "ui.panelBoundary.title": "{name} hit an error",
  "ui.panelStatus.loading": "Loading {label}\u2026",
  "ui.remove": "Remove",
  "ui.repositoryPicker.choose": "Choose a repository\u2026",
  "ui.repositoryPicker.errorHint": "{message} Install GitHub CLI and run gh auth login.",
  "ui.repositoryPicker.label": "Existing GitHub repository",
  "ui.repositoryPicker.loading": "Loading repositories\u2026",
  "ui.repositoryPicker.ownerName": "Repository owner/name",
  "ui.repositoryPicker.recent": "Recent GitHub repositories",
  "ui.repositoryPicker.search": "Search repositories\u2026",
  "ui.reset": "Reset",
  "ui.resetLabel.title": "Click for Reset. \u2325-click to clear value.",
  "ui.resetLabel.toDefault": "Reset to default property value",
  "ui.retry": "Retry",
  "ui.search": "Search\u2026",
  "ui.shortcutRecorder.pressKeys": "Press keys\u2026",
  "ui.windowResize.e": "Resize window (right)",
  "ui.windowResize.n": "Resize window (top)",
  "ui.windowResize.ne": "Resize window (top right)",
  "ui.windowResize.nw": "Resize window (top left)",
  "ui.windowResize.s": "Resize window (bottom)",
  "ui.windowResize.se": "Resize window (bottom right)",
  "ui.windowResize.sw": "Resize window (bottom left)",
  "ui.windowResize.w": "Resize window (left)"
};

// vendor/stacki/shared/properties/i18n/messages/en/variables.ts
var messages37 = {
  "variables.cell.chooseColor": "Choose the colour for {name}",
  "variables.cell.editCurve": "Edit the curve for {name}",
  "variables.count": { one: "1 variable", other: "{count} variables" },
  "variables.dragToReorder": "Drag to reorder",
  "variables.error.add": "Could not add that.",
  "variables.error.alreadyDeclared": "{name} is already declared in {selector}.",
  "variables.error.alreadyExists": "{name} already exists.",
  "variables.error.badVariableName": '"{name}" cannot be a variable name.',
  "variables.error.changedSincePanelRead": "This file changed since the panel read it.",
  "variables.error.collaboratorChanged": "A collaborator changed this source. Refresh and try again.",
  "variables.error.delete": "Could not delete that.",
  "variables.error.duplicate": "Could not duplicate that.",
  "variables.error.headingCannotContainCommentEnd": 'A heading cannot contain "*/".',
  "variables.error.headingNeedsName": "A heading needs a name.",
  "variables.error.headingNotComment": "That heading is no longer a comment.",
  "variables.error.move": "Could not move that.",
  "variables.error.notDeclared": "{name} is no longer declared there.",
  "variables.error.notVariableName": "{name} is not a variable name.",
  "variables.error.nothingToHead": "{selector} has nothing to head.",
  "variables.error.outsideStyleBlock": "That would change the file outside its {tag} block, so it was not saved.",
  "variables.error.parse": "Could not parse \u2014 {detail}",
  "variables.error.placeGone": "That place is no longer in the file.",
  "variables.error.prefixHeading": "This heading is a name prefix, not a CSS comment.",
  "variables.error.rename": "Could not rename that.",
  "variables.error.renamedTwice": "{name} is renamed twice in one go.",
  "variables.error.restart": "Stacki needs to be restarted before this can be used.",
  "variables.error.restoreRename": "Could not restore the rename.",
  "variables.error.restoreStylesheet": "Could not restore that stylesheet.",
  "variables.error.ruleGone": "{selector} is no longer in {file}.",
  "variables.error.ruleInSeveralBlocks": "{selector} is in more than one {tag} block of {file}. Edit this one in the code.",
  "variables.error.sameNameTwice": "Two variables would both be called {name}.",
  "variables.error.styleBlockLine": "The {tag} block on line {line}: {detail}",
  "variables.error.variablesNotDeclared": "Those variables are no longer declared there.",
  "variables.error.write": "Could not write that value.",
  "variables.fluid.error": "Does not reach 2x of its original size at a 500% zoom. Reduce difference between max and min variable size.",
  "variables.fluid.labelError": "Accessibility error: {message}",
  "variables.fluid.labelWarning": "Accessibility warning: {message}",
  "variables.fluid.readWhy": "Read why",
  "variables.fluid.warning": "Shrinks when increasing zoom. Increase difference between max and min viewport size.",
  "variables.group.options": "Group options",
  "variables.head.name": "Name",
  "variables.head.value": "Value",
  "variables.hidden.indicator": "Hidden from variable suggestions",
  "variables.menu.delete": "Delete",
  "variables.menu.duplicate": "Duplicate",
  "variables.menu.rename": "Rename",
  "variables.modes": { one: "1 mode", other: "{count} modes" },
  "variables.name.clickToRename": "Click to rename",
  "variables.name.dragOrRename": "{name} \u2014 drag to move, click to rename",
  "variables.new": "New variable",
  "variables.noMatches": "Nothing matches the search.",
  "variables.panel.allFiles": "All files",
  "variables.panel.cssVariables": "CSS variables",
  "variables.panel.empty": "No CSS custom properties found in this project\u2019s stylesheets or {tag} tags.",
  "variables.saved": "Saved",
  "variables.scope.page": "This page",
  "variables.scope.pageDetail": "Declared in a {tag} on this page, so it applies on this page only.",
  "variables.scope.rendered": "Where rendered",
  "variables.scope.renderedDetail": "Declared in a {tag} in this file, so it applies only on pages that render it.",
  "variables.scope.scoped": "This file only",
  "variables.scope.scopedDetail": "Astro scopes this {tag}, so this rule reaches only the elements written in this file.",
  "variables.scope.writtenGlobal": "The block is is:global: Astro bundles it without scoping.",
  "variables.scope.writtenInline": "The block is is:inline: Astro leaves it in the page exactly as written.",
  "variables.scope.writtenScoped": "The block is a plain {tag}: :root, html, body and :global() stay unscoped, every other selector is scoped.",
  "variables.scroll.label": "Scroll variable values horizontally",
  "variables.search": "Search variables",
  "variables.settings.hideFromSuggestions": "Hide from variable suggestions",
  "variables.settings.showInSuggestions": "Show in variable suggestions",
  "variables.title": "Variables",
  "variables.type.color": "Colour",
  "variables.type.number": "Number",
  "variables.type.size": "Size",
  "variables.type.text": "Text",
  "variables.undo.deleteGroup": "deleting the group",
  "variables.undo.group": "the group",
  "variables.undo.groupRename": "the group rename",
  "variables.undo.heading": "the heading",
  "variables.undo.move": "the move",
  "variables.undo.rename": "the rename",
  "variables.undo.value": "the value",
  "variables.undo.variable": "the variable",
  "variables.visibility.blocked": "Variable suggestions are not being filtered: {detail} Hiding is paused so that file is not overwritten.",
  "variables.visibility.saveFailed": "Could not save which variables are hidden: {detail}"
};

// vendor/stacki/shared/properties/i18n/messages/en/welcome.ts
var messages38 = {
  "welcome.clone.busy": "Downloading\u2026",
  "welcome.clone.downloading": "Downloading repository\u2026",
  "welcome.clone.hint": "Choose a folder next. Stacki downloads a new local copy with its Git history.",
  "welcome.clone.invalid": "Enter a repository as owner/name.",
  "welcome.clone.submit": "Choose folder and download",
  "welcome.clone.title": "Open from GitHub",
  "welcome.creating": "Creating\u2026",
  "welcome.hero.moreOpen": "More ways to open a project",
  "welcome.hero.moreStart": "More ways to start a project",
  "welcome.hero.openFolder": "Open from folder",
  "welcome.hero.openGitHub": "Open from GitHub",
  "welcome.hero.startAstro": "Start from Astro",
  "welcome.hero.startLumos": "Start from Lumos",
  "welcome.packageManager": "Package manager",
  "welcome.project.ai": "Add AI agent files",
  "welcome.project.git": "Initialize a new git repository",
  "welcome.project.install": "Install dependencies",
  "welcome.project.question": "How would you like to start your new project?",
  "welcome.project.starting": "Starting\u2026",
  "welcome.project.submit": "Create Project",
  "welcome.project.title": "New Astro Project",
  "welcome.project.tryAgain": "Try again",
  "welcome.projectCreated": "Project created",
  "welcome.recent.remove": "Remove from recent projects",
  "welcome.siteCreated": "Site created",
  "welcome.siteName": "Site name",
  "welcome.starter.note": "Runs {command}, then starts a git history of its own \u2014 so publishing it later publishes your site, not a fork of the starter.",
  "welcome.starter.noteWithManager": "Runs {command}, installs it with {manager}, then starts a git history of its own \u2014 so publishing it later publishes your site, not a fork of the starter.",
  "welcome.starter.submit": "Create site",
  "welcome.starter.title": "Start from Lumos",
  "welcome.starter.unfinished": "The starter did not finish.",
  "welcome.template.basics.hint": "A basic, helpful starter project",
  "welcome.template.basics.label": "Basics",
  "welcome.template.blog.hint": "Content collections and post routing",
  "welcome.template.blog.label": "Blog",
  "welcome.template.minimal.hint": "Nothing but the essentials",
  "welcome.template.minimal.label": "Empty",
  "welcome.template.starlight.hint": "Astro\u2019s documentation theme",
  "welcome.template.starlight.label": "Docs (Starlight)",
  "welcome.working": "Working"
};

// vendor/stacki/shared/properties/i18n/messages/en/workspace.ts
var messages39 = {
  "workspace.code.close": "Close (edits are saved live)",
  "workspace.code.title": "Code",
  "workspace.notifications.dismiss": "Dismiss notification",
  "workspace.notifications.label": "Notifications",
  "workspace.notifications.loadMore": "Load more ({count})",
  "workspace.notifications.showFewer": "Show fewer",
  "workspace.terminal.close": "Close terminal",
  "workspace.terminal.custom": "Custom\u2026",
  "workspace.terminal.customPlaceholder": "e.g. bun run watch",
  "workspace.terminal.customTitle": "Run once in each new terminal",
  "workspace.terminal.hide": "Hide terminal ({shortcut})",
  "workspace.terminal.loading": "Loading terminal",
  "workspace.terminal.new": "New terminal",
  "workspace.terminal.resize": "Drag to resize",
  "workspace.terminal.scrollBottom": "Scroll to bottom",
  "workspace.terminal.shellOnly": "Shell only"
};

// vendor/stacki/shared/properties/i18n/messages/en/index.ts
var messages40 = {
  ...messages,
  ...messages2,
  ...messages3,
  ...messages4,
  ...messages5,
  ...messages6,
  ...messages7,
  ...messages8,
  ...messages9,
  ...messages10,
  ...messages11,
  ...messages12,
  ...messages13,
  ...messages14,
  ...messages15,
  ...messages16,
  ...messages17,
  ...messages18,
  ...messages19,
  ...messages20,
  ...messages21,
  ...messages22,
  ...messages23,
  ...messages24,
  ...messages25,
  ...messages26,
  ...messages27,
  ...messages28,
  ...messages29,
  ...messages30,
  ...messages31,
  ...messages32,
  ...messages33,
  ...messages34,
  ...messages35,
  ...messages36,
  ...messages37,
  ...messages38,
  ...messages39
};

// vendor/stacki/shared/properties/variantRules.ts
var VARIANT_LIMITS = {
  /** Options one controller may have: a union of more is a generated type, not a designer's list. */
  optionsMax: 64,
  /** Discriminated unions one component's props may combine, and the props that could key a new one. */
  groupsMax: 32,
  /** An option's characters: a word or two, written as a string literal. */
  valueCharsMax: 128,
  /** Props one group may rule: the props a component may have (VARIANT_LIMITS.propsMax). */
  propsMax: LIMITS.propSchemaFieldsMax,
  /** A prop's name, and a type or default as code (PROPERTY_LIMITS.nameCharsMax, textCharsMax). */
  nameCharsMax: 128,
  codeCharsMax: 32768,
  /** Times one edit applies itself again: a shape rewritten first (an interface to a type, a shared member split), then a switch's own steps. */
  editDepthMax: 4
};

// vendor/stacki/shared/properties/propertyEditing.ts
var PROPERTY_LIMITS = {
  fieldsMax: LIMITS.propSchemaFieldsMax,
  sourceCharsMax: 2 * 1024 * 1024,
  textCharsMax: 32768,
  nameCharsMax: 128,
  filesMax: 1e4,
  totalCharsMax: 32 * 1024 * 1024,
  nodesMax: 2e5
};

// vendor/stacki/electron/parse/propModel/propProse.ts
var NUMBER_RE = String.raw`-?\d+(?:\.\d+)?`, UNSIGNED_RE = String.raw`\d+(?:\.\d+)?`;

// vendor/stacki/electron/parse/propModel/propTypes.ts
var import_typescript3 = __toESM(require("typescript"), 1);
var PROP_TYPE_LIMITS = {
  aliasDepthMax: 12,
  partsMax: LIMITS.propOptionsMax * 2,
  constListsMax: 64
};
var OPAQUE_KEYWORDS = /* @__PURE__ */ new Set([
  import_typescript3.default.SyntaxKind.AnyKeyword,
  import_typescript3.default.SyntaxKind.UnknownKeyword,
  import_typescript3.default.SyntaxKind.ObjectKeyword,
  import_typescript3.default.SyntaxKind.SymbolKeyword,
  import_typescript3.default.SyntaxKind.BigIntKeyword,
  import_typescript3.default.SyntaxKind.NeverKeyword,
  import_typescript3.default.SyntaxKind.VoidKeyword
]);

// vendor/stacki/electron/parse/propModel/propReads.ts
var import_typescript5 = __toESM(require("typescript"), 1);

// vendor/stacki/electron/parse/astroParser.ts
function parsePage(source, options = {}) {
  if (typeof source != "string" || source.length > LIMITS.ipcFieldCharsMax)
    return {
      editable: !1,
      // i18n-ignore: diagnostic for a page that is not editable (carried for logs and tests); the code view states it in its own words.
      reason: "Page source is invalid or exceeds the size limit.",
      bail: void 0
    };
  let fence = readFence(source);
  if (fence.kind === "unreadable")
    return {
      editable: !1,
      // i18n-ignore: diagnostic for a page that is not editable (carried for logs and tests); the code view states it in its own words.
      reason: `Page contains markup the visual editor cannot represent. Found ${fence.what}.`,
      bail: { what: fence.what, near: fence.near }
    };
  let frontmatter = fence.kind === "fence" ? fence.code : "", hadFrontmatter = fence.kind === "fence", bodyStart = fence.kind === "fence" ? fence.length : source.startsWith("\uFEFF") ? 1 : 0, body = source.slice(bodyStart), eol = source.includes(`\r
`) ? `\r
` : `
`, frontmatterModel = readFrontmatter(frontmatter), { imports } = frontmatterModel;
  resetParseBail();
  let { nodes: topNodes, clean, trailingBlank } = parseTemplate(body, options.locs ? bodyStart : void 0);
  if (topNodes.length) {
    let blanks = ((body.match(/^(?:[ \t]*\r?\n)+/) || [""])[0].match(/\n/g) || []).length, first = required(topNodes[0], "First top-level node exists");
    blanks ? first.blankBefore = blanks : delete first.blankBefore;
  }
  if (!clean) {
    let where = "";
    if (parseState.lastBail) {
      let at = source.indexOf(parseState.lastBail.near), line = at === -1 ? 0 : source.slice(0, at).split(`
`).length;
      where = ` Found ${parseState.lastBail.what}${line ? ` on line ${line}` : ""}.`;
    }
    return {
      editable: !1,
      // i18n-ignore: diagnostic for a page that is not editable (carried for logs and tests); the code view states it in its own words.
      reason: `Page contains markup the visual editor cannot represent.${where}`,
      bail: parseState.lastBail ? { what: parseState.lastBail.what, near: parseState.lastBail.near } : void 0
    };
  }
  let importsByName = Object.fromEntries(imports.filter((i) => !i.typeOnly).map((i) => [i.name, i]));
  parsePageLayout(topNodes, importsByName), parsePageMarkDynamic(topNodes, importsByName, 0), assignPathIds(topNodes, "", 0), assertTreeInvariants(topNodes);
  let model = {
    ...frontmatterModel,
    hadFrontmatter,
    trailingBlank,
    eol,
    nodes: topNodes,
    // Only when offsets were asked for: it describes the file on disk, and
    // the live model is edited out from under it.
    ...options.locs ? { bodyStart } : {}
  }, refusal = writerRefusal(model);
  return refusal !== void 0 ? {
    editable: !1,
    // i18n-ignore: diagnostic for a page that is not editable (carried for logs and tests); the code view states it in its own words.
    reason: `Page contains markup the visual editor cannot represent. Found ${refusal}.`,
    bail: { what: refusal, near: "" }
  } : { editable: !0, model };
}
function writerRefusal(model) {
  try {
    parseSerializePage(model);
    return;
  } catch (failure) {
    return `a part of the page past the editor's limits (${failure instanceof Error ? failure.message : String(failure)})`;
  }
}
function serializeFrontmatter(model, lines, specFor) {
  let text2 = writeFrontmatter(model, specFor);
  text2 && lines.push(text2.replace(/\r?\n$/, ""));
}
function serializePageMarked(input, prefix = "", stamp = void 0, source = void 0) {
  let model = parseSerializePage(input), marks = chunkImportMarks(model), lines = ["---"];
  serializeFrontmatter(model, lines, (imp) => {
    let mark = /\.html\?raw$/i.test(imp.path) ? marks.get(imp.name) : void 0;
    return mark ? `${imp.path}&avb=${mark.path}${mark.group ? "&avbg=1" : ""}` : imp.path;
  }), lines.push("---");
  let roots = serializeNodesMarked(model.nodes, { pathOf: (i) => `${prefix}${i}`, atRoot: !0, stamp, source });
  return roots !== "" && lines.push(roots), lines.join(`
`) + `
`;
}
function parsePageMarkDynamic(list2, importsByName, depth) {
  assert(depth <= LIMITS.treeDepthMax, "parsePageMarkDynamic: depth limit");
  for (let node of list2) {
    if (node.kind === "component" && node.name !== "Fragment") {
      let imp = importsByName[node.name];
      imp ? imp.path === "astro:assets" && (node.astroAsset = !0) : node.dynamicTag = !0;
    }
    Array.isArray(node.children) && parsePageMarkDynamic(node.children, importsByName, depth + 1);
  }
}
function parsePageLayout(topNodes, importsByName) {
  let significant = topNodes.filter((node) => node.kind !== "comment"), wrapper, significantFirst = significant[0];
  if (significant.length === 1 && significantFirst !== void 0 && significantFirst.kind === "component" && significantFirst.name !== "Fragment" && significantFirst.children !== void 0 && importsByName[significantFirst.name])
    wrapper = significantFirst;
  else if (significant.length > 1) {
    let layoutish = significant.filter(
      (node) => node.kind === "component" && node.children !== void 0 && /layout/i.test(importsByName[node.name]?.path || "")
    );
    layoutish.length === 1 && (wrapper = layoutish[0]);
  }
  wrapper && (wrapper.id = "layout");
}

// vendor/stacki/electron/previewServer/scopeCapture.ts
var import_typescript7 = __toESM(require("typescript"), 1);

// vendor/stacki/shared/page/previewScope.ts
var SCOPE_STORE_KEY = "stacki.scope", PREVIEW_SCOPE_LIMITS = {
  // Files whose last render is kept. Each holds references to what its render
  // computed, so the bound is on memory the dev server keeps alive.
  filesMax: 128,
  // Names one file files and one answer samples: a page binds a handful of
  // values, and a frontmatter with more is generated code.
  namesMax: 64
};

// vendor/stacki/electron/previewServer/scopeCapture.ts
var SCOPE_CAPTURE_LIMITS = {
  // The record's own bound on names (shared/page/previewScope.ts).
  bindingsMax: PREVIEW_SCOPE_LIMITS.namesMax,
  // Destructuring patterns nest; deeper than this is not a page's frontmatter.
  patternDepthMax: 16
}, IDENTIFIER = /^[A-Za-z_$][\w$]*$/, NON_DATA_MODULE = /\.(?:astro|css|scss|sass|less|styl|stylus|pcss|postcss)(?:\?.*)?$/i, STORE_LOCAL = "__stackiScope";
function frontmatterBindings(frontmatter) {
  let file = parseFrontmatter(frontmatter);
  if (file === void 0)
    return [];
  let names = /* @__PURE__ */ new Set();
  for (let statement of file.statements) {
    if (SCOPE_CAPTURE_LIMITS.bindingsMax <= names.size)
      break;
    import_typescript7.default.isImportDeclaration(statement) ? importBindings(statement, names) : import_typescript7.default.isVariableStatement(statement) && variableBindings(statement, names);
  }
  let bindings = [...names].filter((name) => IDENTIFIER.test(name) && name !== STORE_LOCAL).slice(0, SCOPE_CAPTURE_LIMITS.bindingsMax);
  return assert(bindings.length <= SCOPE_CAPTURE_LIMITS.bindingsMax, "Captured bindings are bounded"), bindings;
}
function scopeCaptureStatement(file, names) {
  assert(names.length > 0, "A capture names at least one binding"), assert(names.length <= SCOPE_CAPTURE_LIMITS.bindingsMax, "A capture names a bounded number of bindings");
  for (let name of names)
    assert(IDENTIFIER.test(name), "A captured binding is an identifier"), assert(name !== STORE_LOCAL, "A captured binding is not the capture\u2019s own local");
  let key = JSON.stringify(SCOPE_STORE_KEY), target = JSON.stringify(file), getters = names.map((name) => `get ${name}(){return ${name}}`).join(",");
  return `;{const ${STORE_LOCAL}=globalThis[Symbol.for(${key})]||(globalThis[Symbol.for(${key})]=new Map());${STORE_LOCAL}.delete(${target});${STORE_LOCAL}.set(${target},{at:Date.now(),values:{${getters}}});if(${STORE_LOCAL}.size>${PREVIEW_SCOPE_LIMITS.filesMax}){${STORE_LOCAL}.delete(${STORE_LOCAL}.keys().next().value)}}`;
}
function withScopeCapture(marked, file) {
  let fence = /\r?\n---\r?\n/.exec(marked.slice(3));
  if (!marked.startsWith("---") || fence === null)
    return marked;
  let close = 3 + fence.index, names = frontmatterBindings(marked.slice(3, close));
  if (names.length === 0)
    return marked;
  let statement = scopeCaptureStatement(file, names), captured = `${marked.slice(0, close)}
${statement}${marked.slice(close)}`;
  return assert(captured.startsWith("---"), "The capture leaves the frontmatter fence first"), assert(captured.length === marked.length + statement.length + 1, "The capture only adds its own line"), captured;
}
function parseFrontmatter(frontmatter) {
  try {
    return import_typescript7.default.createSourceFile("frontmatter.ts", frontmatter, import_typescript7.default.ScriptTarget.Latest, !1, import_typescript7.default.ScriptKind.TS);
  } catch (error) {
    if (error instanceof RangeError)
      return;
    throw error;
  }
}
function importBindings(statement, names) {
  let clause = statement.importClause, from = import_typescript7.default.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : "";
  if (clause === void 0 || clause.isTypeOnly || NON_DATA_MODULE.test(from))
    return;
  clause.name !== void 0 && names.add(clause.name.text);
  let named = clause.namedBindings;
  if (named !== void 0) {
    if (import_typescript7.default.isNamespaceImport(named)) {
      names.add(named.name.text);
      return;
    }
    for (let element of named.elements)
      element.isTypeOnly || names.add(element.name.text);
  }
}
function variableBindings(statement, names) {
  if (!(import_typescript7.default.getModifiers(statement) ?? []).some((modifier) => modifier.kind === import_typescript7.default.SyntaxKind.DeclareKeyword))
    for (let declaration of statement.declarationList.declarations)
      bindingNames(declaration.name, names, 0);
}
function bindingNames(name, names, depth) {
  if (assert(depth <= SCOPE_CAPTURE_LIMITS.patternDepthMax, "Binding patterns nest within their bound"), import_typescript7.default.isIdentifier(name)) {
    names.add(name.text);
    return;
  }
  for (let element of name.elements)
    import_typescript7.default.isBindingElement(element) && depth < SCOPE_CAPTURE_LIMITS.patternDepthMax && bindingNames(element.name, names, depth + 1);
}

// vendor/stacki/electron/previewServer/styleBlockScan.ts
var STYLE_SCAN_LIMITS = {
  /** Characters in one file; a longer file is not scanned (uncertain). */
  sourceCharsMax: 32 * 1024 * 1024,
  /** Elements open at once; a deeper template is not scanned (uncertain). */
  elementDepthMax: 1024
};

// vendor/stacki/shared/page/variantOverride.ts
var VARIANT_SCOPE_GLOBAL = "__avbVariantScope";

// vendor/stacki/electron/previewServer/previewMarkers.ts
function markSourceFile(file, projectDirectories) {
  if (!file.endsWith(".astro"))
    return;
  let projectFile = projectDirectories.map((directory) => ({
    directory,
    relative: import_node_path2.default.relative(directory, file).split(import_node_path2.default.sep).join("/")
  })).find(({ relative }) => relative.startsWith("src/") || isDefaultsCanvas(relative));
  if (projectFile === void 0)
    return;
  let bytes = (0, import_node_fs2.readFileSync)(file), source = bytes.toString("utf8"), parsed = parsePage(source, { locs: !0 });
  if (!parsed.editable)
    return;
  resolveChunks(parsed.model, file);
  let relativePath = projectFile.relative;
  assert(stampPathProblem(relativePath) === void 0, "A file under src has a project-relative path");
  let page = relativePath.startsWith("src/pages/") || isDefaultsCanvas(relativePath), checksum = toDigest((0, import_node_crypto.createHash)("sha256").update(bytes).digest("hex")), stamp = { file: relativePath, checksum }, marked = serializePageMarked(parsed.model, page ? "" : `${relativePath}|`, stamp, source);
  assert(marked.endsWith(`
`), "The marked serializer ends on a line of its own");
  let captured = withScopeCapture(marked, relativePath);
  return assert(captured.endsWith(`
`), "The scope capture keeps the template\u2019s last line"), { code: `${captured.endsWith(`---
`) ? captured : captured.slice(0, -1)}${stampComment(stamp)}
`, source, page, file: relativePath };
}
var variantScope = new import_node_async_hooks.AsyncLocalStorage();
Reflect.set(globalThis, VARIANT_SCOPE_GLOBAL, variantScope);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  markSourceFile
});
