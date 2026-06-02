import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { AlertTriangle, Search, BarChart3, Share2, Bookmark } from "lucide-react";
import type { CoachingPayload } from "@/lib/spendsense/store";

const card = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

export function CoachingStack({ data }: { data: CoachingPayload }) {
    return (
        <div className="space-y-4">
            <PassiveDrainCard subs={data.passiveDrains} delay={0} />
            <AnomalyAlertCard anomalies={data.anomalies} delay={0.12} />
            <FinancialAdvisoryCard text={data.advisoryAr} sparkline={data.sparkline} delay={0.24} />
        </div>
    );
}

function CardShell({
    icon,
    title,
    meta,
    children,
    footer,
    delay,
}: {
    icon: React.ReactNode;
    title: string;
    meta?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    delay: number;
}) {
    return (
        <motion.section {...card(delay)} className="glass-card overflow-hidden" lang="ar" dir="rtl">
            <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-brand-accent/10 text-brand-accent">
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-text-arabic">{title}</h3>
                </div>
                {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
            </header>
            <div className="px-5 py-4">{children}</div>
            {footer ? (
                <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 bg-background/30 px-5 py-3">
                    {footer}
                </footer>
            ) : null}
        </motion.section>
    );
}

function PassiveDrainCard({ subs, delay }: { subs: CoachingPayload["passiveDrains"]; delay: number }) {
    return (
        <CardShell
            delay={delay}
            icon={<Search className="size-4" />}
            title="المصاريف الخفية 🔍"
            meta="آخر 30 يوم"
            footer={
                <button className="rounded-full border border-warning/60 px-4 py-1.5 text-sm text-warning transition hover:bg-warning/10">
                    إلغاء الاشتراك
                </button>
            }
        >
            <ul className="divide-y divide-border/50">
                {subs.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-bg-surface text-lg">
                                {s.emoji}
                            </span>
                            <div>
                                <p className="font-medium text-text-arabic">{s.name}</p>
                                <p className="text-xs text-muted-foreground" dir="ltr">
                                    Last: {new Date(s.lastCharge).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === "suspicious"
                                    ? "bg-warning/15 text-warning"
                                    : "bg-success/15 text-success"
                                    }`}
                            >
                                {s.status === "suspicious" ? "مشبوه" : "نشط"}
                            </span>
                            <span className="text-sm font-semibold tabular-nums" dir="ltr">
                                {s.amount} SAR
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </CardShell>
    );
}

function AnomalyAlertCard({
    anomalies,
    delay,
}: {
    anomalies: CoachingPayload["anomalies"];
    delay: number;
}) {
    return (
        <CardShell
            delay={delay}
            icon={<AlertTriangle className="size-4" />}
            title="تنبيهات الإنفاق ⚡"
            meta="هذا الأسبوع"
            footer={
                <button className="rounded-full border border-brand-accent/50 px-4 py-1.5 text-sm text-brand-accent transition hover:bg-brand-accent/10">
                    راجع المصاريف
                </button>
            }
        >
            <div className="space-y-4">
                {anomalies.map((a) => {
                    const over = a.percentOver > 0;
                    const pct = Math.min(150, (a.amount / a.threshold) * 100);
                    return (
                        <div key={a.id}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="font-medium text-text-arabic">{a.category}</span>
                                <span
                                    className={`tabular-nums ${over ? "text-danger" : "text-success"}`}
                                    dir="ltr"
                                >
                                    {a.amount} SAR {over ? `+${a.percentOver}%` : `${a.percentOver}%`}
                                </span>
                            </div>
                            <div className="relative h-2 overflow-hidden rounded-full bg-bg-surface">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, pct)}%`,
                                        background: over
                                            ? "linear-gradient(90deg, var(--brand-accent), var(--danger))"
                                            : "var(--brand-accent)",
                                        boxShadow: over ? "0 0 12px color-mix(in oklab, var(--danger) 60%, transparent)" : undefined,
                                    }}
                                />
                                <div className="absolute right-0 top-0 h-full w-px bg-muted-foreground/40" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardShell>
    );
}

function FinancialAdvisoryCard({
    text,
    sparkline,
    delay,
}: {
    text: string;
    sparkline: number[];
    delay: number;
}) {
    const data = sparkline.map((v, i) => ({ i, v }));
    return (
        <CardShell
            delay={delay}
            icon={<BarChart3 className="size-4" />}
            title="تقريرك المالي 📊"
            meta={
                <div className="h-8 w-24" dir="ltr">
                    <ResponsiveContainer>
                        <LineChart data={data}>
                            <Line
                                type="monotone"
                                dataKey="v"
                                stroke="var(--brand-accent)"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            }
            footer={
                <>
                    <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <Share2 className="size-3.5" />
                        شارك
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                        <Bookmark className="size-3.5" />
                        احفظ التقرير
                    </button>
                </>
            }
        >
            <p className="text-[17px] leading-[1.9] text-text-arabic">{text}</p>
        </CardShell>
    );
}
