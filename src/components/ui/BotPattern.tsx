import { BOT_PATH } from "./BotFace";
import { cn } from "@/lib/utils";

/**
 * The bot field for dark sections — drawn as SVG, not a raster.
 *
 * A scaled-up bitmap went soft at cover sizes; this stays crisp at any
 * width, recolours from tokens, and costs a couple of KB instead of 12.
 *
 * The scatter is a fixed constant (jittered grid, seeded once and inlined)
 * so server and client render identically and nothing clumps.
 */

type Mark = { x: number; y: number; w: number; r: number; s: 0 | 1 | 2 };

/** s: 0 = dim · 1 = mid · 2 = awake */
const MARKS: Mark[] = [
  { x: 479.8, y: 31.5, w: 73.4, r: 7.2, s: 0 },
  { x: 334.6, y: 38.7, w: 70.9, r: 7.3, s: 0 },
  { x: 882.2, y: 71.2, w: 82.7, r: 5.6, s: 0 },
  { x: 1540.3, y: 79.7, w: 76.9, r: 7.0, s: 0 },
  { x: 1557.8, y: 162.8, w: 64.6, r: -0.7, s: 0 },
  { x: 75.1, y: 163.9, w: 87.2, r: 1.3, s: 0 },
  { x: 1419.3, y: 183.3, w: 79.6, r: -0.4, s: 0 },
  { x: 370.9, y: 197.9, w: 87.6, r: -2.5, s: 0 },
  { x: 1282.7, y: 206.2, w: 68.6, r: 2.9, s: 0 },
  { x: 170.4, y: 215.9, w: 76.5, r: -2.8, s: 0 },
  { x: 1265.8, y: 287.4, w: 74.0, r: 0.6, s: 0 },
  { x: 347.9, y: 296.0, w: 89.7, r: -5.9, s: 0 },
  { x: 743.3, y: 325.3, w: 99.2, r: -0.3, s: 0 },
  { x: 54.9, y: 329.2, w: 86.1, r: -1.9, s: 0 },
  { x: 1544.9, y: 332.6, w: 95.9, r: -2.6, s: 0 },
  { x: 630.4, y: 339.8, w: 65.3, r: -2.1, s: 0 },
  { x: 868.1, y: 349.1, w: 71.8, r: -2.5, s: 0 },
  { x: 358.1, y: 423.7, w: 72.1, r: 3.8, s: 0 },
  { x: 1282.4, y: 431.9, w: 93.6, r: -3.9, s: 0 },
  { x: 208.1, y: 442.2, w: 97.5, r: -1.2, s: 0 },
  { x: 503.1, y: 462.9, w: 91.4, r: 0.1, s: 0 },
  { x: 37.7, y: 475.7, w: 95.4, r: -5.0, s: 0 },
  { x: 700.7, y: 481.4, w: 83.2, r: -7.1, s: 0 },
  { x: 1533.9, y: 548.6, w: 79.3, r: 6.4, s: 0 },
  { x: 1253.8, y: 549.5, w: 77.1, r: -6.5, s: 0 },
  { x: 81.6, y: 558.1, w: 98.3, r: 0.2, s: 0 },
  { x: 450.7, y: 564.4, w: 99.1, r: -6.8, s: 0 },
  { x: 693.6, y: 565.7, w: 103.1, r: 2.0, s: 0 },
  { x: 189.9, y: 582.2, w: 72.1, r: 2.6, s: 0 },
  { x: 1370.2, y: 599.1, w: 83.4, r: 4.4, s: 0 },
  { x: 1007.5, y: 602.4, w: 77.9, r: 0.5, s: 0 },
  { x: 339.9, y: 612.2, w: 62.5, r: -3.0, s: 0 },
  { x: 736.0, y: 685.9, w: 91.4, r: 2.9, s: 0 },
  { x: 892.9, y: 700.7, w: 80.7, r: -1.8, s: 0 },
  { x: 364.0, y: 701.5, w: 89.9, r: -4.7, s: 0 },
  { x: 232.0, y: 704.8, w: 94.0, r: -5.4, s: 0 },
  { x: 1301.6, y: 725.2, w: 63.5, r: 4.0, s: 0 },
  { x: 64.5, y: 727.7, w: 72.7, r: 5.7, s: 0 },
  { x: 1556.5, y: 735.8, w: 79.4, r: 1.0, s: 0 },
  { x: 41.3, y: 804.8, w: 86.3, r: -2.9, s: 0 },
  { x: 993.1, y: 811.4, w: 101.3, r: 5.7, s: 0 },
  { x: 595.4, y: 815.0, w: 102.6, r: -3.6, s: 0 },
  { x: 739.9, y: 830.7, w: 74.9, r: 7.6, s: 0 },
  { x: 1260.9, y: 838.0, w: 73.0, r: -6.6, s: 0 },
  { x: 165.9, y: 839.3, w: 87.0, r: -7.1, s: 0 },
  { x: 1390.9, y: 839.7, w: 86.3, r: -4.5, s: 0 },
  { x: 1520.5, y: 869.1, w: 92.0, r: -4.7, s: 0 },
  { x: 1282.1, y: 39.4, w: 93.8, r: -1.1, s: 1 },
  { x: 1113.0, y: 45.5, w: 63.0, r: -5.0, s: 1 },
  { x: 89.2, y: 48.7, w: 103.8, r: 4.7, s: 1 },
  { x: 962.8, y: 52.2, w: 82.0, r: -5.2, s: 1 },
  { x: 755.1, y: 83.6, w: 71.7, r: -2.4, s: 1 },
  { x: 1421.8, y: 96.7, w: 81.8, r: -5.1, s: 1 },
  { x: 466.0, y: 164.5, w: 81.3, r: 0.8, s: 1 },
  { x: 1008.8, y: 171.6, w: 62.2, r: -2.5, s: 1 },
  { x: 868.3, y: 182.6, w: 64.2, r: 3.6, s: 1 },
  { x: 587.2, y: 217.0, w: 68.9, r: -4.6, s: 1 },
  { x: 1120.4, y: 223.0, w: 95.3, r: 5.2, s: 1 },
  { x: 1106.7, y: 308.7, w: 89.7, r: 3.7, s: 1 },
  { x: 961.3, y: 312.4, w: 93.6, r: -7.5, s: 1 },
  { x: 1389.8, y: 316.0, w: 84.2, r: 6.8, s: 1 },
  { x: 994.7, y: 423.7, w: 95.3, r: -1.9, s: 1 },
  { x: 1552.8, y: 438.4, w: 89.7, r: -1.5, s: 1 },
  { x: 581.9, y: 472.5, w: 81.6, r: 7.5, s: 1 },
  { x: 1134.9, y: 474.4, w: 92.5, r: 3.6, s: 1 },
  { x: 1425.4, y: 475.8, w: 78.5, r: -6.5, s: 1 },
  { x: 901.3, y: 476.8, w: 97.7, r: 2.3, s: 1 },
  { x: 597.6, y: 588.3, w: 63.7, r: -7.6, s: 1 },
  { x: 897.3, y: 604.9, w: 64.4, r: 5.9, s: 1 },
  { x: 983.8, y: 699.6, w: 94.6, r: -7.9, s: 1 },
  { x: 561.4, y: 728.7, w: 79.2, r: 0.7, s: 1 },
  { x: 1124.3, y: 732.0, w: 100.0, r: -4.0, s: 1 },
  { x: 467.1, y: 836.9, w: 66.7, r: 6.1, s: 1 },
  { x: 309.6, y: 861.4, w: 84.4, r: -3.5, s: 1 },
  { x: 1119.0, y: 865.4, w: 68.5, r: -8.0, s: 1 },
  { x: 198.6, y: 47.0, w: 76.0, r: 0.1, s: 2 },
  { x: 582.0, y: 94.3, w: 93.2, r: -3.8, s: 2 },
  { x: 743.1, y: 222.4, w: 95.0, r: 5.8, s: 2 },
  { x: 201.9, y: 312.8, w: 92.4, r: 5.5, s: 2 },
  { x: 489.5, y: 321.5, w: 100.6, r: -7.5, s: 2 },
  { x: 1099.1, y: 585.1, w: 102.5, r: 4.8, s: 2 },
  { x: 1377.0, y: 682.1, w: 87.4, r: -1.2, s: 2 },
  { x: 440.4, y: 719.7, w: 88.2, r: 6.5, s: 2 },
  { x: 904.9, y: 821.4, w: 66.6, r: -4.8, s: 2 }
];

const VB_W = 1600;
const VB_H = 900;
const RATIO = 3.112;

export function BotPattern({
  className,
  position = "right",
}: {
  className?: string;
  /** Where the field stays densest as the section resizes. */
  position?: "right" | "center" | "left";
}) {
  const origin =
    position === "right" ? "93% 40%" : position === "left" ? "12% 34%" : "50% 42%";
  const mask = `radial-gradient(68% 128% at ${origin}, #000 6%, rgba(0,0,0,0.62) 40%, transparent 76%)`;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none overflow-hidden", className)}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <filter id="botGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {MARKS.map((m, i) => {
          const h = m.w / RATIO;
          const active = m.s === 2;
          return (
            <g
              key={i}
              transform={`translate(${m.x - m.w / 2} ${m.y - h / 2}) rotate(${m.r} ${m.w / 2} ${h / 2}) scale(${m.w / 100})`}
              className={
                active
                  ? "text-signal-500"
                  : m.s === 1
                    ? "text-bot-mid"
                    : "text-bot-dim"
              }
              opacity={active ? 1 : m.s === 1 ? 1 : 0.92}
              filter={active ? "url(#botGlow)" : undefined}
            >
              <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="currentColor" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
