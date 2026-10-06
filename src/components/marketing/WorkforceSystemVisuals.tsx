import {
  ArrowDown,
  Bot,
  Check,
  ClipboardCheck,
  FileCheck2,
  Inbox,
  Layers3,
  MessageSquareText,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const HERO_STEPS = [
  { label: "Receive", detail: "Enquiry captured", icon: Inbox },
  { label: "Prepare", detail: "Context assembled", icon: Bot },
  { label: "Approve", detail: "Person reviews", icon: ShieldCheck },
  { label: "Record", detail: "Activity logged", icon: ClipboardCheck },
] as const;

const COVERAGE_LANES = [
  {
    label: "Residential",
    detail: "Service enquiry",
    icon: Wrench,
    stages: ["Qualify", "Schedule", "Follow up"],
  },
  {
    label: "Commercial",
    detail: "Project opportunity",
    icon: Layers3,
    stages: ["Research", "Prepare", "Track"],
  },
] as const;

export function HeroSystemVisual() {
  return (
    <figure className="system-visual hero-system-visual" aria-labelledby="hero-system-title">
      <figcaption className="system-visual-head">
        <span id="hero-system-title">Illustrative BOT workflow</span>
        <span className="system-ready"><i aria-hidden="true" /> System ready</span>
      </figcaption>
      <div className="hero-system-body">
        <div className="system-intake">
          <span className="system-icon"><MessageSquareText size={18} /></span>
          <div>
            <p>New service enquiry</p>
            <span>Website · details received</span>
          </div>
          <span className="system-intake-state">Captured</span>
        </div>

        <div className="system-route" aria-label="Receive, prepare, approve and record">
          {HERO_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="system-route-step" key={step.label}>
                <div className="system-route-node">
                  <span><Icon size={19} /></span>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
                {index < HERO_STEPS.length - 1 && (
                  <div className="system-route-link" aria-hidden="true">
                    <i style={{ animationDelay: index * 0.55 + "s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="system-review">
          <div className="system-review-copy">
            <span className="system-icon is-dark"><FileCheck2 size={18} /></span>
            <div>
              <p>Proposed next step</p>
              <span>Prepared for a person to review</span>
            </div>
          </div>
          <div className="system-review-actions" aria-hidden="true">
            <span>Revise</span>
            <strong><Check size={14} /> Approve</strong>
          </div>
        </div>

        <div className="system-visual-note">
          <ShieldCheck size={15} />
          External actions wait for approval
        </div>
      </div>
    </figure>
  );
}

export function CoverageSystemVisual() {
  return (
    <figure className="system-visual coverage-system-visual" aria-labelledby="coverage-system-title">
      <figcaption className="system-visual-head">
        <span id="coverage-system-title">One operating layer</span>
        <span>Illustrative interface</span>
      </figcaption>
      <div className="coverage-system-body">
        <div className="coverage-source">
          <span className="system-icon is-dark"><Search size={18} /></span>
          <div>
            <p>Opportunity enters</p>
            <span>Context travels with the work</span>
          </div>
        </div>
        <ArrowDown className="coverage-arrow" size={18} aria-hidden="true" />
        <div className="coverage-lanes">
          {COVERAGE_LANES.map((lane, laneIndex) => {
            const Icon = lane.icon;
            return (
              <div className="coverage-lane" key={lane.label}>
                <div className="coverage-lane-label">
                  <span><Icon size={17} /></span>
                  <div><strong>{lane.label}</strong><small>{lane.detail}</small></div>
                </div>
                <div className="coverage-track">
                  {lane.stages.map((stage, index) => (
                    <div className="coverage-stage" key={stage}>
                      <span>{stage}</span>
                      {index < lane.stages.length - 1 && (
                        <i className="coverage-link" aria-hidden="true">
                          <b style={{ animationDelay: laneIndex * 0.8 + index * 0.5 + "s" }} />
                        </i>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="coverage-ledger">
          <ClipboardCheck size={17} />
          <div><p>BOT ACTIVITY</p><span>Decisions and next steps stay reviewable</span></div>
          <span className="coverage-ledger-state"><i aria-hidden="true" /> Recording</span>
        </div>
      </div>
    </figure>
  );
}
