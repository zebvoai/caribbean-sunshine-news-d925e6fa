/**
 * In-body entity linker.
 * Scans article HTML for known entity mentions and links the FIRST occurrence
 * of each to its canonical internal page (/people/*, event pages, /category/*, geo, etc.).
 * Skips text already inside <a>, <h1-h6>, <code>, or <pre>.
 */

export interface EntityLink {
  /** Case-insensitive whole-word patterns matched in order. First match wins. */
  patterns: string[];
  /** Absolute internal path, e.g. "/people/roosevelt-skerrit". */
  href: string;
  /** Optional title attribute for the link. */
  title?: string;
}

const currentYear = new Date().getFullYear();

export const DEFAULT_ENTITY_LINKS: EntityLink[] = [
  // People — politicians
  { patterns: ["Roosevelt Skerrit", "Prime Minister Skerrit", "PM Skerrit"], href: "/people/roosevelt-skerrit", title: "Roosevelt Skerrit" },
  { patterns: ["Dame Eugenia Charles", "Eugenia Charles"], href: "/people/dame-eugenia-charles", title: "Dame Eugenia Charles" },
  { patterns: ["Patrick John"], href: "/people/patrick-john", title: "Patrick John" },
  { patterns: ["Lennox Linton"], href: "/author/lennox-linton", title: "Lennox Linton" },
  { patterns: ["Thomson Fontaine"], href: "/author/thomson-fontaine", title: "Thomson Fontaine" },

  // Institutions & parties
  { patterns: ["Dominica Labour Party", "DLP"], href: "/category/politics", title: "Dominica Labour Party (DLP)" },
  { patterns: ["United Workers Party", "UWP"], href: "/category/politics", title: "United Workers Party (UWP)" },
  { patterns: ["Eastern Caribbean Central Bank", "ECCB"], href: "/tag/eccb", title: "ECCB" },
  { patterns: ["CARICOM", "Caribbean Community"], href: "/category/caribbean", title: "CARICOM" },
  { patterns: ["OECS", "Organisation of Eastern Caribbean States"], href: "/category/caribbean", title: "OECS" },
  { patterns: ["Office of Disaster Management", "ODM"], href: "/category/weather", title: "Office of Disaster Management (ODM)" },
  { patterns: ["Dominica Meteorological Service", "Dominica Met Office"], href: "/category/weather", title: "Dominica Meteorological Service" },
  { patterns: ["National Hurricane Center", "NHC"], href: "/hurricane-season-dominica", title: "Hurricane Season Coverage" },

  // Places
  { patterns: ["Roseau"], href: "/roseau-news", title: "Roseau news" },
  { patterns: ["Portsmouth"], href: "/portsmouth-news", title: "Portsmouth news" },
  { patterns: ["Marigot"], href: "/category/dominica", title: "Marigot, Dominica" },
  { patterns: ["Kalinago Territory", "Carib Territory"], href: "/category/dominica", title: "Kalinago Territory" },
  { patterns: ["Nature Isle", "Commonwealth of Dominica"], href: "/category/dominica", title: "Commonwealth of Dominica" },

  // Events
  { patterns: ["World Creole Music Festival", "WCMF"], href: `/wcmf-${currentYear}`, title: `WCMF ${currentYear}` },
  { patterns: ["Dominica Carnival", "Mas Domnik"], href: `/dominica-carnival-${currentYear}`, title: `Dominica Carnival ${currentYear}` },
  { patterns: ["Miss Dominica"], href: `/miss-dominica-${currentYear}`, title: `Miss Dominica ${currentYear}` },
  { patterns: ["hurricane season", "Atlantic hurricane season"], href: "/hurricane-season-dominica", title: "Dominica hurricane season" },
  { patterns: ["general election", "general elections"], href: "/dominica-elections", title: "Dominica elections coverage" },

  // Topical
  { patterns: ["Citizenship by Investment", "CBI programme", "CBI program"], href: "/tag/cbi", title: "Dominica CBI" },
  { patterns: ["obituary", "obituaries", "death announcement"], href: "/obituaries", title: "Dominica Obituaries" },
];

const SKIP_TAGS = new Set(["A", "H1", "H2", "H3", "H4", "H5", "H6", "CODE", "PRE", "SCRIPT", "STYLE"]);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apply entity links to raw article HTML.
 * Runs in the browser using DOMParser. Returns original HTML on any failure or SSR.
 */
export function applyEntityLinks(html: string, links: EntityLink[] = DEFAULT_ENTITY_LINKS): string {
  if (!html || typeof window === "undefined" || typeof DOMParser === "undefined") return html;

  try {
    const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, "text/html");
    const root = doc.getElementById("__root");
    if (!root) return html;

    const used = new Set<number>(); // indices of links already applied

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName)) return;
        Array.from(el.childNodes).forEach(walk);
        return;
      }
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.nodeValue || "";
      if (!text.trim()) return;

      for (let i = 0; i < links.length; i++) {
        if (used.has(i)) continue;
        const link = links[i];
        const pattern = link.patterns.map(escapeRegex).join("|");
        const re = new RegExp(`\\b(${pattern})\\b`, "i");
        const m = re.exec(text);
        if (!m) continue;

        used.add(i);
        const before = text.slice(0, m.index);
        const matched = m[0];
        const after = text.slice(m.index + matched.length);

        const parent = node.parentNode;
        if (!parent) return;

        const anchor = doc.createElement("a");
        anchor.setAttribute("href", link.href);
        if (link.title) anchor.setAttribute("title", link.title);
        anchor.setAttribute("class", "entity-link");
        anchor.textContent = matched;

        if (before) parent.insertBefore(doc.createTextNode(before), node);
        parent.insertBefore(anchor, node);
        if (after) {
          const afterNode = doc.createTextNode(after);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
          walk(afterNode);
        } else {
          parent.removeChild(node);
        }
        return;
      }
    };

    Array.from(root.childNodes).forEach(walk);
    return root.innerHTML;
  } catch {
    return html;
  }
}

/**
 * Ensure every <img> in the given HTML has a non-empty alt attribute.
 * Adds `alt={fallback}` to images missing or with blank alt.
 */
export function ensureImageAlts(html: string, fallback: string): string {
  if (!html || !fallback) return html;
  // Add alt to imgs without an alt attribute
  let out = html.replace(/<img\b(?![^>]*\balt=)([^>]*?)>/gi, (_m, attrs) => `<img${attrs} alt="${escapeAttr(fallback)}">`);
  // Fill blank alt=""
  out = out.replace(/<img\b([^>]*?)\balt=""([^>]*?)>/gi, (_m, a, b) => `<img${a}alt="${escapeAttr(fallback)}"${b}>`);
  return out;
}

function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Extract h2/h3 headings from HTML for a Table of Contents. */
export function extractHeadings(html: string): { id: string; text: string; level: 2 | 3 }[] {
  if (!html || typeof window === "undefined" || typeof DOMParser === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const nodes = doc.querySelectorAll("h2, h3");
    const seen = new Set<string>();
    const out: { id: string; text: string; level: 2 | 3 }[] = [];
    nodes.forEach((n) => {
      const text = (n.textContent || "").trim();
      if (!text) return;
      let id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      if (!id) return;
      let unique = id;
      let i = 2;
      while (seen.has(unique)) unique = `${id}-${i++}`;
      seen.add(unique);
      out.push({ id: unique, text, level: n.tagName === "H2" ? 2 : 3 });
    });
    return out;
  } catch {
    return [];
  }
}

/** Inject id attributes onto h2/h3 tags matching the extracted headings, in order. */
export function injectHeadingIds(html: string, headings: { id: string; text: string; level: 2 | 3 }[]): string {
  if (!html || headings.length === 0) return html;
  let idx = 0;
  return html.replace(/<(h2|h3)(\s[^>]*)?>/gi, (match, tag, attrs) => {
    if (idx >= headings.length) return match;
    const h = headings[idx];
    if (h.level !== (tag.toLowerCase() === "h2" ? 2 : 3)) return match;
    idx++;
    // Skip if id already present
    if (attrs && /\bid=/.test(attrs)) return match;
    return `<${tag}${attrs || ""} id="${h.id}">`;
  });
}

/** Word count of visible text in HTML. */
export function countWords(html: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}
