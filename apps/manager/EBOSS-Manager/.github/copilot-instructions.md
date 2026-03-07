# EBOSS Manager - AI Coding Agent Instructions

## Project Overview
EBOSS Manager is a React TypeScript application for managing ANA Energy's EBOSS hybrid power systems. It provides equipment monitoring, ticket management, preventive maintenance tracking, and customer relationship management with Salesforce integration.

## Architecture & Data Flow
- **Frontend**: React 19 + TypeScript + Vite, using HashRouter for SPA navigation
- **State Management**: React Context API with AppContext for global state (units, tickets, customers)
- **Data Sources**: Mock data for development, Salesforce API for customers, iMonnit telemetry sensors
- **AI Integration**: Google Gemini 3-flash-preview for intelligent ticket analysis and recommendations
- **UI Framework**: Tailwind CSS with custom ANA brand colors (corporate red #e31b23, energy green #8dc63f)

## Key Components & Patterns
- **Navigation**: Sidebar with HashRouter Links, active state management via useLocation
- **Data Display**: Recharts for analytics, Lucide React icons throughout
- **Forms**: Controlled components with TypeScript interfaces from `types.ts`
- **Dark Mode**: Context-based theme switching with localStorage persistence and Tailwind dark: classes
- **Status Management**: Enum-based statuses (UnitStatus, TicketStatus, etc.) with color-coded badges

## Development Workflow
- **Setup**: `npm install`, set `GEMINI_API_KEY` in `.env.local`, `npm run dev`
- **Build**: `npm run build` (Vite), `npm run preview` for production preview
- **Environment**: API keys injected via Vite define (process.env.API_KEY for Gemini)
- **Mock Data**: All data in `mockData.ts` - replace with real API calls for production

## AI Integration Patterns
- **Gemini Usage**: Import `GoogleGenAI` from "@google/genai", initialize with `new GoogleGenAI({ apiKey: process.env.API_KEY })`
- **Prompt Engineering**: Structured JSON responses for ticket analysis (title, category, priority, faults)
- **Error Handling**: Try/catch with user alerts for API failures
- **Model**: "gemini-3-flash-preview" with responseMimeType: "application/json"

## Code Conventions
- **Component Structure**: Functional components with hooks, explicit TypeScript interfaces
- **Styling**: Tailwind utility classes, ANA brand colors via CSS variables
- **State Updates**: Immutable updates with spread operators, context setters
- **File Organization**: Components in `/components`, types in `types.ts`, data in `mockData.ts`
- **Naming**: PascalCase for components, camelCase for variables, UPPER_CASE for enums

## Common Patterns
- **Context Usage**: `const { units, addTicket } = useAppContext();` for data access
- **Navigation Links**: `<Link to="/units" className="nav-link">` with conditional active classes
- **Charts**: `<ResponsiveContainer><PieChart data={chartData}></ResponsiveContainer>`
- **Forms**: `onChange={(e) => setFormData({...formData, field: e.target.value})}`
- **AI Analysis**: Async function with loading state, JSON.parse response handling

## Key Files
- `App.tsx`: Main app with contexts, routing, and global state
- `types.ts`: All TypeScript interfaces and enums
- `mockData.ts`: Development data - replace with API integrations
- `components/Dashboard.tsx`: Overview with stat cards and charts
- `components/CreateTicket.tsx`: AI-powered ticket creation with Gemini analysis</content>
<parameter name="filePath">F:\Repos\GitHub\EBOSS-Manager\.github\copilot-instructions.md