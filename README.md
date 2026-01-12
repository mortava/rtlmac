# RTLMAC - Real-Time Lending Machine AI Companion

> AI-powered gateway to Fannie Mae property and lending data

## Overview

RTLMAC is a modern, LLM-style chat interface that provides instant access to Fannie Mae APIs for property and lending data. Ask questions in natural language and get formatted, actionable responses about loan limits, housing market data, eligibility requirements, and more.

## Features

- **LLM-Style Chat Interface** - Beautiful, modern chat UI with markdown rendering
- **Fannie Mae API Integration** - Direct access to official Fannie Mae data
- **Save & Share** - Save query results and share conversations
- **Real-Time Data** - Live access to loan limits, market data, and eligibility tools
- **Dark Mode** - Elegant dark theme optimized for extended use

## Data Sources

| API | Description |
|-----|-------------|
| Loan Limits | Conforming loan limits by state and county |
| Housing Pulse | Real-time housing market metrics and trends |
| AMI Lookup | Area Median Income and HomeReady eligibility |
| Manufactured Housing | Mobile/manufactured home community data |
| Loan Lookup | Verify if a loan is owned by Fannie Mae |

## Quick Start

\`\`\`bash
git clone https://github.com/yourusername/rtlmac.git
cd rtlmac
npm install
cp .env.example .env.local
npm run dev
\`\`\`

Open http://localhost:3000 to start using RTLMAC.

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Zustand
- Fannie Mae Developer Portal APIs
- Vercel

## License

MIT License
