import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatRole = "user" | "assistant" | "clarification" | "confirmation" | "coaching";

export interface Subscription {
    id: string;
    name: string;
    emoji: string;
    amount: number;
    lastCharge: string;
    status: "active" | "suspicious";
}
export interface Anomaly {
    id: string;
    category: string;
    amount: number;
    threshold: number;
    percentOver: number;
}
export interface CoachingPayload {
    passiveDrains: Subscription[];
    anomalies: Anomaly[];
    advisoryAr: string;
    sparkline: number[];
}
export interface ChatMessage {
    id: string;
    role: ChatRole;
    content?: string;
    language?: "ar" | "en";
    timestamp: number;
    itemsLogged?: number;
    coaching?: CoachingPayload;
    ambiguousItem?: string;
}

export interface Transaction {
    id: string;
    date: string;
    merchant: string;
    category: string;
    amount: number;
    source: string;
}

export interface UserProfile {
    name: string;
    income: number;
    budgets: Record<string, number>;
    language: "ar" | "en";
    notifications: { weekly: boolean; anomalies: boolean };
    onboarded: boolean;
}

interface State {
    messages: ChatMessage[];
    transactions: Transaction[];
    profile: UserProfile;
    addMessage: (m: ChatMessage) => void;
    addTransactions: (t: Transaction[]) => void;
    setProfile: (p: Partial<UserProfile>) => void;
    resetData: () => void;
}

const defaultProfile: UserProfile = {
    name: "",
    income: 8000,
    budgets: { Food: 1000, Transport: 500, Entertainment: 400, Subscriptions: 300 },
    language: "ar",
    notifications: { weekly: true, anomalies: true },
    onboarded: false,
};

export const useSpendStore = create<State>()(
    persist<State>(
        (set) => ({
            messages: [],
            transactions: [],
            profile: defaultProfile,
            addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
            addTransactions: (t) => set((s) => ({ transactions: [...t, ...s.transactions] })),
            setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
            resetData: () => set({ messages: [], transactions: [] }),
        }),
        { name: "spendsense-store" }
    )
);
