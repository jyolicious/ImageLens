import { useState, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from "recharts";

const API = "http://localhost:8000";

const COLORS = ["#6EE7B7", "#34D399", "#10B981", "#059669", "#047857"];

function CosinePlot({ results }) {
  if (!results.length) return null;
  const data = results.map((r) => ({
    name: `#${r.rank}`,
    score: parseFloat((r.score * 100).toFixed(1)),
    path: r.path.split(/[\\/]/).pop(),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "#0f1923", border: "1px solid #1e3a2f",
        borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#a7f3d0"
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "#6EE7B7" }}>
          {payload[0].payload.path}
        </div>
        <div>Cosine Similarity: <strong>{payload[0].value}%</strong></div>
      </div>
    );
  };

  return (
    <div style={{
      background: "linear-gradient(145deg,#0a1a12,#0f2318)",
      border: "1px solid #1a3a28",
      borderRadius: 16, padding: "20px 16px 12px",
    }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#34D399", fontWeight: 700, marginBottom: 16, textTransform: "uppercase" }}>
        ◈ Cosine Similarity Distribution
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a3a28" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#6EE7B7", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(110,231,183,0.05)" }} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={1 - i * 0.12} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SuggestionCard({ suggestion }) {
  if (!suggestion) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg,#0a1a12 60%,#082010)",
      border: "1px solid #1a3a28",
      borderRadius: 16, padding: "20px 22px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20,
        fontSize: 90, opacity: 0.08, pointerEvents: "none", userSelect: "none",
      }}>{suggestion.emoji}</div>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#34D399", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
        ◈ Activity Suggestion
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 36 }}>{suggestion.emoji}</span>
        <span style={{
          fontSize: 20, fontWeight: 800, color: "#ecfdf5",
          fontFamily: "'DM Serif Display', Georgia, serif",
          letterSpacing: -0.5,
        }}>{suggestion.label}</span>
      </div>
      <p style={{
        color: "#86efac", fontSize: 13.5, lineHeight: 1.6, margin: 0,
        fontStyle: "italic",
      }}>"{suggestion.tip}"</p>
    </div>
  );
}

function ResultCard({ result, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: active ? "2px solid #6EE7B7" : "1px solid #1a3a28",
        borderRadius: 14, overflow: "hidden",
        background: active ? "#0a1a12" : "#080f0a",
        transition: "all 0.2s",
        boxShadow: active ? "0 0 18px rgba(110,231,183,0.18)" : "none",
        transform: active ? "scale(1.02)" : "scale(1)",
      }}
    >
      {result.image_b64 ? (
        <img
          src={`data:image/jpeg;base64,${result.image_b64}`}
          alt={`result-${result.rank}`}
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", aspectRatio: "1", background: "#0a1a12", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#374151", fontSize: 24 }}>🖼️</span>
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Rank #{result.rank}</span>
          <span style={{
            fontSize: 12, fontWeight: 800,
            color: result.score > 0.85 ? "#6EE7B7" : result.score > 0.7 ? "#fcd34d" : "#f87171",
          }}>{(result.score * 100).toFixed(1)}%</span>
        </div>
        <div style={{
          fontSize: 10, color: "#4b5563", marginTop: 3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {result.path.split(/[\\/]/).pop()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [queryB64, setQueryB64] = useState(null);
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState(0);
  const fileRef = useRef();

  const doSearch = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(0);
    setQueryB64(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("top_k", 5);
      const res = await fetch(`${API}/search`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setQueryB64(data.query_image_b64);
      setResults(data.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) doSearch(file);
  }, [doSearch]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) doSearch(file);
  };

  const activeResult = results[selected];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050d08",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e5e7eb",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050d08; }
        ::-webkit-scrollbar-thumb { background: #1a3a28; border-radius: 3px; }
        body { background: #050d08; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "22px 40px",
        borderBottom: "1px solid #0f2318",
        display: "flex", alignItems: "center", gap: 16,
        background: "rgba(5,13,8,0.95)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg,#6EE7B7,#059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>🔍</div>
        <div>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20, color: "#ecfdf5", letterSpacing: -0.5,
          }}>VisualSearch<span style={{ color: "#6EE7B7" }}>.</span>ai</div>
          <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, textTransform: "uppercase" }}>
            Deep Visual Retrieval Engine
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#6EE7B7",
            boxShadow: "0 0 8px #6EE7B7", animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 11, color: "#6EE7B7", letterSpacing: 1 }}>LIVE</span>
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </header>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        {/* Upload Zone */}
        {!results.length && !loading && (
          <div style={{ maxWidth: 560, margin: "60px auto 0" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 42, color: "#ecfdf5", letterSpacing: -1, lineHeight: 1.1, marginBottom: 12,
              }}>
                Find Anything<br />
                <span style={{ color: "#6EE7B7" }}>Visually.</span>
              </div>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7 }}>
                Upload an image to retrieve the most visually similar items<br />
                from the dataset using ResNet50 + FAISS similarity search.
              </p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#6EE7B7" : "#1a3a28"}`,
                borderRadius: 20, padding: "60px 40px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "rgba(110,231,183,0.04)" : "#080f0a",
                transition: "all 0.25s",
                boxShadow: dragging ? "0 0 30px rgba(110,231,183,0.1)" : "none",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>⬆️</div>
              <div style={{ color: "#d1fae5", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                Drop your image here
              </div>
              <div style={{ color: "#4b5563", fontSize: 13 }}>
                or <span style={{ color: "#6EE7B7", textDecoration: "underline" }}>browse files</span>
                <br /><span style={{ fontSize: 11 }}>JPG, PNG, JPEG supported</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 20, animation: "spin 1.2s linear infinite", display: "inline-block" }}>⚙️</div>
            <div style={{ color: "#6EE7B7", fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>Extracting features & searching…</div>
            <div style={{ color: "#4b5563", fontSize: 13, marginTop: 8 }}>Running ResNet50 → FAISS cosine search</div>
            <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 12,
            padding: "16px 20px", maxWidth: 480, margin: "40px auto", color: "#fca5a5",
          }}>
            ⚠️ {error}
            <br /><span style={{ fontSize: 12, color: "#6b7280" }}>Make sure the FastAPI backend is running on port 8000</span>
          </div>
        )}

        {/* Results Layout */}
        {results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>

            {/* LEFT — Results Grid */}
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#34D399", fontWeight: 700, textTransform: "uppercase" }}>
                  ◈ Top {results.length} Matches
                </div>
                <button
                  onClick={() => { setResults([]); setQueryB64(null); }}
                  style={{
                    background: "transparent", border: "1px solid #1a3a28",
                    borderRadius: 8, padding: "4px 10px", color: "#6b7280",
                    fontSize: 11, cursor: "pointer",
                  }}
                >↩ New Search</button>
              </div>

              {/* Query image */}
              {queryB64 && (
                <div style={{ marginBottom: 16, borderRadius: 14, overflow: "hidden", border: "1px solid #1a3a28" }}>
                  <img src={`data:image/jpeg;base64,${queryB64}`}
                    alt="query"
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "8px 12px", background: "#050d08", fontSize: 10, color: "#4b5563", letterSpacing: 1, textTransform: "uppercase" }}>
                    🔍 Your Query Image
                  </div>
                </div>
              )}

              {/* Thumbnail grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {results.map((r, i) => (
                  <ResultCard key={i} result={r} active={selected === i} onClick={() => setSelected(i)} />
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Top: Cosine similarity chart */}
              <CosinePlot results={results} />

              {/* Middle: Selected image large view */}
              {activeResult && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
                }}>
                  <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #1a3a28" }}>
                    {activeResult.image_b64 ? (
                      <img src={`data:image/jpeg;base64,${activeResult.image_b64}`}
                        alt="selected"
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1", background: "#0a1a12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🖼️</div>
                    )}
                    <div style={{ padding: "12px 14px", background: "#080f0a" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>Match #{activeResult.rank}</span>
                        <span style={{
                          fontSize: 16, fontWeight: 800,
                          color: activeResult.score > 0.85 ? "#6EE7B7" : activeResult.score > 0.7 ? "#fcd34d" : "#f87171",
                        }}>{(activeResult.score * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#374151", marginTop: 4, wordBreak: "break-all" }}>
                        {activeResult.path}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion card */}
                  <SuggestionCard suggestion={activeResult.suggestion} />
                </div>
              )}

              {/* Score badges row */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {results.map((r, i) => (
                  <div key={i}
                    onClick={() => setSelected(i)}
                    style={{
                      padding: "8px 16px", borderRadius: 999,
                      background: selected === i ? "#6EE7B7" : "#0a1a12",
                      color: selected === i ? "#050d08" : "#6EE7B7",
                      border: "1px solid #1a3a28",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    #{r.rank} · {(r.score * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
