"""
visualize_embeddings.py
───────────────────────
Loads pre-computed ResNet50 embeddings and renders an interactive
t-SNE scatter plot coloured by top-level folder (category).

Usage:
    python visualize_embeddings.py
    python visualize_embeddings.py --perplexity 50 --n_iter 1500
    python visualize_embeddings.py --save tsne_plot.png
"""

import argparse
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from sklearn.manifold import TSNE
from sklearn.preprocessing import LabelEncoder

# ── Config ─────────────────────────────────────────────────────────────────────
FEATURES_PATH = "embeddings/features.npy"
PATHS_PATH    = "embeddings/paths.npy"

# Colour palette (cycles if more categories than colours)
PALETTE = [
    "#E60023", "#60a5fa", "#34d399", "#a78bfa", "#fb923c",
    "#f472b6", "#facc15", "#38bdf8", "#4ade80", "#c084fc",
    "#f87171", "#2dd4bf", "#e879f9", "#a3e635", "#fb7185",
]


def extract_category(path: str) -> str:
    """
    Derive a category label from the image path.
    Uses the parent folder name (one level above the file).
    Falls back to 'unknown' if structure doesn't match.
    """
    parts = path.replace("\\", "/").split("/")
    if len(parts) >= 2:
        return parts[-2]
    return "unknown"


def run_tsne(features: np.ndarray, perplexity: int, n_iter: int, seed: int) -> np.ndarray:
    print(f"Running t-SNE on {features.shape[0]} samples × {features.shape[1]} dims …")
    print(f"  perplexity={perplexity}  n_iter={n_iter}  random_state={seed}")
    tsne = TSNE(
        n_components=2,
        perplexity=perplexity,
        n_iter=n_iter,
        random_state=seed,
        init="pca",           # PCA init converges faster and is more stable
        learning_rate="auto",
        metric="cosine",      # consistent with FAISS cosine similarity
        verbose=1,
    )
    return tsne.fit_transform(features)


def plot(embedding: np.ndarray, labels: list[str], save_path: str | None):
    categories = sorted(set(labels))
    le         = LabelEncoder().fit(categories)
    int_labels = le.transform(labels)
    colours    = [PALETTE[i % len(PALETTE)] for i in int_labels]

    fig, ax = plt.subplots(figsize=(14, 10))
    fig.patch.set_facecolor("#09090b")
    ax.set_facecolor("#0f0f12")

    # Scatter — draw all points
    scatter = ax.scatter(
        embedding[:, 0], embedding[:, 1],
        c=colours, s=18, alpha=0.82, linewidths=0,
        zorder=2,
    )

    # Per-category centroid labels
    for i, cat in enumerate(categories):
        mask  = np.array(labels) == cat
        cx    = embedding[mask, 0].mean()
        cy    = embedding[mask, 1].mean()
        color = PALETTE[i % len(PALETTE)]
        txt   = ax.text(
            cx, cy, cat,
            fontsize=8.5, fontweight="bold", color=color, ha="center", va="center",
            zorder=3,
        )
        txt.set_path_effects([
            pe.Stroke(linewidth=2.5, foreground="#09090b"),
            pe.Normal(),
        ])

    # Legend (one dot per category)
    legend_handles = [
        plt.Line2D([0], [0], marker="o", color="w",
                   markerfacecolor=PALETTE[i % len(PALETTE)], markersize=7,
                   label=cat)
        for i, cat in enumerate(categories)
    ]
    legend = ax.legend(
        handles=legend_handles, title="Category",
        loc="upper right", framealpha=0.15, edgecolor="#3f3f46",
        labelcolor="white", facecolor="#1a1a20",
        fontsize=8, title_fontsize=9,
    )
    legend.get_title().set_color("#a1a1aa")

    # Styling
    ax.set_title("ResNet50 Embeddings — t-SNE Projection", color="#f4f4f5", fontsize=14, fontweight="bold", pad=16)
    ax.set_xlabel("t-SNE dim 1", color="#52525b", fontsize=9)
    ax.set_ylabel("t-SNE dim 2", color="#52525b", fontsize=9)
    ax.tick_params(colors="#3f3f46", labelsize=7)
    for spine in ax.spines.values():
        spine.set_edgecolor("#27272a")
    ax.grid(True, color="#1e1e24", linewidth=0.5, zorder=0)

    # Stats annotation
    stats = f"{embedding.shape[0]} images · {len(categories)} categories · cosine metric"
    fig.text(0.5, 0.01, stats, ha="center", fontsize=8, color="#3f3f46", style="italic")

    plt.tight_layout(rect=[0, 0.02, 1, 1])

    if save_path:
        plt.savefig(save_path, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
        print(f"Saved → {save_path}")
    else:
        plt.show()


def main():
    parser = argparse.ArgumentParser(description="t-SNE visualisation of image embeddings")
    parser.add_argument("--features",   default=FEATURES_PATH, help="Path to features.npy")
    parser.add_argument("--paths",      default=PATHS_PATH,    help="Path to paths.npy")
    parser.add_argument("--perplexity", type=int,   default=30,   help="t-SNE perplexity (default 30)")
    parser.add_argument("--n_iter",     type=int,   default=1000, help="t-SNE iterations (default 1000)")
    parser.add_argument("--seed",       type=int,   default=42,   help="Random seed")
    parser.add_argument("--save",       default=None,             help="Save plot to file instead of showing")
    args = parser.parse_args()

    # ── Load embeddings ──
    if not os.path.exists(args.features):
        raise FileNotFoundError(f"Features file not found: {args.features}")
    if not os.path.exists(args.paths):
        raise FileNotFoundError(f"Paths file not found: {args.paths}")

    features = np.load(args.features).astype("float32")
    paths    = np.load(args.paths)
    labels   = [extract_category(str(p)) for p in paths]

    print(f"Loaded {features.shape[0]} embeddings ({features.shape[1]}-D)")
    print(f"Categories found: {sorted(set(labels))}")

    # ── t-SNE ──
    embedding = run_tsne(features, args.perplexity, args.n_iter, args.seed)

    # ── Plot ──
    plot(embedding, labels, args.save)


if __name__ == "__main__":
    main()