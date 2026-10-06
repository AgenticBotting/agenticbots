import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui";

type TransitionRow = {
  title: string;
  today: string;
  after: string;
};

export function OperatingTransition({
  botName,
  rows,
}: {
  botName: string;
  rows: TransitionRow[];
}) {
  return (
    <section className="service-transition on-dark">
      <Container>
        <div className="service-transition-layout">
          <div className="service-transition-heading">
            <p className="eyebrow">Operating transition</p>
            <h2 className="display-xl text-balance">
              From fragmented execution to <span className="em-green">a controlled workflow.</span>
            </h2>
            <p className="body-lg">
              {botName} replaces disconnected handoffs with one defined operating path, visible decisions and a reviewable record.
            </p>
          </div>

          <ol className="service-transition-rows">
            {rows.map((row, index) => (
              <li key={`${row.title}-${index}`}>
                <div className="service-transition-title">
                  <span>0{index + 1}</span>
                  <strong>{row.title}</strong>
                </div>
                <div className="service-transition-state is-current">
                  <span>Current state</span>
                  <p>{row.today}</p>
                </div>
                <ArrowRight className="service-transition-arrow" aria-hidden="true" />
                <div className="service-transition-state is-managed">
                  <span>Managed state</span>
                  <p>{row.after}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
