"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TransactionRecord,
  DesignerEarningRecord,
  EarningsSummary,
  PayoutRecord,
  PayoutMethodRecord,
  AdminDashboardSummary,
} from "@/lib/types";

interface PaymentState {
  // Transaction state
  currentTransactionId: number | null;
  virtualAccount: {
    account_number: string;
    bank_name: string;
    amount: string;
    expires_at: string;
  } | null;
  paymentStatus: string | null;

  setCurrentTransaction: (id: number, va: PaymentState["virtualAccount"]) => void;
  setPaymentStatus: (status: string) => void;
  clearPayment: () => void;

  // Designer earnings (cached)
  earningsSummary: EarningsSummary | null;
  earnings: DesignerEarningRecord[];
  payouts: PayoutRecord[];
  payoutMethods: PayoutMethodRecord[];

  setEarningsSummary: (s: EarningsSummary) => void;
  setEarnings: (e: DesignerEarningRecord[]) => void;
  setPayouts: (p: PayoutRecord[]) => void;
  setPayoutMethods: (m: PayoutMethodRecord[]) => void;

  // Admin
  adminDashboard: AdminDashboardSummary | null;
  adminTransactions: TransactionRecord[];
  adminEarnings: DesignerEarningRecord[];
  adminPayouts: PayoutRecord[];

  setAdminDashboard: (d: AdminDashboardSummary) => void;
  setAdminTransactions: (t: TransactionRecord[]) => void;
  setAdminEarnings: (e: DesignerEarningRecord[]) => void;
  setAdminPayouts: (p: PayoutRecord[]) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      currentTransactionId: null,
      virtualAccount: null,
      paymentStatus: null,

      setCurrentTransaction: (currentTransactionId, virtualAccount) =>
        set({ currentTransactionId, virtualAccount, paymentStatus: "pending" }),
      setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
      clearPayment: () =>
        set({
          currentTransactionId: null,
          virtualAccount: null,
          paymentStatus: null,
        }),

      earningsSummary: null,
      earnings: [],
      payouts: [],
      payoutMethods: [],

      setEarningsSummary: (earningsSummary) => set({ earningsSummary }),
      setEarnings: (earnings) => set({ earnings }),
      setPayouts: (payouts) => set({ payouts }),
      setPayoutMethods: (payoutMethods) => set({ payoutMethods }),

      adminDashboard: null,
      adminTransactions: [],
      adminEarnings: [],
      adminPayouts: [],

      setAdminDashboard: (adminDashboard) => set({ adminDashboard }),
      setAdminTransactions: (adminTransactions) => set({ adminTransactions }),
      setAdminEarnings: (adminEarnings) => set({ adminEarnings }),
      setAdminPayouts: (adminPayouts) => set({ adminPayouts }),
    }),
    {
      name: "ai-fashion-payments",
      partialize: (state) => ({
        payoutMethods: state.payoutMethods,
      }),
    }
  )
);
