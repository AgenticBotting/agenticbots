import type { CSSProperties } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siGmail,
  siGoogle,
  siGoogleads,
  siGoogleanalytics,
  siGooglecalendar,
  siGoogledrive,
  siHotjar,
  siHubspot,
  siLooker,
  siMailchimp,
  siMeta,
  siNotion,
  siSemrush,
  siWebflow,
  siWordpress,
  siYelp,
  siYoutube,
  siZoho,
} from "simple-icons";
import { Bot, Check, LockKeyhole, Workflow } from "lucide-react";

import { getServicePlatforms, type PlatformId } from "@/config/service-platforms";

const BRAND_ICONS: Partial<Record<PlatformId, SimpleIcon>> = {
  facebook: siFacebook,
  gmail: siGmail,
  "google-ads": siGoogleads,
  "google-analytics": siGoogleanalytics,
  "google-business": siGoogle,
  "google-calendar": siGooglecalendar,
  "google-drive": siGoogledrive,
  hotjar: siHotjar,
  hubspot: siHubspot,
  looker: siLooker,
  mailchimp: siMailchimp,
  meta: siMeta,
  notion: siNotion,
  semrush: siSemrush,
  webflow: siWebflow,
  wordpress: siWordpress,
  yelp: siYelp,
  youtube: siYoutube,
  zoho: siZoho,
};

function PlatformMark({ id, mark }: { id: PlatformId; mark: string }) {
  const icon = BRAND_ICONS[id];
  if (!icon) return <span className="platform-node-letter">{mark}</span>;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

export function ServicePlatformConstellation({
  slug,
  serviceName,
}: {
  slug?: string;
  serviceName: string;
}) {
  const platforms = getServicePlatforms(slug);

  return (
    <section className="platform-constellation" aria-label={`Common systems considered for ${serviceName}`}>
      <div className="platform-constellation-head">
        <div>
          <p className="mono">System landscape</p>
          <h2>Designed around the stack you already own.</h2>
        </div>
        <span><span className="platform-live-dot" /> scoping reference</span>
      </div>

      <div className="platform-map">
        <svg className="platform-map-lines" viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M90 54 C190 54 202 128 320 150" />
          <path d="M90 150 H320" />
          <path d="M90 246 C190 246 202 172 320 150" />
          <path d="M550 54 C450 54 438 128 320 150" />
          <path d="M550 150 H320" />
          <path d="M550 246 C450 246 438 172 320 150" />
        </svg>

        <div className="platform-core">
          <span className="platform-core-icon"><Bot /></span>
          <p>Managed BOT workflow</p>
          <strong>{serviceName}</strong>
          <span className="platform-core-status"><LockKeyhole /> authority policy active</span>
        </div>

        {platforms.map((platform, index) => (
          <div
            key={platform.id}
            className={`platform-node platform-node-${index + 1}`}
            style={{ "--platform-delay": `${index * 140}ms` } as CSSProperties}
          >
            <span className="platform-node-mark"><PlatformMark id={platform.id} mark={platform.mark} /></span>
            <span className="platform-node-name">{platform.name}</span>
            <Check className="platform-node-check" />
          </div>
        ))}
      </div>

      <div className="platform-constellation-foot">
        <span><Workflow /> Common systems in scope</span>
        <p>Exact access, connection method and write authority are confirmed during the workflow audit.</p>
      </div>
    </section>
  );
}
