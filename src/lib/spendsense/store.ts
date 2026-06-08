import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, Subscription } from "../types";

export type ChatRole = "user" | "assistant" | "clarification" | "confirmation" | "coaching";

// Removed Subscription interface as it is now imported from ../types
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
    displayContent?: string;
    language?: "ar" | "en";
    timestamp: number;
    itemsLogged?: number;
    coaching?: CoachingPayload;
    ambiguousItem?: string;
}

// Removed Transaction interface as it is now imported from ../types

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
    updateTransaction: (id: string, partial: Partial<Transaction>) => void;
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
            updateTransaction: (id, partial) => set((s) => ({
                transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...partial } as Transaction : tx)
            })),
            setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
            resetData: () => set({ messages: [], transactions: [] }),
        }),
        { name: "spendsense-store" }
    )
);
