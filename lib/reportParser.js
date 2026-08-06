const SECTION_HEADERS = [
  "PERFORMANCE SUMMARY",
  "RULE COMPLIANCE SCORE",
  "MISTAKE BREAKDOWN",
  "BEST DAY AND WORST DAY",
  "DISCIPLINED VS IMPULSIVE",
  "TOP 3 STRENGTHS",
  "TOP 3 WEAKNESSES",
  "3 GOALS FOR NEXT WEEK",
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarkdownNoise(text) {
  if (!text) return text;
  return text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*-{2,}\s*$/gm, "")
    .replace(/^\s*\*{2,}\s*$/gm, "");
}

export function parseReportSections(text) {
  if (!text) return {};
  const cleaned = stripMarkdownNoise(text);
  const pattern = new RegExp(
    `(${SECTION_HEADERS.map(escapeRegExp).join("|")})`,
    "g"
  );
  const parts = cleaned.split(pattern);
  const sections = {};
  let currentHeader = null;

  for (const part of parts) {
    const trimmed = part.trim();
    if (SECTION_HEADERS.includes(trimmed)) {
      currentHeader = trimmed;
      sections[currentHeader] = sections[currentHeader] || "";
    } else if (currentHeader) {
      sections[currentHeader] = (sections[currentHeader] || "") + part;
    }
  }

  Object.keys(sections).forEach((k) => {
    sections[k] = sections[k].trim();
  });

  return sections;
}

const ENUMERATOR = /^(?:[\d]+[.)]|[-•])\s*/;
const NEW_ITEM_SIGNAL = /^(?:[\d]+[.)]|[-•]|Goal\s*\d|Strength\s*\d|Weakness\s*\d)/i;

export function parseListItems(sectionText) {
  if (!sectionText) return [];
  const lines = sectionText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !/^[-#*]*$/.test(l));

  const items = [];
  for (const line of lines) {
    if (NEW_ITEM_SIGNAL.test(line) || items.length === 0) {
      items.push(line.replace(ENUMERATOR, "").trim());
    } else {
      items[items.length - 1] = `${items[items.length - 1]} ${line}`.trim();
    }
  }
  return items.filter(Boolean);
}
