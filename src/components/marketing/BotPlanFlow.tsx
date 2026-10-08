"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Layers3, Loader2, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui";
import { BOT_PLAN_EVENT } from "@/lib/lead-flow";
import { track } from "@/lib/analytics";
import { MARKETING_CONTACT } from "@/config/marketing-contact";
import { PROPOSAL_CHOICES as choices, emptyProposal, proposalFit, proposalStepReady, toggleProposalTool, type ProposalDraft } from "@/lib/proposal-intake";
import { readLandingPath } from "./AcquisitionAttribution";
import "./proposal-intake.css";

const STEPS = ["Priorities", "Your team", "Your tools", "Investment", "Timing", "Review & send"];
const HEADINGS = ["What would you like to improve?", "Who will the BOTS work alongside?", "Which tools do you use today?", "Let’s align on the investment.", "When would you like to get started?", "Your next chapter starts here."];
const NOTES = ["Choose up to three priorities. We’ll use these to focus the proposal.", "Help us understand your capacity and who currently handles the work.", "Select all that apply. No logins or account access needed.", "A clear budget helps us recommend a scope that makes sense for both sides.", "Your preferred timing helps us plan. Launch dates are confirmed after scoping.", "Review your brief and tell us where to follow up. No payment is required."];
const CONTACT = { name: "", email: "", company: "", website: "", phone: "" };

/** One site-wide intake. Native modal provides focus containment and an inert background. */
export function BotPlanFlow() {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const sending = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ProposalDraft>(emptyProposal);
  const [contact, setContact] = useState(CONTACT);
  const [consent, setConsent] = useState(false);
  const [context, setContext] = useState({ source: "site", focus: "", pagePath: "/" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const submitted = state === "done";

  useEffect(() => {
    function begin(event: Event) {
      const detail = (event as CustomEvent<{ source?: string; focus?: string }>).detail;
      opener.current = document.activeElement as HTMLElement | null;
      setContext({ source: (detail?.source ?? "site").slice(0, 80), focus: (detail?.focus ?? "").slice(0, 120), pagePath: window.location.pathname });
      setOpen(true);
      // An unfinished brief survives closing/reopening in this tab, never browser storage.
      track("proposal_opened");
    }
    window.addEventListener(BOT_PLAN_EVENT, begin);
    return () => window.removeEventListener(BOT_PLAN_EVENT, begin);
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previous = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    title.current?.focus();
    return () => {
      node.close();
      document.body.style.overflow = previous;
      if (opener.current?.isConnected) opener.current.focus();
      else document.querySelector<HTMLElement>('.site-header-actions [data-proposal-entry]')?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      title.current?.focus();
      dialog.current?.querySelector(".pi-main")?.scrollTo({ top: 0 });
    }
  }, [step, open, submitted]);

  function close() { if (!sending.current) setOpen(false); }
  function update<K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) { setAnswers(previous => ({ ...previous, [key]: value })); }
  function next() {
    if (!proposalStepReady(step, answers)) return;
    track("proposal_step_completed", { step: step + 1 });
    setStep(step + 1);
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !consent || !proposalStepReady(5, answers)) return;
    sending.current = true;
    setState("sending"); setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ kind: "proposal", ...contact, ...context, qualification: answers, consent, landingPath: readLandingPath() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "We couldn’t send your request. Your answers are still here—please try again."); setState("error"); return; }
      setState("done");
      track("proposal_completed");
    } catch {
      setError("Connection interrupted. Your answers are still here—please try again."); setState("error");
    } finally { window.clearTimeout(timeout); sending.current = false; }
  }
  function reset() { setAnswers(emptyProposal()); setContact(CONTACT); setConsent(false); setStep(0); setState("idle"); setError(""); }
  const belowMinimum = proposalFit(answers) === "below_current_minimum";

  // Keep the full-screen questionnaire out of every public page's initial HTML.
  if (!open) return null;

  return <dialog ref={dialog} className="pi-dialog" aria-labelledby="proposal-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="pi-top"><Logo href={null} variant="dark" height={24} className="pi-logo" /><span className="pi-top-caption">Request a proposal</span><button type="button" className="pi-close" onClick={close} disabled={state === "sending"} aria-label="Close proposal"><X size={22} /></button></div>
    <div className="pi-layout">
      <aside className="pi-side">
        <p className="pi-kicker">Built around your business</p><h2>A clearer path<br />to what’s next.</h2><p>Your priorities. Your tools.<br />A focused BOT implementation.</p>
        <ol aria-label="Proposal progress">{STEPS.map((label, index) => <li key={label} aria-current={index === step && state !== "done" ? "step" : undefined} data-complete={index < step || state === "done"}><span>{index < step || state === "done" ? <Check size={15} /> : `0${index + 1}`}</span>{label}</li>)}</ol>
        <div className="pi-side-bottom"><Layers3 size={20} /><p>Implementation starts at <strong>$7,500 setup + $2,500/month.</strong> Scope and pricing agreed before work begins.</p><a href={MARKETING_CONTACT.phoneHref}><Phone size={16} />Prefer to talk? {MARKETING_CONTACT.phone}</a></div>
      </aside>
      <main className="pi-main">
        <div className="pi-content">
          <div className="pi-progress"><span>{state === "done" ? "Request received" : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}</span><span>{state === "done" ? "Complete" : "No payment required"}</span></div>
          <div className="pi-progress-track" aria-hidden="true"><i style={{ transform: `scaleX(${state === "done" ? 1 : (step + 1) / STEPS.length})` }} /></div>
          <h2 ref={title} tabIndex={-1} id="proposal-title">{state === "done" ? "Your brief is with our team." : HEADINGS[step]}</h2>
          <p className="pi-intro">{state === "done" ? "We’ll review your priorities, tools and investment range, then follow up by email about fit and the next step. No work starts without an agreed scope." : NOTES[step]}</p>
          {state === "done" ? <div className="pi-success"><CheckCheck size={34} /><h3>Proposal request received.</h3><p>This is a request for review, not a confirmed project or automated quote.</p><button className="btn btn-primary" type="button" onClick={close}>Return to the site<ArrowRight size={17} /></button><button className="pi-quiet" type="button" onClick={reset}>Start a different request</button></div> : <>
            {step === 0 && <>
              <Choices label="Your priorities" values={choices.goals} selected={answers.goals} multi max={3} onPick={value => update("goals", answers.goals.includes(value) ? answers.goals.filter(item => item !== value) : [...answers.goals, value])} />
              <Choices label="Who are your customers?" values={choices.customerType} selected={answers.customerType} onPick={value => update("customerType", value)} />
            </>}
            {step === 1 && <>
              <Choices label="How large is your team?" values={choices.teamSize} selected={answers.teamSize} onPick={value => update("teamSize", value)} />
              <Choices label="Who handles marketing and sales today?" values={choices.teamModel} selected={answers.teamModel} onPick={value => update("teamModel", value)} />
              <Choices label="Approximate annual revenue" values={choices.revenue} selected={answers.revenue} onPick={value => update("revenue", value)} />
            </>}
            {step === 2 && <>
              <Choices label="Your current systems" values={choices.tools} selected={answers.tools} multi dense onPick={value => update("tools", toggleProposalTool(answers.tools, value))} />
              {answers.tools.includes("Other tools") && <label className="pi-field">Other tools <small>(optional)</small><input className="field" value={answers.otherTools} maxLength={160} onChange={event => update("otherTools", event.target.value)} placeholder="Names only—no passwords or account details" /></label>}
              <p className="pi-note">Tool selection helps us scope the work. Available integrations and permissions are confirmed before implementation.</p>
            </>}
            {step === 3 && <>
              <div className="pi-investment"><strong>Managed implementation, not a software subscription.</strong><p>Projects start at $7,500 setup + $2,500/month. Ad spend and third-party usage are separate.</p></div>
              <Choices label="One-time implementation budget" values={choices.setupBudget} selected={answers.setupBudget} onPick={value => update("setupBudget", value)} />
              <Choices label="Ongoing monthly management budget" values={choices.monthlyBudget} selected={answers.monthlyBudget} onPick={value => update("monthlyBudget", value)} />
              {belowMinimum && <div className="pi-fit-note" role="status"><strong>Our current starting point may exceed your budget.</strong><p>You can still request a fit review, or explore <Link href="/blog" onClick={close}>our resources</Link> first. We’ll be clear if a managed implementation is premature.</p></div>}
            </>}
            {step === 4 && <>
              <Choices label="Preferred implementation timeline" values={choices.timeline} selected={answers.timeline} onPick={value => update("timeline", value)} />
              <Choices label="Your role in the decision" values={choices.role} selected={answers.role} onPick={value => update("role", value)} />
            </>}
            {step === 5 && <form onSubmit={submit}>
              <details className="pi-review"><summary>Review your answers <span>{answers.goals.length} priorities · {answers.tools.length} tool selections</span></summary>
                {[
                  ["Priorities", `${answers.goals.join(", ")} · ${answers.customerType}`],
                  ["Team", `${answers.teamSize} · ${answers.teamModel} · ${answers.revenue} annual revenue`],
                  ["Tools", [answers.tools.join(", "), answers.otherTools].filter(Boolean).join(" · ")],
                  ["Investment", `${answers.setupBudget} setup · ${answers.monthlyBudget}`],
                  ["Timing", `${answers.timeline} · ${answers.role}`],
                ].map(([label, value], index) => <div key={label}><span><strong>{label}</strong><p>{value}</p></span><button type="button" onClick={() => setStep(index)} aria-label={`Edit ${label.toLowerCase()}`}>Edit</button></div>)}
              </details>
              <div className="pi-fields">{([
                ["name", "Your name", "name", "text", true, 120], ["email", "Work email", "email", "email", true, 200],
                ["company", "Company name", "organization", "text", true, 160], ["website", "Company website", "url", "text", false, 200],
                ["phone", "Phone number", "tel", "tel", false, 40],
              ] as const).map(([key, label, autoComplete, type, required, maxLength]) => <label className="pi-field" key={key}>{label} {!required && <small>(optional)</small>}<input className="field" name={key} autoComplete={autoComplete} type={type} required={required} minLength={required ? 2 : undefined} maxLength={maxLength} value={contact[key]} onChange={event => setContact(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>
              <label className="pi-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>AgenticBots may contact me about this request. I’ve read the <a href="/privacy" target="_blank" rel="noreferrer">privacy policy</a>.</span></label>
              {state === "error" && <p className="pi-error" role="alert">{error} You can also <a href={MARKETING_CONTACT.emailHref}>email us</a>.</p>}
              <div className="pi-actions"><button type="button" className="pi-back" onClick={() => setStep(4)} disabled={state === "sending"}><ArrowLeft size={17} />Back</button><button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? <><Loader2 size={17} className="animate-spin" />Sending request…</> : <>{belowMinimum ? "Request a fit review" : "Request my proposal"}<ArrowRight size={17} /></>}</button></div>
              <p className="pi-note">No payment. No obligation. Your request is reviewed before a project is proposed.</p>
            </form>}
            {step < 5 && <div className="pi-actions"><button className="pi-back" type="button" onClick={() => step ? setStep(step - 1) : close()}><ArrowLeft size={17} />{step ? "Back" : "Back to site"}</button><button className="btn btn-primary" type="button" disabled={!proposalStepReady(step, answers)} onClick={next}>{step === 4 ? "Review & finish" : "Continue"}<ArrowRight size={17} /></button></div>}
          </>}
        </div>
      </main>
    </div>
  </dialog>;
}

function Choices<T extends string>({ label, values, selected, multi = false, max, dense = false, onPick }: {
  label: string; values: readonly T[]; selected?: T | T[]; multi?: boolean; max?: number; dense?: boolean; onPick: (value: T) => void;
}) {
  const picked = Array.isArray(selected) ? selected : selected ? [selected] : [];
  return <fieldset className={`pi-choices ${dense ? "pi-choices-dense" : ""}`}><legend>{label}{multi && <small>{max ? `Choose up to ${max}` : "Select all that apply"}</small>}</legend><div>{values.map(value => <label key={value} data-selected={picked.includes(value)}><input type={multi ? "checkbox" : "radio"} name={label} value={value} checked={picked.includes(value)} disabled={!!max && picked.length >= max && !picked.includes(value)} onChange={() => onPick(value)} /><span>{value}</span></label>)}</div></fieldset>;
}
