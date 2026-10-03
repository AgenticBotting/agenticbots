import { ServiceArea } from "./ProductUI";

/** The city graphic: the real neighborhoods covered, as a plain list. */
export function CityVignette({ name, stateAbbr, labels }: { name: string; stateAbbr: string; labels: string[] }) {
  return <ServiceArea city={name} stateAbbr={stateAbbr} areas={labels.slice(0, 8)} />;
}
