# Asset brief — what to create

## Why this exists

Every site we benchmarked against (the landdding.com gallery, Sept 2026) leads
each major section with a real image. Ours led every section with type and
1px-stroke SVG. That is the single biggest reason the site reads as a wireframe
rather than a finished design — not the colors, not the type, not the spacing.

The layout now reserves the exact space each image needs. Slots render as
labeled dashed plates until real files arrive; supply a `src` and the plate
becomes the image with no layout shift.

**The coded artwork stays.** `AgentConsole`, `CityVignette`, `CategoryVignette`,
`PipelineMockup` and the charts explain *systems* — a diagram is the right form
for those and it loads instantly. Photography goes where *humans and places*
belong. Every reference site mixes both; we were missing one half entirely.

## How to drop an asset in

1. Save to `public/media/<id>.webp` (WebP or AVIF, quality ~80).
2. Add `src="/media/<id>.webp"` and a real `alt` to that `MediaSlot`.
3. Nothing else changes — ratio, position and sizing are already set.

---

## Priority 1 — the four faces (homepage "Who this is for")

Four vertical portraits, **1200×1500 (4:5)**. These carry the whole "sells a
plumber and an executive" promise, which right now is only asserted in copy.

| ID | Subject | Direction |
|---|---|---|
| `W-01` | Home-service crew on a job | Real crew, real van, natural light. Mid-work, not posed. |
| `W-02` | Owner on the phone in a truck cab | The moment a lead comes in and nobody can answer it. |
| `W-03` | Ops lead at a desk, two screens | CRM visible but unreadable. Focus on the person. |
| `W-04` | Marketing lead presenting to a small group | A working meeting, not a boardroom. |

**Avoid:** stock handshakes, headset call-center shots, anyone pointing at a
laptop, glowing-blue "AI" imagery, robots. Those read as stock instantly and
would put us back where we started.

**Fastest route:** shoot two of these on a real job with a client's crew (get a
release), and use a paid library — Stocksy, Death to the Stock Photo, or Twenty20
— for the two office ones. Free libraries (Unsplash/Pexels) are recognizable and
will undercut the effect.

## Priority 2 — three client headshots (homepage "In their words")

**800×800 square**, `V-01` … `V-03`. Real person, plain background, eyes to
camera. These sit beside testimonial quotes that are **deliberately empty** —
the section says so on the page. Fill the quotes and the photos together or
leave the section out; do not fill one without the other.

This is also the audit's #1 conversion gap. A skeptical buyer on `/pricing`
currently sees a $25,000 number with zero evidence anyone has ever bought.

## Priority 3 — blog covers

**2100×900 (21:9)**, one per post, `B-<slug>`. One literal idea each — a phone
screen at 8pm, a whiteboard, a van, a dashboard. Not abstract gradients.

Three posts exist today:
- `B-speed-to-lead-is-the-whole-game`
- `B-what-agentic-actually-means`
- `B-your-crm-is-lying-to-you`

## Priority 4 — the explainer video (`V-MAIN`)

**1920×1080, 60–90 seconds.** A screen recording of one missed call handled end
to end — text back, questions answered, slot offered, booked, written to the
CRM. Voiceover in plain English, **captions burned in** (the section promises
"no sound needed"). No slides, no stock b-roll, no music bed over narration.

Drop the file in `public/media/` and pass `src` to `<VideoSection>`; it becomes
a real player with controls, no autoplay. A `poster` frame is worth supplying —
it is what people see before pressing play.

## Priority 5 — the guide (`G-01`)

Two pieces: the **PDF itself** and a **1200×1600 portrait cover** rendered as it
will look as a thumbnail (title in Geist 600, black on white, AB mark
bottom-left). The section already lists what the guide promises to contain:

- What an agent actually is, without the hype
- The five jobs worth automating first
- What it costs to run, honestly
- Questions to ask any vendor before you sign
- How to tell a real agent from a chatbot

Write those five sections and the guide exists. **Note:** the form captures the
email but nothing yet delivers the file — wire the PDF into the Resend template
in `src/lib/notify.ts`, or the promise on that button breaks.

## Priority 6 — logo wall

Six to eight client or integration marks, **SVG, monochrome**, for a strip under
the hero. Integration logos (HubSpot, Salesforce, Twilio, Google Ads) are honest
today and already named in `StackStrip` as text — real marks would lift that
section immediately. Client logos need permission first.

---

## Two things that are not images

**1. Real numbers.** ProofBar, the pricing tiers and the category StatBands are
all labeled illustrative because they are invented. Verified figures from the
first client would let those labels come off, and that changes the page more
than any photograph.

**2. A named human on `/about` and `/contact`.** Both pages currently name no
one. A founder photo, a name, and one paragraph of history closes more of the
trust gap than the entire asset list above.
