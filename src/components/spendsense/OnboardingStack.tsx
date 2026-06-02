import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpendStore } from "../../lib/spendsense/store";

export function OnboardingModal() {
    const profile = useSpendStore((s) => s.profile);
    const setProfile = useSpendStore((s) => s.setProfile);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [income, setIncome] = useState(8000);
    const [budgets, setBudgets] = useState<Record<string, number>>({ ...profile.budgets });

    useEffect(() => {
        if (!profile.onboarded) setOpen(true);
    }, [profile.onboarded]);

    if (!open) return null;

    const cats = Object.keys(budgets);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="glass-card w-full max-w-md p-7"
                    lang="ar"
                    dir="rtl"
                >
                    <div className="mb-5 flex justify-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className={`h-1 w-8 rounded-full ${i <= step ? "bg-brand-accent" : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {step === 0 && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-mid to-brand-accent text-2xl">
                                💎
                            </div>
                            <h2 className="text-2xl font-bold text-text-arabic">مرحباً في SpendSense</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                مساعدك المالي الذكي. سجّل مصاريفك بطريقتك، ودعنا نحلّلها بهدوء.
                            </p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-text-arabic">عرّفنا عليك</h2>
                            <div>
                                <label className="mb-1.5 block text-sm text-muted-foreground">الاسم الأول</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border bg-bg-surface px-3 py-2.5 text-text-arabic focus:border-brand-accent focus:outline-none"
                                    placeholder="فهد"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 flex justify-between text-sm">
                                    <span className="text-muted-foreground">الدخل الشهري التقريبي</span>
                                    <span className="font-semibold text-brand-accent" dir="ltr">
                                        {income.toLocaleString()} SAR
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min={2000}
                                    max={40000}
                                    step={500}
                                    value={income}
                                    onChange={(e) => setIncome(+e.target.value)}
                                    className="w-full accent-brand-accent"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    هذا يساعدنا على ضبط توصياتك
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-text-arabic">حدّد ميزانياتك</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {cats.map((c) => (
                                    <div key={c} className="rounded-xl border border-border/60 bg-bg-surface/60 p-3">
                                        <p className="text-sm font-medium">{c}</p>
                                        <p className="mb-2 text-xs text-brand-accent tabular-nums" dir="ltr">
                                            {budgets[c]} SAR
                                        </p>
                                        <input
                                            type="range"
                                            min={0}
                                            max={2000}
                                            step={50}
                                            value={budgets[c]}
                                            onChange={(e) =>
                                                setBudgets((b: Record<string, number>) => ({ ...b, [c]: +e.target.value }))
                                            }
                                            className="w-full accent-brand-accent"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep((s) => s - 1)}
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                السابق
                            </button>
                        ) : (
                            <span />
                        )}
                        <button
                            onClick={() => {
                                if (step < 2) {
                                    setStep((s) => s + 1);
                                } else {
                                    setProfile({
                                        name: name || "صديقي",
                                        income,
                                        budgets,
                                        onboarded: true,
                                    });
                                    setOpen(false);
                                }
                            }}
                            className="rounded-full bg-brand-accent px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            {step === 0 ? "ابدأ" : step === 1 ? "التالي" : "ابدأ تتبع مصاريفك"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
