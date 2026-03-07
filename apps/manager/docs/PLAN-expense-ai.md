# PLAN: AI-Optimized Expense Workflow

## Overview
Optimize the expense management system with AI-driven automation for receipt capture, transaction matching, and business justification.

## Success Criteria
- [ ] AI Email Capture: Simulate an inbox that automatically extracts receipts.
- [ ] AI OCR & Matching: Pictures taken on phones are automatically matched to card transactions with a "Confidence Score".
- [ ] AI Reports: Generate summaries with "AI Reasoning" for each expenditure (e.g., "Validated against Denver project calendar").
- [ ] UI/UX: Dashboard for "Unmatched AI Findings".

## Tech Stack
- React + Framer Motion (UI)
- Lucide React (Icons)
- Mock "AI Engine" (Simulated backend logic)

## UI Components to Add/Update
1. **AI Inbox Component**: View for captured receipt emails.
2. **Auto-Match Dashboard**: High-tech view showing AI matching card transactions to receipts.
3. **Reasoning Engine**: Display panel showing why an expense was categorized or matched.
4. **Expense Report Generator**: Export-ready view with AI summaries.

## Task Breakdown

### Phase 1: AI Data Simulation (Backend Logic)
- **Task ID**: `EX-1`
- **Name**: Create Mock AI Matching Service
- **Agent**: `backend-specialist`
- **Description**: Add logic to `mockData.ts` or a new service to simulate AI confidence scores and automated reasonings.
- **INPUT**: Raw transactions/receipts → **OUTPUT**: Annotated "AI Verified" items → **VERIFY**: Data includes `aiScore` and `aiReasoning` fields.

### Phase 2: AI Capture UI (Frontend)
- **Task ID**: `EX-2`
- **Name**: Implement AI Receipt Inbox
- **Agent**: `frontend-specialist`
- **Description**: Create a dedicated view in `ExpenseManager.tsx` for "AI Captured" items from emails and phone uploads.
- **INPUT**: New `activeTab` → **OUTPUT**: List of "AI Found" receipts → **VERIFY**: Visual indicator for "Email Capture" source.

### Phase 3: Smart Matching Interface
- **Task ID**: `EX-3`
- **Name**: Auto-Match UI & Confidence Scores
- **Agent**: `frontend-specialist`
- **Description**: Update the "Match Transactions" tab to show AI-suggested matches with progress bars/glow effects for high confidence.
- **INPUT**: Match tab UI → **OUTPUT**: Enhanced match cards → **VERIFY**: Confidence scores displayed with color-coding.

### Phase 4: AI Reporting & Reasoning
- **Task ID**: `EX-4`
- **Name**: AI Reasoning Panel
- **Agent**: `frontend-specialist`
- **Description**: Add an expandable details view for expenses that shows the "AI Reasoning" for the business case.
- **INPUT**: Expense list items → **OUTPUT**: Detailed reasoning modal/drawer → **VERIFY**: Reasoning text is legible and professional.

## Phase X: Verification
- [ ] Run `ux_audit.py` to ensure high-tech feel.
- [ ] Verify matching logic with mock data.
- [ ] Manual check of the "Reasoning" display.
