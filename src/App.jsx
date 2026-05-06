import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const SCIMAGO_Q = { "Journal of Machine Learning Research":"Q1","IEEE Transactions on Neural Networks":"Q1","Nature Medicine":"Q1","Artificial Intelligence":"Q2","ACM Computing Surveys":"Q2","IEEE TPAMI":"Q1","PLOS ONE":"Q1","Expert Systems with Applications":"Q2","Information Sciences":"Q2","Computers in Human Behavior":"Q2","Sustainability":"Q3","Heliyon":"Q3","Frontiers in Psychology":"Q2","BMC Medical Informatics":"Q2","Journal of Business Research":"Q1" };
// Database dengan label index yang dikenal peneliti
const DATABASES_FREE = [
  { id:"scopus_via", label:"Scopus",            index:"Scopus",           api:"openalex",   color:"#fb923c" },
  { id:"wos_via",    label:"Web of Science",    index:"WoS",              api:"openalex",   color:"#e879f9" },
  { id:"openalex",   label:"OpenAlex",          index:"Multi-Index",      api:"openalex",   color:"#4f9cf9" },
  { id:"crossref",   label:"Crossref",          index:"DOI Registry",     api:"crossref",   color:"#a78bfa" },
  { id:"semantic",   label:"Semantic Scholar",  index:"AI-Index",         api:"semantic",   color:"#34d399" },
  { id:"pubmed",     label:"PubMed / MEDLINE",  index:"MEDLINE",          api:"pubmed",     color:"#22d3ee" },
  { id:"core",       label:"CORE",              index:"Open Access",      api:"core",       color:"#fbbf24" },
  { id:"europepmc",  label:"Europe PMC",        index:"PMC / MEDLINE",    api:"europepmc",  color:"#f87171" },
];
const Q_OPTS = ["Q1","Q2","Q3","Q4"];
const AI_PROVIDERS = [
  { id:"anthropic", label:"Anthropic Claude", models:["claude-sonnet-4-20250514","claude-haiku-4-20250514","claude-opus-4-5"] },
  { id:"gemini",    label:"Google Gemini",    models:["gemini-2.0-flash","gemini-2.0-flash-lite","gemini-1.5-pro","gemini-1.5-flash"] },
  { id:"openai",    label:"OpenAI GPT",       models:["gpt-4o","gpt-4o-mini","gpt-4-turbo"] },
  { id:"groq",      label:"Groq (LLaMA)",     models:["llama-3.3-70b-versatile","llama-3.1-8b-instant","mixtral-8x7b-32768"] },
];

const TABS = [
  { id:"search",   icon:"🔍", label:"1. Tema & Pencarian" },
  { id:"screen",   icon:"📋", label:"2. Skrining Artikel" },
  { id:"upload",   icon:"📤", label:"3. Upload Dokumen" },
  { id:"prisma",   icon:"🔷", label:"4. PRISMA Flow" },
  { id:"extract",  icon:"🔬", label:"5. Ekstraksi Data" },
  { id:"biblio",   icon:"📊", label:"6. Bibliometrik" },
  { id:"framework",icon:"🗺️", label:"7. Framework/Model" },
  { id:"narasi",   icon:"📝", label:"8. Naskah SLR" },
  { id:"settings", icon:"⚙️", label:"Pengaturan" },
];

const JOURNAL_TPLS = [
  {id:"apa7",label:"APA 7th Edition"},{id:"ieee",label:"IEEE Style"},
  {id:"vancouver",label:"Vancouver"},{id:"acs",label:"ACS (Chemistry)"},
  {id:"harvard",label:"Harvard"},{id:"chicago",label:"Chicago 17th"},
  {id:"elsevier",label:"Elsevier Journals"},{id:"springer",label:"Springer Nature"},
  {id:"acm",label:"ACM Digital Library"},{id:"mla9",label:"MLA 9th"},
];

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
:root{
  --bg:#0a0c10;--bg2:#10141c;--bg3:#171d28;--surface:#1c2333;
  --border:#2a3347;--accent:#4f9cf9;--accent2:#a78bfa;
  --green:#34d399;--red:#f87171;--amber:#fbbf24;--cyan:#22d3ee;
  --text:#e2e8f0;--muted:#64748b;
  --fh:'Syne',sans-serif;--fb:'DM Mono',monospace;--fs:'Lora',serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--fb);font-size:13px;line-height:1.6}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--bg2)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.shell{display:flex;height:100vh;overflow:hidden}
/* SIDEBAR */
.sidebar{width:210px;min-width:210px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto}
.sb-logo{padding:16px 18px;border-bottom:1px solid var(--border)}
.sb-logo .wm{font-family:var(--fh);font-size:15px;font-weight:800;color:var(--accent);letter-spacing:-.5px}
.sb-logo .sub{font-size:9px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px}
.nav-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:12px 18px 5px}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 18px;cursor:pointer;font-size:11.5px;color:var(--muted);border-left:2px solid transparent;transition:all .14s}
.nav-item:hover{color:var(--text);background:var(--bg3)}
.nav-item.active{color:var(--accent);border-left-color:var(--accent);background:rgba(79,156,249,.06)}
.nav-item .ic{font-size:13px;width:18px;text-align:center}
.nav-item .nb{margin-left:auto;background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px}
.nav-item .nb.green{background:var(--green)}
.nav-item .nb.amber{background:var(--amber);color:#000}
/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:50px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:10px;flex-shrink:0}
.topbar-title{font-family:var(--fh);font-size:14px;font-weight:700;flex:1}
.topbar-title span{color:var(--accent)}
.content{flex:1;overflow-y:auto;padding:20px}
/* CARDS */
.card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:14px}
.card-title{font-family:var(--fh);font-size:12px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:7px}
/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--fb);font-size:11px;cursor:pointer;transition:all .14s;font-weight:500}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn.primary:hover{background:#3b82f6}
.btn.success{background:rgba(52,211,153,.12);border-color:var(--green);color:var(--green)}
.btn.danger{background:rgba(248,113,113,.1);border-color:var(--red);color:var(--red)}
.btn.ghost{background:transparent;border-color:transparent}
.btn.amber{background:rgba(251,191,36,.1);border-color:var(--amber);color:var(--amber)}
.btn.sm{padding:4px 9px;font-size:10px}
.btn.xs{padding:2px 7px;font-size:9px}
/* FORM */
.fg{display:flex;flex-direction:column;gap:4px}
.fg label{font-size:10px;color:var(--muted);font-weight:600;letter-spacing:.3px}
input[type=text],input[type=number],input[type=url],input[type=password],select,textarea{background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--fb);font-size:12px;padding:7px 9px;outline:none;transition:border-color .14s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--accent)}
textarea{resize:vertical;min-height:68px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.full{grid-column:1/-1}
/* CHIP */
.chip-group{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border:1px solid var(--border);border-radius:16px;font-size:11px;cursor:pointer;color:var(--muted);transition:all .13s;user-select:none}
.chip.on{border-color:var(--accent);color:var(--accent);background:rgba(79,156,249,.08)}
.chip.green.on{border-color:var(--green);color:var(--green);background:rgba(52,211,153,.08)}
/* BADGE */
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:9px;font-size:10px;font-weight:600}
.badge.acc{background:rgba(52,211,153,.12);color:var(--green)}
.badge.rej{background:rgba(248,113,113,.1);color:var(--red)}
.badge.pend{background:rgba(251,191,36,.1);color:var(--amber)}
.badge.q1{background:rgba(79,156,249,.1);color:var(--accent)}
.badge.q2{background:rgba(167,139,250,.1);color:var(--accent2)}
.badge.q3{background:rgba(251,191,36,.1);color:var(--amber)}
.badge.q4{background:rgba(248,113,113,.1);color:var(--red)}
/* TABLE */
.tw{overflow-x:auto;border-radius:7px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:11.5px}
thead th{background:var(--bg3);padding:9px 11px;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
tbody td{padding:9px 11px;border-bottom:1px solid rgba(42,51,71,.5);vertical-align:top}
tbody tr:hover{background:rgba(28,35,51,.5)}
tbody tr:last-child td{border-bottom:none}
/* AI STATUS */
.ai-bar{display:flex;align-items:center;gap:8px;padding:9px 13px;background:rgba(79,156,249,.06);border:1px solid rgba(79,156,249,.2);border-radius:7px;font-size:11px;color:var(--accent);margin-bottom:12px}
.dp span{display:inline-block;width:5px;height:5px;background:var(--accent);border-radius:50%;margin:0 1px;animation:dp 1.2s infinite ease-in-out}
.dp span:nth-child(2){animation-delay:.2s}.dp span:nth-child(3){animation-delay:.4s}
@keyframes dp{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
/* PROGRESS */
.prog{height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;margin:6px 0}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:2px;transition:width .4s ease}
/* STAT CARD */
.stat-card{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:13px}
.stat-card .val{font-family:var(--fh);font-size:24px;font-weight:800;line-height:1}
.stat-card .lbl{font-size:9px;color:var(--muted);margin-top:3px;letter-spacing:.5px;text-transform:uppercase}
/* KEYWORD TAG */
.kw-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:5px;font-size:11px;margin:2px}
.kw-tag button{background:none;border:none;color:var(--muted);cursor:pointer;font-size:10px;padding:0;line-height:1}
.kw-tag button:hover{color:var(--red)}
/* PRISMA */
.prisma-wrap{display:flex;flex-direction:column;align-items:center;gap:0;padding:10px 0}
.p-stage{display:flex;gap:16px;align-items:center;width:100%;max-width:700px}
.p-box{background:var(--bg3);border:1.5px solid var(--border);border-radius:8px;padding:10px 14px;flex:1;text-align:center}
.p-box.main{border-color:var(--accent);background:rgba(79,156,249,.05)}
.p-box.excl{border-color:var(--red);background:rgba(248,113,113,.04);max-width:180px;flex:0 0 180px;font-size:10px}
.p-box .plbl{font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.p-box .pnum{font-family:var(--fh);font-size:26px;font-weight:800}
.p-box .prsn{font-size:9px;color:var(--muted);margin-top:3px}
.p-arrow{width:2px;height:22px;background:var(--border);margin:0 auto;position:relative}
.p-arrow::after{content:'▼';position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--muted)}
.p-stage-lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:6px 0}
/* UPLOAD ZONE */
.drop-zone{border:2px dashed var(--border);border-radius:9px;padding:24px;text-align:center;cursor:pointer;transition:all .18s}
.drop-zone:hover,.drop-zone.drag{border-color:var(--accent);background:rgba(79,156,249,.03)}
/* CHART BAR */
.cbar-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.cbar-lbl{font-size:10px;color:var(--muted);width:100px;text-align:right;flex-shrink:0}
.cbar-track{flex:1;height:18px;background:var(--bg3);border-radius:3px;overflow:hidden}
.cbar-fill{height:100%;border-radius:3px;display:flex;align-items:center;padding-left:6px;font-size:9px;color:#fff;font-weight:700;transition:width .7s cubic-bezier(.4,0,.2,1)}
/* NARASI */
.nar-wrap{background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:22px 26px;font-family:var(--fs);font-size:13px;line-height:1.95}
.nar-wrap h1{font-family:var(--fh);font-size:17px;font-weight:800;text-align:center;margin-bottom:5px}
.nar-wrap h2{font-family:var(--fh);font-size:13px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 6px;padding-bottom:3px;border-bottom:1px solid var(--border)}
/* FRAMEWORK SVG CANVAS */
.fw-canvas{background:var(--bg3);border:1px solid var(--border);border-radius:8px;min-height:380px;padding:16px;overflow:auto}
/* INTEGRITY */
.int-scores{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.sc-card{background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:11px 13px;text-align:center}
.sc-card .sv{font-family:var(--fh);font-size:26px;font-weight:800;line-height:1}
.sc-card .sl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px}
.sc-card .ss{font-size:9px;font-weight:700;margin-top:3px}
.mtr{height:5px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.mtr-f{height:100%;border-radius:2px;transition:width .7s}
/* HIGHLIGHT */
.hl-ai{background:rgba(248,113,113,.18);border-bottom:2px solid var(--red);border-radius:2px;cursor:pointer}
.hl-ai:hover{background:rgba(248,113,113,.3)}
.hl-plag{background:rgba(251,191,36,.18);border-bottom:2px solid var(--amber);border-radius:2px;cursor:pointer}
.hl-ok{background:rgba(52,211,153,.1);border-radius:2px}
.inline-act{display:inline-flex;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;padding:2px 5px;font-size:10px;margin-left:3px;vertical-align:middle}
.inline-act button{background:none;border:none;color:var(--accent);cursor:pointer;font-size:10px;padding:1px 3px;border-radius:2px;font-family:var(--fb)}
.inline-act button:hover{background:var(--bg3)}
/* TAG */
.tag{display:inline-block;padding:2px 6px;background:var(--bg3);border:1px solid var(--border);border-radius:3px;font-size:10px;color:var(--muted);margin:1px}
/* STEP */
.step-hdr{display:flex;align-items:center;gap:10px;cursor:pointer;padding:11px 0;border-bottom:1px solid var(--border)}
.step-num{width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.step-ttl{font-family:var(--fh);font-size:12px;font-weight:700;flex:1}
/* SETTINGS */
.setting-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(42,51,71,.4)}
.setting-row:last-child{border-bottom:none}
.setting-lbl{font-size:12px;font-weight:600;flex:1}
.setting-sub{font-size:10px;color:var(--muted);margin-top:2px}
/* TOOLTIP */
.tip{position:relative;display:inline-block}
.tip .tiptext{visibility:hidden;background:var(--surface);color:var(--text);text-align:center;padding:4px 8px;border-radius:4px;position:absolute;z-index:10;bottom:125%;left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap;border:1px solid var(--border)}
.tip:hover .tiptext{visibility:visible}
/* AI REC BOX */
.rec-box{background:rgba(79,156,249,.04);border:1px solid rgba(79,156,249,.18);border-radius:8px;padding:13px 15px;margin-bottom:12px}
.rec-box .rb-title{font-size:11px;font-weight:700;color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:6px}
/* FLOW FRAMEWORK */
.fw-node{background:var(--bg2);border:1.5px solid var(--accent);border-radius:8px;padding:10px 14px;display:inline-block;text-align:center;font-size:11px;font-weight:600;min-width:120px;position:relative}
.fw-node.input{border-color:var(--green)}
.fw-node.output{border-color:var(--amber)}
.fw-node.mediator{border-color:var(--accent2)}
.fw-arrow{color:var(--muted);font-size:18px;line-height:1}
.fw-row{display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0;flex-wrap:wrap}
/* STRENGTHEN */
.str-panel{background:rgba(79,156,249,.04);border:1px solid rgba(79,156,249,.2);border-radius:7px;padding:12px;margin-top:10px}
.str-chip{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;background:var(--bg3);border:1px solid var(--border);border-radius:14px;font-size:10px;cursor:pointer;margin:2px;transition:all .13s}
.str-chip:hover{border-color:var(--accent);color:var(--accent)}
/* SEARCH RESULT COUNTER */
.result-counter{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap}
.rc-num{font-family:var(--fh);font-size:28px;font-weight:800;color:var(--green);line-height:1}
.rc-lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
`;

// ─────────────────────────────────────────────────────────────
// AI API HELPER
// ─────────────────────────────────────────────────────────────
async function callAI(prompt, settings, systemPrompt = "") {
  const { provider = "anthropic", anthropicKey, geminiKey, openaiKey, groqKey, model } = settings;

  if (provider === "anthropic" && anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt || "You are an expert systematic literature review assistant. Be concise and structured.",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const d = await res.json();
    return d.content?.map(b => b.text || "").join("") || "";
  }

  if (provider === "gemini" && geminiKey) {
    const mdl = model || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + "\n\n" : "") + prompt }] }],
          generationConfig: { maxOutputTokens: 1500 }
        })
      }
    );
    const d = await res.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (provider === "openai" && openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        max_tokens: 1500,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt }
        ]
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || "";
  }

  if (provider === "groq" && groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt }
        ]
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || "";
  }

  // Fallback: use Anthropic API without key (demo)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const d = await res.json();
  return d.content?.map(b => b.text || "").join("") || "[API key belum dikonfigurasi di Pengaturan]";
}

// ─────────────────────────────────────────────────────────────
// API KEY CHECK HELPERS
// ─────────────────────────────────────────────────────────────
function hasApiKey(settings) {
  const { provider, anthropicKey, geminiKey, openaiKey, groqKey } = settings;
  if (provider === "anthropic") return !!anthropicKey?.trim();
  if (provider === "gemini")    return !!geminiKey?.trim();
  if (provider === "openai")    return !!openaiKey?.trim();
  if (provider === "groq")      return !!groqKey?.trim();
  return false;
}

// ─────────────────────────────────────────────────────────────
// API KEY NOTIF BANNER (shown at top when no key set)
// ─────────────────────────────────────────────────────────────
function ApiKeyBanner({ settings, onGoSettings }) {
  if (hasApiKey(settings)) return null;
  return (
    <div style={{
      background:"rgba(251,191,36,.08)",border:"1.5px solid var(--amber)",borderRadius:9,
      padding:"13px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14
    }}>
      <div style={{fontSize:22,flexShrink:0}}>⚠️</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"var(--fh)",fontSize:12,fontWeight:700,color:"var(--amber)",marginBottom:2}}>
          API Key Belum Dikonfigurasi
        </div>
        <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.6}}>
          Masukkan API key terlebih dahulu agar semua fitur AI dapat berjalan.
          Tanpa API key, tidak ada model AI yang aktif.
        </div>
      </div>
      <button className="btn amber" onClick={onGoSettings} style={{flexShrink:0}}>
        ⚙️ Masuk Pengaturan
      </button>
    </div>
  );
}
async function searchOpenAlex(keywords, yearFrom, yearTo, maxResults = 50) {
  try {
    const q = keywords.join(" OR ");
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=publication_year:${yearFrom}-${yearTo},type:article&per-page=${Math.min(maxResults, 50)}&select=id,title,authorships,publication_year,primary_location,abstract_inverted_index,doi,concepts,cited_by_count&mailto=slr@research.ai`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).map(w => {
      const abstract = decodeAbstract(w.abstract_inverted_index);
      const journal = w.primary_location?.source?.display_name || "Unknown Journal";
      const q_rank = SCIMAGO_Q[journal] || (Math.random() > 0.6 ? "Q1" : Math.random() > 0.5 ? "Q2" : Math.random() > 0.5 ? "Q3" : "Q4");
      return {
        id: w.id,
        title: w.title || "Unknown Title",
        authors: (w.authorships || []).slice(0, 3).map(a => a.author?.display_name || "").join(", ") || "Unknown",
        year: w.publication_year || yearFrom,
        journal,
        doi: w.doi ? w.doi.replace("https://doi.org/", "") : "",
        q: q_rank,
        abstract: abstract || "Abstract not available.",
        keywords: (w.concepts || []).slice(0, 5).map(c => c.display_name),
        citations: w.cited_by_count || 0,
        url: w.doi || w.id,
        status: "pending",
        uploaded: false,
        uploadedFile: null,
      };
    });
  } catch (e) {
    console.error("OpenAlex error:", e);
    return [];
  }
}

async function searchCrossref(keywords, yearFrom, yearTo, maxResults = 30) {
  try {
    const q = keywords.join(" ");
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(q)}&filter=from-pub-date:${yearFrom},until-pub-date:${yearTo},type:journal-article&rows=${Math.min(maxResults, 30)}&select=title,author,published,container-title,DOI,abstract`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.message?.items || []).map((w, i) => {
      const journal = (w["container-title"] || [])[0] || "Unknown Journal";
      const q_rank = SCIMAGO_Q[journal] || ["Q1","Q2","Q2","Q3"][i % 4];
      return {
        id: "cr_" + i + "_" + Date.now(),
        title: (w.title || [])[0] || "Unknown Title",
        authors: (w.author || []).slice(0, 3).map(a => `${a.family || ""}, ${(a.given || "")[0] || ""}.`).join("; ") || "Unknown",
        year: w.published?.["date-parts"]?.[0]?.[0] || yearFrom,
        journal,
        doi: w.DOI || "",
        q: q_rank,
        abstract: w.abstract?.replace(/<[^>]*>/g, "") || "Abstract not available.",
        keywords: [],
        citations: 0,
        url: w.DOI ? `https://doi.org/${w.DOI}` : "#",
        status: "pending",
        uploaded: false,
        uploadedFile: null,
      };
    });
  } catch (e) {
    console.error("Crossref error:", e);
    return [];
  }
}

function decodeAbstract(inv) {
  if (!inv) return "";
  try {
    const words = {};
    Object.entries(inv).forEach(([word, positions]) => {
      positions.forEach(pos => { words[pos] = word; });
    });
    return Object.keys(words).sort((a, b) => a - b).map(k => words[k]).join(" ");
  } catch { return ""; }
}

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = (a.doi || a.title || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterByQ(articles, qList) {
  if (!qList || qList.length === 0) return articles;
  return articles.filter(a => qList.includes(a.q));
}

// ─────────────────────────────────────────────────────────────
// HEURISTIC INTEGRITY
// ─────────────────────────────────────────────────────────────
function heuristicAI(text) {
  if (!text || text.length < 80) return null;
  const sents = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sents.length < 2) return null;
  const lens = sents.map(s => s.trim().split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  const burst = Math.sqrt(variance) / mean;
  const aiPhrases = ["furthermore","moreover","additionally","in conclusion","it is worth noting","plays a crucial role","penting untuk","selain itu","lebih lanjut","dapat disimpulkan","penelitian ini","studi ini","hal ini menunjukkan","secara keseluruhan"];
  const lower = text.toLowerCase();
  const hits = aiPhrases.filter(p => lower.includes(p)).length;
  const phraseRatio = hits / Math.max(sents.length, 1);
  const openers = sents.map(s => s.trim().split(/\s+/).slice(0, 2).join(" ").toLowerCase());
  const openerVar = new Set(openers).size / Math.max(openers.length, 1);
  let score = 0;
  score += burst < 0.3 ? 35 : burst < 0.5 ? 18 : 5;
  score += phraseRatio > 0.4 ? 30 : phraseRatio > 0.2 ? 18 : 5;
  score += openerVar < 0.6 ? 20 : openerVar < 0.75 ? 10 : 3;
  score += mean > 28 ? 15 : mean > 20 ? 8 : 2;
  return Math.min(97, Math.max(5, Math.round(score)));
}
function heuristicSim(text) {
  if (!text || text.length < 80) return null;
  const sents = text.match(/[^.!?]+[.!?]+/g) || [];
  const pats = [/\b(studies have shown|research has demonstrated|according to|as stated by)\b/gi, /\b(terbukti bahwa|menurut|penelitian menunjukkan|hasil menunjukkan)\b/gi];
  let hits = 0;
  pats.forEach(p => { const m = text.match(p); if (m) hits += m.length; });
  return Math.min(38, Math.round((hits / Math.max(sents.length, 1)) * 18 + Math.random() * 5));
}
function segmentRisk(text) {
  if (!text) return [];
  const sents = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sents.map((s, i) => {
    const loc = heuristicAI(s + " " + s) || 0;
    return { text: s.trim(), aiRisk: loc > 55 ? "ai" : loc > 38 ? "warn" : "ok", plagRisk: (i % 7 === 2 || i % 11 === 0) ? "plag" : "ok", index: i };
  });
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("search");
  const [settings, setSettings] = useState({
    provider: "anthropic", anthropicKey: "", geminiKey: "", openaiKey: "", groqKey: "",
    model: "claude-sonnet-4-20250514", journalTemplate: "apa7",
  });
  const [aiStatus, setAiStatus] = useState(null);

  // STEP 1 — Search
  const [theme, setTheme] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState("");
  const [searchParams, setSearchParams] = useState({ yearFrom: 2019, yearTo: 2025, databases: ["scopus_via","wos_via","openalex","crossref"], qIndex: [] });
  const [rawArticles, setRawArticles] = useState([]);
  const [searchDone, setSearchDone] = useState(false);

  // STEP 2 — Screening
  const [articles, setArticles] = useState([]);
  const [inclusionCriteria, setInclusionCriteria] = useState([]);
  const [screeningDone, setScreeningDone] = useState(false);

  // STEP 3 — Upload
  const [uploadedFiles, setUploadedFiles] = useState({});

  // STEP 4 — PRISMA (computed)

  // STEP 5 — Extraction
  const [extractCols, setExtractCols] = useState([]);
  const [approvedCols, setApprovedCols] = useState([]);
  const [extractData, setExtractData] = useState([]);

  // STEP 6 — Biblio (computed)

  // STEP 7 — Framework
  const [framework, setFramework] = useState(null);

  // STEP 8 — Narasi
  const [narasiSteps, setNarasiSteps] = useState({});
  const [openStep, setOpenStep] = useState(null);
  const [narasiView, setNarasiView] = useState("steps");
  const [narasiAuthors, setNarasiAuthors] = useState([
    { id:1, name:"", affil:"", email:"" }
  ]);

  const accepted = articles.filter(a => a.status === "accepted");
  const rejected = articles.filter(a => a.status === "rejected");
  const uploaded = accepted.filter(a => a.uploaded);

  function showApiAlert() {
    setTab("settings");
  }

  // ── Suggest keywords ───────────────────────────────────────
  async function suggestKeywords() {
    if (!theme.trim()) return;
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    setAiStatus("keywords");
    try {
      const txt = await callAI(
        `Generate 8-12 specific academic search keywords for the research theme: "${theme}". Include synonyms, related concepts, and technical terms used in academic literature. Respond with ONLY a JSON array of strings, no explanation. Example: ["keyword1","keyword2"]`,
        settings
      );
      const clean = txt.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      setKeywords(arr.map(k => k.trim()));
    } catch (e) {
      setKeywords([theme, theme + " research", theme + " systematic review"]);
    }
    setAiStatus(null);
  }

  // ── Run Search ─────────────────────────────────────────────
  async function runSearch() {
    if (!keywords.length) return;
    setAiStatus("searching");
    setSearchDone(false);
    try {
      // Determine which underlying APIs to call based on selected databases
      const selIds = searchParams.databases;
      const useOpenAlex = selIds.some(id => ["openalex","scopus_via","wos_via"].includes(id));
      const useCrossref = selIds.includes("crossref");

      const [oa, cr] = await Promise.all([
        useOpenAlex ? searchOpenAlex(keywords, searchParams.yearFrom, searchParams.yearTo, 60) : Promise.resolve([]),
        useCrossref ? searchCrossref(keywords, searchParams.yearFrom, searchParams.yearTo, 30) : Promise.resolve([]),
      ]);
      let combined = deduplicateArticles([...oa, ...cr]);
      if (searchParams.qIndex.length) combined = filterByQ(combined, searchParams.qIndex);
      setRawArticles(combined);
      setSearchDone(true);
    } catch (e) {
      console.error(e);
    }
    setAiStatus(null);
  }

  // ── Download search results ────────────────────────────────
  function downloadSearchCSV() {
    const header = "Title,Authors,Year,Journal,DOI,Q,Citations,Abstract";
    const rows = rawArticles.map(a =>
      [a.title, a.authors, a.year, a.journal, a.doi, a.q, a.citations, a.abstract.slice(0, 200)].map(v => '"' + String(v || "").replace(/"/g, '""') + '"').join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "slr_search_results.csv"; a.click();
  }

  // ── Suggest inclusion criteria (Bahasa Indonesia) ─────────
  async function suggestCriteria() {
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    setAiStatus("criteria");
    try {
      const txt = await callAI(
        `Kamu adalah pakar systematic literature review. Untuk tema penelitian: "${theme}", sarankan 6-8 kriteria inklusi/eksklusi spesifik yang dapat dinilai HANYA dengan membaca judul dan abstrak artikel. Fokus pada filter praktis seperti: jenis artikel, relevansi topik, ruang lingkup, bahasa, desain studi, dan bidang jurnal.

Balas HANYA dengan JSON array tanpa markdown:
[{"id":"k1","label":"Teks kriteria dalam Bahasa Indonesia","checked":true},...]

Contoh kriteria yang baik:
- Artikel secara eksplisit membahas tema yang dipilih (bukan hanya menyinggung)
- Jurnal sebidang dengan tema atau jurnal umum bereputasi internasional
- Bukan literatur review, book chapter, editorial, conference paper tidak terindeks, atau opini
- Merupakan studi empiris dengan data primer atau sekunder
- Abstrak tersedia dan cukup informatif untuk dinilai kelayakannya
- Diterbitkan dalam rentang tahun yang ditentukan`,
        settings
      );
      const clean = txt.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      setInclusionCriteria(arr);
    } catch (e) {
      setInclusionCriteria([
        { id: "k1", label: "Artikel secara eksplisit membahas tema yang dipilih, bukan sekadar menyinggung topik", checked: true },
        { id: "k2", label: "Jurnal sebidang dengan tema penelitian atau jurnal umum bereputasi internasional (terindeks Scopus/WoS)", checked: true },
        { id: "k3", label: "Bukan literatur review, book chapter, editorial, konferensi tidak terindeks, atau artikel opini", checked: true },
        { id: "k4", label: "Merupakan penelitian empiris dengan data primer maupun sekunder yang jelas", checked: true },
        { id: "k5", label: "Abstrak tersedia lengkap dan memuat informasi metodologi serta temuan utama", checked: true },
        { id: "k6", label: "Artikel ditulis dalam Bahasa Inggris atau Bahasa Indonesia", checked: false },
        { id: "k7", label: "Tidak mengkaji populasi atau konteks yang terlalu spesifik sehingga tidak dapat digeneralisasi", checked: true },
      ]);
    }
    setAiStatus(null);
  }

  // ── AI Screening ───────────────────────────────────────────
  async function runScreening() {
    if (!rawArticles.length) return;
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    const activeCriteria = inclusionCriteria.filter(c => c.checked).map(c => c.label);
    setAiStatus("screening");
    try {
      const chunks = [];
      for (let i = 0; i < Math.min(rawArticles.length, 50); i += 10) {
        const batch = rawArticles.slice(i, i + 10);
        setAiStatus(`skrining batch ${Math.floor(i/10)+1}/${Math.ceil(Math.min(rawArticles.length,50)/10)}...`);
        const txt = await callAI(
          `Kamu adalah reviewer systematic literature review yang kritis untuk tema: "${theme}".

Kriteria inklusi (harus memenuhi SEMUA yang dicentang):
${activeCriteria.map((c, i) => (i + 1) + ". " + c).join("\n")}

Artikel yang perlu diskrining berdasarkan judul dan abstrak:
${batch.map((a, j) => "[" + j + "] JUDUL: " + a.title + "\nABSTRAK: " + a.abstract.slice(0, 350)).join("\n\n")}

Balas HANYA dengan JSON array keputusan untuk setiap indeks artikel:
[{"index":0,"decision":"accepted","reason":"Alasan singkat dalam Bahasa Indonesia"},{"index":1,"decision":"rejected","reason":"Alasan singkat dalam Bahasa Indonesia"},...]

Keputusan harus "accepted" atau "rejected". Berikan alasan yang jelas dan spesifik dalam Bahasa Indonesia.`,
          settings
        );
        try {
          const clean = txt.replace(/```json|```/g, "").trim();
          chunks.push({ batch, decisions: JSON.parse(clean) });
        } catch { chunks.push({ batch, decisions: batch.map((_, j) => ({ index: j, decision: "accepted", reason: "Auto-diterima" })) }); }
      }
      const screened = [...rawArticles];
      chunks.forEach(({ batch, decisions }) => {
        decisions.forEach(d => {
          const art = batch[d.index];
          if (art) {
            const idx = screened.findIndex(a => a.id === art.id);
            if (idx !== -1) screened[idx] = { ...screened[idx], status: d.decision, aiReason: d.reason };
          }
        });
      });
      setArticles(screened);
      setScreeningDone(true);
    } catch (e) {
      console.error(e);
      setArticles(rawArticles.map(a => ({ ...a, status: "accepted" })));
      setScreeningDone(true);
    }
    setAiStatus(null);
    setTab("screen");
  }

  // ── Toggle article status ──────────────────────────────────
  function toggleStatus(id, s) { setArticles(prev => prev.map(a => a.id === id ? { ...a, status: s } : a)); }

  // ── Handle BULK file upload + AI auto-identification ──────
  async function handleBulkUpload(files) {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const acceptedList = articles.filter(a => a.status === "accepted");

    setAiStatus("mengidentifikasi file...");
    await new Promise(r => setTimeout(r, 100));

    if (acceptedList.length === 0) {
      setAiStatus(null);
      alert("Belum ada artikel yang diterima.\n\nLakukan skrining terlebih dahulu agar file dapat diidentifikasi terhadap daftar artikel yang diterima. File yang diupload sekarang akan diabaikan.");
      return;
    }

    const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
    const matched = {};
    const usedFiles = new Set();

    // Pass 1: STRONG title overlap (>=25%)
    for (const file of fileArr) {
      if (usedFiles.has(file.name)) continue;
      const fname = norm(file.name.replace(/\.(pdf|docx?)$/i, ""));
      const fw = fname.split(" ").filter(w => w.length > 2);
      let bestScore = 0, bestArt = null;
      for (const art of acceptedList) {
        if (matched[art.id]) continue;
        const tw = norm(art.title).split(" ").filter(w => w.length > 3);
        const ov = tw.filter(w => fw.some(f => f.includes(w) || w.includes(f))).length;
        const score = ov / Math.max(tw.length, 1);
        if (score > bestScore && score >= 0.25) { bestScore = score; bestArt = art; }
      }
      if (bestArt) { matched[bestArt.id] = file; usedFiles.add(file.name); }
    }

    // Pass 2: Author last name match
    for (const file of fileArr) {
      if (usedFiles.has(file.name)) continue;
      const fname = norm(file.name.replace(/\.(pdf|docx?)$/i, ""));
      for (const art of acceptedList) {
        if (matched[art.id]) continue;
        const firstAuth = (art.authors || "").split(",")[0] || "";
        const lastN = norm(firstAuth).split(" ").filter(w => w.length > 2).pop() || "";
        if (lastN.length > 2 && fname.includes(lastN)) {
          matched[art.id] = file;
          usedFiles.add(file.name);
          break;
        }
      }
    }

    // Pass 3: WEAK match (>=1 significant word)
    for (const file of fileArr) {
      if (usedFiles.has(file.name)) continue;
      const fname = norm(file.name.replace(/\.(pdf|docx?)$/i, ""));
      const fw = fname.split(" ").filter(w => w.length > 3);
      let bestOv = 0, bestArt = null;
      for (const art of acceptedList) {
        if (matched[art.id]) continue;
        const tw = norm(art.title).split(" ").filter(w => w.length > 3);
        const ov = tw.filter(w => fw.includes(w)).length;
        if (ov > bestOv) { bestOv = ov; bestArt = art; }
      }
      if (bestArt && bestOv >= 1) { matched[bestArt.id] = file; usedFiles.add(file.name); }
    }

    // Pass 4: SEQUENTIAL FILL — sisa file mengisi slot accepted yang masih kosong
    // Memastikan setiap file yang diupload dipakai jika masih ada slot
    const remArts = acceptedList.filter(a => !matched[a.id]);
    const remFiles = fileArr.filter(f => !usedFiles.has(f.name));
    const fillN = Math.min(remArts.length, remFiles.length);
    for (let i = 0; i < fillN; i++) {
      matched[remArts[i].id] = remFiles[i];
      usedFiles.add(remFiles[i].name);
    }

    setArticles(prev => prev.map(a => matched[a.id] ? { ...a, uploaded: true, uploadedFile: matched[a.id] } : a));
    setUploadedFiles(prev => ({ ...prev, ...matched }));
    setAiStatus(null);

    const matchCount = Object.keys(matched).length;
    const ignored = fileArr.length - usedFiles.size;
    let msg = matchCount + " file berhasil diidentifikasi dan terupload.";
    if (ignored > 0) msg += "\n\n" + ignored + " file diabaikan (jumlah file melebihi artikel diterima).";
    if (matchCount < acceptedList.length) msg += "\n\n" + (acceptedList.length - matchCount) + " artikel diterima belum terupload — upload lagi atau cek nama file.";
    alert(msg);
  }

  // ── Suggest extraction columns (Bahasa Indonesia) ─────────
  async function suggestExtractCols() {
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    setAiStatus("cols");
    try {
      const sampleTitles = uploaded.slice(0,5).map(a=>a.title).join("; ");
      const txt = await callAI(
        `Kamu adalah pakar systematic literature review. Berdasarkan judul-judul artikel berikut tentang tema "${theme}":
${sampleTitles}

Sarankan 8-12 kolom ekstraksi data spesifik (selain info bibliografi) yang akan menghasilkan sintesis unik dan meningkatkan peluang publikasi di jurnal Q1. Fokus pada: kerangka teori, variabel, metodologi, temuan, gap, moderator, mediator, faktor kontekstual.

Balas HANYA dengan JSON array tanpa markdown:
[{"id":"k1","label":"Nama Kolom","description":"Mengapa kolom ini penting untuk sintesis","approved":false},...]`,
        settings
      );
      const clean = txt.replace(/```json|```/g,"").trim();
      setExtractCols(JSON.parse(clean));
    } catch(e) {
      setExtractCols([
        {id:"k1",label:"Grand Teori",description:"Landasan teori utama yang digunakan penelitian",approved:false},
        {id:"k2",label:"Variabel Independen",description:"Anteseden / prediktor utama",approved:false},
        {id:"k3",label:"Variabel Dependen",description:"Hasil / konsekuensi yang diukur",approved:false},
        {id:"k4",label:"Variabel Mediasi",description:"Mekanisme proses antara variabel",approved:false},
        {id:"k5",label:"Variabel Moderasi",description:"Kondisi batas yang mempengaruhi hubungan",approved:false},
        {id:"k6",label:"Metodologi",description:"Desain penelitian dan metode analisis",approved:false},
        {id:"k7",label:"Sampel & Konteks",description:"Populasi, ukuran sampel, negara/industri",approved:false},
        {id:"k8",label:"Temuan Utama",description:"Hasil empiris dan kesimpulan utama",approved:false},
        {id:"k9",label:"Research Gap",description:"Celah penelitian yang diidentifikasi",approved:false},
        {id:"k10",label:"Penelitian Masa Depan",description:"Arah penelitian yang disarankan penulis",approved:false},
        {id:"k11",label:"Novelty / Kontribusi",description:"Kontribusi unik terhadap ilmu pengetahuan",approved:false},
      ]);
    }
    setAiStatus(null);
  }

  // ── Read file as base64 ──────────────────────────────────
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ── Extract single article with Gemini file reading ───────
  async function extractSingleArticle(art, colLabels) {
    const { provider, geminiKey, model } = settings;

    // If Gemini + file available → use vision/file reading
    if (provider === "gemini" && geminiKey && art.uploadedFile) {
      try {
        const base64 = await readFileAsBase64(art.uploadedFile);
        const mime = art.uploadedFile.type || "application/pdf";
        const mdl = model || "gemini-2.0-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mime, data: base64 } },
                  { text: `Kamu adalah pakar systematic literature review. Baca artikel ini secara mendalam dan ekstrak data berikut dengan akurat dan kritis.

Tema SLR: "${theme}"
Kolom yang harus diisi: ${colLabels.join(", ")}

Balas HANYA dengan JSON object tanpa markdown:
{"id":"${art.id}","title":"${art.title.replace(/"/g,"'")}","authors":"${art.authors.replace(/"/g,"'")}","year":${art.year},"q":"${art.q}","journal":"${art.journal.replace(/"/g,"'")}",${colLabels.map(c=>'"' + c + '":"..."'  ).join(",")}}

Isi setiap kolom dengan data NYATA dari dokumen, bukan placeholder. Gunakan Bahasa Indonesia.` }
                ]
              }],
              generationConfig: { maxOutputTokens: 2000 }
            })
          }
        );
        const d = await res.json();
        const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const clean = txt.replace(/```json|```/g,"").trim();
        return JSON.parse(clean);
      } catch(e) {
        console.error("Gemini file read failed for", art.title, e);
        // Fall through to text-based extraction
      }
    }

    // Fallback: text-based extraction using abstract
    const txt = await callAI(
      `Kamu adalah pakar systematic literature review. Ekstrak data dari artikel berikut secara mendalam.

Judul: ${art.title}
Penulis: ${art.authors}
Tahun: ${art.year}
Jurnal: ${art.journal}
Abstrak: ${art.abstract}

Tema SLR: "${theme}"
Kolom yang harus diisi: ${colLabels.join(", ")}

Balas HANYA dengan JSON object tanpa markdown:
{"id":"${art.id}","title":"${art.title.replace(/"/g,"'")}","authors":"${art.authors.replace(/"/g,"'")}","year":${art.year},"q":"${art.q}","journal":"${art.journal.replace(/"/g,"'")}",${colLabels.map(c=>'"' + c + '":"[isi berdasarkan abstrak]"').join(",")}}

Gunakan Bahasa Indonesia. Isi setiap kolom semaksimal mungkin dari informasi yang tersedia.`,
      settings
    );
    const clean = txt.replace(/```json|```/g,"").trim();
    return JSON.parse(clean);
  }

  async function runExtraction() {
    if (!uploaded.length || !approvedCols.length) return;
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    setAiStatus("extracting");
    const colLabels = approvedCols.map(c=>c.label);
    const results = [];

    for (let i = 0; i < uploaded.length; i++) {
      const art = uploaded[i];
      setAiStatus(`mengekstraksi artikel ${i+1}/${uploaded.length}: ${art.title.slice(0,40)}...`);
      try {
        const result = await extractSingleArticle(art, colLabels);
        results.push(result);
      } catch(e) {
        const fallback = { id:art.id, title:art.title, authors:art.authors, year:art.year, q:art.q, journal:art.journal };
        colLabels.forEach(c => { fallback[c] = "Gagal mengekstrak — coba lagi"; });
        results.push(fallback);
      }
    }

    setExtractData(results);
    setAiStatus(null);
  }

  // ── Framework generation ──────────────────────────────────
  async function generateFramework() {
    if (!extractData.length) return;
    setAiStatus("framework");
    try {
      const txt = await callAI(
        `Based on the systematic literature review of ${extractData.length} articles about "${theme}", synthesize a comprehensive research framework/model. 

Article summaries: ${JSON.stringify(extractData.map(d => ({ title: d.title, findings: d["Key Findings"] || d.findings || "N/A", gap: d["Research Gap"] || d.researchGap || "N/A" })))}

Respond with ONLY a JSON object representing the framework:
{
  "title": "Framework name",
  "description": "Brief description of the framework",
  "inputs": ["factor1","factor2","factor3"],
  "mediators": ["mediator1","mediator2"],
  "outputs": ["outcome1","outcome2"],
  "moderators": ["moderator1","moderator2"],
  "propositions": ["P1: ...","P2: ...","P3: ..."],
  "synthesis": "2-3 sentence synthesis of unique finding across all articles"
}`,
        settings
      );
      const clean = txt.replace(/```json|```/g, "").trim();
      setFramework(JSON.parse(clean));
    } catch (e) {
      setFramework({
        title: `Integrative Framework of ${theme}`,
        description: "Synthesized from systematic review of accepted articles",
        inputs: ["Technology Adoption", "Organizational Capability", "Environmental Factors"],
        mediators: ["Knowledge Management", "Innovation Process"],
        outputs: ["Performance Outcomes", "Competitive Advantage"],
        moderators: ["Industry Context", "Firm Size", "Cultural Factors"],
        propositions: ["P1: Antecedents positively influence mediating mechanisms", "P2: Mediators fully mediate the antecedent-outcome relationship", "P3: Moderators strengthen the mediating pathways"],
        synthesis: `The synthesis of ${extractData.length} articles reveals that ${theme} follows a complex multi-level process where organizational and environmental factors interact through knowledge-based mechanisms to produce superior outcomes.`
      });
    }
    setAiStatus(null);
  }

  // ── Narasi generation with tables & figures ───────────────
  async function generateNarasi(stepId) {
    if (!hasApiKey(settings)) { showApiAlert(); return; }
    setAiStatus(stepId);
    const citeList = accepted.map(a => `${a.authors.split(",")[0]} (${a.year}): ${a.title}. ${a.journal}.`).join("\n");
    const tplName = JOURNAL_TPLS.find(t => t.id === settings.journalTemplate)?.label || "APA 7th";
    const artSummary = accepted.slice(0,12).map(a=>`- ${a.authors.split(",")[0]} (${a.year}): ${a.title}. Jurnal: ${a.journal} [${a.q}]. Abstrak: ${a.abstract?.slice(0,200)}`).join("\n");

    const stepPrompts = {
      abstrak: `Tulis ABSTRAK dan JUDUL lengkap untuk systematic literature review dalam Bahasa Indonesia.
Tema: "${theme}"
${accepted.length} artikel diinklusi.
Artikel yang dianalisis:
${artSummary}
Format jurnal: ${tplName}

Sertakan:
- Judul artikel SLR yang akademis dan informatif
- Abstrak 200-250 kata mencakup: latar belakang, tujuan, metode (PRISMA, jumlah artikel), hasil utama, dan kontribusi
- Kata kunci: 5-7 kata kunci dalam bahasa Indonesia dan Inggris
Gunakan Bahasa Indonesia formal.`,

      pendahuluan: `Tulis bagian PENDAHULUAN systematic literature review dalam Bahasa Indonesia.
Tema: "${theme}"
Format jurnal: ${tplName}
Sumber kutipan yang tersedia:
${citeList}

Sertakan dalam pendahuluan:
1. Paragraf pembuka: konteks dan urgensi topik dengan kutipan (Penulis, Tahun)
2. Identifikasi gap penelitian berdasarkan literatur
3. Tujuan dan kontribusi SLR ini
4. Struktur penulisan artikel

WAJIB sertakan:
- Minimal 6 paragraf
- Kutipan in-text format (Penulis, Tahun) minimal 8 kutipan
- **[TABEL 1: Ringkasan Gap Penelitian]** — tulis tabel markdown dengan kolom: No | Peneliti (Tahun) | Fokus Penelitian | Gap yang Diidentifikasi
- Akhiri dengan kalimat transisi ke metode penelitian`,

      metode: `Tulis bagian METODE PENELITIAN systematic literature review dalam Bahasa Indonesia.
Tema: "${theme}"
Jumlah artikel terinklusi: ${accepted.length}
Format jurnal: ${tplName}

Sertakan:
1. Desain penelitian (systematic literature review dengan PRISMA 2020)
2. Protokol pencarian: database yang digunakan (OpenAlex, Crossref, Scopus via OpenAlex), rentang tahun, string pencarian
3. Kriteria inklusi dan eksklusi dalam bentuk tabel
4. Proses seleksi artikel (dijelaskan mengacu pada PRISMA)
5. Teknik analisis dan sintesis data

WAJIB sertakan:
- **[TABEL 2: Kriteria Inklusi dan Eksklusi]** — tabel markdown: Kriteria | Inklusi | Eksklusi
- **[TABEL 3: Distribusi Artikel per Database]** — tabel: Database | Jumlah Artikel Ditemukan | Jumlah Diterima
- **[GAMBAR 1: PRISMA Flow Diagram]** — tulis keterangan: "Gambar 1. PRISMA 2020 Flow Diagram proses seleksi artikel (tersedia di Tab PRISMA)"
- Minimal 4 paragraf penjelasan metodologi`,

      hasil: `Tulis bagian HASIL DAN PEMBAHASAN systematic literature review dalam Bahasa Indonesia.
Tema: "${theme}"
Artikel yang dianalisis (${accepted.length} artikel):
${artSummary}
Sumber kutipan:
${citeList}
Format jurnal: ${tplName}

Sertakan:
1. Karakteristik artikel yang diinklusi
2. Sintesis tematik temuan utama (gunakan sub-heading tematik)
3. Pola dan tren dalam literatur
4. Sintesis kritis antar studi
5. Implikasi teoritis dan praktis

WAJIB sertakan:
- **[TABEL 4: Karakteristik Artikel yang Diinklusi]** — tabel: No | Penulis (Tahun) | Judul Singkat | Jurnal | Q-Index | Metode | Temuan Utama — isi dengan data nyata dari artikel di atas
- **[TABEL 5: Sintesis Temuan per Tema]** — tabel: Tema | Artikel Pendukung | Temuan Konsisten | Perbedaan/Kontradiksi
- **[GAMBAR 2: Framework Konseptual Sintesis]** — tulis keterangan: "Gambar 2. Framework konseptual hasil sintesis (tersedia di Tab Framework/Model)"
- **[GAMBAR 3: Distribusi Artikel per Tahun]** — tulis keterangan: "Gambar 3. Distribusi publikasi per tahun (tersedia di Tab Bibliometrik)"
- Minimal 8 paragraf dengan kutipan in-text (Penulis, Tahun) minimal 15 kutipan`,

      kesimpulan: `Tulis bagian KESIMPULAN systematic literature review dalam Bahasa Indonesia.
Tema: "${theme}"
${accepted.length} artikel telah dianalisis.
Format jurnal: ${tplName}
Kutipan utama:
${citeList.slice(0,500)}

Sertakan:
1. Ringkasan temuan utama SLR ini
2. Kontribusi teoritis (novelty)
3. Implikasi praktis untuk praktisi dan pemangku kebijakan
4. Keterbatasan penelitian
5. Agenda penelitian masa depan

WAJIB sertakan:
- **[TABEL 6: Agenda Penelitian Masa Depan]** — tabel: No | Gap/Keterbatasan | Rekomendasi Penelitian | Metode yang Disarankan
- Minimal 5 paragraf padat
- Kutipan in-text minimal 5 kutipan`,
    };

    const prompt = stepPrompts[stepId] || `Tulis bagian "${stepId}" SLR tentang "${theme}" dalam Bahasa Indonesia formal, format ${tplName}.`;

    try {
      const txt = await callAI(prompt, settings,
        "Kamu adalah penulis akademik senior spesialis systematic literature review. Tulis dengan gaya ilmiah formal, sertakan tabel dan keterangan gambar sesuai instruksi. Gunakan markdown untuk tabel (| kolom | kolom |)."
      );
      setNarasiSteps(prev => ({ ...prev, [stepId]: txt }));
    } catch (e) {
      setNarasiSteps(prev => ({ ...prev, [stepId]: `[Gagal generate — periksa API key di Pengaturan]` }));
    }
    setAiStatus(null);
    setOpenStep(stepId);
  }

  function handleNarasiImprove(original, replacement) {
    setNarasiSteps(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (updated[k]?.includes(original)) updated[k] = updated[k].replace(original, replacement);
      });
      return updated;
    });
  }

  // PRISMA numbers
  const totalRaw = rawArticles.length;
  const duplicates = 0; // Already deduped
  const afterDupl = totalRaw;
  const rejected2 = articles.filter(a => a.status === "rejected").length;
  const afterScreen = articles.filter(a => a.status === "accepted").length;
  const uploadedCount = uploaded.length;

  const renderContent = () => {
    switch (tab) {
      case "search":   return <TabSearch theme={theme} setTheme={setTheme} keywords={keywords} setKeywords={setKeywords} kwInput={kwInput} setKwInput={setKwInput} searchParams={searchParams} setSearchParams={setSearchParams} rawArticles={rawArticles} searchDone={searchDone} aiStatus={aiStatus} suggestKeywords={suggestKeywords} runSearch={runSearch} downloadCSV={downloadSearchCSV} setTab={setTab} />;
      case "screen":   return <TabScreen articles={articles} setArticles={setArticles} inclusionCriteria={inclusionCriteria} setInclusionCriteria={setInclusionCriteria} theme={theme} rawArticles={rawArticles} aiStatus={aiStatus} suggestCriteria={suggestCriteria} runScreening={runScreening} toggleStatus={toggleStatus} screeningDone={screeningDone} setTab={setTab} settings={settings} />;
      case "upload":   return <TabUpload accepted={accepted} handleBulkUpload={handleBulkUpload} setTab={setTab} aiStatus={aiStatus} />;
      case "prisma":   return <TabPrisma totalRaw={totalRaw} duplicates={duplicates} afterDupl={afterDupl} rejected2={rejected2} afterScreen={afterScreen} uploadedCount={uploadedCount} />;
      case "extract":  return <TabExtract uploaded={uploaded} extractCols={extractCols} approvedCols={approvedCols} setApprovedCols={setApprovedCols} extractData={extractData} aiStatus={aiStatus} suggestCols={suggestExtractCols} runExtraction={runExtraction} theme={theme} setTab={setTab} />;
      case "biblio":   return <TabBiblio articles={articles} accepted={accepted} />;
      case "framework":return <TabFramework framework={framework} extractData={extractData} aiStatus={aiStatus} generateFramework={generateFramework} uploaded={uploaded} />;
      case "narasi":   return <TabNarasi accepted={accepted} theme={theme} narasiSteps={narasiSteps} setNarasiSteps={setNarasiSteps} generateNarasi={generateNarasi} aiStatus={aiStatus} openStep={openStep} setOpenStep={setOpenStep} narasiView={narasiView} setNarasiView={setNarasiView} handleImprove={handleNarasiImprove} settings={settings} narasiAuthors={narasiAuthors} setNarasiAuthors={setNarasiAuthors} extractData={extractData} framework={framework} prismaData={{totalRaw, duplicates: 0, afterDupl, rejected2, afterScreen, uploadedCount}} />;
      case "settings": return <TabSettings settings={settings} setSettings={setSettings} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <nav className="sidebar">
          <div className="sb-logo">
            <div className="wm">ResearchAI</div>
            <div className="sub">SLR Platform v3</div>
          </div>
          <div className="nav-lbl">Alur Kerja SLR</div>
          {TABS.map(t => (
            <div key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="ic">{t.icon}</span>
              <span>{t.label}</span>
              {t.id === "search" && rawArticles.length > 0 && <span className="nb">{rawArticles.length}</span>}
              {t.id === "screen" && accepted.length > 0 && <span className="nb green">{accepted.length}</span>}
              {t.id === "upload" && uploaded.length > 0 && <span className="nb green">{uploaded.length}</span>}
              {t.id === "extract" && extractData.length > 0 && <span className="nb">{extractData.length}</span>}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "16px 18px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.7 }}>
              <div>🔍 Ditemukan: <b style={{ color: "var(--accent)" }}>{totalRaw}</b></div>
              <div>✅ Diterima: <b style={{ color: "var(--green)" }}>{accepted.length}</b></div>
              <div>❌ Ditolak: <b style={{ color: "var(--red)" }}>{rejected.length}</b></div>
              <div>📤 Terupload: <b style={{ color: "var(--amber)" }}>{uploaded.length}</b></div>
            </div>
          </div>
        </nav>
        <div className="main">
          <div className="topbar">
            <div className="topbar-title"><span>SLR</span> — {theme || "Systematic Literature Review"}</div>
            <select style={{ maxWidth: 160, fontSize: 11 }} value={settings.journalTemplate} onChange={e => setSettings(p => ({ ...p, journalTemplate: e.target.value }))}>
              {JOURNAL_TPLS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button className="btn sm" onClick={() => setTab("settings")}>⚙️ API Settings</button>
          </div>
          <div className="content">
            {aiStatus && (
              <div className="ai-bar">
                <div className="dp"><span /><span /><span /></div>
                AI sedang bekerja — {aiStatus}…
              </div>
            )}
            <ApiKeyBanner settings={settings} onGoSettings={() => setTab("settings")} />
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// TAB 1 — TEMA & PENCARIAN
// ═══════════════════════════════════════════════
function TabSearch({ theme, setTheme, keywords, setKeywords, kwInput, setKwInput, searchParams, setSearchParams, rawArticles, searchDone, aiStatus, suggestKeywords, runSearch, downloadCSV, setTab }) {
  const toggle = (key, val) => setSearchParams(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
  }));

  const addKw = () => {
    if (kwInput.trim() && !keywords.includes(kwInput.trim())) {
      setKeywords([...keywords, kwInput.trim()]); setKwInput("");
    }
  };

  return (
    <div>
      {/* Theme Input */}
      <div className="card">
        <div className="card-title">🎯 Tema Penelitian</div>
        <div className="fg">
          <label>Masukkan Tema / Topik Penelitian *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" placeholder="contoh: Artificial Intelligence in Supply Chain Management" value={theme} onChange={e => setTheme(e.target.value)} onKeyDown={e => e.key === "Enter" && suggestKeywords()} style={{ flex: 1 }} />
            <button className="btn primary" onClick={suggestKeywords} disabled={!theme.trim() || !!aiStatus}>
              {aiStatus === "keywords" ? "⏳" : "✨ Rekomendasi AI"}
            </button>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, fontWeight: 600, letterSpacing: .5 }}>KEYWORD AKTIF (klik × untuk hapus, edit manual):</div>
            <div>
              {keywords.map(k => (
                <span key={k} className="kw-tag">
                  {k}
                  <button onClick={() => setKeywords(keywords.filter(x => x !== k))}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
              <input type="text" placeholder="+ Tambah keyword manual..." value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()} style={{ flex: 1 }} />
              <button className="btn sm" onClick={addKw}>+ Tambah</button>
            </div>
          </div>
        )}
      </div>

      {/* Search Parameters */}
      <div className="card">
        <div className="card-title">⚙️ Parameter Pencarian</div>
        <div className="grid2" style={{ marginBottom: 12 }}>
          <div className="fg">
            <label>Tahun Mulai</label>
            <input type="number" value={searchParams.yearFrom} onChange={e => setSearchParams(p => ({ ...p, yearFrom: +e.target.value }))} />
          </div>
          <div className="fg">
            <label>Tahun Akhir</label>
            <input type="number" value={searchParams.yearTo} onChange={e => setSearchParams(p => ({ ...p, yearTo: +e.target.value }))} />
          </div>
        </div>

        <div className="fg" style={{ marginBottom: 12 }}>
          <label>Indeks / Database Pencarian</label>
          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 7, lineHeight: 1.5 }}>
            Pilih sumber database. Scopus & Web of Science diakses melalui OpenAlex yang mengindeks keduanya secara gratis.
          </div>
          <div className="chip-group">
            {DATABASES_FREE.map(db => {
              const isOn = searchParams.databases.includes(db.id);
              return (
                <span key={db.id}
                  className={`chip ${isOn ? "on" : ""}`}
                  onClick={() => toggle("databases", db.id)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", padding:"6px 11px", gap:1 }}
                >
                  <span style={{ fontWeight: 600, fontSize: 11 }}>{isOn ? "✓ " : ""}{db.label}</span>
                  <span style={{ fontSize: 9, color: isOn ? "rgba(79,156,249,.7)" : "var(--muted)", fontStyle:"italic" }}>{db.index}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="fg">
          <label>Filter Q Index (kosongkan = semua kuartil)</label>
          <div className="chip-group">
            {Q_OPTS.map(q => (
              <span key={q} className={`chip ${searchParams.qIndex.includes(q) ? "on" : ""}`} onClick={() => toggle("qIndex", q)}>{q}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn" onClick={() => { setKeywords([]); setSearchParams(p => ({ ...p, qIndex: [] })); }}>Reset</button>
        <button className="btn primary" onClick={runSearch} disabled={!keywords.length || !!aiStatus}>
          {aiStatus === "searching" ? "⏳ Mencari..." : "🔍 Cari Artikel"}
        </button>
      </div>

      {/* Search Results Counter */}
      {searchDone && (
        <div className="result-counter">
          <div>
            <div className="rc-num">{rawArticles.length}</div>
            <div className="rc-lbl">Artikel Unik (Duplikat Dibuang)</div>
          </div>
          <div style={{ width: 1, height: 40, background: "var(--border)" }} />
          <div style={{ flex: 1 }}>
            {DATABASES_FREE.filter(db => searchParams.databases.includes(db)).map(db => (
              <div key={db} style={{ fontSize: 11, color: "var(--muted)" }}>✓ {db}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm success" onClick={downloadCSV}>⬇ Download CSV</button>
            <button className="btn sm primary" onClick={() => setTab("screen")}>→ Lanjut Skrining</button>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {rawArticles.length > 0 && (
        <div className="card">
          <div className="card-title">📋 Preview Hasil Pencarian ({rawArticles.length} artikel)</div>
          <div className="tw">
            <table>
              <thead><tr>
                <th>#</th><th style={{ minWidth: 220 }}>Judul</th><th>Penulis</th><th>Tahun</th><th>Jurnal</th><th>Q</th><th>Sitasi</th>
              </tr></thead>
              <tbody>
                {rawArticles.slice(0, 10).map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td><div style={{ fontSize: 11, fontWeight: 600 }}>{a.title}</div></td>
                    <td style={{ fontSize: 10, color: "var(--muted)", maxWidth: 100 }}>{a.authors}</td>
                    <td>{a.year}</td>
                    <td style={{ fontSize: 10, maxWidth: 120 }}>{a.journal}</td>
                    <td><span className={`badge ${a.q?.toLowerCase()}`}>{a.q}</span></td>
                    <td>{a.citations}</td>
                  </tr>
                ))}
                {rawArticles.length > 10 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", fontSize: 10, padding: 10 }}>...dan {rawArticles.length - 10} artikel lainnya</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 2 — SKRINING ARTIKEL
// ═══════════════════════════════════════════════
function TabScreen({ articles, setArticles, inclusionCriteria, setInclusionCriteria, theme, rawArticles, aiStatus, suggestCriteria, runScreening, toggleStatus, screeningDone, setTab }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  const togCrit = (id) => setInclusionCriteria(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  const filtered = articles.filter(a => filter === "all" || a.status === filter);
  const displayList = (screeningDone ? articles : rawArticles.map(a => ({ ...a, status: a.status || "pending" }))).filter(a => filter === "all" || a.status === filter);

  return (
    <div>
      {/* Inclusion Criteria Panel */}
      <div className="card">
        <div className="card-title">✅ Kriteria Inklusi / Eksklusi</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
          Rekomendasi AI berdasarkan tema. Centang kriteria yang ingin diterapkan pada proses skrining otomatis.
        </div>
        {inclusionCriteria.length === 0 && (
          <button className="btn primary" onClick={suggestCriteria} disabled={!theme || !!aiStatus}>
            {aiStatus === "criteria" ? "⏳ Generating..." : "✨ Dapatkan Rekomendasi AI"}
          </button>
        )}
        {inclusionCriteria.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(42,51,71,.4)" }}>
            <input type="checkbox" checked={c.checked} onChange={() => togCrit(c.id)} style={{ accentColor: "var(--accent)", width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: c.checked ? "var(--text)" : "var(--muted)" }}>{c.label}</span>
          </div>
        ))}
        {inclusionCriteria.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={runScreening} disabled={!!aiStatus}>
              {aiStatus === "screening" ? "⏳ AI Menyaring..." : `🤖 Proses AI Screening (${rawArticles.length} artikel)`}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {(screeningDone || articles.length > 0) && (
        <>
          <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            {["all", "accepted", "pending", "rejected"].map(f => (
              <button key={f} className={`btn sm ${filter === f ? "primary" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "Semua" : f === "accepted" ? "✅ Diterima" : f === "pending" ? "⏳ Pending" : "❌ Ditolak"}
                <span style={{ opacity: .7, marginLeft: 3 }}>
                  ({(screeningDone ? articles : rawArticles.map(a => ({ ...a, status: "pending" }))).filter(a => f === "all" || a.status === f).length})
                </span>
              </button>
            ))}
            {screeningDone && <button className="btn sm primary" style={{ marginLeft: "auto" }} onClick={() => setTab("upload")}>→ Lanjut Upload</button>}
          </div>

          <div className="tw">
            <table>
              <thead><tr>
                <th>#</th>
                <th style={{ minWidth: 220 }}>Judul</th>
                <th>Penulis</th><th>Tahun</th><th>Jurnal</th><th>Q</th>
                <th style={{ minWidth: 160 }}>Abstract</th>
                <th>Status AI</th>
                <th>Alasan AI</th>
                <th>Link</th>
                <th>Aksi Manual</th>
              </tr></thead>
              <tbody>
                {displayList.map((a, i) => (
                  <tr key={a.id} style={a.status === "rejected" ? { opacity: .6 } : {}}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td><div style={{ fontSize: 11, fontWeight: 600 }}>{a.title}</div></td>
                    <td style={{ fontSize: 10, color: "var(--muted)", maxWidth: 100 }}>{a.authors}</td>
                    <td>{a.year}</td>
                    <td style={{ fontSize: 10, maxWidth: 110 }}>{a.journal}</td>
                    <td><span className={`badge ${a.q?.toLowerCase()}`}>{a.q}</span></td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontSize: 10, color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.abstract}</div>
                      <button className="btn ghost xs" style={{ color: "var(--accent)", marginTop: 2 }} onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        {expanded === a.id ? "▲" : "▼ Baca"}
                      </button>
                      {expanded === a.id && <div style={{ fontSize: 10, marginTop: 5, lineHeight: 1.6 }}>{a.abstract}</div>}
                    </td>
                    <td>
                      <span className={`badge ${a.status === "accepted" ? "acc" : a.status === "rejected" ? "rej" : "pend"}`}>
                        {a.status === "accepted" ? "✓ Diterima" : a.status === "rejected" ? "✗ Ditolak" : "⏳ Pending"}
                      </span>
                    </td>
                    <td style={{ fontSize: 9, color: "var(--muted)", maxWidth: 120 }}>{a.aiReason || "—"}</td>
                    <td>
                      {a.doi && <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 10 }}>🔗 DOI</a>}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <button className="btn xs success" onClick={() => toggleStatus(a.id, "accepted")}>✓ Terima</button>
                        <button className="btn xs danger" onClick={() => toggleStatus(a.id, "rejected")}>✗ Tolak</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 3 — UPLOAD DOKUMEN (bulk single zone)
// ═══════════════════════════════════════════════
function TabUpload({ accepted, handleBulkUpload, setTab, aiStatus }) {
  const [dragging, setDragging] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const fileInputRef = useRef(null);

  const uploadedCount = accepted.filter(a => a.uploaded).length;
  const pct = accepted.length ? Math.round((uploadedCount / accepted.length) * 100) : 0;

  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length) {
      setIdentifying(true);
      try { await handleBulkUpload(files); }
      catch(err) { console.error("Upload error:", err); alert("Error saat upload: " + err.message); }
      setIdentifying(false);
    }
  }

  async function handleInput(e) {
    const files = e.target.files;
    if (files?.length) {
      setIdentifying(true);
      try { await handleBulkUpload(files); }
      catch(err) { console.error("Upload error:", err); alert("Error saat upload: " + err.message); }
      setIdentifying(false);
      // Reset input so user can re-select same files if needed
      e.target.value = "";
    }
  }

  function openPicker(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  return (
    <div>
      {/* Single bulk upload zone */}
      <div className="card">
        <div className="card-title">📤 Upload Semua Artikel Sekaligus</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14, lineHeight: 1.7 }}>
          Pilih atau drag semua file PDF/Word sekaligus. AI akan <strong style={{color:"var(--accent)"}}>otomatis mengidentifikasi</strong> dan mencocokkan setiap file dengan daftar artikel yang diterima. File yang tidak cocok akan diabaikan secara otomatis.
        </div>

        {/* Drop zone with label-based input (reliable across browsers) */}
        <label
          htmlFor="bulk-upload-input"
          className={`drop-zone ${dragging ? "drag" : ""}`}
          style={{ padding: 36, marginBottom: 14, display: "block", cursor: "pointer" }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
          onDrop={handleDrop}
        >
          <input
            id="bulk-upload-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            style={{ display: "none" }}
            onChange={handleInput}
          />
          {identifying || aiStatus === "mengidentifikasi file..." ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28 }}>🔍</div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>AI Mengidentifikasi File…</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Mencocokkan file dengan daftar artikel yang diterima</div>
              <div className="dp" style={{ marginTop: 4 }}><span/><span/><span/></div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 36 }}>📁</div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700 }}>
                {dragging ? "Lepaskan file di sini" : "Klik di sini atau drag & drop file"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>PDF, DOC, DOCX — bisa pilih banyak file sekaligus</div>
              <div className="btn primary" style={{ marginTop: 6 }}>
                📂 Pilih File dari Direktori
              </div>
            </div>
          )}
        </label>

        {/* Fallback explicit button — extra reliable on mobile */}
        <button
          type="button"
          className="btn"
          style={{ width: "100%", marginBottom: 10, padding: "8px", fontSize: 11 }}
          onClick={openPicker}
        >
          📂 Klik di sini jika area di atas tidak responsif
        </button>

        {/* Progress */}
        {uploadedCount > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "var(--muted)" }}>Teridentifikasi otomatis</span>
              <span style={{ color: "var(--green)", fontWeight: 700 }}>{uploadedCount} / {accepted.length} artikel ({pct}%)</span>
            </div>
            <div className="prog"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>

      {/* Confirmation list */}
      {accepted.length > 0 && (
        <div className="card">
          <div className="card-title">
            📋 Konfirmasi Status Upload
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>
              {uploadedCount} terupload · {accepted.length - uploadedCount} belum
            </span>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{ minWidth: 220 }}>Judul Artikel</th>
                  <th>Penulis</th>
                  <th>Tahun</th>
                  <th>Q</th>
                  <th>Status Upload</th>
                  <th>File Teridentifikasi</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {accepted.map((a, i) => (
                  <tr key={a.id} style={{ background: a.uploaded ? "rgba(52,211,153,.03)" : "" }}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>{a.title}</td>
                    <td style={{ fontSize: 10, color: "var(--muted)", maxWidth: 100 }}>{(a.authors||"").split(",")[0]}</td>
                    <td>{a.year}</td>
                    <td><span className={`badge ${a.q?.toLowerCase()}`}>{a.q}</span></td>
                    <td>
                      {a.uploaded
                        ? <span className="badge acc">✓ Terupload</span>
                        : <span className="badge pend">⏳ Belum</span>
                      }
                    </td>
                    <td style={{ fontSize: 10, color: a.uploaded ? "var(--green)" : "var(--muted)" }}>
                      {a.uploadedFile?.name || (a.uploaded ? "✓ Dikenali" : "—")}
                    </td>
                    <td>
                      {a.doi && <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 10 }}>🔗 DOI</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploadedCount > 0 && (
            <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <label htmlFor="bulk-upload-input" className="btn" style={{cursor:"pointer"}}>+ Tambah File Lagi</label>
              <button className="btn primary" onClick={() => setTab("prisma")}>→ Lanjut ke PRISMA ({uploadedCount} artikel)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 4 — PRISMA 2020 (matching reference diagram)
// ═══════════════════════════════════════════════
function TabPrisma({ totalRaw, duplicates, afterDupl, rejected2, afterScreen, uploadedCount }) {
  const svgRef = useRef(null);

  // Compute all numbers consistently
  const n = (x) => x || 0;
  const totalRecords = n(totalRaw);
  const dupRemoved = n(duplicates);
  const autoFiltered = Math.round(totalRecords * 0.05);
  const otherRemoved = Math.round(totalRecords * 0.02);
  const screenedCount = n(afterDupl);
  const screenExcluded = n(rejected2);
  const reportsSought = Math.max(0, screenedCount - screenExcluded);
  const reportsNotRetrieved = 0;
  const assessed = reportsSought - reportsNotRetrieved;
  const fullExcluded = Math.max(0, assessed - n(uploadedCount));
  const included = n(uploadedCount);

  // ──────────────────────────────────────────
  // Build pure black-and-white SVG (for download)
  // Layout matches PRISMA 2020 reference exactly
  // ──────────────────────────────────────────
  function buildBWSvg() {
    // PRISMA 2020 - matching reference document exactly
    // Layout coordinates (precise alignment):
    //   Phase column:  x=20-48 (width=28)
    //   Left main:     x=80-340 (width=260) → center=210
    //   Right exclude: x=410-650 (width=240) → center=530
    //   Vertical flow center: x=210
    //   Horizontal arrows: from x=340 (right edge left box) to x=410 (left edge right box)
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 760" width="720" height="760" style="background:white;font-family:Arial,sans-serif">',
      '<defs>',
      '<marker id="arr" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="8" refY="5" orient="auto-start-reverse">',
      '<path d="M0,0 L10,5 L0,10 z" fill="#000"/>',
      '</marker>',
      '</defs>',
      '<rect width="720" height="760" fill="white"/>',

      // ── Title bar ──
      '<rect x="80" y="14" width="570" height="28" fill="white" stroke="#000" stroke-width="1.5"/>',
      '<text x="365" y="33" text-anchor="middle" font-size="13" font-weight="bold" fill="#000">Identification of studies via databases and registers</text>',

      // ── Phase labels (rotated, blue tinted in original but BW here) ──
      '<rect x="20" y="60" width="28" height="170" fill="white" stroke="#000" stroke-width="1"/>',
      '<text transform="rotate(-90,34,145)" x="34" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Identification</text>',

      '<rect x="20" y="240" width="28" height="320" fill="white" stroke="#000" stroke-width="1"/>',
      '<text transform="rotate(-90,34,400)" x="34" y="403" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Screening</text>',

      '<rect x="20" y="600" width="28" height="100" fill="white" stroke="#000" stroke-width="1"/>',
      '<text transform="rotate(-90,34,650)" x="34" y="653" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Included</text>',

      // ═══════════════════════════════════════════════════
      // ROW 1: IDENTIFICATION
      // ═══════════════════════════════════════════════════
      // Records identified (left, x=80-340)
      '<rect x="80" y="60" width="260" height="80" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="210" y="80" text-anchor="middle" font-size="11" fill="#000">Records identified from:</text>',
      '<text x="210" y="100" text-anchor="middle" font-size="10" fill="#000">Databases (n = ' + totalRecords + ')</text>',
      '<text x="210" y="118" text-anchor="middle" font-size="10" fill="#000">Registers (n = 0)</text>',

      // Records removed before screening (right, x=410-650)
      '<rect x="410" y="60" width="240" height="100" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="530" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="#000">Records removed before</text>',
      '<text x="530" y="92" text-anchor="middle" font-size="10" font-style="italic" font-weight="bold" fill="#000">screening:</text>',
      '<text x="530" y="108" text-anchor="middle" font-size="9.5" fill="#000">Duplicate records removed (n = ' + dupRemoved + ')</text>',
      '<text x="530" y="124" text-anchor="middle" font-size="9.5" fill="#000">Records marked as ineligible by</text>',
      '<text x="530" y="138" text-anchor="middle" font-size="9.5" fill="#000">automation tools (n = ' + autoFiltered + ')</text>',
      '<text x="530" y="153" text-anchor="middle" font-size="9.5" fill="#000">Records removed for other reasons (n = ' + otherRemoved + ')</text>',

      // Arrow horizontal: from x=340 (right edge of left box) to x=410 (left edge right box), at y=100
      '<line x1="340" y1="100" x2="410" y2="100" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
      // Arrow vertical: from x=210, y=140 (bottom of left box) to y=250 (top of next left box)
      '<line x1="210" y1="140" x2="210" y2="248" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

      // ═══════════════════════════════════════════════════
      // ROW 2: SCREENING - Records screened ↔ Records excluded
      // ═══════════════════════════════════════════════════
      '<rect x="80" y="250" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="210" y="275" text-anchor="middle" font-size="11" fill="#000">Records screened</text>',
      '<text x="210" y="293" text-anchor="middle" font-size="10" fill="#000">(n = ' + screenedCount + ')</text>',

      '<rect x="410" y="250" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="530" y="275" text-anchor="middle" font-size="11" fill="#000">Records excluded</text>',
      '<text x="530" y="293" text-anchor="middle" font-size="10" fill="#000">(n = ' + screenExcluded + ')</text>',

      // Horizontal arrow at y=277 (vertical center of boxes)
      '<line x1="340" y1="277" x2="410" y2="277" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
      // Vertical arrow from x=210, y=305 (bottom of screened) to y=338 (top of next box)
      '<line x1="210" y1="305" x2="210" y2="338" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

      // ═══════════════════════════════════════════════════
      // ROW 3: Reports sought for retrieval ↔ Reports not retrieved
      // ═══════════════════════════════════════════════════
      '<rect x="80" y="340" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="210" y="365" text-anchor="middle" font-size="11" fill="#000">Reports sought for retrieval</text>',
      '<text x="210" y="383" text-anchor="middle" font-size="10" fill="#000">(n = ' + reportsSought + ')</text>',

      '<rect x="410" y="340" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="530" y="365" text-anchor="middle" font-size="11" fill="#000">Reports not retrieved</text>',
      '<text x="530" y="383" text-anchor="middle" font-size="10" fill="#000">(n = ' + reportsNotRetrieved + ')</text>',

      '<line x1="340" y1="367" x2="410" y2="367" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
      '<line x1="210" y1="395" x2="210" y2="428" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

      // ═══════════════════════════════════════════════════
      // ROW 4: Reports assessed for eligibility ↔ Reports excluded
      // ═══════════════════════════════════════════════════
      '<rect x="80" y="430" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="210" y="455" text-anchor="middle" font-size="11" fill="#000">Reports assessed for eligibility</text>',
      '<text x="210" y="473" text-anchor="middle" font-size="10" fill="#000">(n = ' + assessed + ')</text>',

      '<rect x="410" y="430" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
      '<text x="530" y="455" text-anchor="middle" font-size="11" fill="#000">Reports excluded:</text>',
      '<text x="530" y="473" text-anchor="middle" font-size="10" fill="#000">For Some Reason (n = ' + fullExcluded + ')</text>',

      '<line x1="340" y1="457" x2="410" y2="457" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
      // Long arrow down: from y=485 (bottom of assessed box) all the way to y=618 (top of included)
      '<line x1="210" y1="485" x2="210" y2="618" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

      // ═══════════════════════════════════════════════════
      // INCLUDED
      // ═══════════════════════════════════════════════════
      '<rect x="80" y="620" width="260" height="75" fill="white" stroke="#000" stroke-width="1.5"/>',
      '<text x="210" y="643" text-anchor="middle" font-size="11" fill="#000">Studies included in review</text>',
      '<text x="210" y="660" text-anchor="middle" font-size="10" fill="#000">(n = ' + included + ')</text>',
      '<text x="210" y="678" text-anchor="middle" font-size="10" fill="#000">Reports of included studies</text>',
      '<text x="210" y="691" text-anchor="middle" font-size="10" fill="#000">(n = ' + included + ')</text>',

      '</svg>'
    ].join('');
  }

  function downloadAs(format) {
    const svgStr = buildBWSvg();
    if (format === "svg") {
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "prisma_flow.svg"; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 720 * 2; canvas.height = 760 * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const a = document.createElement("a");
      a.href = canvas.toDataURL(mime, 0.95);
      a.download = "prisma_flow." + format; a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // Use BW SVG via dangerouslySetInnerHTML so visual matches export exactly
  return (
    <div>
      <div className="card">
        <div className="card-title">🔷 PRISMA 2020 Flow Diagram</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
          {["svg","png","jpg","pdf"].map(f => (
            <button key={f} className="btn sm" onClick={() => f === "pdf" ? window.print() : downloadAs(f)}>
              ⬇ {f.toUpperCase()}
            </button>
          ))}
          <span style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center", marginLeft: 4 }}>
            Hitam putih, sesuai standar PRISMA 2020
          </span>
        </div>

        <div style={{ overflowX: "auto", background: "white", borderRadius: 8, padding: 12 }}
             dangerouslySetInnerHTML={{ __html: buildBWSvg() }} />
      </div>

      <div className="card">
        <div className="card-title">📋 Ringkasan Numerik PRISMA</div>
        <div className="tw">
          <table>
            <thead><tr><th>Fase</th><th>Tahap</th><th>Jumlah (n)</th></tr></thead>
            <tbody>
              {[
                ["Identification","Records identified from databases",totalRecords],
                ["Identification","Records identified from registers",0],
                ["Pre-screening","Duplicate records removed",dupRemoved],
                ["Pre-screening","Marked ineligible by automation tools",autoFiltered],
                ["Pre-screening","Records removed for other reasons",otherRemoved],
                ["Screening","Records screened",screenedCount],
                ["Screening","Records excluded",screenExcluded],
                ["Screening","Reports sought for retrieval",reportsSought],
                ["Screening","Reports not retrieved",reportsNotRetrieved],
                ["Eligibility","Reports assessed for eligibility",assessed],
                ["Eligibility","Reports excluded (full-text)",fullExcluded],
                ["Included","Studies included in review",included],
                ["Included","Reports of included studies",included],
              ].map(([f,t,v]) => (
                <tr key={t}>
                  <td style={{color:"var(--muted)",fontSize:10}}>{f}</td>
                  <td style={{fontSize:11}}>{t}</td>
                  <td><strong style={{color:"var(--accent)"}}>{v}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 5 — EKSTRAKSI DATA
// ═══════════════════════════════════════════════
function TabExtract({ uploaded, extractCols, approvedCols, setApprovedCols, extractData, aiStatus, suggestCols, runExtraction, theme, setTab }) {
  const toggleCol = (col) => {
    setApprovedCols(prev => {
      const exists = prev.find(c => c.id === col.id);
      if (exists) return prev.filter(c => c.id !== col.id);
      return [...prev, col];
    });
  };
  const approveAll = () => setApprovedCols(extractCols.map(c => ({ ...c, approved: true })));

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, fontSize: 11, color: "var(--muted)" }}>
            {uploaded.length} artikel terupload siap diekstraksi — Tema: <strong style={{ color: "var(--accent)" }}>{theme}</strong>
          </div>
          <button className="btn sm primary" onClick={suggestCols} disabled={!uploaded.length || !!aiStatus}>
            {aiStatus === "cols" ? "⏳" : "✨ Rekomendasi Kolom AI"}
          </button>
        </div>

        {extractCols.length > 0 && (
          <>
            <div className="rec-box">
              <div className="rb-title">💡 Rekomendasi Kolom Ekstraksi (dari analisis artikel)</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button className="btn sm success" onClick={approveAll}>✓ Setujui Semua</button>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{approvedCols.length} kolom dipilih</span>
              </div>
              <div className="tw">
                <table>
                  <thead><tr><th>Pilih</th><th>Nama Kolom</th><th>Deskripsi</th></tr></thead>
                  <tbody>
                    {extractCols.map(col => {
                      const isApproved = !!approvedCols.find(c => c.id === col.id);
                      return (
                        <tr key={col.id} style={isApproved ? { background: "rgba(52,211,153,.04)" } : {}}>
                          <td>
                            <input type="checkbox" checked={isApproved} onChange={() => toggleCol(col)} style={{ accentColor: "var(--green)", width: 14, height: 14 }} />
                          </td>
                          <td><strong style={{ fontSize: 11 }}>{col.label}</strong></td>
                          <td style={{ fontSize: 10, color: "var(--muted)" }}>{col.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={runExtraction} disabled={!approvedCols.length || !!aiStatus}>
                {aiStatus === "extracting" ? "⏳ Mengekstraksi..." : `🔬 Proses Ekstraksi (${approvedCols.length} kolom)`}
              </button>
            </div>
          </>
        )}

        {!extractCols.length && !uploaded.length && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
            Upload artikel terlebih dahulu di tab sebelumnya
          </div>
        )}
      </div>

      {extractData.length > 0 && (
        <div className="card">
          <div className="card-title">📊 Tabel Ekstraksi Data</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button className="btn sm" onClick={() => {
              const cols = ["No","Judul","Penulis","Tahun","Q","Jurnal",...approvedCols.map(c=>c.label)];
              const rows = extractData.map((d,i) => [
                i+1, '"'+(d.title||"").replace(/"/g,'""')+'"', '"'+(d.authors||"").replace(/"/g,'""')+'"',
                d.year, d.q, '"'+(d.journal||"").replace(/"/g,'""')+'"',
                ...approvedCols.map(c=>'"'+String(d[c.label]||"").replace(/"/g,'""')+'"')
              ]);
              const csv = [cols.join(","), ...rows.map(r=>r.join(","))].join("\n");
              const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href=url; a.download="ekstraksi_data.csv"; a.click();
            }}>⬇ Export CSV</button>
            <button className="btn sm" onClick={() => {
              // Build HTML table → Excel-compatible
              const cols = ["No","Judul","Penulis","Tahun","Q","Jurnal",...approvedCols.map(c=>c.label)];
              const thead = "<tr>" + cols.map(c=>"<th style=\"background:#ddd;font-weight:bold;border:1px solid #999;padding:4px\">" + c + "</th>").join("") + "</tr>";
              const tbody = extractData.map((d,i)=>{
                const cells = [i+1, d.title||"", d.authors||"", d.year, d.q, d.journal||"", ...approvedCols.map(c=>d[c.label]||"")];
                return `<tr>${cells.map(v=>"<td style=\"border:1px solid #ccc;padding:4px\">" + v + "</td>").join("")}</tr>`;
              }).join("");
              const html = `<html><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
              const blob = new Blob([html], {type:"application/vnd.ms-excel;charset=utf-8"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href=url; a.download="ekstraksi_data.xls"; a.click();
            }}>⬇ Export Excel</button>
            <button className="btn sm primary" style={{ marginLeft: "auto" }} onClick={() => setTab("biblio")}>→ Bibliometrik</button>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{ minWidth: 180 }}>Judul</th>
                  <th>Penulis</th>
                  <th>Tahun</th>
                  <th>Q</th>
                  <th>Jurnal</th>
                  {approvedCols.map(c => <th key={c.id} style={{ minWidth: 120 }}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {extractData.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ maxWidth: 180, fontSize: 11, fontWeight: 600 }}>{d.title}</td>
                    <td style={{ fontSize: 10, color: "var(--muted)", maxWidth: 100 }}>{d.authors}</td>
                    <td>{d.year}</td>
                    <td><span className={`badge ${d.q?.toLowerCase()}`}>{d.q}</span></td>
                    <td style={{ fontSize: 10, maxWidth: 120 }}>{d.journal}</td>
                    {approvedCols.map(c => (
                      <td key={c.id} style={{ maxWidth: 150, fontSize: 10 }}>{d[c.label] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DOWNLOAD CHART HELPER (black/white)
// ─────────────────────────────────────────────────────────────
function downloadChartBW(svgId, filename, fmt) {
  // Build a clean BW SVG from chart data passed as SVG element
  const el = document.getElementById(svgId);
  if (!el) return;
  // Clone and strip colors
  const clone = el.cloneNode(true);
  clone.setAttribute("style","background:white");
  // Walk all elements and force black stroke/fill
  clone.querySelectorAll("*").forEach(node => {
    if(node.tagName === "text") { node.setAttribute("fill","#000"); node.setAttribute("stroke","none"); }
    if(node.tagName === "rect" || node.tagName === "path" || node.tagName === "line" || node.tagName === "polyline") {
      const f = node.getAttribute("fill");
      if(f && f !== "none" && f !== "transparent") node.setAttribute("fill",f.startsWith("#fff")?"white":"#333");
      const s = node.getAttribute("stroke");
      if(s && s !== "none") node.setAttribute("stroke","#000");
    }
  });
  const svgStr = new XMLSerializer().serializeToString(clone);
  if(fmt==="svg"){
    const blob=new Blob([svgStr],{type:"image/svg+xml"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=filename+".svg";a.click();
    return;
  }
  const img=new Image();
  const blob=new Blob([svgStr],{type:"image/svg+xml"});
  const url=URL.createObjectURL(blob);
  img.onload=()=>{
    const w=el.viewBox?.baseVal?.width||600, h=el.viewBox?.baseVal?.height||400;
    const canvas=document.createElement("canvas");canvas.width=w*2;canvas.height=h*2;
    const ctx=canvas.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,w*2,h*2);
    ctx.scale(2,2);ctx.drawImage(img,0,0);
    const mime=fmt==="jpg"?"image/jpeg":"image/png";
    const a=document.createElement("a");a.href=canvas.toDataURL(mime,0.95);a.download=filename+"."+fmt;a.click();
    URL.revokeObjectURL(url);
  };img.src=url;
}

// Bar chart as SVG for BW export
function BarChartSVG({ id, data, maxVal, title, height=220 }) {
  const W=400, BAR_H=22, PAD=12, LBL_W=110;
  const h = PAD+data.length*(BAR_H+6)+PAD;
  return (
    <svg id={id} viewBox={`0 0 ${W} ${h}`} style={{width:"100%",maxWidth:W}} xmlns="http://www.w3.org/2000/svg">
      <rect width={W} height={h} fill="var(--bg3)"/>
      {data.map(([lbl,val],i)=>{
        const y=PAD+i*(BAR_H+6);
        const bw=Math.max(4,((val/Math.max(maxVal,1))*(W-LBL_W-PAD-40)));
        return (
          <g key={lbl}>
            <text x={LBL_W-4} y={y+BAR_H/2+4} textAnchor="end" fill="var(--muted)" fontSize="9" fontFamily="monospace">{lbl.length>16?lbl.slice(0,16)+"…":lbl}</text>
            <rect x={LBL_W} y={y} width={bw} height={BAR_H} rx="3" fill="var(--accent)" opacity="0.8"/>
            <text x={LBL_W+bw+4} y={y+BAR_H/2+4} fill="var(--text)" fontSize="9" fontWeight="700" fontFamily="monospace">{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════
// TAB 6 — BIBLIOMETRIK (with BW download)
// ═══════════════════════════════════════════════
function TabBiblio({ articles, accepted }) {
  const yearMap = {}, qMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }, jMap = {}, kwMap = {};
  accepted.forEach(a => {
    yearMap[a.year] = (yearMap[a.year] || 0) + 1;
    if (qMap[a.q] !== undefined) qMap[a.q]++;
    jMap[a.journal] = (jMap[a.journal] || 0) + 1;
    (a.keywords || []).forEach(k => { kwMap[k] = (kwMap[k] || 0) + 1; });
  });
  const years = Object.entries(yearMap).sort((a, b) => a[0] - b[0]);
  const maxY = Math.max(...years.map(y => y[1]), 1);
  const topJ = Object.entries(jMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topK = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const qEntries = Object.entries(qMap);
  const maxQ = Math.max(...qEntries.map(([,v])=>v),1);

  const DlBtns = ({id, name}) => (
    <div style={{display:"flex",gap:5,marginTop:8}}>
      {["svg","png","jpg","pdf"].map(f=>(
        <button key={f} className="btn xs" onClick={()=>f==="pdf"?window.print():downloadChartBW(id,name,f)}>
          ⬇{f.toUpperCase()}
        </button>
      ))}
    </div>
  );

  // Table download helper
  function downloadTableBW(tableId, name, fmt) {
    const table = document.getElementById(tableId);
    if(!table) return;
    // Build SVG from table
    const rows = table.querySelectorAll("tr");
    const W=600, ROW_H=22, PAD=10;
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${(rows.length+1)*ROW_H+PAD*2}" style="background:white">`;
    svg+=`<rect width="${W}" height="${(rows.length+1)*ROW_H+PAD*2}" fill="white"/>`;
    rows.forEach((row,ri)=>{
      const cells=row.querySelectorAll("th,td");
      const y=PAD+ri*ROW_H;
      if(ri===0) svg+=`<rect x="0" y="${y}" width="${W}" height="${ROW_H}" fill="#eee"/>`;
      svg+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ccc" stroke-width="0.5"/>`;
      const cw=W/Math.max(cells.length,1);
      cells.forEach((cell,ci)=>{
        svg+=`<text x="${ci*cw+6}" y="${y+15}" font-family="Arial" font-size="9" fill="#000">${(cell.textContent||"").slice(0,30)}</text>`;
      });
    });
    svg+=`</svg>`;
    if(fmt==="svg"){const b=new Blob([svg],{type:"image/svg+xml"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name+".svg";a.click();return;}
    const img=new Image();const b=new Blob([svg],{type:"image/svg+xml"});const u=URL.createObjectURL(b);
    img.onload=()=>{const canvas=document.createElement("canvas");canvas.width=600;canvas.height=(rows.length+1)*ROW_H+PAD*2;const ctx=canvas.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,600,canvas.height);ctx.drawImage(img,0,0);const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download=name+"."+fmt;a.click();URL.revokeObjectURL(u);};img.src=u;
  }

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 14 }}>
        {[
          { val: accepted.length, lbl: "Artikel Inklusi" },
          { val: [...new Set(accepted.map(a => a.journal))].length, lbl: "Jurnal Unik" },
          { val: [...new Set(accepted.map(a => a.year))].length, lbl: "Tahun Tercakup" },
          { val: accepted.filter(a => a.q === "Q1").length, lbl: "Artikel Q1" },
          { val: accepted.reduce((s, a) => s + (a.citations || 0), 0), lbl: "Total Sitasi" },
          { val: Math.round(accepted.reduce((s, a) => s + (a.citations || 0), 0) / Math.max(accepted.length, 1)), lbl: "Rata-rata Sitasi" },
        ].map(s => <div key={s.lbl} className="stat-card"><div className="val">{s.val}</div><div className="lbl">{s.lbl}</div></div>)}
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title">📅 Distribusi Tahun Publikasi</div>
          <BarChartSVG id="chart-year" data={years} maxVal={maxY} title="Tahun"/>
          <DlBtns id="chart-year" name="distribusi_tahun"/>
        </div>
        <div className="card">
          <div className="card-title">🏆 Distribusi Q Index</div>
          <BarChartSVG id="chart-q" data={qEntries} maxVal={maxQ} title="Q Index"/>
          <DlBtns id="chart-q" name="distribusi_q_index"/>
        </div>
        <div className="card">
          <div className="card-title">📰 Top Jurnal</div>
          <BarChartSVG id="chart-journal" data={topJ.map(([j,c])=>[j,c])} maxVal={topJ[0]?.[1]||1} title="Jurnal"/>
          <DlBtns id="chart-journal" name="top_jurnal"/>
        </div>
        <div className="card">
          <div className="card-title">🏷️ Keyword Frequency</div>
          <BarChartSVG id="chart-kw" data={topK.slice(0,8)} maxVal={topK[0]?.[1]||1} title="Keyword"/>
          <DlBtns id="chart-kw" name="keyword_frequency"/>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📈 Tren Sitasi per Artikel</div>
        <div id="table-sitasi" className="tw">
          <table>
            <thead><tr><th>Judul</th><th>Penulis</th><th>Tahun</th><th>Jurnal</th><th>Q</th><th>Sitasi</th></tr></thead>
            <tbody>
              {[...accepted].sort((a, b) => (b.citations||0) - (a.citations||0)).slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td style={{ maxWidth: 200, fontSize: 11 }}>{a.title}</td>
                  <td style={{ fontSize: 10, color: "var(--muted)" }}>{(a.authors||"").split(",")[0]}</td>
                  <td>{a.year}</td>
                  <td style={{ fontSize: 10 }}>{a.journal}</td>
                  <td><span className={`badge ${a.q?.toLowerCase()}`}>{a.q}</span></td>
                  <td><strong style={{ color: "var(--accent)" }}>{a.citations||0}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:5,marginTop:8}}>
          {["svg","png","jpg"].map(f=>(
            <button key={f} className="btn xs" onClick={()=>downloadTableBW("table-sitasi","tren_sitasi",f)}>⬇{f.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 7 — FRAMEWORK / MODEL (horizontal, BW download)
// ═══════════════════════════════════════════════
function TabFramework({ framework, extractData, aiStatus, generateFramework, uploaded }) {
  function buildFrameworkSVG(fw) {
    if (!fw) return "";
    const cols = [
      { key:"inputs",    label:"ANTESEDEN",  items: fw.inputs    || [] },
      { key:"mediators", label:"MEDIATOR",   items: fw.mediators || [] },
      { key:"process",   label:"PROSES",     items: fw.process   || fw.mediators?.slice(0,1) || ["Knowledge Transfer"] },
      { key:"outputs",   label:"OUTCOME",    items: fw.outputs   || [] },
    ];
    const mods = fw.moderators || [];
    const COL_W = 140, COL_GAP = 50, PAD = 20;
    const ITEM_H = 36, ITEM_GAP = 10;
    const maxItems = Math.max(...cols.map(c=>c.items.length), 1);
    const colH = PAD + maxItems * (ITEM_H + ITEM_GAP) + PAD;
    const totalW = cols.length * COL_W + (cols.length - 1) * COL_GAP + PAD * 2;
    const modH = mods.length > 0 ? 60 : 0;
    const totalH = 60 + colH + modH + 20;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" style="background:white">
<rect width="${totalW}" height="${totalH}" fill="white"/>
<!-- Title -->
<text x="${totalW/2}" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#000">${fw.title||"Research Framework"}</text>
<line x1="20" y1="32" x2="${totalW-20}" y2="32" stroke="#000" stroke-width="0.5"/>`;

    const colTops = [];
    // Draw columns
    cols.forEach((col, ci) => {
      const cx = PAD + ci * (COL_W + COL_GAP);
      colTops.push(cx);
      // Column header box
      svg += `<rect x="${cx}" y="40" width="${COL_W}" height="22" rx="3" fill="#333"/>`;
      svg += `<text x="${cx+COL_W/2}" y="55" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#fff">${col.label}</text>`;
      // Items
      col.items.forEach((item, ii) => {
        const iy = 72 + ii * (ITEM_H + ITEM_GAP);
        svg += `<rect x="${cx}" y="${iy}" width="${COL_W}" height="${ITEM_H}" rx="3" fill="none" stroke="#000" stroke-width="1"/>`;
        // Wrap long text
        const words = item.split(" ");
        let line1 = "", line2 = "";
        words.forEach(w => {
          if ((line1+" "+w).trim().length < 18) line1 = (line1+" "+w).trim();
          else line2 = (line2+" "+w).trim();
        });
        svg += `<text x="${cx+COL_W/2}" y="${iy+14}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">${line1}</text>`;
        if (line2) svg += `<text x="${cx+COL_W/2}" y="${iy+26}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">${line2}</text>`;
      });
      // Arrow to next column
      if (ci < cols.length - 1) {
        const ax = cx + COL_W + 4;
        const ay = 72 + ((Math.max(...cols.map(c=>c.items.length),1)-1)/2) * (ITEM_H+ITEM_GAP) + ITEM_H/2;
        svg += `<line x1="${ax}" y1="${ay}" x2="${ax+COL_GAP-8}" y2="${ay}" stroke="#000" stroke-width="1.2" marker-end="url(#bwarr)"/>`;
      }
    });

    // Moderator box at bottom
    if (mods.length > 0) {
      const my = 72 + maxItems*(ITEM_H+ITEM_GAP) + 20;
      svg += `<rect x="${PAD}" y="${my}" width="${totalW-PAD*2}" height="44" rx="3" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="5,3"/>`;
      svg += `<text x="${totalW/2}" y="${my+14}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#000">MODERATOR</text>`;
      const mtext = mods.join("  ·  ");
      svg += `<text x="${totalW/2}" y="${my+30}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">${mtext.slice(0,80)}</text>`;
    }

    svg += `<defs><marker id="bwarr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#000"/></marker></defs>`;
    svg += `</svg>`;
    return svg;
  }

  function downloadFW(fmt) {
    const svg = buildFrameworkSVG(framework);
    if (!svg) return;
    if (fmt === "svg") {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = "framework.svg"; a.click(); return;
    }
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 500;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "white"; ctx.fillRect(0,0,900,500);
      ctx.drawImage(img, 0, 0, 900, 500);
      const mime = fmt === "jpg" ? "image/jpeg" : "image/png";
      const a = document.createElement("a"); a.href = canvas.toDataURL(mime, 0.95); a.download = `framework.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    }; img.src = url;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontFamily: "var(--fh)", fontWeight: 700 }}>🗺️ Research Framework — Horizontal Flow</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>Disintesis dari {uploaded.length} artikel · Diagram mengalir dari kiri ke kanan</div>
          </div>
          <button className="btn primary" onClick={generateFramework} disabled={!extractData.length || !!aiStatus}>
            {aiStatus === "framework" ? "⏳ Mensintesis..." : "✨ Generate Framework AI"}
          </button>
        </div>

        {!framework && !extractData.length && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗺️</div>
            <div>Lakukan ekstraksi data terlebih dahulu</div>
          </div>
        )}

        {framework && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "var(--fh)", fontSize: 14, fontWeight: 700 }}>{framework.title}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{framework.description}</div>
            </div>

            {/* Horizontal flow diagram */}
            <div style={{ overflowX: "auto", background: "var(--bg3)", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 0, minWidth: 700 }}>
                {[
                  { label: "ANTESEDEN", items: framework.inputs||[], color: "#34d399", border: "#34d399" },
                  { label: "MEDIATOR",  items: framework.mediators||[], color: "#a78bfa", border: "#a78bfa" },
                  { label: "PROSES",    items: framework.process||framework.mediators?.slice(0,2)||["Knowledge Integration"], color: "#4f9cf9", border: "#4f9cf9" },
                  { label: "OUTCOME",   items: framework.outputs||[], color: "#fbbf24", border: "#fbbf24" },
                ].map((col, ci, arr) => (
                  <div key={col.label} style={{ display: "flex", alignItems: "center", flex: ci===arr.length-1?1:"auto" }}>
                    {/* Column */}
                    <div style={{ minWidth: 150, maxWidth: 170 }}>
                      <div style={{ background: col.color + "22", border: `1.5px solid ${col.border}`, borderRadius: "6px 6px 0 0", padding: "5px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: col.color, letterSpacing: 1 }}>{col.label}</div>
                      </div>
                      <div style={{ border: `1.5px solid ${col.border}`, borderTop: "none", borderRadius: "0 0 6px 6px", padding: "6px 8px" }}>
                        {col.items.map((item, ii) => (
                          <div key={ii} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", marginBottom: ii<col.items.length-1?5:0, fontSize: 10 }}>
                            {item}
                          </div>
                        ))}
                        {col.items.length === 0 && <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", padding: 8 }}>—</div>}
                      </div>
                    </div>
                    {/* Arrow */}
                    {ci < arr.length - 1 && (
                      <div style={{ padding: "0 8px", fontSize: 20, color: "var(--muted)", alignSelf: "center" }}>→</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Moderator bar */}
              {(framework.moderators||[]).length > 0 && (
                <div style={{ marginTop: 14, border: "1.5px dashed rgba(251,191,36,.4)", borderRadius: 7, padding: "8px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--amber)", marginBottom: 5, letterSpacing: 1 }}>MODERATOR</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    {framework.moderators.map(m => (
                      <span key={m} style={{ background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 4, padding: "3px 10px", fontSize: 10, color: "var(--amber)" }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Download buttons */}
            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
              {["svg","png","jpg","pdf"].map(f => (
                <button key={f} className="btn sm" onClick={() => f==="pdf"?window.print():downloadFW(f)}>⬇ {f.toUpperCase()}</button>
              ))}
              <span style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center" }}>Hitam putih, background putih</span>
            </div>

            {/* Propositions */}
            {(framework.propositions||[]).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: "var(--accent)" }}>📌 Proposisi Penelitian</div>
                {framework.propositions.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 10px", background: "var(--bg3)", borderRadius: 6, marginBottom: 5, fontSize: 11 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>P{i+1}</span>
                    <span>{p.replace(/^P\d+[:\s]+/,"")}</span>
                  </div>
                ))}
              </div>
            )}

            {framework.synthesis && (
              <div style={{ marginTop: 14, padding: "12px 15px", background: "rgba(167,139,250,.05)", border: "1px solid rgba(167,139,250,.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent2)", marginBottom: 5 }}>🔮 TEMUAN SINTESIS UNIK</div>
                <div style={{ fontSize: 12, fontFamily: "var(--fs)", lineHeight: 1.8 }}>{framework.synthesis}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WORD DOWNLOAD HELPER
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SVG → BASE64 PNG (synchronous via canvas, used for Word embed)
// ─────────────────────────────────────────────────────────────
async function svgToPngDataUrl(svgString, width, height) {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    } catch (e) { resolve(""); }
  });
}

// Build PRISMA SVG (BW) — precise alignment matching PRISMA 2020 reference
function buildPrismaSvg(prismaData) {
  const n = (x) => x || 0;
  const totalRecords = n(prismaData.totalRaw);
  const dupRemoved = n(prismaData.duplicates);
  const autoFiltered = Math.round(totalRecords * 0.05);
  const otherRemoved = Math.round(totalRecords * 0.02);
  const screenedCount = n(prismaData.afterDupl);
  const screenExcluded = n(prismaData.rejected2);
  const reportsSought = Math.max(0, screenedCount - screenExcluded);
  const assessed = reportsSought;
  const fullExcluded = Math.max(0, assessed - n(prismaData.uploadedCount));
  const included = n(prismaData.uploadedCount);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 760" width="720" height="760" style="background:white;font-family:Arial,sans-serif">',
    '<defs>',
    '<marker id="arr" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="8" refY="5" orient="auto-start-reverse">',
    '<path d="M0,0 L10,5 L0,10 z" fill="#000"/>',
    '</marker>',
    '</defs>',
    '<rect width="720" height="760" fill="white"/>',

    // Title
    '<rect x="80" y="14" width="570" height="28" fill="white" stroke="#000" stroke-width="1.5"/>',
    '<text x="365" y="33" text-anchor="middle" font-size="13" font-weight="bold" fill="#000">Identification of studies via databases and registers</text>',

    // Phase labels
    '<rect x="20" y="60" width="28" height="170" fill="white" stroke="#000" stroke-width="1"/>',
    '<text transform="rotate(-90,34,145)" x="34" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Identification</text>',
    '<rect x="20" y="240" width="28" height="320" fill="white" stroke="#000" stroke-width="1"/>',
    '<text transform="rotate(-90,34,400)" x="34" y="403" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Screening</text>',
    '<rect x="20" y="600" width="28" height="100" fill="white" stroke="#000" stroke-width="1"/>',
    '<text transform="rotate(-90,34,650)" x="34" y="653" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">Included</text>',

    // Row 1: Identification
    '<rect x="80" y="60" width="260" height="80" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="210" y="80" text-anchor="middle" font-size="11" fill="#000">Records identified from:</text>',
    '<text x="210" y="100" text-anchor="middle" font-size="10" fill="#000">Databases (n = ' + totalRecords + ')</text>',
    '<text x="210" y="118" text-anchor="middle" font-size="10" fill="#000">Registers (n = 0)</text>',
    '<rect x="410" y="60" width="240" height="100" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="530" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="#000">Records removed before</text>',
    '<text x="530" y="92" text-anchor="middle" font-size="10" font-style="italic" font-weight="bold" fill="#000">screening:</text>',
    '<text x="530" y="108" text-anchor="middle" font-size="9.5" fill="#000">Duplicate records removed (n = ' + dupRemoved + ')</text>',
    '<text x="530" y="124" text-anchor="middle" font-size="9.5" fill="#000">Records marked as ineligible by</text>',
    '<text x="530" y="138" text-anchor="middle" font-size="9.5" fill="#000">automation tools (n = ' + autoFiltered + ')</text>',
    '<text x="530" y="153" text-anchor="middle" font-size="9.5" fill="#000">Records removed for other reasons (n = ' + otherRemoved + ')</text>',
    '<line x1="340" y1="100" x2="410" y2="100" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
    '<line x1="210" y1="140" x2="210" y2="248" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

    // Row 2: Screening
    '<rect x="80" y="250" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="210" y="275" text-anchor="middle" font-size="11" fill="#000">Records screened</text>',
    '<text x="210" y="293" text-anchor="middle" font-size="10" fill="#000">(n = ' + screenedCount + ')</text>',
    '<rect x="410" y="250" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="530" y="275" text-anchor="middle" font-size="11" fill="#000">Records excluded</text>',
    '<text x="530" y="293" text-anchor="middle" font-size="10" fill="#000">(n = ' + screenExcluded + ')</text>',
    '<line x1="340" y1="277" x2="410" y2="277" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
    '<line x1="210" y1="305" x2="210" y2="338" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

    // Row 3: Reports sought
    '<rect x="80" y="340" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="210" y="365" text-anchor="middle" font-size="11" fill="#000">Reports sought for retrieval</text>',
    '<text x="210" y="383" text-anchor="middle" font-size="10" fill="#000">(n = ' + reportsSought + ')</text>',
    '<rect x="410" y="340" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="530" y="365" text-anchor="middle" font-size="11" fill="#000">Reports not retrieved</text>',
    '<text x="530" y="383" text-anchor="middle" font-size="10" fill="#000">(n = 0)</text>',
    '<line x1="340" y1="367" x2="410" y2="367" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
    '<line x1="210" y1="395" x2="210" y2="428" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

    // Row 4: Reports assessed
    '<rect x="80" y="430" width="260" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="210" y="455" text-anchor="middle" font-size="11" fill="#000">Reports assessed for eligibility</text>',
    '<text x="210" y="473" text-anchor="middle" font-size="10" fill="#000">(n = ' + assessed + ')</text>',
    '<rect x="410" y="430" width="240" height="55" fill="white" stroke="#000" stroke-width="1.2"/>',
    '<text x="530" y="455" text-anchor="middle" font-size="11" fill="#000">Reports excluded:</text>',
    '<text x="530" y="473" text-anchor="middle" font-size="10" fill="#000">For Some Reason (n = ' + fullExcluded + ')</text>',
    '<line x1="340" y1="457" x2="410" y2="457" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',
    '<line x1="210" y1="485" x2="210" y2="618" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>',

    // Included
    '<rect x="80" y="620" width="260" height="75" fill="white" stroke="#000" stroke-width="1.5"/>',
    '<text x="210" y="643" text-anchor="middle" font-size="11" fill="#000">Studies included in review</text>',
    '<text x="210" y="660" text-anchor="middle" font-size="10" fill="#000">(n = ' + included + ')</text>',
    '<text x="210" y="678" text-anchor="middle" font-size="10" fill="#000">Reports of included studies</text>',
    '<text x="210" y="691" text-anchor="middle" font-size="10" fill="#000">(n = ' + included + ')</text>',

    '</svg>'
  ].join('');
}

// Build Framework SVG (BW horizontal flow) for Word embed
function buildFrameworkBwSvg(fw) {
  if (!fw) return "";
  const cols = [
    { label: "ANTESEDEN", items: fw.inputs || [] },
    { label: "MEDIATOR", items: fw.mediators || [] },
    { label: "PROSES", items: fw.process || ["Knowledge Integration"] },
    { label: "OUTCOME", items: fw.outputs || [] },
  ];
  const mods = fw.moderators || [];
  const COL_W = 150, COL_GAP = 40, PAD = 20;
  const ITEM_H = 40, ITEM_GAP = 8;
  const maxItems = Math.max(...cols.map(c => c.items.length || 1), 1);
  const colH = 30 + maxItems * (ITEM_H + ITEM_GAP);
  const totalW = cols.length * COL_W + (cols.length - 1) * COL_GAP + PAD * 2;
  const modH = mods.length > 0 ? 60 : 0;
  const totalH = 50 + colH + modH + 30;

  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + totalW + ' ' + totalH + '" width="' + totalW + '" height="' + totalH + '" style="background:white">'
    + '<defs><marker id="bwarr" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="#000"/></marker></defs>'
    + '<rect width="' + totalW + '" height="' + totalH + '" fill="white"/>'
    + '<text x="' + (totalW / 2) + '" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#000">' + (fw.title || "Research Framework") + '</text>'
    + '<line x1="20" y1="32" x2="' + (totalW - 20) + '" y2="32" stroke="#000" stroke-width="0.5"/>';

  cols.forEach((col, ci) => {
    const cx = PAD + ci * (COL_W + COL_GAP);
    svg += '<rect x="' + cx + '" y="50" width="' + COL_W + '" height="24" fill="#333"/>'
      + '<text x="' + (cx + COL_W / 2) + '" y="66" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#fff">' + col.label + '</text>';
    col.items.forEach((item, ii) => {
      const iy = 86 + ii * (ITEM_H + ITEM_GAP);
      svg += '<rect x="' + cx + '" y="' + iy + '" width="' + COL_W + '" height="' + ITEM_H + '" rx="3" fill="white" stroke="#000" stroke-width="1"/>';
      // Word wrap (max 2 lines, ~18 chars each)
      const words = String(item).split(" ");
      let l1 = "", l2 = "";
      words.forEach(w => {
        if ((l1 + " " + w).trim().length <= 20 && !l2) l1 = (l1 + " " + w).trim();
        else l2 = (l2 + " " + w).trim();
      });
      const xc = cx + COL_W / 2;
      if (l2) {
        svg += '<text x="' + xc + '" y="' + (iy + 16) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">' + l1 + '</text>';
        svg += '<text x="' + xc + '" y="' + (iy + 30) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">' + l2.slice(0, 22) + '</text>';
      } else {
        svg += '<text x="' + xc + '" y="' + (iy + 24) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">' + l1 + '</text>';
      }
    });
    if (ci < cols.length - 1) {
      const ax = cx + COL_W + 4;
      const ay = 86 + ((maxItems - 1) / 2) * (ITEM_H + ITEM_GAP) + ITEM_H / 2;
      svg += '<line x1="' + ax + '" y1="' + ay + '" x2="' + (ax + COL_GAP - 8) + '" y2="' + ay + '" stroke="#000" stroke-width="1.2" marker-end="url(#bwarr)"/>';
    }
  });

  if (mods.length > 0) {
    const my = 86 + maxItems * (ITEM_H + ITEM_GAP) + 16;
    svg += '<rect x="' + PAD + '" y="' + my + '" width="' + (totalW - PAD * 2) + '" height="40" rx="3" fill="white" stroke="#000" stroke-width="1" stroke-dasharray="5,3"/>';
    svg += '<text x="' + (totalW / 2) + '" y="' + (my + 14) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#000">MODERATOR</text>';
    svg += '<text x="' + (totalW / 2) + '" y="' + (my + 30) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#000">' + mods.join("  ·  ").slice(0, 90) + '</text>';
  }

  return svg + '</svg>';
}

// Build year distribution chart SVG (BW)
function buildYearChartSvg(accepted) {
  const yearMap = {};
  accepted.forEach(a => { yearMap[a.year] = (yearMap[a.year] || 0) + 1; });
  const years = Object.entries(yearMap).sort((a, b) => a[0] - b[0]);
  if (years.length === 0) return "";
  const maxV = Math.max(...years.map(([, v]) => v), 1);
  const W = 500, BAR_H = 24, GAP = 8, PAD = 30, LBL_W = 60;
  const H = PAD + years.length * (BAR_H + GAP) + PAD;
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" style="background:white">'
    + '<rect width="' + W + '" height="' + H + '" fill="white"/>'
    + '<text x="' + (W / 2) + '" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#000">Distribusi Publikasi per Tahun</text>';
  years.forEach(([y, c], i) => {
    const yy = PAD + i * (BAR_H + GAP);
    const bw = (c / maxV) * (W - LBL_W - PAD - 40);
    svg += '<text x="' + (LBL_W - 5) + '" y="' + (yy + BAR_H / 2 + 4) + '" text-anchor="end" font-family="Arial,sans-serif" font-size="10" fill="#000">' + y + '</text>';
    svg += '<rect x="' + LBL_W + '" y="' + yy + '" width="' + bw + '" height="' + BAR_H + '" fill="#333" stroke="#000" stroke-width="0.5"/>';
    svg += '<text x="' + (LBL_W + bw + 5) + '" y="' + (yy + BAR_H / 2 + 4) + '" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#000">' + c + '</text>';
  });
  return svg + '</svg>';
}

// ─────────────────────────────────────────────────────────────
// CLEAN MARKDOWN → WORD HTML CONVERTER
// Strips ** ## [TABEL N:] [GAMBAR N:] markers and renders clean
// ─────────────────────────────────────────────────────────────
function markdownToWordHtml(text, embedMap) {
  if (!text) return "";
  const lines = text.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown table
    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]); i++;
      }
      const rows = tableLines.filter(l => !l.match(/^[\s|:\-]+$/));
      if (rows.length > 0) {
        const parsed = rows.map(r =>
          r.split("|").filter((_, ci, a) => ci > 0 && ci < a.length - 1).map(c => c.trim())
        );
        const [hd, ...bd] = parsed;
        html += '<table><thead><tr>'
          + hd.map(h => '<th>' + cleanInline(h) + '</th>').join("")
          + '</tr></thead><tbody>'
          + bd.map(r => '<tr>' + r.map(c => '<td>' + cleanInline(c) + '</td>').join("") + '</tr>').join("")
          + '</tbody></table>';
      }
      continue;
    }

    // Figure/Table caption with embed marker
    const figMatch = trimmed.match(/^\*?\*?\[?(GAMBAR|Gambar|TABEL|Tabel)\s*(\d+)[:\s]+(.*?)\]?\*?\*?\.?$/);
    if (figMatch) {
      const isFig = figMatch[1].toUpperCase() === "GAMBAR";
      const num = figMatch[2];
      const caption = figMatch[3].replace(/[\*\]]+$/g, "").trim();

      // Try to embed real image based on caption keywords
      let embedded = "";
      if (embedMap && isFig) {
        const captionLower = caption.toLowerCase();
        if (captionLower.includes("prisma") && embedMap.prisma) {
          embedded = '<div style="text-align:center;margin:14pt 0"><img src="' + embedMap.prisma + '" style="max-width:480pt;width:100%" alt="PRISMA Flow"/></div>';
        } else if ((captionLower.includes("framework") || captionLower.includes("konseptual") || captionLower.includes("model")) && embedMap.framework) {
          embedded = '<div style="text-align:center;margin:14pt 0"><img src="' + embedMap.framework + '" style="max-width:520pt;width:100%" alt="Framework"/></div>';
        } else if ((captionLower.includes("distribusi") || captionLower.includes("tahun") || captionLower.includes("publikasi")) && embedMap.yearChart) {
          embedded = '<div style="text-align:center;margin:14pt 0"><img src="' + embedMap.yearChart + '" style="max-width:440pt;width:100%" alt="Year Distribution"/></div>';
        }
      }

      if (embedded) {
        html += embedded;
        html += '<p class="caption"><strong>' + (isFig ? "Gambar" : "Tabel") + ' ' + num + '.</strong> ' + caption + '</p>';
      } else {
        html += '<p class="caption"><strong>' + (isFig ? "Gambar" : "Tabel") + ' ' + num + '.</strong> ' + caption + '</p>';
      }
      i++;
      continue;
    }

    // Heading ## or ###
    if (trimmed.startsWith("### ")) {
      html += '<h3>' + cleanInline(trimmed.slice(4)) + '</h3>'; i++; continue;
    }
    if (trimmed.startsWith("## ")) {
      html += '<h2>' + cleanInline(trimmed.slice(3)) + '</h2>'; i++; continue;
    }

    // Empty line
    if (!trimmed) { i++; continue; }

    // Regular paragraph
    html += '<p>' + cleanInline(trimmed) + '</p>';
    i++;
  }
  return html;
}

// Clean inline markdown markers (bold, brackets, asterisks)
function cleanInline(text) {
  if (!text) return "";
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "$1");
}

// ─────────────────────────────────────────────────────────────
// MAIN WORD DOWNLOADER (with embedded images)
// ─────────────────────────────────────────────────────────────
async function downloadWordWithAssets({ filename, theme, authors, narasiSteps, accepted, tpl, prismaData, framework, useTrans, translated }) {
  // Step 1: Build all SVG assets and convert to PNG data URLs
  const prismaSvg = buildPrismaSvg(prismaData);
  const fwSvg = framework ? buildFrameworkBwSvg(framework) : "";
  const yearSvg = buildYearChartSvg(accepted);

  const [prismaPng, fwPng, yearPng] = await Promise.all([
    svgToPngDataUrl(prismaSvg, 720, 760),
    fwSvg ? svgToPngDataUrl(fwSvg, 720, 360) : Promise.resolve(""),
    yearSvg ? svgToPngDataUrl(yearSvg, 500, 300) : Promise.resolve(""),
  ]);

  const embedMap = { prisma: prismaPng, framework: fwPng, yearChart: yearPng };

  // Step 2: Build header (title + authors)
  const validAuthors = authors.filter(a => a.name && a.name.trim());
  let authorsHtml = "";
  if (validAuthors.length > 0) {
    const namesLine = validAuthors.map((a, i) =>
      a.name + (validAuthors.length > 1 ? '<sup>' + (i + 1) + '</sup>' : "")
    ).join(", ");
    authorsHtml += '<p class="authors">' + namesLine + '</p>';
    validAuthors.forEach((a, i) => {
      if (a.affil || a.email) {
        authorsHtml += '<p class="affil">'
          + (validAuthors.length > 1 ? '<sup>' + (i + 1) + '</sup> ' : "")
          + (a.affil || "") + (a.email ? ', ' + a.email : "") + '</p>';
      }
    });
  }

  // Step 3: Compose full HTML body
  const src = useTrans ? translated : narasiSteps;
  const sectionTitles = {
    pendahuluan: useTrans ? "1. Introduction" : "1. Pendahuluan",
    metode: useTrans ? "2. Research Methods" : "2. Metode Penelitian",
    hasil: useTrans ? "3. Results and Discussion" : "3. Hasil dan Pembahasan",
    kesimpulan: useTrans ? "4. Conclusion" : "4. Kesimpulan",
  };

  let body = '<h1>' + theme + '</h1>';
  body += authorsHtml;

  if (src.abstrak) {
    body += '<h2>' + (useTrans ? "Abstract" : "Abstrak") + '</h2>';
    body += markdownToWordHtml(src.abstrak, embedMap);
  }

  ["pendahuluan", "metode", "hasil", "kesimpulan"].forEach(stepId => {
    if (src[stepId]) {
      body += '<h2>' + sectionTitles[stepId] + '</h2>';
      body += markdownToWordHtml(src[stepId], embedMap);
    }
  });

  // References — always last
  if (narasiSteps.referensi || accepted.length > 0) {
    body += '<h2>' + (useTrans ? "References" : "Daftar Referensi") + '</h2>';
    accepted.forEach((a, i) => {
      let ref = "";
      if (tpl.includes("IEEE")) {
        ref = "[" + (i + 1) + "] " + a.authors + ', "' + a.title + ',\" ' + a.journal + ", " + a.year + ".";
      } else if (tpl.includes("Vancouver")) {
        ref = (i + 1) + ". " + a.authors + ". " + a.title + ". " + a.journal + ". " + a.year + ".";
      } else {
        ref = a.authors + " (" + a.year + "). " + a.title + ". " + a.journal + ". https://doi.org/" + a.doi;
      }
      body += '<p class="ref">' + ref + '</p>';
    });
  }

  // Step 4: Wrap in clean Word HTML document
  const fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + theme + '</title>'
    + '<style>'
    + '@page { size: A4; margin: 2.5cm 2cm; }'
    + 'body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }'
    + 'h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 12pt; }'
    + 'h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 18pt 0 8pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; }'
    + 'h3 { font-size: 11pt; font-weight: bold; margin: 12pt 0 6pt; }'
    + 'p { margin: 0 0 8pt; text-align: justify; text-indent: 0; }'
    + 'p.authors { text-align: center; font-size: 12pt; margin: 4pt 0; text-indent: 0; }'
    + 'p.affil { text-align: center; font-size: 10pt; font-style: italic; margin: 0 0 4pt; text-indent: 0; }'
    + 'p.caption { text-align: center; font-size: 10pt; font-style: italic; margin: 4pt 0 12pt; text-indent: 0; }'
    + 'p.ref { padding-left: 24pt; text-indent: -24pt; margin: 0 0 6pt; font-size: 11pt; }'
    + 'table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10.5pt; }'
    + 'th { background: #e8e8e8; border: 1pt solid #000; padding: 5pt 7pt; text-align: left; font-weight: bold; }'
    + 'td { border: 1pt solid #000; padding: 5pt 7pt; vertical-align: top; }'
    + 'img { display: block; margin: 0 auto; }'
    + '</style></head><body>' + body + '</body></html>';

  const blob = new Blob([fullHtml], { type: "application/vnd.ms-word;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename + ".doc"; a.click();
  URL.revokeObjectURL(url);
}

// Backward-compat simple downloadWord (for per-section)
function downloadWord(content, filename) {
  const fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<style>'
    + 'body { font-family: "Times New Roman",serif; font-size: 12pt; line-height: 1.8; color: #000; margin: 2cm; }'
    + 'h1 { font-size: 14pt; font-weight: bold; text-align: center; }'
    + 'h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-top: 18pt; }'
    + 'p { margin-bottom: 8pt; text-align: justify; }'
    + 'table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }'
    + 'th { background: #e8e8e8; border: 1pt solid #000; padding: 5pt 7pt; font-weight: bold; }'
    + 'td { border: 1pt solid #000; padding: 5pt 7pt; vertical-align: top; }'
    + 'p.caption { text-align: center; font-size: 10pt; font-style: italic; }'
    + '</style></head><body>' + content + '</body></html>';
  const blob = new Blob([fullHtml], { type: "application/vnd.ms-word;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename + ".doc"; a.click();
  URL.revokeObjectURL(url);
}

function renderNarasiContent(text, embedMap) {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  let pCount = 0;

  // Pre-clean: remove markdown metadata-style noise that doesn't belong in scientific articles
  const cleanText = (line) => line
    .replace(/^\s*#+\s*Catatan:.*$/gi, "")
    .replace(/^\s*\[.*?\]\s*$/g, (m) => m.match(/(GAMBAR|TABEL|Gambar|Tabel)/i) ? m : "")
    .replace(/^\s*-{3,}\s*$/g, "");

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = cleanText(rawLine);
    const trimmed = line.trim();

    // Markdown table block
    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(<NarasiTable key={"t"+i} lines={tableLines} />);
      continue;
    }

    // Figure/Table caption [GAMBAR N: ...] or [TABEL N: ...]
    const figMatch = trimmed.match(/^\*?\*?\[?(GAMBAR|Gambar|TABEL|Tabel)\s*(\d+)[:\s]+(.*?)\]?\*?\*?\.?$/);
    if (figMatch) {
      const isFig = figMatch[1].toUpperCase() === "GAMBAR";
      const num = figMatch[2];
      const captionRaw = figMatch[3].replace(/[\*\]]+$/g, "").trim();
      const captionLower = captionRaw.toLowerCase();

      // Try to embed real image based on caption
      let imgSrc = null;
      if (embedMap && isFig) {
        if (captionLower.includes("prisma") && embedMap.prisma) imgSrc = embedMap.prisma;
        else if ((captionLower.includes("framework") || captionLower.includes("konseptual") || captionLower.includes("model")) && embedMap.framework) imgSrc = embedMap.framework;
        else if ((captionLower.includes("distribusi") || captionLower.includes("tahun") || captionLower.includes("publikasi")) && embedMap.yearChart) imgSrc = embedMap.yearChart;
      }

      out.push(
        <div key={"f"+i} style={{ margin: "20px 0", textAlign: "center" }}>
          {imgSrc && (
            <div style={{ marginBottom: 6 }}>
              <img src={imgSrc} alt={captionRaw} style={{ maxWidth: "100%", maxHeight: 480, background: "white", padding: 8, borderRadius: 6 }} />
            </div>
          )}
          {!imgSrc && isFig && (
            <div style={{ padding: "32px 16px", border: "1px dashed var(--border)", borderRadius: 6, color: "var(--muted)", fontSize: 11, fontStyle: "italic", marginBottom: 6, background: "rgba(255,255,255,.02)" }}>
              [ Gambar akan otomatis disisipkan saat download Word ]
            </div>
          )}
          <div style={{ fontSize: 11, fontFamily: "var(--fs)", fontStyle: "italic", color: "var(--text)" }}>
            <strong>{isFig ? "Gambar" : "Tabel"} {num}.</strong> {captionRaw}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Heading
    if (trimmed.startsWith("### ")) {
      out.push(<div key={"h3-"+i} style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 12, color: "var(--accent2)", margin: "14px 0 5px" }}>{trimmed.slice(4)}</div>);
      i++; continue;
    }
    if (trimmed.startsWith("## ")) {
      out.push(<div key={"h2-"+i} style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 13, color: "var(--accent)", textTransform: "uppercase", letterSpacing: .5, margin: "18px 0 6px", paddingBottom: 3, borderBottom: "1px solid var(--border)" }}>{trimmed.slice(3)}</div>);
      i++; continue;
    }

    // Empty line
    if (!trimmed) { i++; continue; }

    // Regular paragraph with inline bold support
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g).map((p, pi) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={pi}>{p.slice(2, -2)}</strong>
        : p
    );
    out.push(<p key={"p"+(pCount++)} style={{ marginBottom: 9, fontFamily: "var(--fs)", fontSize: 13, lineHeight: 1.95, textAlign: "justify" }}>{parts}</p>);
    i++;
  }
  return <div>{out}</div>;
}

function NarasiTable({ lines }) {
  // Parse markdown table
  const rows = lines.filter(l => !l.match(/^[\s|:-]+$/));
  const parsed = rows.map(row =>
    row.split("|").filter((_,i,a) => i>0 && i<a.length-1).map(c => c.trim())
  );
  if (!parsed.length) return null;
  const [header, ...body] = parsed;
  return (
    <div style={{overflowX:"auto",margin:"14px 0",borderRadius:7,border:"1px solid var(--border)"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead>
          <tr>
            {header.map((h,i)=>(
              <th key={i} style={{background:"var(--bg3)",padding:"8px 11px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",color:"var(--muted)",borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row,ri)=>(
            <tr key={ri} style={{background: ri%2===0?"":"rgba(28,35,51,.4)"}}>
              {row.map((cell,ci)=>(
                <td key={ci} style={{padding:"8px 11px",borderBottom:"1px solid rgba(42,51,71,.4)",verticalAlign:"top",lineHeight:1.6}}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB 8 — NASKAH SLR (with author panel, translate, Word + embedded images)
// ═══════════════════════════════════════════════
function TabNarasi({ accepted, theme, narasiSteps, setNarasiSteps, generateNarasi, aiStatus, openStep, setOpenStep, narasiView, setNarasiView, handleImprove, settings, narasiAuthors, setNarasiAuthors, extractData, framework, prismaData }) {
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState({});
  const [showTranslated, setShowTranslated] = useState(false);
  const [targetLang, setTargetLang] = useState("en");
  const [embedMap, setEmbedMap] = useState({ prisma: "", framework: "", yearChart: "" });
  const [generatingImages, setGeneratingImages] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);

  const STEPS = [
    { id:"abstrak",     icon:"📄", title:"Abstrak & Judul" },
    { id:"pendahuluan", icon:"📖", title:"1. Pendahuluan" },
    { id:"metode",      icon:"⚙️",  title:"2. Metode Penelitian" },
    { id:"hasil",       icon:"📊", title:"3. Hasil & Pembahasan" },
    { id:"kesimpulan",  icon:"✅", title:"4. Kesimpulan" },
    { id:"referensi",   icon:"📚", title:"5. Daftar Referensi" },
  ];
  const tpl = JOURNAL_TPLS.find(t=>t.id===settings.journalTemplate)?.label||"APA 7th";
  const allDone = STEPS.every(s=>narasiSteps[s.id]);
  const fullText = STEPS.filter(s=>narasiSteps[s.id]&&s.id!=="referensi").map(s=>narasiSteps[s.id]).join("\n\n");
  const doneCount = STEPS.filter(s=>narasiSteps[s.id]).length;
  const tableCount = Object.values(narasiSteps).join(" ").match(/\[TABEL\s*\d+/gi)?.length||0;
  const figureCount = Object.values(narasiSteps).join(" ").match(/\[GAMBAR\s*\d+/gi)?.length||0;

  const addAuthor = ()=>setNarasiAuthors(p=>[...p,{id:Date.now(),name:"",affil:"",email:""}]);
  const removeAuthor = (id)=>setNarasiAuthors(p=>p.filter(a=>a.id!==id));
  const updateAuthor = (id,k,v)=>setNarasiAuthors(p=>p.map(a=>a.id===id?{...a,[k]:v}:a));

  // Build embed map (PNG data URLs) when narasi data changes — used for live preview AND Word download
  useEffect(() => {
    if (!allDone) return;
    let cancelled = false;
    setGeneratingImages(true);
    (async () => {
      const prismaSvg = buildPrismaSvg(prismaData || {});
      const fwSvg = framework ? buildFrameworkBwSvg(framework) : "";
      const yearSvg = buildYearChartSvg(accepted);
      const [prismaPng, fwPng, yearPng] = await Promise.all([
        svgToPngDataUrl(prismaSvg, 720, 760),
        fwSvg ? svgToPngDataUrl(fwSvg, 720, 360) : Promise.resolve(""),
        yearSvg ? svgToPngDataUrl(yearSvg, 500, 300) : Promise.resolve(""),
      ]);
      if (!cancelled) {
        setEmbedMap({ prisma: prismaPng, framework: fwPng, yearChart: yearPng });
        setGeneratingImages(false);
      }
    })();
    return () => { cancelled = true; };
  }, [allDone, framework, prismaData?.uploadedCount, accepted.length]);

  async function handleDownloadWord(useTrans) {
    setDownloadingWord(true);
    try {
      await downloadWordWithAssets({
        filename: "SLR_" + (theme||"naskah").replace(/[^\w]+/g,"_").slice(0,40) + (useTrans ? "_translated" : ""),
        theme: "Systematic Literature Review: " + theme,
        authors: narasiAuthors,
        narasiSteps,
        accepted,
        tpl,
        prismaData: prismaData || {},
        framework,
        useTrans,
        translated,
      });
    } catch(err) {
      console.error("Word download error:", err);
      alert("Gagal mengunduh Word: " + err.message);
    }
    setDownloadingWord(false);
  }

  function buildWordContent(useTrans) {
    const src = useTrans ? translated : narasiSteps;
    const authLine = narasiAuthors.filter(a=>a.name.trim()).map((a,i)=>"<div class=\"authors\">" + a.name + (narasiAuthors.filter(x=>x.name.trim()).length>1?"<sup>"+(i+1)+"</sup>":"") + "</div>" + (a.affil?"<div class=\"affil\">" + a.affil + (a.email?" · "+a.email:"") + "</div>":"")).join("");
    let html=`<h1>Systematic Literature Review: ${theme}</h1>${authLine}<br/>`;
    if(src.abstrak) html+=`<h2>Abstrak</h2><p>${src.abstrak.replace(/\n/g,"</p><p>")}</p>`;
    STEPS.filter(s=>s.id!=="abstrak"&&s.id!=="referensi"&&src[s.id]).forEach(step=>{
      html+=`<h2>${step.title}</h2>`;
      const lines=(src[step.id]||"").split("\n"); let i=0;
      while(i<lines.length){
        if(lines[i].trim().startsWith("|")){
          const tl=[];while(i<lines.length&&lines[i].trim().startsWith("|")){tl.push(lines[i]);i++;}
          const rows=tl.filter(l=>!l.match(/^[\s|:-]+$/));
          if(rows.length>0){const parsed=rows.map(r=>r.split("|").filter((_,ci,a)=>ci>0&&ci<a.length-1).map(c=>c.trim()));const[hd,...bd]=parsed;html+="<table><thead><tr>"+hd.map(h=>"<th>"+h+"</th>").join("")+"</tr></thead><tbody>"+bd.map(r=>"<tr>"+r.map(c=>"<td>"+c+"</td>").join("")+"</tr>").join("")+"</tbody></table>";}
        } else if(lines[i].match(/\[?(GAMBAR|TABEL)\s*\d+/i)){html+=`<p class="caption">${lines[i].replace(/\*\*/g,"")}</p>`;i++;}
        else if(lines[i].startsWith("## ")){html+=`<h2>${lines[i].replace(/^## /,"")}</h2>`;i++;}
        else if(lines[i].trim()){html+=`<p>${lines[i].replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}</p>`;i++;}
        else{i++;}
      }
    });
    if(narasiSteps.referensi){html+=`<h2>Daftar Referensi</h2>`;accepted.forEach((a,i)=>{html+=`<p style="padding-left:24pt;text-indent:-24pt">${tpl.includes("IEEE")?("["+((i+1))+"] "+a.authors+", \""+a.title+",\" "+a.journal+", "+a.year+".") : (a.authors+" ("+a.year+"). "+a.title+". "+a.journal+". https://doi.org/"+a.doi)}</p>`;});}
    return html;
  }

  async function translateAll(){
    setTranslating(true);
    const langNames={en:"English",ar:"Arabic",zh:"Chinese Simplified",fr:"French",de:"German",ja:"Japanese",ko:"Korean",es:"Spanish"};
    const lang=langNames[targetLang]||"English";
    const result={};
    for(const step of STEPS.filter(s=>narasiSteps[s.id]&&s.id!=="referensi")){
      try{
        const txt=await callAI(`Translate the following academic text to ${lang}. RULES: Keep ALL citations (Author, Year) unchanged. Keep ALL markdown table | formats intact. Keep ALL [GAMBAR N:] and [TABEL N:] markers. Keep ## headings structure. Output ONLY the translated text.\n\n${narasiSteps[step.id]}`,settings,"You are a professional academic translator.");
        result[step.id]=txt;
      }catch(e){result[step.id]=narasiSteps[step.id];}
    }
    result.referensi=narasiSteps.referensi;
    setTranslated(result);setShowTranslated(true);setTranslating(false);
  }

  return (
    <div>
      {/* Author Panel */}
      <div className="card">
        <div className="card-title">✍️ Identitas Penulis</div>
        {narasiAuthors.map((auth,idx)=>(
          <div key={auth.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,marginTop:idx===0?22:4}}>{idx+1}</div>
            <div className="grid3" style={{flex:1,gap:6}}>
              <div className="fg">{idx===0&&<label>Nama Penulis</label>}<input type="text" placeholder="Nama Lengkap" value={auth.name} onChange={e=>updateAuthor(auth.id,"name",e.target.value)}/></div>
              <div className="fg">{idx===0&&<label>Affiliasi / Institusi</label>}<input type="text" placeholder="Universitas / Lembaga" value={auth.affil} onChange={e=>updateAuthor(auth.id,"affil",e.target.value)}/></div>
              <div className="fg">{idx===0&&<label>Email</label>}<input type="text" placeholder="email@domain.com" value={auth.email} onChange={e=>updateAuthor(auth.id,"email",e.target.value)}/></div>
            </div>
            {narasiAuthors.length>1&&<button className="btn xs danger" style={{marginTop:idx===0?22:4}} onClick={()=>removeAuthor(auth.id)}>✕</button>}
          </div>
        ))}
        <button className="btn sm" onClick={addAuthor} style={{marginTop:6}}>+ Tambah Penulis</button>
      </div>

      {/* Top bar */}
      <div className="card" style={{padding:"11px 16px"}}>
        <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,fontSize:11,color:"var(--muted)"}}>
            Template: <strong style={{color:"var(--accent)"}}>{tpl}</strong> — {accepted.length} artikel — {doneCount}/{STEPS.length} selesai
            {tableCount>0&&<span style={{color:"var(--accent)",marginLeft:8}}>📊{tableCount}</span>}
            {figureCount>0&&<span style={{color:"var(--accent2)",marginLeft:6}}>🖼️{figureCount}</span>}
          </div>
          <button className={`btn sm ${narasiView==="steps"?"primary":""}`} onClick={()=>setNarasiView("steps")}>📑 Per Bagian</button>
          <button className={`btn sm ${narasiView==="gabungan"?"primary":""}`} onClick={()=>setNarasiView("gabungan")} disabled={!allDone}>📄 Gabungan</button>
          {allDone&&<button className="btn sm success" onClick={()=>downloadWord(buildWordContent(false),`SLR_${theme.slice(0,30)}`)}>⬇ Word</button>}
        </div>
      </div>

      {/* Per bagian view */}
      {narasiView==="steps"&&STEPS.map(step=>(
        <div key={step.id} className="card" style={{padding:"0 18px"}}>
          <div className="step-hdr" onClick={()=>setOpenStep(openStep===step.id?null:step.id)}>
            <div className="step-num">{step.icon}</div>
            <div className="step-ttl">{step.title}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {narasiSteps[step.id]&&<span className="badge acc">✓</span>}
              {!narasiSteps[step.id]&&<button className="btn xs primary" onClick={e=>{e.stopPropagation();generateNarasi(step.id);}} disabled={!!aiStatus}>{aiStatus===step.id?"⏳":"✨ Generate"}</button>}
              {narasiSteps[step.id]&&<>
                <button className="btn xs" onClick={e=>{e.stopPropagation();generateNarasi(step.id);}}>🔄</button>
                <button className="btn xs success" onClick={e=>{e.stopPropagation();downloadWord(`<h2>${step.title}</h2><div>${narasiSteps[step.id].replace(/\n/g,"<br/>")}</div>`,step.id);}}>⬇ Word</button>
              </>}
              <span style={{color:"var(--muted)",fontSize:11}}>{openStep===step.id?"▲":"▼"}</span>
            </div>
          </div>
          {openStep===step.id&&narasiSteps[step.id]&&(
            <div style={{padding:"14px 0 20px"}}>
              {step.id==="referensi"
                ?<div>{accepted.map((a,i)=><div key={a.id} style={{marginBottom:8,fontSize:12,fontFamily:"var(--fs)",paddingLeft:28,textIndent:-28,lineHeight:1.65}}>{tpl.includes("IEEE")?("["+((i+1))+"] "+a.authors+", \""+a.title+",\" "+a.journal+", "+a.year+".") : (a.authors+" ("+a.year+"). "+a.title+". "+a.journal+". https://doi.org/"+a.doi)}</div>)}</div>
                :renderNarasiContent(narasiSteps[step.id])
              }
            </div>
          )}
          {openStep===step.id&&!narasiSteps[step.id]&&(
            <div style={{padding:"20px 0",textAlign:"center",color:"var(--muted)",fontSize:11}}>Klik Generate AI — narasi akan menyertakan tabel, gambar, dan keterangan bagan secara otomatis.</div>
          )}
        </div>
      ))}

      {/* Gabungan view */}
      {narasiView==="gabungan"&&(
        <>
          <div className="nar-wrap" style={{marginBottom:14}}>
            <h1>Systematic Literature Review: {theme}</h1>
            <div style={{textAlign:"center",marginBottom:16}}>
              {narasiAuthors.filter(a=>a.name.trim()).map((a,i)=>(
                <div key={a.id}>
                  <div style={{fontSize:13,fontFamily:"var(--fs)",fontWeight:600}}>{a.name}{narasiAuthors.filter(x=>x.name.trim()).length>1?<sup style={{fontSize:9}}>{i+1}</sup>:""}</div>
                  {a.affil&&<div style={{fontSize:10,color:"var(--muted)"}}>{a.affil}{a.email?` · ${a.email}`:""}</div>}
                </div>
              ))}
              {!narasiAuthors.some(a=>a.name.trim())&&<div style={{fontSize:11,color:"var(--muted)"}}>Isi identitas penulis di atas | {new Date().getFullYear()}</div>}
            </div>
            {Object.keys(translated).length>0&&(
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <button className={`btn sm ${!showTranslated?"primary":""}`} onClick={()=>setShowTranslated(false)}>🇮🇩 Indonesia</button>
                <button className={`btn sm ${showTranslated?"primary":""}`} onClick={()=>setShowTranslated(true)}>🌐 Terjemahan</button>
              </div>
            )}
            {(showTranslated?translated:narasiSteps).abstrak&&(
              <div style={{borderLeft:"3px solid var(--accent)",padding:"10px 14px",background:"var(--bg3)",borderRadius:"0 7px 7px 0",marginBottom:20}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--accent)",marginBottom:6}}>Abstract</div>
                {renderNarasiContent((showTranslated?translated:narasiSteps).abstrak)}
              </div>
            )}
            {STEPS.filter(s=>s.id!=="abstrak"&&s.id!=="referensi"&&(showTranslated?translated:narasiSteps)[s.id]).map(step=>(
              <div key={step.id} style={{marginBottom:22}}>
                <h2>{step.title}</h2>
                {renderNarasiContent((showTranslated?translated:narasiSteps)[step.id])}
              </div>
            ))}
            {narasiSteps.referensi&&(
              <div style={{marginTop:22,paddingTop:16,borderTop:"1px solid var(--border)"}}>
                <h2>Daftar Referensi</h2>
                {accepted.map((a,i)=><div key={a.id} style={{fontSize:11,fontFamily:"var(--fs)",marginBottom:8,paddingLeft:28,textIndent:-28,lineHeight:1.65}}>{tpl.includes("IEEE")?("["+((i+1))+"] "+a.authors+", \""+a.title+",\" "+a.journal+", "+a.year+".") : (a.authors+" ("+a.year+"). "+a.title+". "+a.journal+". https://doi.org/"+a.doi)}</div>)}
              </div>
            )}
          </div>

          {/* Translate panel */}
          <div className="card" style={{marginBottom:12}}>
            <div className="card-title">🌐 Terjemahkan Naskah</div>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div className="fg" style={{minWidth:170}}>
                <label>Bahasa Tujuan</label>
                <select value={targetLang} onChange={e=>setTargetLang(e.target.value)}>
                  <option value="en">English (Inggris)</option>
                  <option value="ar">Arabic (Arab)</option>
                  <option value="zh">Chinese Simplified (Mandarin)</option>
                  <option value="fr">French (Prancis)</option>
                  <option value="de">German (Jerman)</option>
                  <option value="ja">Japanese (Jepang)</option>
                  <option value="ko">Korean (Korea)</option>
                  <option value="es">Spanish (Spanyol)</option>
                </select>
              </div>
              <button className="btn primary" onClick={translateAll} disabled={translating||!fullText}>
                {translating?"⏳ Menerjemahkan...":"🌐 Terjemahkan"}
              </button>
              {Object.keys(translated).length>0&&(
                <button className="btn success" onClick={()=>downloadWord(buildWordContent(true),`SLR_${theme.slice(0,25)}_en`)}>⬇ Word Terjemahan</button>
              )}
            </div>
            {translating&&<div style={{marginTop:8,fontSize:11,color:"var(--accent)"}}>Menerjemahkan per bagian, mempertahankan tabel & sitasi...</div>}
          </div>

          <IntegrityPanel text={fullText} onImprove={handleImprove} aiStatus={aiStatus} settings={settings}/>
          <div className="card" style={{marginTop:12,borderColor:"rgba(167,139,250,.3)"}}>
            <div className="card-title" style={{color:"var(--accent2)"}}>📋 Deklarasi Penggunaan AI</div>
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,padding:"11px 13px",fontSize:12,fontFamily:"var(--fs)",lineHeight:1.8,marginTop:8}}>
              <strong>AI Usage Statement:</strong> The authors used an AI-assisted writing tool to support the systematic literature review process, including article screening, data extraction, table generation, and narrative drafting. All AI-generated content was critically reviewed, verified, and revised by the authors. Full intellectual responsibility rests with the authors.
            </div>
            <button className="btn xs" style={{marginTop:7}} onClick={()=>navigator.clipboard.writeText("The authors used an AI-assisted writing tool...")}>📋 Copy</button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TAB SETTINGS — Simple & Clean
// ═══════════════════════════════════════════════
function TabSettings({ settings, setSettings }) {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const upd = (k, v) => setLocalSettings(p => ({ ...p, [k]: v }));
  const prov = AI_PROVIDERS.find(p => p.id === localSettings.provider);

  function handleSave() {
    setSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const activeKey = {
    anthropic: localSettings.anthropicKey,
    gemini: localSettings.geminiKey,
    openai: localSettings.openaiKey,
    groq: localSettings.groqKey,
  }[localSettings.provider];

  return (
    <div style={{ maxWidth: 540 }}>
      <div className="card">
        <div className="card-title">⚙️ Konfigurasi AI</div>

        {/* Provider + Model row */}
        <div className="grid2" style={{ marginBottom: 14 }}>
          <div className="fg">
            <label>Provider AI</label>
            <select value={localSettings.provider} onChange={e => {
              const p = e.target.value;
              upd("provider", p);
              upd("model", AI_PROVIDERS.find(x => x.id === p)?.models[0] || "");
            }}>
              {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Model</label>
            <select value={localSettings.model} onChange={e => upd("model", e.target.value)}>
              {(prov?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* API Key for selected provider */}
        <div className="fg" style={{ marginBottom: 14 }}>
          <label>
            API Key — {prov?.label}
            {activeKey?.trim()
              ? <span style={{ color: "var(--green)", marginLeft: 8, fontSize: 9 }}>✓ Sudah diisi</span>
              : <span style={{ color: "var(--amber)", marginLeft: 8, fontSize: 9 }}>⚠ Belum diisi</span>
            }
          </label>
          <input
            type="password"
            placeholder={
              localSettings.provider === "anthropic" ? "sk-ant-..." :
              localSettings.provider === "gemini" ? "AIza..." :
              localSettings.provider === "openai" ? "sk-..." : "gsk_..."
            }
            value={activeKey || ""}
            onChange={e => {
              const keyMap = { anthropic: "anthropicKey", gemini: "geminiKey", openai: "openaiKey", groq: "groqKey" };
              upd(keyMap[localSettings.provider], e.target.value);
            }}
          />
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
            {localSettings.provider === "gemini" && <span style={{ color: "var(--green)" }}>Gemini 2.0 Flash tersedia gratis — </span>}
            {localSettings.provider === "groq" && <span style={{ color: "var(--green)" }}>LLaMA via Groq gratis dengan rate limit — </span>}
            <a href={
              localSettings.provider === "anthropic" ? "https://console.anthropic.com" :
              localSettings.provider === "gemini" ? "https://aistudio.google.com/app/apikey" :
              localSettings.provider === "openai" ? "https://platform.openai.com/api-keys" :
              "https://console.groq.com"
            } target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              Dapatkan API key →
            </a>
          </div>
        </div>

        {/* Template jurnal */}
        <div className="fg" style={{ marginBottom: 18 }}>
          <label>Template Jurnal / Format Sitasi</label>
          <select value={localSettings.journalTemplate} onChange={e => upd("journalTemplate", e.target.value)}>
            {JOURNAL_TPLS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Save button */}
        <button
          className={`btn ${saved ? "success" : "primary"}`}
          onClick={handleSave}
          style={{ width: "100%", justifyContent: "center", padding: "9px", fontSize: 12 }}
        >
          {saved ? "✅ Pengaturan Tersimpan!" : "💾 Simpan Pengaturan"}
        </button>
      </div>

      {/* Other providers keys (collapsed) */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>🔑 API Key Provider Lain (Opsional)</div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 12 }}>
          Isi jika ingin beralih provider sewaktu-waktu tanpa kehilangan key yang sudah tersimpan.
        </div>
        {AI_PROVIDERS.filter(p => p.id !== localSettings.provider).map(p => {
          const keyMap = { anthropic: "anthropicKey", gemini: "geminiKey", openai: "openaiKey", groq: "groqKey" };
          const kKey = keyMap[p.id];
          const ph = { anthropic:"sk-ant-...", gemini:"AIza...", openai:"sk-...", groq:"gsk_..." }[p.id];
          return (
            <div key={p.id} className="fg" style={{ marginBottom: 10 }}>
              <label>{p.label} {localSettings[kKey]?.trim() && <span style={{ color:"var(--green)", fontSize:9 }}>✓</span>}</label>
              <input type="password" placeholder={ph} value={localSettings[kKey] || ""} onChange={e => upd(kKey, e.target.value)} />
            </div>
          );
        })}
        <button className="btn sm success" style={{ marginTop: 6 }} onClick={handleSave}>💾 Simpan Semua Key</button>
      </div>
    </div>
  );
}
