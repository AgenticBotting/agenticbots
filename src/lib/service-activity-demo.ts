/** Fictional display data only. Never a forecast, client result or runtime feed. */
export type ServiceActivityDemo = {
  demo: true;
  metric: string;
  unit: string;
  source: string;
  values: number[];
};

export const SERVICE_ACTIVITY_DEMOS: Record<string, ServiceActivityDemo> = {
  "paid-media": { demo: true, metric: "Search terms reviewed", unit: "search terms", source: "Campaign activity", values: [18, 26, 21, 38, 31, 45, 34, 52, 40, 36, 48, 43] },
  seo: { demo: true, metric: "Pages checked", unit: "pages", source: "Site & search data", values: [12, 20, 16, 28, 22, 32, 24, 19, 30, 26, 36, 29] },
  content: { demo: true, metric: "Source materials reviewed", unit: "source materials", source: "Approved expertise", values: [3, 5, 4, 8, 6, 4, 7, 9, 5, 8, 6, 7] },
  email: { demo: true, metric: "Audience records checked", unit: "records", source: "Audience & consent", values: [24, 38, 31, 46, 34, 52, 43, 36, 48, 41, 55, 47] },
  cro: { demo: true, metric: "Conversion paths reviewed", unit: "paths", source: "Pages & form events", values: [2, 4, 3, 6, 4, 7, 5, 4, 8, 6, 5, 7] },
  analytics: { demo: true, metric: "Source records reviewed", unit: "records", source: "CRM & marketing data", values: [32, 48, 39, 62, 51, 73, 58, 66, 49, 78, 64, 71] },
  "lead-generation": { demo: true, metric: "Accounts researched", unit: "accounts", source: "Approved market & ICP", values: [6, 11, 8, 16, 12, 19, 14, 10, 18, 15, 22, 17] },
  outbound: { demo: true, metric: "Outreach contexts reviewed", unit: "contexts", source: "Approved account research", values: [8, 13, 10, 18, 14, 22, 16, 12, 20, 15, 24, 19] },
  inbound: { demo: true, metric: "Enquiries reviewed", unit: "enquiries", source: "Inbound service requests", values: [4, 7, 5, 11, 8, 6, 10, 13, 9, 7, 12, 10] },
  crm: { demo: true, metric: "CRM records checked", unit: "records", source: "Contacts & opportunities", values: [20, 35, 27, 44, 32, 51, 39, 30, 46, 37, 55, 43] },
  enablement: { demo: true, metric: "Proposal inputs reviewed", unit: "inputs", source: "Project notes & price books", values: [3, 6, 4, 9, 7, 5, 8, 11, 6, 9, 7, 10] },
  reviews: { demo: true, metric: "Feedback items reviewed", unit: "feedback items", source: "Completed service & feedback", values: [2, 5, 3, 7, 4, 8, 6, 4, 9, 5, 7, 6] },
  reactivation: { demo: true, metric: "Customer histories reviewed", unit: "histories", source: "Service history & eligibility", values: [14, 22, 18, 31, 25, 36, 28, 21, 34, 26, 40, 32] },
};

export function getServiceActivityDemo(slug: string): ServiceActivityDemo {
  const demo = SERVICE_ACTIVITY_DEMOS[slug];
  if (!demo) throw new Error(`Missing activity demonstration: ${slug}`);
  return demo;
}
