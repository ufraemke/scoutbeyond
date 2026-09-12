import type { CandidateCategory } from "@/types";

/**
 * Prepared tank-cleaning demo dataset.
 * Not live research. Citations are illustrative references for UX demos only.
 * Do not present this as verified empirical evidence.
 */
export const DEMO_MODE_LABEL = "Prepared demo dataset";

export const DEMO_CHALLENGE =
  "What physical alternatives or complementary technologies exist to conventional spray cleaning for cleaning the interior of industrial tanks while reducing water consumption and cleaning cycle time?";

export type DemoSource = {
  title: string;
  url: string;
  publisher: string;
  note: string;
};

export type DemoCandidate = {
  id: string;
  name: string;
  principle: string;
  category: CandidateCategory;
  summary: string;
  relevance: string;
  maturityLabel: string;
  benefits: string[];
  limitations: string[];
  sources: DemoSource[];
};

export const DEMO_BRIEF = {
  problem:
    "How can tank interior cleaning reduce water use and cycle time while maintaining required cleanliness?",
  goals: [
    "Reduce water consumption",
    "Reduce wash cycle duration",
    "Maintain hygiene / cleanliness standards",
  ],
  constraints: [
    "Industrial manufacturing environment",
    "Prefer retrofit into existing tanks",
  ],
  assumptions: [
    "Cleaning intensity can be modulated",
    "A clean-detection signal is feasible",
  ],
  unknowns: [
    "Residue adhesion across batches",
    "Allowable acoustic or thermal stress on the vessel",
  ],
  searchDimensions: [
    "Adaptive kinetic impingement",
    "In-situ residue sensing",
    "Closed-loop feedback control",
    "Anti-fouling surface engineering",
  ],
};

export const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: "demo-adaptive-jet",
    name: "Adaptive high-pressure jet cleaning",
    principle:
      "Modulate nozzle pressure and flow to actual cleaning demand rather than fixed-duration cycles.",
    category: "established",
    summary:
      "Demand-driven jet cleaning uses process feedback to avoid over-washing.",
    relevance:
      "Directly addresses tank-interior spray cleaning with retrofit potential.",
    maturityLabel: "Commercial / industrial practice",
    benefits: ["Water reduction potential", "Compatible with spray mounts"],
    limitations: ["Savings depend on residue type and geometry"],
    sources: [
      {
        title: "Fraunhofer cleaning technologies overview",
        url: "https://www.fraunhofer.de/en.html",
        publisher: "Fraunhofer",
        note: "Prepared demo reference — open institution overview, not a verified trial claim.",
      },
    ],
  },
  {
    id: "demo-closed-loop",
    name: "Closed-loop adaptive cleaning control",
    principle:
      "Measure effluent indicators and terminate rinse phases when cleanliness criteria are met.",
    category: "established",
    summary:
      "Feedback control ends cycles when a cleanliness threshold is reached.",
    relevance: "Reduces blind over-rinsing in tank and CIP-like processes.",
    maturityLabel: "Commercial in CIP contexts",
    benefits: ["Cycle-time reduction", "Lower effluent volume"],
    limitations: ["Requires reliable sensing and control integration"],
    sources: [
      {
        title: "VDI technical guidelines overview",
        url: "https://www.vdi.de/en/home",
        publisher: "VDI",
        note: "Prepared demo reference — standards body landing page only.",
      },
    ],
  },
  {
    id: "demo-fluorescence",
    name: "In-situ fluorescence residue monitoring",
    principle:
      "Detect organic residues with fluorescence sensing to decide when cleaning is complete.",
    category: "adjacent",
    summary:
      "Optical sensing can indicate residual contamination without opening the vessel.",
    relevance: "Supports demand-based termination rather than timed washes.",
    maturityLabel: "Adjacent sensing applications",
    benefits: ["Faster stop decisions", "Less over-cleaning"],
    limitations: ["Sensor window fouling and calibration drift"],
    sources: [
      {
        title: "Sensors and Actuators journal home",
        url: "https://www.sciencedirect.com/journal/sensors-and-actuators-b-chemical",
        publisher: "ScienceDirect",
        note: "Prepared demo reference — journal home, not a specific paper claim.",
      },
    ],
  },
  {
    id: "demo-fluidic-nozzles",
    name: "Fluidic oscillator swept-jet nozzles",
    principle:
      "Use fluidic oscillation without moving parts to sweep impinging jets across interior walls.",
    category: "established",
    summary:
      "Swept jets improve coverage and wall shear without mechanical wear parts.",
    relevance: "Improves spray coverage inside complex tank geometries.",
    maturityLabel: "Industrial fluidics practice",
    benefits: ["Coverage improvement", "No internal moving seals"],
    limitations: ["Fixed hardware cannot adapt to every batch condition"],
    sources: [
      {
        title: "Journal of Fluid Mechanics home",
        url: "https://www.cambridge.org/core/journals/journal-of-fluid-mechanics",
        publisher: "Cambridge University Press",
        note: "Prepared demo reference — journal home only.",
      },
    ],
  },
  {
    id: "demo-machine-vision",
    name: "Multi-spectral contamination inspection",
    principle:
      "Classify residual fouling visually to target local cleaning instead of flooding the whole tank.",
    category: "adjacent",
    summary:
      "Inspection methods from other industries can direct localized cleaning.",
    relevance: "Cross-industry transfer from precision manufacturing inspection.",
    maturityLabel: "Adjacent industrial inspection",
    benefits: ["Targeted washing", "Potential water savings"],
    limitations: ["Optics reliability in mist, steam, or recessed areas"],
    sources: [
      {
        title: "Robotics and Computer-Integrated Manufacturing journal",
        url: "https://www.sciencedirect.com/journal/robotics-and-computer-integrated-manufacturing",
        publisher: "ScienceDirect",
        note: "Prepared demo reference — journal home only.",
      },
    ],
  },
  {
    id: "demo-surface-coatings",
    name: "Oleophobic / hydrophobic surface coatings",
    principle:
      "Lower surface energy so residues adhere less strongly and require less cleaning energy.",
    category: "exploratory",
    summary:
      "Surface engineering may reduce fouling load before cleaning begins.",
    relevance: "Complementary to cleaning hardware rather than a direct replacement.",
    maturityLabel: "Emerging materials approaches",
    benefits: ["Lower adhesion", "Possible pressure reduction"],
    limitations: ["Wear under abrasive or aggressive chemical conditions"],
    sources: [
      {
        title: "ACS Applied Materials & Interfaces journal",
        url: "https://pubs.acs.org/journal/aamick",
        publisher: "ACS Publications",
        note: "Prepared demo reference — journal home only.",
      },
    ],
  },
  {
    id: "demo-megasonic",
    name: "Megasonic / ultrasonic cavitation cleaning",
    principle:
      "Use acoustic cavitation micro-jets to dislodge deposits with less bulk fluid flow.",
    category: "adjacent",
    summary:
      "Acoustic cleaning is proven in precision industries and may transfer to enclosed vessels.",
    relevance: "Physical alternative to high-volume spray flooding.",
    maturityLabel: "Commercial in precision cleaning",
    benefits: ["Potential water reduction", "Non-contact deposit removal"],
    limitations: ["Acoustic shadow zones and substrate erosion risk"],
    sources: [
      {
        title: "Ultrasonics Sonochemistry journal",
        url: "https://www.sciencedirect.com/journal/ultrasonics-sonochemistry",
        publisher: "ScienceDirect",
        note: "Prepared demo reference — journal home only.",
      },
    ],
  },
];

export function candidatesByCategory(category: CandidateCategory) {
  return DEMO_CANDIDATES.filter((c) => c.category === category);
}
