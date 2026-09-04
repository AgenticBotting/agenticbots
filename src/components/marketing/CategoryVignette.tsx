/**
 * One coded hero graphic per bot — thirteen bespoke scenes, shared
 * grammar (hairline boxes, mono labels, accent = the thing the bot
 * changed). Selected by catalog slug; unknown slugs fall back to the
 * wired-hub scene. All inline SVG: zero requests, token-colored.
 */

const F = "w-full h-auto block";
const MONO = "var(--font-mono)";
const INK = "var(--color-ink-950)";
const GREEN = "var(--color-accent-500)";
const GREEN_TXT = "var(--accent-text)";
const MUTED = "var(--text-muted)";
const BODY = "var(--text-secondary)";
const LINE = "var(--border-strong)";
const FILL = "var(--background)";
const BAR = "var(--color-ink-100)";
const TINT = "var(--bg-tint)";
const TINT_LINE = "var(--border-tint)";

function Label({ x, y, children, tone = MUTED, anchor = "start" }: {
  x: number; y: number; children: React.ReactNode; tone?: string; anchor?: "start" | "middle" | "end";
}) {
  return <text x={x} y={y} textAnchor={anchor} fontSize="8" fontFamily={MONO} fill={tone} letterSpacing="0.6">{children}</text>;
}

/* 01 · paid-media — junk struck, budget follows booked work */
function PaidMedia() {
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="20" y="28" width="140" height="124" fill={FILL} stroke={LINE} />
      <Label x={32} y={45}>SEARCH TERMS · TODAY</Label>
      {[
        { y: 60, w: 88, ok: true, t: "emergency repair" },
        { y: 84, w: 74, ok: false, t: "free diy fix" },
        { y: 108, w: 96, ok: true, t: "repair near me" },
        { y: 132, w: 62, ok: false, t: "salary intern" },
      ].map((r) => (
        <g key={r.y} opacity={r.ok ? 1 : 0.55}>
          {r.ok
            ? <path d={`M32 ${r.y} l3 3 5-6`} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            : <path d={`M32 ${r.y - 3} l6 6 M38 ${r.y - 3} l-6 6`} fill="none" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" />}
          <text x="48" y={r.y + 2.5} fontSize="8.5" fontFamily={MONO} fill={BODY}
            textDecoration={r.ok ? undefined : "line-through"}>{r.t}</text>
        </g>
      ))}
      <path d="M160 90 C 184 90, 182 90, 196 90" fill="none" stroke={GREEN} strokeWidth="1.5" />
      <rect x="196" y="28" width="104" height="124" fill={FILL} stroke={LINE} />
      <Label x={208} y={45}>BUDGET</Label>
      {[
        { x: 210, h: 26, on: false }, { x: 234, h: 44, on: false },
        { x: 258, h: 78, on: true }, { x: 282, h: 60, on: true },
      ].map((b) => (
        <rect key={b.x} x={b.x} y={140 - b.h} width="14" height={b.h} fill={b.on ? GREEN : BAR} />
      ))}
      <Label x={248} y={162} tone={GREEN_TXT} anchor="middle">→ WHAT BOOKS JOBS</Label>
    </svg>
  );
}

/* 02 · seo — the climb */
function Seo() {
  const rows = [
    { pos: "1", w: 92, you: false }, { pos: "2", w: 78, you: false },
    { pos: "3", w: 96, you: true }, { pos: "4", w: 64, you: false }, { pos: "5", w: 72, you: false },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="58" y="22" width="204" height="136" fill={FILL} stroke={LINE} />
      <Label x={70} y={40}>YOUR KEYWORD · PAGE ONE</Label>
      {rows.map((r, i) => {
        const y = 56 + i * 21;
        return (
          <g key={r.pos}>
            <text x="74" y={y + 8} fontSize="8.5" fontFamily={MONO} fill={r.you ? GREEN_TXT : MUTED}>#{r.pos}</text>
            <rect x="92" y={y} width={r.w} height="10" fill={r.you ? GREEN : BAR} />
            {r.you && <Label x={196} y={y + 8.5} tone={GREEN_TXT}>YOU</Label>}
          </g>
        );
      })}
      {/* the climb from last month */}
      <path d="M238 140 C 250 140, 248 104, 236 100" fill="none" stroke={GREEN} strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M236 100 l7 1.5 -3.5 -6.5 z" fill={GREEN} />
      <Label x={244} y={152} tone={MUTED}>#9 LAST MO</Label>
    </svg>
  );
}

/* 03 · content — one piece becomes many */
function Content() {
  const out = [
    { t: "social post", y: 42 }, { t: "email", y: 84 }, { t: "video script", y: 126 },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="30" y="52" width="104" height="76" fill={FILL} stroke={LINE} />
      <rect x="30" y="52" width="104" height="16" fill={TINT} />
      <Label x={40} y={63} tone={GREEN_TXT}>THE-GUIDE.MD</Label>
      {[78, 90, 102, 114].map((y, i) => (
        <rect key={y} x="40" y={y} width={84 - i * 12} height="5" fill={BAR} />
      ))}
      {out.map((o) => (
        <g key={o.t}>
          <path d={`M134 90 C 168 90, 168 ${o.y}, 198 ${o.y}`} fill="none" stroke={GREEN} strokeWidth="1.4" opacity="0.8" />
          <rect x="198" y={o.y - 13} width="92" height="26" fill={TINT} stroke={TINT_LINE} />
          <text x="244" y={o.y + 3.5} textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill={GREEN_TXT}>{o.t}</text>
        </g>
      ))}
      <Label x={82} y={146} anchor="middle">WRITTEN ONCE</Label>
      <Label x={244} y={158} anchor="middle" tone={GREEN_TXT}>PUBLISHED EVERYWHERE</Label>
    </svg>
  );
}

/* 04 · email — the sequence that stops itself */
function Email() {
  const steps = [
    { x: 40, d: "DAY 0", t: "quote sent", on: false },
    { x: 124, d: "DAY 2", t: "nudge", on: false },
    { x: 208, d: "DAY 5", t: "reply ✓", on: true },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <path d="M56 90 H 264" stroke={LINE} strokeWidth="1" />
      {steps.map((s) => (
        <g key={s.x}>
          <circle cx={s.x + 32} cy="90" r="3" fill={s.on ? GREEN : LINE} />
          <rect x={s.x} y="52" width="72" height="26" fill={s.on ? TINT : FILL} stroke={s.on ? TINT_LINE : LINE} />
          <text x={s.x + 36} y="68.5" textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill={s.on ? GREEN_TXT : BODY}>{s.t}</text>
          <Label x={s.x + 36} y={112} anchor="middle">{s.d}</Label>
        </g>
      ))}
      <rect x="96" y="130" width="128" height="24" fill={INK} />
      <text x="160" y="145.5" textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill="white">sequence stopped — booked</text>
    </svg>
  );
}

/* 05 · cro — B wins */
function Cro() {
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      {/* A: the long form */}
      <rect x="34" y="34" width="110" height="112" fill={FILL} stroke={LINE} />
      <Label x={46} y={52}>PAGE A · 11 FIELDS</Label>
      {[62, 76, 90, 104, 118].map((y) => (
        <rect key={y} x="46" y={y} width="86" height="8" fill={BAR} />
      ))}
      <rect x="46" y="130" width="86" height="10" fill={BAR} />
      {/* B: the short one */}
      <rect x="176" y="34" width="110" height="112" fill={FILL} stroke={LINE} />
      <Label x={188} y={52} tone={GREEN_TXT}>PAGE B · 3 FIELDS</Label>
      {[62, 76, 90].map((y) => (
        <rect key={y} x="188" y={y} width="86" height="8" fill={BAR} />
      ))}
      <rect x="188" y="106" width="86" height="16" fill={GREEN} />
      <rect x="196" y="132" width="70" height="12" fill={TINT} stroke={TINT_LINE} />
      <text x="231" y="141" textAnchor="middle" fontSize="7.5" fontFamily={MONO} fill={GREEN_TXT}>+38% CALLS</text>
      <Label x={160} y={166} anchor="middle">TESTED ON REAL VISITORS · B SHIPPED</Label>
    </svg>
  );
}

/* 06 · analytics — one number that matters */
function Analytics() {
  const pts = [140, 132, 126, 112, 96, 88, 84, 78];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="34" y="26" width="252" height="128" fill={FILL} stroke={LINE} />
      <Label x={46} y={44}>ONE VIEW · NOT FIFTEEN TABS</Label>
      <text x="46" y="84" fontSize="30" fontWeight="600" fontFamily="var(--font-geist-sans)" fill={INK} letterSpacing="-1">$151</text>
      <Label x={46} y={98} tone={GREEN_TXT}>COST PER BOOKED JOB · ↓64%</Label>
      <polyline
        points={pts.map((y, i) => `${168 + i * 15},${y}`).join(" ")}
        fill="none" stroke={GREEN} strokeWidth="2"
      />
      <circle cx={168 + 7 * 15} cy={78} r="3.5" fill={GREEN} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={46 + i * 26} y={124} width="16" height={18 - i * 3} fill={BAR} />
      ))}
      <Label x={46} y={166}>SPEND</Label>
      <Label x={273} y={166} anchor="end" tone={GREEN_TXT}>WK 12</Label>
    </svg>
  );
}

/* 07 · lead-generation — a list worth calling */
function LeadGen() {
  const rows = [
    { y: 46, name: 62, ok: true, tag: "verified" },
    { y: 82, name: 78, ok: true, tag: "verified" },
    { y: 118, name: 54, ok: true, tag: "hiring now", hot: true },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="40" y="26" width="240" height="128" fill={FILL} stroke={LINE} />
      <Label x={52} y={42}>THE LIST · BUILT + ENRICHED</Label>
      {rows.map((r) => (
        <g key={r.y}>
          <rect x="52" y={r.y + 6} width="18" height="18" fill={r.hot ? GREEN : BAR} />
          <rect x="80" y={r.y + 8} width={r.name} height="6" fill={BAR} />
          <rect x="80" y={r.y + 18} width={r.name - 18} height="5" fill={BAR} opacity="0.6" />
          <rect x={196} y={r.y + 6} width={r.hot ? 72 : 62} height="16"
            fill={r.hot ? TINT : FILL} stroke={r.hot ? TINT_LINE : LINE} />
          <text x={r.hot ? 232 : 227} y={r.y + 17} textAnchor="middle" fontSize="7.5" fontFamily={MONO}
            fill={r.hot ? GREEN_TXT : MUTED}>{r.tag}</text>
        </g>
      ))}
      <Label x={160} y={168} anchor="middle" tone={GREEN_TXT}>CONTACTED WHEN THERE&apos;S A REASON</Label>
    </svg>
  );
}

/* 08 · outbound — every step, then sorted */
function Outbound() {
  const chain = [
    { x: 30, t: "email" }, { x: 106, t: "linkedin" }, { x: 182, t: "call" },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      {chain.map((c, i) => (
        <g key={c.t}>
          <rect x={c.x} y="44" width="64" height="26" fill={FILL} stroke={LINE} />
          <text x={c.x + 32} y="60.5" textAnchor="middle" fontSize="8.5" fontFamily={MONO} fill={BODY}>{c.t}</text>
          {i < 2 && <path d={`M${c.x + 64} 57 h12`} stroke={GREEN} strokeWidth="1.5" />}
        </g>
      ))}
      <path d="M246 57 h16" stroke={GREEN} strokeWidth="1.5" />
      <rect x="262" y="44" width="28" height="26" fill={INK} />
      <path d="M270 57 l3 3 6-6" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* replies sorted */}
      <path d="M160 70 C 160 92, 110 92, 104 104" fill="none" stroke={GREEN} strokeWidth="1.3" opacity="0.8" />
      <path d="M160 70 C 160 92, 210 92, 216 104" fill="none" stroke={LINE} strokeWidth="1.3" />
      <rect x="52" y="104" width="104" height="42" fill={TINT} stroke={TINT_LINE} />
      <Label x={104} y={122} anchor="middle" tone={GREEN_TXT}>INTERESTED · 3</Label>
      {[88, 104, 120].map((x) => <rect key={x} x={x} y="130" width="8" height="8" fill={GREEN} />)}
      <rect x="164" y="104" width="104" height="42" fill={FILL} stroke={LINE} />
      <Label x={216} y={122} anchor="middle">LATER · 11</Label>
      {[186, 200, 214, 228].map((x) => <rect key={x} x={x} y="130" width="8" height="8" fill={BAR} />)}
    </svg>
  );
}

/* 09 · inbound — the stopwatch */
function Inbound() {
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="24" y="64" width="76" height="42" fill={FILL} stroke={LINE} />
      <Label x={62} y={80} anchor="middle">MISSED CALL</Label>
      <Label x={62} y={94} anchor="middle" tone={BODY}>8:42 PM</Label>
      <path d="M100 85 C 118 85, 118 85, 126 85" fill="none" stroke={GREEN} strokeWidth="1.5" />
      {/* the stopwatch */}
      <circle cx="160" cy="85" r="34" fill={INK} />
      <circle cx="160" cy="85" r="34" fill="none" stroke={GREEN} strokeWidth="2.5"
        strokeDasharray="150 64" strokeLinecap="round" transform="rotate(-90 160 85)" />
      <text x="160" y="83" textAnchor="middle" fontSize="15" fontWeight="600" fontFamily="var(--font-geist-sans)" fill="white">41s</text>
      <text x="160" y="97" textAnchor="middle" fontSize="6.5" fontFamily={MONO} fill="var(--color-ink-300)" letterSpacing="1">FIRST REPLY</text>
      <path d="M194 85 C 202 85, 202 85, 220 85" fill="none" stroke={GREEN} strokeWidth="1.5" />
      <rect x="220" y="64" width="78" height="42" fill={TINT} stroke={TINT_LINE} />
      <Label x={259} y={80} anchor="middle" tone={GREEN_TXT}>TEXT SENT</Label>
      <Label x={259} y={94} anchor="middle" tone={GREEN_TXT}>8:42 PM</Label>
      <Label x={160} y={152} anchor="middle">AT 2PM OR 2AM · SAME NUMBER</Label>
    </svg>
  );
}

/* 10 · crm — duplicates merge, stage advances */
function Crm() {
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="28" y="38" width="84" height="46" fill={FILL} stroke={LINE} transform="rotate(-3 70 61)" />
      <rect x="36" y="72" width="84" height="46" fill={FILL} stroke={LINE} transform="rotate(2 78 95)" />
      <Label x={50} y={92}>ACME CO.</Label>
      <Label x={50} y={104} tone={MUTED}>×2 RECORDS</Label>
      <path d="M124 84 C 148 84, 148 84, 162 84" fill="none" stroke={GREEN} strokeWidth="1.5" />
      <rect x="162" y="52" width="130" height="64" fill={FILL} stroke={LINE} />
      <path d="M174 66 l3.5 3.5 6-7" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Label x={190} y={70} tone={GREEN_TXT}>ACME CO. · CLEAN</Label>
      {/* stage pills */}
      {["lead", "quote", "won"].map((t, i) => (
        <g key={t}>
          <rect x={174 + i * 38} y={84} width="34" height="14"
            fill={i < 2 ? GREEN : BAR} opacity={i === 0 ? 0.45 : 1} />
          <text x={191 + i * 38} y={94} textAnchor="middle" fontSize="7" fontFamily={MONO}
            fill={i < 2 ? INK : MUTED}>{t}</text>
        </g>
      ))}
      <Label x={160} y={150} anchor="middle">NOBODY TYPED ANY OF THIS</Label>
    </svg>
  );
}

/* 11 · enablement — the quote that goes out today */
function Enablement() {
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <rect x="86" y="22" width="148" height="136" fill={FILL} stroke={LINE} />
      <rect x="86" y="22" width="148" height="18" fill={TINT} />
      <Label x={98} y={34} tone={GREEN_TXT}>QUOTE-1042.PDF</Label>
      {[52, 68, 84].map((y, i) => (
        <g key={y}>
          <rect x="98" y={y} width={70 - i * 10} height="6" fill={BAR} />
          <rect x={188} y={y} width="34" height="6" fill={BAR} opacity="0.7" />
        </g>
      ))}
      <path d="M98 110 C 112 100, 122 116, 136 106 C 144 100, 150 108, 158 104" fill="none" stroke={INK} strokeWidth="1.4" />
      <Label x={98} y={126}>SIGNATURE</Label>
      <rect x="146" y="132" width="76" height="16" fill={GREEN} />
      <text x="184" y="143" textAnchor="middle" fontSize="7.5" fontFamily={MONO} fill={INK}>SIGNED · DAY 1</text>
      <Label x={160} y={172} anchor="middle">FROM YOUR RATE CARD · SAME DAY</Label>
    </svg>
  );
}

/* 12 · account-management — the save */
function Retention() {
  const bars = [
    { x: 40, h: 66, dip: false }, { x: 104, h: 58, dip: false },
    { x: 168, h: 34, dip: true }, { x: 232, h: 72, dip: false },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      <Label x={40} y={36}>ACCOUNT HEALTH · SCORED WEEKLY</Label>
      {bars.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={124 - b.h} width="48" height={b.h} fill={b.dip ? BAR : GREEN} opacity={b.dip ? 1 : 0.8} />
          {b.dip && (
            <g>
              <circle cx={b.x + 24} cy={124 - b.h - 12} r="6" fill="var(--color-caution)" />
              <text x={b.x + 24} y={124 - b.h - 9} textAnchor="middle" fontSize="8" fontWeight="700" fill={INK}>!</text>
            </g>
          )}
        </g>
      ))}
      <path d="M192 86 C 206 66, 214 60, 224 56" fill="none" stroke={GREEN} strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M224 56 l7 0 -3 -6.5 z" fill={GREEN} />
      <rect x="146" y="138" width="128" height="20" fill={TINT} stroke={TINT_LINE} />
      <Label x={210} y={151} anchor="middle" tone={GREEN_TXT}>FLAGGED 6 WKS BEFORE RENEWAL</Label>
    </svg>
  );
}

/* 13 · revops — the handoff that holds */
function Revops() {
  const lanes = [
    { y: 44, t: "SDR" }, { y: 90, t: "AE" }, { y: 136, t: "CS" },
  ];
  return (
    <svg viewBox="0 0 320 180" className={F} aria-hidden="true">
      {lanes.map((l) => (
        <g key={l.t}>
          <Label x={36} y={l.y + 4}>{l.t}</Label>
          <path d={`M66 ${l.y} H 284`} stroke={LINE} strokeWidth="1" />
        </g>
      ))}
      {/* the deal moving down the lanes, context attached */}
      <rect x="80" y="32" width="58" height="22" fill={GREEN} />
      <text x="109" y="46.5" textAnchor="middle" fontSize="7.5" fontFamily={MONO} fill={INK}>DEAL #88</text>
      <path d="M138 43 C 168 43, 150 90, 168 90" fill="none" stroke={GREEN} strokeWidth="1.4" />
      <rect x="168" y="78" width="58" height="22" fill={GREEN} opacity="0.85" />
      <text x="197" y="92.5" textAnchor="middle" fontSize="7.5" fontFamily={MONO} fill={INK}>+ CONTEXT</text>
      <path d="M226 89 C 256 89, 238 136, 256 136" fill="none" stroke={GREEN} strokeWidth="1.4" />
      <rect x="256" y="124" width="34" height="22" fill={INK} />
      <path d="M266 135 l3 3 6-6" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Label x={160} y={168} anchor="middle">NOTHING FALLS BETWEEN THE LANES</Label>
    </svg>
  );
}

const SCENES: Record<string, () => React.ReactNode> = {
  "paid-media": PaidMedia,
  seo: Seo,
  content: Content,
  email: Email,
  cro: Cro,
  analytics: Analytics,
  "lead-generation": LeadGen,
  outbound: Outbound,
  inbound: Inbound,
  crm: Crm,
  enablement: Enablement,
  "account-management": Retention,
  revops: Revops,
};

export function CategoryVignette({ slug }: { slug: string }) {
  const Scene = SCENES[slug] ?? Inbound;
  return <Scene />;
}
