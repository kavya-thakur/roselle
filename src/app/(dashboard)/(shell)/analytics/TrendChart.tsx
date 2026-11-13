"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatNumber } from "@/lib/utils/format";

export interface DayPoint {
    day: string; // "2026-11-12"
    views: number;
    clicks: number;
}

const HEIGHT = 260;
const TOP = 12;
const BOTTOM = 30; // under the plot, for the dates
const LEFT = 40; // left of the plot, for the counts
const RIGHT = 12;
const LINE = "#0b4d2c";

// Rounds the largest value up to a tidy axis top (1, 2, 2.5 or 5 × a power of ten, × 4 rows)
function niceMax(value: number) {
    if (value <= 0) return 4;
    const step = value / 4;
    const power = 10 ** Math.floor(Math.log10(step));
    const nice = [1, 2, 2.5, 5, 10].find((n) => n * power >= step)!;
    return Math.max(4, nice * power * 4);
}

const dayLabel = (day: string, long = false) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", ...(long && { weekday: "short" }) });

// Views or clicks per day: a cherry line on a soft wash. Hovering, or the arrow keys once the
// chart has focus, reads out a day.
export function TrendChart({ points }: { points: DayPoint[] }) {
    const [metric, setMetric] = useState<"views" | "clicks">("views");
    const [active, setActive] = useState<number | null>(null);
    const [width, setWidth] = useState(0);
    const box = useRef<HTMLDivElement>(null);

    // the SVG is drawn in real pixels (so lines and text never stretch), so it needs its width
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(box.current!);
        return () => observer.disconnect();
    }, []);

    const values = points.map((point) => point[metric]);
    const max = niceMax(Math.max(...values));
    const plotWidth = Math.max(width - LEFT - RIGHT, 1);
    const plotHeight = HEIGHT - TOP - BOTTOM;
    const x = (i: number) => LEFT + (points.length === 1 ? plotWidth / 2 : (i / (points.length - 1)) * plotWidth);
    const y = (value: number) => TOP + plotHeight - (value / max) * plotHeight;

    const line = values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(value)}`).join("");
    const area = `${line}L${x(values.length - 1)},${TOP + plotHeight}L${x(0)},${TOP + plotHeight}Z`;
    // about six dates under the axis, whatever the range
    const labelEvery = Math.ceil(points.length / 6);

    function onMove(event: PointerEvent<SVGSVGElement>) {
        const left = event.currentTarget.getBoundingClientRect().left;
        const ratio = (event.clientX - left - LEFT) / plotWidth;
        setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
    }

    function onKey(event: KeyboardEvent) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const step = event.key === "ArrowLeft" ? -1 : 1;
        setActive((current) => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)));
    }

    return (
        <div>
            <div role="radiogroup" aria-label="Measure" className="mb-4 flex w-fit rounded-full bg-sand p-1">
                {(["views", "clicks"] as const).map((option) => (
                    <button
                        key={option}
                        role="radio"
                        aria-checked={metric === option}
                        onClick={() => setMetric(option)}
                        className={`h-8 rounded-full px-4 text-[13px] font-semibold capitalize transition ${metric === option ? "bg-paper text-ink shadow-soft" : "text-muted hover:text-ink"}`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div ref={box} className="relative" tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)} aria-label={`${metric} per day. Use the left and right arrow keys to read each day.`}>
                {width > 0 && (
                    <svg width={width} height={HEIGHT} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="block touch-pan-y" aria-hidden>
                        <defs>
                            <linearGradient id="trend-wash" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={LINE} stopOpacity={0.18} />
                                <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        {/* four quiet grid rows with their counts */}
                        {[0, 1, 2, 3, 4].map((row) => {
                            const value = (max / 4) * row;
                            return (
                                <g key={row}>
                                    <line x1={LEFT} x2={width - RIGHT} y1={y(value)} y2={y(value)} stroke="#e5e5e0" strokeDasharray={row === 0 ? undefined : "2 4"} />
                                    <text x={LEFT - 10} y={y(value)} dy="0.32em" textAnchor="end" fontSize={11} fill="#a0a0a0">
                                        {formatNumber(value)}
                                    </text>
                                </g>
                            );
                        })}

                        {points.map((point, i) =>
                            i % labelEvery === 0 || i === points.length - 1 ? (
                                // the last date ends at the edge instead of hanging off it
                                <text key={point.day} x={x(i)} y={HEIGHT - 8} textAnchor={i === points.length - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize={11} fill="#a0a0a0">
                                    {dayLabel(point.day)}
                                </text>
                            ) : null
                        )}

                        <path d={area} fill="url(#trend-wash)" />
                        <path d={line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                        {active !== null && (
                            <g>
                                <line x1={x(active)} x2={x(active)} y1={TOP} y2={TOP + plotHeight} stroke="#1c1716" strokeOpacity={0.25} />
                                <circle cx={x(active)} cy={y(values[active])} r={5} fill={LINE} stroke="#ffffff" strokeWidth={2} />
                            </g>
                        )}
                    </svg>
                )}

                {active !== null && (
                    <div
                        className="pointer-events-none absolute top-0 rounded-lg border border-line bg-paper px-3 py-2 shadow-soft"
                        // stays inside the chart near the edges
                        style={{ left: Math.min(Math.max(x(active) - 70, 0), Math.max(width - 140, 0)), width: 140 }}
                    >
                        <p className="text-lg font-semibold text-ink">{formatNumber(values[active])}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                            <span className="h-0.5 w-3 rounded-full bg-forest" />
                            {metric} · {dayLabel(points[active].day, true)}
                        </p>
                    </div>
                )}
            </div>

            {/* the same numbers for screen readers, without hovering */}
            <table className="sr-only">
                <caption>{metric} per day</caption>
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Views</th>
                        <th>Clicks</th>
                    </tr>
                </thead>
                <tbody>
                    {points.map((point) => (
                        <tr key={point.day}>
                            <td>{dayLabel(point.day, true)}</td>
                            <td>{point.views}</td>
                            <td>{point.clicks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
