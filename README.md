# 🌐 PeopleMine 人脉

**Your network is a mine. Make it yours.**

PeopleMine is an AI-native relationship intelligence app that turns your messy, scattered contacts into a visual, playable, analyzable personal asset. It's not a CRM. It's not a contacts app. It's a relationship strategist in your pocket.

---

## What is this

Most people "manage" their network by scrolling through WeChat or LinkedIn and hoping they remember who's who. PeopleMine takes a different approach:

- **Tag everyone in 30 seconds.** After meeting someone, open the app, swipe a vibe rating, tap a few personality tags, and let AI auto-generate their industry position. Done.
- **See your universe.** Your entire network rendered as an interactive star map — node size = relationship energy, color = industry, lines = connections. Zoom, drag, explore.
- **Let AI connect the dots.** AI analyzes supply chain positions, finds hidden overlaps between your contacts, predicts "chemistry" between two people, and suggests who you should introduce to whom.
- **Never let a relationship go cold.** Weekly reviews, birthday reminders, energy decay warnings, and AI-generated outreach suggestions.

---

## Core Features (V1.0)

**🏷️ Smart Tagging System**
Dual-layer tags: tag yourself first (industry, role, social style), then tag others with minimal friction. Vibe score (1-5 stars), personality tags (tap to select from presets or create custom), AI-generated industry and supply chain tags.

**🌌 Relationship Universe**
Force-directed graph visualization. Every contact is a node. Size = relationship energy. Color = industry. Line thickness = connection strength. Line style = relationship type (business / personal / weak tie). Pinch to zoom, drag to explore, tap to drill down.

**🤖 AI Analysis Engine**
- Industry & supply chain positioning (auto-detected from company + title)
- Pairwise intersection analysis (what two contacts have in common)
- Chemistry prediction (personality compatibility + industry synergy)
- Personalized outreach suggestions (communication style, talking points, timing)

**📊 Weekly Review**
Auto-generated weekly digest: who you contacted, whose energy is decaying, upcoming birthdays, and AI recommendations for who to reach out to this week.

**🪑 Smart Seating (Bonus)**
Hosting a dinner or event? AI recommends optimal seating arrangements based on relationship analysis and chemistry predictions.

**🎮 Playground (Coming in V2)**
Opt-in social experiment: see blurred, aggregated tags that others have given you. Privacy-first design — minimum 5 taggers required, fully anonymized, exit anytime.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Visualization | D3.js (force-directed graph in WebView) |
| State Management | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Claude API (Anthropic) |
| Graph Database | Neo4j Aura (relationship path queries) |
| Local Storage | MMKV |
| CI/CD | EAS Build + GitHub Actions |

---

## Project Structure
```
peoplemine/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── graph.tsx       # Relationship universe
│   │   ├── contacts.tsx    # Contact list
│   │   ├── review.tsx      # Weekly review
│   │   ├── tasks.tsx       # Task-people mapping
│   │   └── profile.tsx     # Settings & Playground
│   └── contact/[id].tsx    # Contact detail
├── components/
│   ├── GraphCanvas.tsx     # D3 WebView wrapper
│   ├── TagSelector.tsx     # Tagging interface
│   ├── VibeStars.tsx       # Vibe rating component
│   ├── EnergyBar.tsx       # Relationship energy display
│   └── ContactCard.tsx     # List item component
├── services/
│   ├── ai.ts               # Claude API integration
│   ├── supabase.ts         # Database operations
│   └── graph.ts            # Neo4j queries
├── stores/
│   └── useStore.ts         # Zustand global state
├── prompts/
│   └── index.ts            # AI prompt templates
├── types/
│   └── index.ts            # TypeScript definitions
├── assets/
│   └── graph.html          # D3.js visualization
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)
- Anthropic API key

### Setup
```bash
# Clone
git clone https://github.com/yourusername/peoplemine.git
cd peoplemine

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in your Supabase URL, Supabase Anon Key, and Anthropic API Key

# Start development
npx expo start
```

### Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_claude_api_key
NEO4J_URI=your_neo4j_uri
NEO4J_PASSWORD=your_neo4j_password
```

---

## Roadmap

| Version | Timeline | Focus |
|---------|----------|-------|
| **V1.0** | 2026 Q2 | Core tagging + visualization + AI analysis |
| **V1.5** | 2026 Q3 | WeChat mini-program + CRM integrations |
| **V2.0** | 2026 Q4 | Playground + deep chemistry analysis |
| **V2.5** | 2027 Q1 | Team edition + enterprise features |
| **V3.0** | 2027 Q2 | Voice input + AR exploration + open API |

---

## Philosophy

Traditional CRMs are built around deals. PeopleMine is built around **people**.

We believe:
- Your network is your most undervalued asset
- Understanding relationships should feel like exploring, not filing paperwork
- AI should be the analyst, you should be the strategist
- Privacy is non-negotiable — your relationship data is yours alone

---

## Contributing

PeopleMine is in early development. If you're interested in contributing, open an issue first to discuss what you'd like to work on.

Areas where help is especially welcome:
- D3.js visualization improvements (clustering, animations, 3D mode)
- AI prompt optimization (better industry detection, smarter chemistry analysis)
- Internationalization (currently Chinese + English)
- Accessibility

---

## License

MIT

---

<p align="center">
  <em>Your network is a mine. Start digging.</em>
</p>
