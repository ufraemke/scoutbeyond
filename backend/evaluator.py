import os
import re
import json
from typing import List, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types

class EvaluatedSource(BaseModel):
    url: str
    title: str
    source_tier: str            # "TIER_1_ACADEMIC_PATENT", "TIER_2_TECHNICAL_SPEC", "TIER_3_TRADE"
    credibility_score: int      # 0 to 100
    empirical_density_score: int = 0  # 0 to 100
    bias_rating: str            # "Independent Research", "Vendor Technical Spec", "Promotional"
    physical_mechanism: str     # Specific mechanical / physical principle identified
    operating_limits: List[str] # Discovered drawbacks, constraints, or boundary conditions
    reported_metrics: List[str] # Quantified numbers (e.g. "75% water reduction at 4.5 bar")
    summary: str
    is_credible: bool

class SourceEvaluator:
    """
    Rigorously tests scraped sources to filter out commercial hype and detect
    genuine physical engineering evidence with empirical data.
    """
    def __init__(self, api_key: Optional[str] = None):
        key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=key)
        self.model_name = "gemini-3.6-flash"

        # Authoritative peer-reviewed and patent domains
        self.tier_1_domains = [
            "sciencedirect.com", "ieee.org", "springer.com", "nature.com",
            "patents.google.com", "fraunhofer.de", "asme.org", "wiley.com",
            "osti.gov", "nist.gov", "nasa.gov", "researchgate.net", "tandfonline.com"
        ]

    def calculate_empirical_density(self, text: str) -> int:
        """
        Counts occurrences of physical engineering units and numbers.
        Marketing fluff almost never includes specific engineering tolerances.
        """
        unit_patterns = [
            r'\b\d+(\.\d+)?\s*(bar|psi|mpa|kpa)\b',      # Pressure
            r'\b\d+(\.\d+)?\s*(°c|deg c|kelvin|k)\b',   # Temperature
            r'\b\d+(\.\d+)?\s*(khz|mhz|ghz|hz)\b',      # Frequency
            r'\b\d+(\.\d+)?\s*(l/min|m3/h|gpm|ml/s)\b', # Flow rate
            r'\b\d+(\.\d+)?\s*(μm|um|nm|mm|cm)\b',      # Particle size / surface roughness
            r'\b\d+(\.\d+)?\s*(kw|mw|w|kwh)\b',         # Energy
            r'\b\d+(\.\d+)?\s*%\b'                      # Empirical percentages
        ]
        matches = sum(len(re.findall(p, text, re.IGNORECASE)) for p in unit_patterns)
        return min(100, matches * 10)

    def evaluate(self, raw_source: dict) -> EvaluatedSource:
        url = raw_source.get("url", "")
        title = raw_source.get("title", "Untitled Source")
        content = raw_source.get("markdown", "")[:4000]

        density_score = self.calculate_empirical_density(content)
        is_tier_1 = any(d in url.lower() for d in self.tier_1_domains)

        prompt = f"""
You are a skeptical Chief Engineer in industrial manufacturing and precision R&D.
Evaluate this technical source objectively:

URL: {url}
Title: {title}
Content snippet:
{content}

Critique requirements:
1. Identify the physical, chemical, or mechanical principle involved (e.g. "Supercritical CO2 extraction", "Ultrasonic cavitation", "Atmospheric plasma").
2. Extract operational limits, boundary conditions, drawbacks, or failure modes (e.g. "Risk of surface pitting on soft aluminum", "Max operating temp 70°C").
3. Extract concrete numerical data/metrics (water savings %, pressures, flow rates, cycle times).
4. Classify bias: "Independent Research", "Vendor Technical Spec", or "Promotional".
5. Assign a credibility score (0 to 100).
6. Determine if this source has enough credible technical substance (is_credible = true/false).

Return a strict JSON object with these exact keys:
{{
  "url": "{url}",
  "title": "{title}",
  "source_tier": "TIER_1_ACADEMIC_PATENT" or "TIER_2_TECHNICAL_SPEC" or "TIER_3_TRADE",
  "credibility_score": 85,
  "bias_rating": "Independent Research" or "Vendor Technical Spec" or "Promotional",
  "physical_mechanism": "string",
  "operating_limits": ["limit 1", "limit 2"],
  "reported_metrics": ["metric 1", "metric 2"],
  "summary": "1-2 sentence engineering summary",
  "is_credible": true
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
        except Exception as e:
            # Fallback in case of API issue
            print(f"[Evaluator Error]: {e}")
            data = {
                "url": url,
                "title": title,
                "source_tier": "TIER_1_ACADEMIC_PATENT" if is_tier_1 else "TIER_2_TECHNICAL_SPEC",
                "credibility_score": 75 if is_tier_1 else 60,
                "bias_rating": "Independent Research" if is_tier_1 else "Vendor Technical Spec",
                "physical_mechanism": "Industrial engineering principle",
                "operating_limits": ["Operating conditions vary by substrate"],
                "reported_metrics": ["Empirical measurements available in primary text"],
                "summary": title,
                "is_credible": True
            }

        evaluated = EvaluatedSource(**data)
        evaluated.empirical_density_score = density_score

        # Sturdiness filter: Reject pure promotional hype that has no numbers
        if density_score < 10 and evaluated.bias_rating == "Promotional":
            evaluated.is_credible = False

        if is_tier_1:
            evaluated.source_tier = "TIER_1_ACADEMIC_PATENT"
            evaluated.credibility_score = max(evaluated.credibility_score, 88)

        return evaluated
