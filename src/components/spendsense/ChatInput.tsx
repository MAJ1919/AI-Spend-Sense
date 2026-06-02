import { useRef, useState } from "react";
import { Paperclip, Send, X, FileText } from "lucide-react";

export function ChatInput({
    onSend,
    disabled,
}: {
    onSend: (text: string, file?: File) => void;
    disabled?: boolean;
}) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const taRef = useRef<HTMLTextAreaElement>(null);

    function autosize() {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 168) + "px";
    }

    function submit() {
        if (disabled) return;
        if (!text.trim() && !file) return;
        onSend(text.trim(), file ?? undefined);
        setText("");
        setFile(null);
        setError(null);
        requestAnimationFrame(() => {
            if (taRef.current) taRef.current.style.height = "auto";
        });
    }

    function pickFile(f: File | null) {
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
            setError("الملف كبير جداً (الحد 5MB)");
            return;
        }
        const ok = /\.(csv|txt|xlsx)$/i.test(f.name);
        if (!ok) {
            setError("نوع الملف غير مدعوم — استخدم csv أو txt أو xlsx");
            return;
        }
        setError(null);
        setFile(f);
    }

    return (
        <div className="glass-panel sticky bottom-0 border-t">
            <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
                {file ? (
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-bg-surface py-1 pl-3 pr-1 text-sm">
                        <FileText className="size-3.5 text-brand-accent" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                            onClick={() => setFile(null)}
                            className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                            aria-label="Remove file"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                ) : null}
                {error ? (
                    <p className="mb-2 text-xs text-warning" lang="ar" dir="rtl">
                        {error}
                    </p>
                ) : null}

                <div className="glass-card flex items-end gap-2 p-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.txt,.xlsx"
                        className="hidden"
                        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        aria-label="Attach file"
                    >
                        <Paperclip className="size-5" />
                    </button>

                    <textarea
                        ref={taRef}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            autosize();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        rows={1}
                        placeholder="الصق مصاريفك أو اسأل عن إنفاقك..."
                        lang="ar"
                        dir="rtl"
                        className="max-h-42 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-text-arabic placeholder:text-muted-foreground focus:outline-none"
                    />

                    <button
                        onClick={submit}
                        disabled={disabled || (!text.trim() && !file)}
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-accent text-primary-foreground transition hover:opacity-90 disabled:opacity-30"
                        aria-label="Send"
                    >
                        <Send className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
