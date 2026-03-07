import ExpenseCamera from "@/app/components/workflows/ExpenseCamera";

export default function ExpensesPage() {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-2 text-2xl font-black uppercase tracking-tighter text-white">
                Expense<span className="text-orange-500">.Auto</span>
            </h1>
            <p className="mb-8 font-mono text-xs text-slate-500">FINANCE // RECEIPT_RECONCILIATION</p>
            <ExpenseCamera />
        </div>
    );
}
