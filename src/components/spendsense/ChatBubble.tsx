import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ChatMessage } from "../../lib/spendsense/store";
import { CoachingStack } from "./CoachingStack";

function timeLabel(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ msg }: { msg: ChatMessage }) {
    if (msg.role === "coaching" && msg.coaching) {
        return <CoachingStack data={msg.coaching} />;
    }

    if (msg.role === "user") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
            >
                <div className="max-w-[80%] rounded-[18px_18px_4px_18px] bg-brand-mid px-4 py-2.5 text-sm text-primary-foreground shadow-lg">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="mt-1 text-[10px] opacity-60">{timeLabel(msg.timestamp)}</p>
                </div>
            </motion.div>
        );
    }

    if (msg.role === "confirmation") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
            >
                <div className="grid size-8 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="size-4" />
                </div>
                <div className="glass-card max-w-[80%] px-4 py-2.5">
                    <p lang="ar" dir="rtl" className="text-text-arabic text-[15px]">
                        {msg.content}
                    </p>
                    {msg.itemsLogged ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {msg.itemsLogged} transactions recorded
                        </p>
                    ) : null}
                </div>
            </motion.div>
        );
    }

    if (msg.role === "clarification") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
            >
                <div className="grid size-8 place-items-center rounded-full bg-warning/15 text-warning">?</div>
                <div
                    className="max-w-[80%] rounded-2xl border px-4 py-3 text-[15px]"
                    style={{
                        borderColor: "color-mix(in oklab, var(--warning) 40%, transparent)",
                        background: "color-mix(in oklab, var(--warning) 8%, transparent)",
                    }}
                >
                    <p lang="ar" dir="rtl" className="text-text-arabic">{msg.content}</p>
                    {msg.ambiguousItem ? (
                        <p className="mt-1 text-xs text-warning/80">"{msg.ambiguousItem}"</p>
                    ) : null}
                </div>
            </motion.div>
        );
    }

    // assistant default
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
        >
            <div className="size-8 rounded-full bg-gradient-to-br from-brand-mid to-brand-accent" />
            <div className="glass-card max-w-[80%] px-4 py-2.5 text-sm">
                <p>{msg.content}</p>
            </div>
        </motion.div>
    );
}

export function TypingIndicator() {
    return (
        <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-gradient-to-br from-brand-mid to-brand-accent" />
            <div className="glass-card flex items-center gap-1.5 px-4 py-3">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="size-2 rounded-full bg-brand-accent"
                        style={{
                            animation: "typingPulse 1.2s ease-in-out infinite",
                            animationDelay: `${i * 160}ms`,
                        }}
                    />
                ))}
            </div>
            <style>{`@keyframes typingPulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}`}</style>
        </div>
    );
}
