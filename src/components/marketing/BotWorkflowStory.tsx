"use client";

import { useEffect, useReducer, useRef } from "react";
import { ArrowRight, CalendarDays, Check, CheckCheck, ClipboardCheck, FileText, MessageSquare, PhoneMissed, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { INITIAL_WORKFLOW_EXAMPLE, WORKFLOW_EXAMPLE, workflowExampleReducer, type WorkflowStep } from "@/lib/marketing/workflow-example";

const CHAPTERS = [
  { name: "Receive", title: "A new enquiry. A clear next step.", copy: "A missed call or form starts a workflow. The BOT brings the details together so your team can act without hunting through inboxes.", icon: PhoneMissed },
  { name: "Prepare", title: "The context travels with the work.", copy: "Service area, the customer's request and your process shape the proposed response. The next BOT picks up the context instead of starting over.", icon: MessageSquare },
  { name: "Approve", title: "The important decisions stay yours.", copy: "The proposed reply and appointment wait for approval. Your team reviews what will happen before anything is sent or written to a connected system.", icon: ShieldCheck },
  { name: "Record", title: "You can see what happened.", copy: "The workflow records the decision and next steps in BOT ACTIVITY. You get a clear account of the work, including what is still waiting on a person.", icon: ClipboardCheck },
] as const;

/** A fictional, local-only walkthrough. No account connections or external actions. */
export function BotWorkflowStory() {
  const [{ active, approved, manual }, dispatch] = useReducer(workflowExampleReducer, INITIAL_WORKFLOW_EXAMPLE);
  const chapterRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    function observe() {
      observer?.disconnect();
      if (!desktop.matches || reduced.matches) return;
      observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) dispatch({ type: "select", step: Number((visible.target as HTMLElement).dataset.chapter) as WorkflowStep, source: "scroll" });
      }, { rootMargin: "-28% 0px -38% 0px", threshold: [0, 0.2, 0.5] });
      chapterRefs.current.forEach((element) => { if (element) observer?.observe(element); });
    }
    function resumeScroll() { dispatch({ type: "resume" }); }
    function onScrollKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) resumeScroll();
    }
    observe();
    // Only deliberate scrolling resumes the narrative. Focus or browser auto-scroll
    // must not overwrite a visitor's chosen step while they review its controls.
    window.addEventListener("wheel", resumeScroll, { passive: true });
    window.addEventListener("touchstart", resumeScroll, { passive: true });
    window.addEventListener("keydown", onScrollKey);
    desktop.addEventListener("change", observe);
    reduced.addEventListener("change", observe);
    return () => { observer?.disconnect(); window.removeEventListener("wheel", resumeScroll); window.removeEventListener("touchstart", resumeScroll); window.removeEventListener("keydown", onScrollKey); desktop.removeEventListener("change", observe); reduced.removeEventListener("change", observe); };
  }, []);

  function select(index: number) {
    dispatch({ type: "select", step: index as WorkflowStep, source: "manual" });
    track("workflow_step_viewed", { step: CHAPTERS[index].name });
  }

  return (
    <section id="demo" className="workforce-story section-pad">
      <Container>
        <div className="story-heading">
          <div><p className="eyebrow mb-4">One workflow. Connected BOTS.</p><h2 className="display-xl max-w-[20ch]">Watch the work<br />move forward.</h2></div>
          <p className="body-lg max-w-[43ch]">From the first enquiry to an approved next step. Each BOT has a role. Your business has the control.</p>
        </div>
        <div className="story-layout">
          <ol className="story-chapters">
            {CHAPTERS.map((chapter, index) => <li key={chapter.name} data-chapter={index} ref={(element) => { chapterRefs.current[index] = element; }} className={cn("story-chapter", active === index && "is-active")}>
              <span className="story-chapter-number">0{index + 1}</span>
              <div><h3 className="display-lg">{chapter.title}</h3><p className="body-base mt-4 max-w-[39ch]">{chapter.copy}</p></div>
            </li>)}
          </ol>
          <div className="story-stage">
            <div className="workflow-controls" role="group" aria-label="Explore the example workflow">
              {CHAPTERS.map((chapter, index) => <button key={chapter.name} type="button" aria-pressed={active === index} onClick={() => select(index)}><span>0{index + 1}</span>{chapter.name}</button>)}
            </div>
            <div className="workflow-display" aria-live={manual ? "polite" : "off"} aria-atomic="true">
              <div className="workflow-topline"><span>{WORKFLOW_EXAMPLE.title}</span><span className="workflow-state">{active < 2 ? "Preparing" : approved ? "Example approved" : "Awaiting approval"}</span></div>
              <div className="workflow-route" aria-hidden="true">{CHAPTERS.map((chapter, index) => { const Icon = chapter.icon; return <div key={chapter.name} className={cn("workflow-node", index <= active && "reached", index === active && "current")}><Icon size={19} /><span>{chapter.name}</span></div>; })}</div>
              <div className="workflow-scene" key={`${active}-${approved}`}>
                {active === 0 && <><p className="workflow-caption">INBOUND ENQUIRY</p><div className="workflow-customer"><PhoneMissed size={24} /><div><p className="display-md">A customer needs roof repair.</p><p className="body-sm mt-2">Missed call · fictional example</p></div></div><div className="workflow-fact"><span>Request</span><strong>Leak above the garage</strong></div><div className="workflow-fact"><span>Next step</span><strong>Prepare a response for review</strong></div><p className="workflow-footer-note"><FileText size={15} /> Context added to the workflow</p></>}
                {active === 1 && <><p className="workflow-caption">RESPONSE DRAFT</p><div className="workflow-message">“Thanks for getting in touch. We can help with a roof inspection. What is the property address, and when would suit you?”</div><p className="body-sm mt-4">A proposed reply, using the business&apos;s service and scheduling rules.</p><div className="workflow-checklist"><span><Check size={15} /> Service request identified</span><span><Check size={15} /> Pricing left for the estimator</span><span><ShieldCheck size={15} /> Draft only · nothing sent</span></div></>}
                {active === 2 && <><p className="workflow-caption">HUMAN APPROVAL</p><div className="workflow-approval-title"><CalendarDays size={25} /><h3 className="display-lg">Review the proposed next step.</h3></div><div className="workflow-fact"><span>Appointment</span><strong>Roof inspection · Thursday morning</strong></div><div className="workflow-fact"><span>Action</span><strong>Confirm with customer and update CRM</strong></div><p className="body-sm mt-4">{approved ? "The example decision is recorded. No real message or booking was created." : "The workflow waits here. A BOT cannot approve its own action."}</p><button type="button" className="btn btn-primary mt-6" disabled={approved} onClick={() => { dispatch({ type: "approve" }); track("workflow_example_approved", {}); }}>{approved ? <><CheckCheck size={17} /> Example approved</> : <>Approve this example <ArrowRight size={17} /></>}</button></>}
                {active === 3 && <><p className="workflow-caption">BOT ACTIVITY</p><h3 className="display-lg">A clear record of the work.</h3><ul className="workflow-activity"><li><Check size={16} /><span>Enquiry received and context prepared</span></li><li><Check size={16} /><span>Response and appointment drafted</span></li><li>{approved ? <Check size={16} /> : <ShieldCheck size={16} />}<span>{approved ? "Human approval recorded in this example" : "Waiting for human approval · no external action"}</span></li><li><FileText size={16} /><span>{approved ? "Approved next steps ready for execution" : "Proposed next steps retained for review"}</span></li></ul>{!approved && <button type="button" className="btn btn-outline mt-4" onClick={() => select(2)}>Review the example <ArrowRight size={16} /></button>}</>}
              </div>
              <div className="workflow-bottomline"><span>Illustrative workflow · fictional account</span><button type="button" onClick={() => { dispatch({ type: "reset" }); }}>Reset example</button></div>
            </div>
            <p className="body-xs mt-4">Explore the steps above. This demonstration creates no messages, bookings or CRM changes.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
