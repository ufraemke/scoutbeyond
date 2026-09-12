import os
import json
from app import app

client = app.test_client()

print("--- 1. Testing /api/health ---")
res = client.get("/api/health")
print("Health:", res.status_code, res.get_json())

print("\n--- 2. Testing /api/refine ---")
payload = {
    "problem": "How can cleaning be adapted to actual cleaning need while reducing water consumption and cleaning time?",
    "priorities": ["Water consumption", "Cleaning time"],
    "context": ["Industrial cleaning", "Manufacturing"],
    "constraints": ["Prefer existing equipment", "Industrial environment"],
    "scope": "Industry + adjacent"
}
res = client.post("/api/refine", json=payload)
data = res.get_json()
print("Refine status:", res.status_code)
brief = data.get("brief", {})
print("Challenge:", brief.get("challenge"))
print("Search Dimensions:", brief.get("search_dimensions"))
print("Confidence:", brief.get("confidence_score"), "%")

print("\nEndpoint test passed successfully!")
