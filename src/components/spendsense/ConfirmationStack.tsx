import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

export function ConfirmationToast({
    show,
    itemsLogged,
}: {
    show: boolean;
    itemsLogged: number;
}) {
    return (
        <AnimatePresence>
            {show ? (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="pointer-events-none fixed bottom-28 left-1/2 z-50 -translate-x-1/2"
                >
                    <div
                        className="glass-card flex items-center gap-3 border-l-4 px-4 py-3 shadow-2xl"
                        style={{ borderLeftColor: "var(--success)" }}
                    >
                        <span className="grid size-7 place-items-center rounded-full bg-success/20 text-success">
                            <Check className="size-4" />
                        </span>
                        <div lang="ar" dir="rtl">
                            <p className="text-sm font-medium text-text-arabic">تم التسجيل بهدوء ✓</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">
                                {itemsLogged} items recorded
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
