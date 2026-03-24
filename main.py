from search import search

query = "test_images/cycle.jpg"

results = search(query)

print("\nTop Matches:\n")

for score, path in results:
    print(f"{score:.4f} → {path}")