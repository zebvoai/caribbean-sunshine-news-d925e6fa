/**
 * In-body entity linker.
 * Scans article HTML for known entity mentions and links the FIRST occurrence
 * of each to its canonical internal page (/people/*, event pages, etc.).
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
  { patterns: ["Roosevelt Skerrit", "Prime Minister Skerrit", "PM Skerrit"], href: "/people/roosevelt-skerrit", title: "Roosevelt Skerrit" },
  { patterns: ["Dame Eugenia Charles", "Eugenia Charles"], href: "/people/dame-eugenia-charles", title: "Dame Eugenia Charles" },
  { patterns: ["Patrick John"], href: "/people/patrick-john", title: "Patrick John" },
  { patterns: ["World Creole Music Festival", "WCMF"], href: `/wcmf-${currentYear}`, title: `WCMF ${currentYear}` },
  { patterns: ["Dominica Carnival", "Mas Domnik"], href: `/dominica-carnival-${currentYear}`, title: `Dominica Carnival ${currentYear}` },
  { patterns: ["Miss Dominica"], href: `/miss-dominica-${currentYear}`, title: `Miss Dominica ${currentYear}` },
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
