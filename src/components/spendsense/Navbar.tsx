import { NavLink as Link } from "react-router-dom";
import { Wallet } from "lucide-react";

const links = [
    { to: "/", label: "Dashboard" },
    { to: "/history", label: "History" },
    { to: "/settings", label: "Settings" },
] as const;

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2">
                    <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-accent-teal text-slate-950">
                        <Wallet className="size-5" />
                    </div>
                    <span className="text-base font-semibold tracking-tight text-slate-100">
                        SpendSense<span className="text-accent-teal"> AI</span>
                    </span>
                </Link>
                <nav className="flex items-center gap-1 text-sm">
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={({ isActive }) =>
                                `rounded-full px-3 py-1.5 transition-colors ${
                                    isActive
                                        ? "bg-card border border-border-light text-slate-100"
                                        : "text-slate-400 hover:text-slate-200"
                                }`
                            }
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}

