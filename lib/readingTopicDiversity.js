/**
 * IELTS Academic Reading topic diversity — assigned topic pool + near-duplicate checks.
 */

/** High-level IELTS Academic Reading domains. */
export const READING_TOPIC_DOMAINS = [
  "environmental science",
  "urban studies and sociology",
  "psychology",
  "history",
  "technology and innovation",
  "business and economics",
  "health and medicine",
  "education",
  "astronomy and space",
  "marine biology",
  "archaeology",
  "linguistics",
  "art and culture",
  "climate science",
  "neuroscience",
  "anthropology",
  "geology",
  "renewable energy",
  "transportation",
  "agriculture",
];

/**
 * Concrete passage seeds — model must write about the assigned topic string, not invent a default.
 * @type {{ domain: string, topic: string }[]}
 */
export const READING_TOPIC_SEEDS = [
  { domain: "environmental science", topic: "peatland restoration and carbon sequestration" },
  { domain: "environmental science", topic: "invasive freshwater mussels in North American rivers" },
  { domain: "climate science", topic: "paleoclimate signals preserved in coral skeletons" },
  { domain: "climate science", topic: "atmospheric rivers and extreme rainfall forecasting" },
  { domain: "urban studies and sociology", topic: "night-time economies in post-industrial cities" },
  { domain: "urban studies and sociology", topic: "informal settlements and tenure security reforms" },
  { domain: "psychology", topic: "prospect theory and everyday financial decisions" },
  { domain: "psychology", topic: "attachment styles across adult friendships" },
  { domain: "neuroscience", topic: "sleep spindle activity and memory consolidation" },
  { domain: "neuroscience", topic: "neuroplasticity after adult cochlear implantation" },
  { domain: "history", topic: "Indian Ocean trade networks before European arrival" },
  { domain: "history", topic: "printing presses and literacy in early modern Europe" },
  { domain: "archaeology", topic: "remote sensing of buried roads under desert sands" },
  { domain: "archaeology", topic: "isotopic analysis of prehistoric diets" },
  { domain: "technology and innovation", topic: "solid-state battery materials for electric vehicles" },
  { domain: "technology and innovation", topic: "edge computing for remote sensor networks" },
  { domain: "business and economics", topic: "circular supply chains in consumer electronics" },
  { domain: "business and economics", topic: "microinsurance models for smallholder farmers" },
  { domain: "health and medicine", topic: "phage therapy against antibiotic-resistant bacteria" },
  { domain: "health and medicine", topic: "community health workers in maternal care programs" },
  { domain: "education", topic: "dual-language immersion outcomes in secondary schools" },
  { domain: "education", topic: "formative assessment practices in large lecture courses" },
  { domain: "astronomy and space", topic: "exoplanet atmospheres measured by transit spectroscopy" },
  { domain: "astronomy and space", topic: "lunar polar ice as a future resource" },
  { domain: "marine biology", topic: "kelp forest recovery after sea otter reintroduction" },
  { domain: "marine biology", topic: "deep-sea hydrothermal vent food webs" },
  { domain: "linguistics", topic: "creole language formation in plantation societies" },
  { domain: "linguistics", topic: "child bilingual code-switching patterns" },
  { domain: "art and culture", topic: "conserving wall paintings in humid climates" },
  { domain: "art and culture", topic: "music notation systems outside Western tradition" },
  { domain: "anthropology", topic: "gift exchange economies among Pacific island communities" },
  { domain: "anthropology", topic: "migration and kinship networks in diaspora towns" },
  { domain: "geology", topic: "tephra layers used to date archaeological sites" },
  { domain: "geology", topic: "groundwater flow through fractured limestone aquifers" },
  { domain: "renewable energy", topic: "pumped hydro storage in mountainous regions" },
  { domain: "renewable energy", topic: "agrivoltaics combining crops with solar arrays" },
  { domain: "transportation", topic: "high-speed rail freight versus short-haul aviation" },
  { domain: "transportation", topic: "bus rapid transit design in medium-sized cities" },
  { domain: "agriculture", topic: "nitrogen-fixing cover crops in cereal rotations" },
  { domain: "agriculture", topic: "precision irrigation using soil moisture sensors" },
];

/** How many recent topics to avoid (global + student). */
export const RECENT_TOPIC_WINDOW = 20;

/**
 * @param {unknown} value
 */
export function normalizeTopicKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Token overlap ratio for near-duplicate detection (0–1).
 * @param {string} a
 * @param {string} b
 */
export function topicSimilarity(a, b) {
  const ta = new Set(
    normalizeTopicKey(a)
      .split(" ")
      .filter((w) => w.length > 3)
  );
  const tb = new Set(
    normalizeTopicKey(b)
      .split(" ")
      .filter((w) => w.length > 3)
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap += 1;
  }
  return overlap / Math.min(ta.size, tb.size);
}

/**
 * @param {string} candidate
 * @param {string[]} avoided
 * @param {number} [threshold]
 */
export function isNearDuplicateTopic(candidate, avoided, threshold = 0.55) {
  const key = normalizeTopicKey(candidate);
  if (!key) return true;
  for (const prev of avoided) {
    const p = normalizeTopicKey(prev);
    if (!p) continue;
    if (key === p) return true;
    if (key.includes(p) || p.includes(key)) return true;
    if (topicSimilarity(key, p) >= threshold) return true;
  }
  return false;
}

/**
 * Pick a concrete topic seed not near-duplicate to recent titles/topics.
 * @param {{ avoid?: string[] }} [opts]
 */
export function pickAssignedTopic(opts = {}) {
  const avoid = Array.isArray(opts.avoid) ? opts.avoid : [];
  const shuffled = [...READING_TOPIC_SEEDS].sort(() => Math.random() - 0.5);

  for (const seed of shuffled) {
    if (
      isNearDuplicateTopic(seed.topic, avoid) ||
      isNearDuplicateTopic(seed.domain, avoid)
    ) {
      continue;
    }
    return { ...seed };
  }

  // Fallback: invent from an unused domain label + random suffix
  const domain =
    READING_TOPIC_DOMAINS.find((d) => !isNearDuplicateTopic(d, avoid)) ||
    READING_TOPIC_DOMAINS[Math.floor(Math.random() * READING_TOPIC_DOMAINS.length)];
  return {
    domain,
    topic: `${domain} case study ${Date.now().toString(36).slice(-4)}`,
  };
}

/**
 * @param {{ title?: string, topic?: string }} generated
 * @param {string[]} avoid
 */
export function assertTopicIsDiverse(generated, avoid) {
  const title = String(generated?.title ?? "");
  const topic = String(generated?.topic ?? "");
  if (isNearDuplicateTopic(topic, avoid) || isNearDuplicateTopic(title, avoid)) {
    throw new Error(
      `Topic diversity rejection: "${topic || title}" is too similar to a recently used topic`
    );
  }
}

/** Titles the old temp=0 generator converged on — reject unless explicitly assigned. */
const OVERUSED_DEFAULT_PATTERNS = [
  "impact of urbanization on biodiversity",
  "urbanization on biodiversity",
  "evolution of renewable energy sources",
  "the water cycle a continuous process",
  "water cycle continuous process",
];

/**
 * Ensure the model stayed on the assigned seed and did not fall back to known defaults.
 * @param {{ title?: string, topic?: string, content?: string }} generated
 * @param {{ domain: string, topic: string }} assigned
 */
export function assertFollowsAssignedTopic(generated, assigned) {
  const title = String(generated?.title ?? "");
  const topic = String(generated?.topic ?? "");
  const snippet = String(generated?.content ?? "").slice(0, 900);
  const blob = `${title} ${topic} ${snippet}`;

  for (const banned of OVERUSED_DEFAULT_PATTERNS) {
    if (isNearDuplicateTopic(assigned.topic, [banned], 0.45)) continue;
    if (
      isNearDuplicateTopic(title, [banned], 0.5) ||
      isNearDuplicateTopic(topic, [banned], 0.5)
    ) {
      throw new Error(
        `Rejected overused default passage pattern ("${banned}") — assigned "${assigned.topic}"`
      );
    }
  }

  if (!isNearDuplicateTopic(blob, [assigned.topic], 0.18)) {
    throw new Error(
      `Generated passage drifted from assigned topic "${assigned.topic}"`
    );
  }
}
