import { useState, useRef, useCallback, useEffect } from "react";

/* ─── CONFIG ──────────────────────────────────────────────────────────────── */
const API = "http://localhost:8000";
const STEP_DURATION = 1200;

/* ─── GLOBAL STYLES ──────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #09090b;
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow-x: hidden;
  min-height: 100vh;
}

@keyframes fadeUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes spin     { to   { transform: rotate(360deg) } }
@keyframes pulse    { 0%,100% { opacity:.5 } 50% { opacity:1 } }
@keyframes slideRight { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:translateX(0) } }
@keyframes stepReveal { from { opacity:0; transform:translateY(20px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }

.glass {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 0.5px solid rgba(255,255,255,0.08);
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: #E60023; color: #fff;
  border: none; border-radius: 6px;
  padding: 11px 24px; font-size: 13px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.15s ease;
  letter-spacing: 0.01em;
}
.btn-primary:hover { background: #cc0020; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(230,0,35,0.3); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; color: #a1a1aa;
  border: 0.5px solid #3f3f46; border-radius: 6px;
  padding: 11px 24px; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all 0.15s ease;
}
.btn-ghost:hover { color: #f4f4f5; border-color: #71717a; background: rgba(255,255,255,0.04); }
`;

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
function Navbar({ view, onLogoClick, onQueryClick }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(9,9,11,0.85)", backdropFilter: "blur(20px)",
      borderBottom: "0.5px solid rgba(255,255,255,0.06)",
      padding: "0 40px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div
        onClick={onLogoClick}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 4,
          background: "#E60023", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" fill="white"/>
            <line x1="7" y1="1" x2="7" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="7" y1="10" x2="7" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="7" x2="4" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="10" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", letterSpacing: -0.3 }}>
          Image<span style={{ color: "#E60023" }}>Lens</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#52525b", fontFamily: "monospace" }}>ResNet50 · FAISS</span>
        <button
          onClick={onQueryClick}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: view === "query" ? "rgba(230,0,35,0.1)" : "transparent",
            border: view === "query" ? "0.5px solid rgba(230,0,35,0.4)" : "0.5px solid #3f3f46",
            borderRadius: 6, padding: "7px 14px",
            fontSize: 12, fontWeight: 500, color: view === "query" ? "#E60023" : "#a1a1aa",
            fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Image Query
        </button>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────── */
function Hero({ onSearchClick }) {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: "120px 40px 80px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(230,0,35,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(230,0,35,0.08)", border: "0.5px solid rgba(230,0,35,0.25)",
        borderRadius: 4, padding: "5px 12px", marginBottom: 28,
        animation: "fadeUp 0.5s ease both",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E60023", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 11, color: "#E60023", fontWeight: 700, letterSpacing: 0.8 }}>
          AI-POWERED VISUAL SEARCH
        </span>
      </div>
      <h1 style={{
        fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 700,
        color: "#f4f4f5", lineHeight: 1.08, letterSpacing: -2,
        marginBottom: 20, maxWidth: 720,
        animation: "fadeUp 0.6s ease 0.1s both",
      }}>
        Find images by<br />
        <span style={{ color: "#E60023" }}>what they look like</span>
      </h1>
      <p style={{
        fontSize: 16, color: "#71717a", lineHeight: 1.7, maxWidth: 480,
        marginBottom: 36, fontWeight: 400,
        animation: "fadeUp 0.6s ease 0.2s both",
      }}>
        Upload any image. Deep learning extracts visual features and retrieves the most similar images from your dataset in milliseconds.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp 0.6s ease 0.3s both" }}>
        <button className="btn-primary" onClick={onSearchClick} style={{ fontSize: 14, padding: "12px 28px" }}>
          Upload an image
        </button>
        <button className="btn-ghost" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
          See how it works
        </button>
      </div>
      <div style={{
        display: "flex", gap: 12, marginTop: 64, flexWrap: "wrap", justifyContent: "center",
        animation: "fadeUp 0.6s ease 0.5s both",
      }}>
        {[
          { label: "Feature dims", value: "2048-D" },
          { label: "Search speed", value: "< 50 ms" },
          { label: "Similarity", value: "Cosine" },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ borderRadius: 8, padding: "14px 22px", textAlign: "center", minWidth: 110 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", letterSpacing: -0.5 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#52525b", marginTop: 3, letterSpacing: 0.4, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── PIPELINE EXPLAINER ─────────────────────────────────────────────────── */
function Pipeline() {
  const steps = [
    { step: "01", title: "Upload",    sub: "JPG / PNG input",      color: "#71717a", border: "#3f3f46" },
    { step: "02", title: "ResNet50",  sub: "2048-D feature vector", color: "#60a5fa", border: "#1d4ed8" },
    { step: "03", title: "L2 Norm",   sub: "Cosine-ready",          color: "#a78bfa", border: "#6d28d9" },
    { step: "04", title: "FAISS ANN", sub: "Index search",           color: "#34d399", border: "#065f46" },
    { step: "05", title: "Top-K",     sub: "Ranked results",         color: "#86efac", border: "#15803d" },
  ];
  return (
    <section id="how-it-works" style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 4, padding: "5px 12px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, color: "#52525b", fontWeight: 700, letterSpacing: 0.8 }}>HOW IT WORKS</span>
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#f4f4f5", letterSpacing: -1.2, lineHeight: 1.1 }}>
          From pixels to similarity scores
        </h2>
        <p style={{ color: "#52525b", marginTop: 12, fontSize: 14, maxWidth: 420, margin: "12px auto 0" }}>
          Five stages of deep learning inference and vector search — end-to-end in under 50 ms.
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, overflowX: "auto", padding: "8px 0" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: 1, marginBottom: 8, fontFamily: "monospace" }}>{s.step}</span>
              <div style={{
                width: 110, padding: "14px 10px",
                background: "rgba(255,255,255,0.03)", border: `0.5px solid ${s.border}`,
                borderRadius: 6, textAlign: "center", cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#52525b", lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 24 }}>
                <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                  <line x1="0" y1="6" x2="20" y2="6" stroke="#3f3f46" strokeWidth="1"/>
                  <polyline points="14,2 20,6 14,10" fill="none" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32, justifyContent: "center" }}>
        <div style={{ height: 1, width: 60, background: "#27272a" }} />
        <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "monospace", letterSpacing: 0.5 }}>end-to-end &lt; 50 ms</span>
        <div style={{ height: 1, width: 60, background: "#27272a" }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
        {["ResNet50", "FAISS", "FastAPI", "React", "PyTorch", "Cosine Similarity"].map((t, i) => (
          <span key={i} style={{
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 4, padding: "4px 12px", fontSize: 11, color: "#71717a", fontFamily: "monospace",
          }}>{t}</span>
        ))}
      </div>
    </section>
  );
}

/* ─── UPLOAD ZONE ────────────────────────────────────────────────────────── */
function UploadZone({ onFile, error }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const onDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) onFile(f);
  };
  return (
    <section id="search" style={{ padding: "60px 40px 120px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#f4f4f5", letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 10 }}>
          Search by image
        </h2>
        <p style={{ color: "#52525b", fontSize: 14 }}>Drop any image and discover visually similar results</p>
      </div>
      {error && (
        <div style={{
          background: "rgba(230,0,35,0.07)", border: "0.5px solid rgba(230,0,35,0.25)",
          borderRadius: 6, padding: "10px 18px", marginBottom: 20,
          fontSize: 12, color: "#fca5a5", maxWidth: 480, width: "100%", textAlign: "center", fontFamily: "monospace",
        }}>
          {error} — is the backend running on port 8000?
        </div>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
        style={{
          width: "100%", maxWidth: 520,
          border: `1px dashed ${drag ? "#E60023" : "#27272a"}`,
          borderRadius: 12, padding: "64px 40px", textAlign: "center",
          cursor: "pointer",
          background: drag ? "rgba(230,0,35,0.04)" : "rgba(255,255,255,0.01)",
          transition: "all 0.2s ease",
          boxShadow: drag ? "0 0 0 4px rgba(230,0,35,0.06)" : "none",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 8,
          background: "rgba(230,0,35,0.08)", border: "0.5px solid rgba(230,0,35,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 14V4M11 4L7 8M11 4L15 8" stroke="#E60023" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="#E60023" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", marginBottom: 6 }}>Drop your image here</div>
        <div style={{ fontSize: 12, color: "#3f3f46", marginBottom: 24 }}>JPG, PNG supported · or click to browse</div>
        <button className="btn-primary" style={{ pointerEvents: "none" }}>Choose image</button>
      </div>
      <input ref={ref} type="file" accept="image/*"
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }}
        style={{ display: "none" }} />
    </section>
  );
}

/* ─── [NEW] SEGMENTATION CONFIRM MODAL ───────────────────────────────────── */
// Shown after preprocessing, before search. Lets user choose original vs segmented.
function SegmentationModal({ previewSrc, onChoose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div className="glass" style={{
        borderRadius: 14, padding: "36px 32px", maxWidth: 440, width: "90%",
        border: "0.5px solid rgba(255,255,255,0.12)",
        animation: "fadeUp 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "rgba(230,0,35,0.12)", border: "0.5px solid rgba(230,0,35,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f4f4f5" }}>Feature Extraction Mode</span>
        </div>

        <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.65, marginBottom: 24 }}>
          Segmentation isolates the foreground before ResNet50 extracts features. This can improve accuracy for object-centric queries, but may reduce it for textured backgrounds.
        </p>

        {/* Preview */}
        {previewSrc && (
          <img
            src={previewSrc}
            alt="query preview"
            style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 24, border: "0.5px solid rgba(255,255,255,0.08)" }}
          />
        )}

        {/* Choice buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onChoose(false)}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            Original RGB
          </button>
          <button
            onClick={() => onChoose(true)}
            className="btn-primary"
            style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/><path d="M8 12h8M12 8v8"/>
            </svg>
            Use Segmentation
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#27272a", marginTop: 12, textAlign: "center", fontFamily: "monospace" }}>
          preprocessing is visualization-only · search always uses original or segmented RGB
        </p>
      </div>
    </div>
  );
}

/* ─── PREPROCESSING STEP CARDS ───────────────────────────────────────────── */
// [UPDATED] PP_META now has 5 steps to match updated backend (added Gaussian Blur)
const PP_META = [
  { label: "Original",               desc: "Your uploaded image" },
  { label: "Grayscale",              desc: "Luminance channel extracted" },
  { label: "Gaussian Blur",          desc: "Noise reduction (5×5 kernel)" },      // [NEW]
  { label: "Histogram Equalisation", desc: "Contrast enhanced" },
  { label: "Edge Detection",         desc: "Canny structural features" },
];

function PreprocessingPipeline({ steps, visibleCount, activeIdx }) {
  if (steps.length === 0) return null;
  return (
    <div style={{ padding: "0 40px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 11, color: "#E60023", fontWeight: 700, letterSpacing: 0.8 }}>MV PREPROCESSING PIPELINE</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {steps.map((step, i) => {
          const isVisible = i < visibleCount;
          const isActive  = i === activeIdx;
          const isDone    = i < activeIdx || (activeIdx === -1 && visibleCount > i);
          const meta      = PP_META[i] || {};
          return (
            <div key={i} style={{
              borderRadius: 10, overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              border: isActive ? "1px solid #E60023" : isDone ? "0.5px solid rgba(255,255,255,0.12)" : "0.5px solid rgba(255,255,255,0.05)",
              boxShadow: isActive ? "0 0 0 2px rgba(230,0,35,0.15)" : "none",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
              transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              position: "relative",
            }}>
              <div style={{ width: "100%", aspectRatio: "1/1", position: "relative", overflow: "hidden", background: "#18181b" }}>
                {step.data ? (
                  <img src={`data:image/png;base64,${step.data}`} alt={step.label || meta.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", animation: isActive ? "pulse 1.2s ease-in-out infinite" : "none", background: "#1c1c22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isActive && <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.06)", borderTop: "1.5px solid #E60023", animation: "spin 0.8s linear infinite" }} />}
                  </div>
                )}
                {isActive && <div style={{ position: "absolute", inset: 0, background: "rgba(230,0,35,0.06)", animation: "pulse 1.2s ease-in-out infinite" }} />}
                {isDone && !isActive && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(9,9,11,0.85)", backdropFilter: "blur(8px)", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: isActive ? "#E60023" : "#52525b", fontFamily: "monospace" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#f4f4f5" : "#a1a1aa", marginBottom: 3 }}>{step.label || meta.label}</div>
                <div style={{ fontSize: 11, color: "#52525b", lineHeight: 1.5 }}>{step.desc || meta.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── LOADER ──────────────────────────────────────────────────────────────── */
function Loader() {
  const dots = ["Extracting features", "Normalizing vectors", "Running FAISS search", "Ranking results"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % dots.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.06)", borderTop: "1.5px solid #E60023", animation: "spin 0.8s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", marginBottom: 6 }}>Searching visually</div>
        <div style={{ fontSize: 12, color: "#52525b", fontFamily: "monospace", animation: "pulse 0.9s ease-in-out infinite" }}>{dots[idx]}</div>
      </div>
    </div>
  );
}

/* ─── RESULT CARD ────────────────────────────────────────────────────────── */
const ACCENT_COLORS = ["#E60023", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"];

function ResultCard({ result, index, selected, onSelect, onChain }) {
  const accent  = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const score   = Math.round(result.score * 100);
  const imgSrc  = result.image_b64 ? `data:image/jpeg;base64,${result.image_b64}` : null;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 10, overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
        border: selected ? `1px solid ${accent}` : hovered ? "0.5px solid rgba(255,255,255,0.18)" : "0.5px solid rgba(255,255,255,0.07)",
        transform: selected ? "scale(1.02)" : hovered ? "translateY(-3px) scale(1.01)" : "scale(1)",
        boxShadow: hovered && !selected ? "0 12px 40px rgba(0,0,0,0.4)" : "none",
        transition: "all 0.2s ease",
        animation: `fadeUp 0.4s ease ${index * 60}ms both`,
        position: "relative", cursor: "pointer",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "1/1" }}>
        {imgSrc ? (
          <img src={imgSrc} alt={`result-${result.rank}`} onClick={() => onSelect(result)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.3s ease" }} />
        ) : (
          <div onClick={() => onSelect(result)} style={{ width: "100%", height: "100%", background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="20" rx="3" stroke="#3f3f46" strokeWidth="1.5"/><circle cx="11" cy="13" r="2.5" stroke="#3f3f46" strokeWidth="1.5"/><path d="M4 22l6-5 5 4 4-3 9 7" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(9,9,11,0.85)", backdropFilter: "blur(8px)", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: accent, fontFamily: "monospace", pointerEvents: "none" }}>{score}%</div>
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(9,9,11,0.85)", backdropFilter: "blur(8px)", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#52525b", fontFamily: "monospace", pointerEvents: "none" }}>#{result.rank}</div>
        {onChain && imgSrc && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)", opacity: hovered ? 1 : 0, transition: "opacity 0.2s ease", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-start", padding: "12px", pointerEvents: hovered ? "auto" : "none" }}>
            <button onClick={e => { e.stopPropagation(); onChain(result, index); }}
              style={{ background: "#E60023", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(230,0,35,0.4)", transition: "transform 0.15s, background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#cc0020"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#E60023"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Find similar
            </button>
          </div>
        )}
      </div>
      <div onClick={() => onSelect(result)} style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{result.suggestion?.label || "Similar Image"}</div>
        <p style={{ fontSize: 11.5, color: "#52525b", lineHeight: 1.5, margin: "0 0 10px" }}>{result.suggestion?.tip || "Visually similar to your query image."}</p>
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${score}%`, background: accent, borderRadius: 1, transition: "width 0.8s ease" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── CHAIN BREADCRUMB ───────────────────────────────────────────────────── */
function ChainBreadcrumb({ chain, onReset }) {
  if (chain.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 24, padding: "0 40px" }}>
      <button onClick={onReset} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid #3f3f46", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#71717a", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#f4f4f5"; e.currentTarget.style.borderColor = "#71717a"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "#3f3f46"; }}
      >↩ Start over</button>
      {chain.map((c, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#3f3f46" }}>›</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: i === chain.length - 1 ? "rgba(230,0,35,0.08)" : "rgba(255,255,255,0.03)", border: i === chain.length - 1 ? "0.5px solid rgba(230,0,35,0.3)" : "0.5px solid #27272a", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: i === chain.length - 1 ? "#E60023" : "#52525b", maxWidth: 100 }}>
            {c.thumb && <img src={c.thumb} alt="" style={{ width: 20, height: 20, borderRadius: 3, objectFit: "cover" }} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
          </div>
        </span>
      ))}
      {chain.length > 1 && <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "monospace", marginLeft: 4 }}>depth {chain.length}</span>}
    </div>
  );
}

/* ─── RESULTS VIEW ───────────────────────────────────────────────────────── */
function ResultsView({ queryB64, results, chain, onNewSearch, onChain, onResetChain, loadingChain, segmentationUsed }) {
  const [selected, setSelected] = useState(null);
  const handleSelect = r => setSelected(prev => prev?.rank === r.rank ? null : r);
  return (
    <div>
      <div className="glass" style={{ position: "sticky", top: 56, zIndex: 100, padding: "12px 40px", display: "flex", alignItems: "center", gap: 16, animation: "fadeIn 0.3s ease" }}>
        {queryB64 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`data:image/jpeg;base64,${queryB64}`} style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", border: "1px solid #E60023" }} alt="query" />
            <div>
              <div style={{ fontSize: 10, color: "#3f3f46", letterSpacing: 0.6, fontWeight: 700 }}>QUERY</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5" }}>{results.length} results</div>
            </div>
          </div>
        )}
        {/* [NEW] Segmentation badge */}
        {segmentationUsed && (
          <div style={{ background: "rgba(167,139,250,0.1)", border: "0.5px solid rgba(167,139,250,0.3)", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#a78bfa", fontFamily: "monospace" }}>
            segmented
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#3f3f46", fontFamily: "monospace" }}>ResNet50 · FAISS · Cosine</span>
          <button className="btn-primary" onClick={onNewSearch} style={{ padding: "8px 16px", fontSize: 12 }}>New search</button>
        </div>
      </div>

      {selected && (
        <div className="glass" style={{ padding: "24px 40px", display: "flex", gap: 24, alignItems: "flex-start", animation: "slideRight 0.25s ease", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <img src={`data:image/jpeg;base64,${selected.image_b64}`} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.1)" }} alt="selected" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5" }}>{selected.suggestion?.label}</span>
              <span style={{ marginLeft: "auto", background: "rgba(230,0,35,0.10)", color: "#E60023", border: "0.5px solid rgba(230,0,35,0.25)", borderRadius: 4, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{Math.round(selected.score * 100)}% match</span>
            </div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.65, maxWidth: 520, marginBottom: 8 }}>{selected.suggestion?.tip}</p>
            <div style={{ fontSize: 10, color: "#27272a", fontFamily: "monospace" }}>{selected.path}</div>
          </div>
          <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 4, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>
      )}

      <div style={{ paddingTop: 20 }}>
        <ChainBreadcrumb chain={chain} onReset={onResetChain} />
      </div>

      {results.length > 0 && chain.length === 1 && (
        <div style={{ padding: "0 40px 16px", fontSize: 12, color: "#3f3f46", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Hover any result and click "Find similar →" for Pinterest-style chaining
        </div>
      )}

      {loadingChain ? (
        <Loader />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, padding: "8px 40px 80px", maxWidth: 1400, margin: "0 auto" }}>
          {results.map((r, i) => (
            <ResultCard key={`${chain.length}-${i}`} result={r} index={i} selected={selected?.rank === r.rank} onSelect={handleSelect} onChain={onChain} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── IMAGE QUERY EXPLAINER ──────────────────────────────────────────────── */
function ImageQueryExplainer({ onGoSearch }) {
  return (
    <div style={{ padding: "80px 40px", maxWidth: 700, margin: "0 auto", animation: "fadeUp 0.5s ease both" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(230,0,35,0.08)", border: "0.5px solid rgba(230,0,35,0.25)", borderRadius: 4, padding: "5px 12px", marginBottom: 24 }}>
        <span style={{ fontSize: 11, color: "#E60023", fontWeight: 700, letterSpacing: 0.8 }}>PINTEREST-STYLE CHAINING</span>
      </div>
      <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#f4f4f5", letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 20 }}>Image Query Mode</h2>
      <div className="glass" style={{ borderRadius: 10, padding: "24px 28px", marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.8 }}>
          <strong style={{ color: "#f4f4f5" }}>How chaining works:</strong><br />
          Upload any image on the Search tab. After preprocessing (for visualization), you'll be asked whether to search with the original RGB or a segmented version. Results appear ranked by cosine similarity. Hover any card and click <strong style={{ color: "#E60023" }}>"Find similar →"</strong> to chain.
        </p>
      </div>
      <div className="glass" style={{ borderRadius: 10, padding: "24px 28px", marginBottom: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { n: "1", t: "Upload image", d: "Drop a photo in the Search tab" },
            { n: "2", t: "Preprocessing pipeline runs", d: "Grayscale → Blur → Histogram EQ → Edge Detection (display only)" },
            { n: "3", t: "Choose feature mode", d: "Original RGB or threshold-segmented — your choice" },
            { n: "4", t: "Top-5 similar images appear", d: "Ranked by cosine similarity via FAISS" },
            { n: "5", t: "Click 'Find similar →' on any result", d: "That image becomes your new query" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(230,0,35,0.1)", border: "0.5px solid rgba(230,0,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#E60023" }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5", marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: "#52525b" }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={onGoSearch} style={{ fontSize: 14, padding: "12px 28px" }}>Go to Search →</button>
    </div>
  );
}

/* ─── SEARCH VIEW ────────────────────────────────────────────────────────── */
function SearchView() {
  const [file, setFile]                     = useState(null);
  const [preview, setPreview]               = useState(null);
  const [error, setError]                   = useState(null);
  const [phase, setPhase]                   = useState("idle");
  const [queryB64, setQueryB64]             = useState(null);
  const [results, setResults]               = useState([]);
  const [ppSteps, setPpSteps]               = useState([]);
  const [ppVisible, setPpVisible]           = useState(0);
  const [ppActive, setPpActive]             = useState(-1);
  const [loadingChain, setLoadingChain]     = useState(false);
  const [chain, setChain]                   = useState([]);
  const [segmentationUsed, setSegUsed]      = useState(false);

  // [NEW] Segmentation modal state
  // pendingFile holds the original File waiting for user's seg choice
  const [pendingFile, setPendingFile]       = useState(null);
  const [showSegModal, setShowSegModal]     = useState(false);

  const handleFile = useCallback((f) => {
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhase("idle");
    setResults([]); setQueryB64(null);
    setPpSteps([]); setPpVisible(0); setPpActive(-1);
    setChain([]); setError(null);
    setSegUsed(false);
  }, []);

  const animatePipeline = (steps) => {
    setPpSteps(steps);
    setPpVisible(0);
    setPpActive(0);
    steps.forEach((_, i) => {
      setTimeout(() => {
        setPpVisible(i + 1);
        setPpActive(i);
      }, i * STEP_DURATION);
    });
    setTimeout(() => setPpActive(-1), steps.length * STEP_DURATION);
  };

  // [FIXED] Runs preprocessing (display only), then shows segmentation modal.
  // The actual /search call always uses the original file (never edge image).
  const runPreprocessThenPrompt = useCallback(async (originalFile, previewUrl) => {
    setError(null);
    setPhase("preprocessing");
    setPpSteps([]); setPpVisible(0); setPpActive(-1);
    setResults([]);
    setChain([{ thumb: previewUrl, label: "Query" }]);

    // ── Step 1: Run preprocessing for VISUALIZATION only ──
    try {
      const ppForm = new FormData();
      ppForm.append("file", originalFile);
      const ppRes = await fetch(`${API}/preprocess`, { method: "POST", body: ppForm });
      if (ppRes.ok) {
        const ppData = await ppRes.json();
        if (ppData.steps) animatePipeline(ppData.steps);
      } else {
        animatePipeline(PP_META.map(m => ({ ...m, data: null })));
      }
    } catch {
      animatePipeline(PP_META.map(m => ({ ...m, data: null })));
    }

    // Wait for animation to complete
    await new Promise(r => setTimeout(r, PP_META.length * STEP_DURATION + 400));

    // ── Step 2: Show segmentation modal — do NOT send to /search yet ──
    setPendingFile(originalFile);
    setShowSegModal(true);
    setPhase("awaiting_seg_choice");
  }, []);

  // [NEW] Called when user picks original or segmented from modal
  const handleSegChoice = useCallback(async (useSegmentation) => {
    setShowSegModal(false);
    setSegUsed(useSegmentation);
    const searchFile = pendingFile;
    setPendingFile(null);
    if (!searchFile) return;

    setPhase("searching");
    setError(null);

    try {
      const srForm = new FormData();
      // [FIXED] Always send ORIGINAL file — backend handles segmentation server-side
      srForm.append("file", searchFile);
      srForm.append("top_k", 5);
      srForm.append("use_segmentation", useSegmentation);   // boolean query param
      const srRes = await fetch(`${API}/search?use_segmentation=${useSegmentation}`, { method: "POST", body: srForm });
      if (!srRes.ok) throw new Error(`Server error ${srRes.status}`);
      const srData = await srRes.json();
      setQueryB64(srData.query_image_b64);
      setResults(srData.results || []);
      setSegUsed(srData.segmentation_used ?? useSegmentation);
    } catch (e) {
      setError(e.message);
    }

    setPhase("results");
  }, [pendingFile]);

  /* ── Chaining: use a result image directly (RGB, no preprocessing) ── */
  const handleChain = useCallback(async (result, idx) => {
    if (!result.image_b64) return;
    const thumb = `data:image/jpeg;base64,${result.image_b64}`;
    const byteStr = atob(result.image_b64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/jpeg" });
    const chainFile = new File([blob], `chain_${idx}.jpg`, { type: "image/jpeg" });

    setLoadingChain(true);
    setError(null);
    try {
      const srForm = new FormData();
      srForm.append("file", chainFile);
      srForm.append("top_k", 5);
      // Chained searches always use original RGB (no segmentation prompt)
      const srRes = await fetch(`${API}/search?use_segmentation=false`, { method: "POST", body: srForm });
      if (!srRes.ok) throw new Error(`Server error ${srRes.status}`);
      const srData = await srRes.json();
      setQueryB64(srData.query_image_b64);
      setResults(srData.results || []);
      setSegUsed(false);
      setChain(c => [...c, { thumb, label: `Similar #${c.length}` }]);
    } catch (e) {
      setError(e.message);
    }
    setLoadingChain(false);
    setPhase("results");
  }, []);

  const resetChain = () => {
    setChain([]); setResults([]); setPhase("idle");
    setPpSteps([]); setPpVisible(0); setPpActive(-1);
    setQueryB64(null); setSegUsed(false);
  };

  const goBackToLanding = () => {
    setFile(null); setPreview(null);
    setPhase("idle"); setResults([]);
    setChain([]); setError(null);
    setPpSteps([]); setPpVisible(0); setPpActive(-1);
    setQueryB64(null); setSegUsed(false);
    setShowSegModal(false); setPendingFile(null);
  };

  /* ── idle: show hero + upload zone ── */
  if (phase === "idle" && results.length === 0) {
    return (
      <>
        <Hero onSearchClick={() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })} />
        <Pipeline />
        <UploadZone onFile={(f) => { handleFile(f); runPreprocessThenPrompt(f, URL.createObjectURL(f)); }} error={error} />
      </>
    );
  }

  /* ── preprocessing animation ── */
  if (phase === "preprocessing" || phase === "awaiting_seg_choice") {
    return (
      <div style={{ paddingTop: 56 }}>
        {/* [NEW] Segmentation modal overlay */}
        {showSegModal && (
          <SegmentationModal previewSrc={preview} onChoose={handleSegChoice} />
        )}
        <div style={{ padding: "48px 40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#52525b", fontFamily: "monospace", marginBottom: 10 }}>Processing your image</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#f4f4f5", letterSpacing: -0.8 }}>Running MV Pipeline…</h2>
          {preview && (
            <img src={preview} alt="query" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #E60023", margin: "20px auto 0", display: "block" }} />
          )}
        </div>
        <PreprocessingPipeline steps={ppSteps} visibleCount={ppVisible} activeIdx={ppActive} />
      </div>
    );
  }

  /* ── searching spinner (after seg choice, before results) ── */
  if (phase === "searching") {
    return (
      <div style={{ paddingTop: 56 }}>
        <div style={{ padding: "48px 40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#52525b", fontFamily: "monospace", marginBottom: 10 }}>
            {segmentationUsed ? "Using segmented image · " : "Using original RGB · "}searching index
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#f4f4f5", letterSpacing: -0.8 }}>Querying FAISS…</h2>
        </div>
        <Loader />
      </div>
    );
  }

  /* ── results ── */
  return (
    <div style={{ paddingTop: 56 }}>
      {ppSteps.length > 0 && (
        <details>
          <summary style={{ padding: "14px 40px", fontSize: 12, color: "#52525b", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            View preprocessing steps (visualization only)
          </summary>
          <div style={{ paddingTop: 20 }}>
            <PreprocessingPipeline steps={ppSteps} visibleCount={ppSteps.length} activeIdx={-1} />
          </div>
        </details>
      )}
      <ResultsView
        queryB64={queryB64}
        results={results}
        chain={chain}
        onNewSearch={goBackToLanding}
        onChain={handleChain}
        onResetChain={resetChain}
        loadingChain={loadingChain}
        segmentationUsed={segmentationUsed}
      />
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("search");
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = GLOBAL_STYLES;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);
  return (
    <>
      <Navbar
        view={view}
        onLogoClick={() => setView("search")}
        onQueryClick={() => setView(v => v === "query" ? "search" : "query")}
      />
      {view === "query" ? (
        <div style={{ paddingTop: 56 }}>
          <ImageQueryExplainer onGoSearch={() => setView("search")} />
        </div>
      ) : (
        <SearchView />
      )}
    </>
  );
}