import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print("--- Testing Configuration ---")
gemini_key = os.getenv("GEMINI_API_KEY")
firecrawl_key = os.getenv("FIRECRAWL_API_KEY")

print(f"GEMINI_API_KEY found: {bool(gemini_key and len(gemini_key) > 10)}")
print(f"FIRECRAWL_API_KEY found: {bool(firecrawl_key and len(firecrawl_key) > 5)}")

print("\n--- Testing Gemini Connection ---")
try:
    from google import genai
    client = genai.Client(api_key=gemini_key)
    # Test model
    for m in ["gemini-3.6-flash", "gemini-2.5-pro", "gemini-3-flash", "gemini-1.5-pro"]:
        try:
            print(f"Testing model {m}...")
            res = client.models.generate_content(
                model=m,
                contents="State the primary physical mechanism of ultrasonic cleaning in 1 sentence."
            )
            print(f"Success with {m}:", res.text.strip())
            break
        except Exception as err:
            print(f"Failed {m}: {err}")
except Exception as e:
    print("Gemini test error:", e)

print("\n--- Testing Evaluator & Density Scorer ---")
try:
    from evaluator import SourceEvaluator
    evaluator = SourceEvaluator(gemini_key)
    score = evaluator.calculate_empirical_density("Operating at 40 kHz, 6 bar pressure, 65°C and 80% water reduction.")
    print("Empirical density score calculation:", score, "/ 100")
except Exception as e:
    print("Evaluator test error:", e)

print("\nTest completed successfully!")
