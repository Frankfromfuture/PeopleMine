from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"
OUTPUT_PATH = OUTPUT_DIR / "peoplemine-app-summary.pdf"

PAGE_W, PAGE_H = A4
MARGIN_X = 42
MARGIN_TOP = 44
MARGIN_BOTTOM = 34
GUTTER = 20
COL_W = (PAGE_W - (MARGIN_X * 2) - GUTTER) / 2

TITLE = "PeopleMine App Summary"
SUBTITLE = "One-page repo-based overview generated from local project evidence."

LEFT_SECTIONS = [
    (
        "What It Is",
        [
            "PeopleMine is a Next.js web app for managing a personal network as structured contacts, companies, and relationship paths.",
            "It combines CRM-style records, network visualization, dashboard metrics, and AI-assisted goal planning in one product demo.",
        ],
        "body",
    ),
    (
        "Who It's For",
        [
            "Primary persona: people actively building long-term relationship capital, including students, early-career professionals, founders, BD operators, and community builders.",
        ],
        "body",
    ),
    (
        "What It Does",
        [
            "Captures rich contact records with role/archetype data, trust, warmth, energy, notes, and linked interactions.",
            "Maintains a separate company database and auto-syncs companies from contact data.",
            "Shows dashboard metrics such as total contacts, high-energy contacts, maintenance queue, growth, activity, and trait summaries.",
            "Visualizes people and company relationships through network and universe views.",
            "Generates AI-assisted journey paths toward a goal by scoring contacts, building candidate paths, and saving journey history.",
            "Supports OTP sign-in, profile/onboarding/settings flows, and local test-data plus dev-lab tooling.",
        ],
        "bullets",
    ),
]

RIGHT_SECTIONS = [
    (
        "How It Works",
        [
            "UI: Next.js 14 App Router pages in src/app with shared UI/components in src/components; styling uses Tailwind CSS and shadcn/ui.",
            "Server: route handlers in src/app/api cover auth, contacts, companies, dashboard, network, journey, and dev utilities.",
            "Data: Prisma uses a PostgreSQL connection pool from src/lib/db.ts; schema models include User, PhoneOtp, Contact, Company, ContactRelation, CompanyRelation, Interaction, and Journey.",
            "Auth flow: iron-session stores cookie-based sessions; middleware protects non-public routes outside development mode.",
            "Journey flow: browser -> API routes -> Prisma data load -> local scoring/pathfinding in src/lib/journey -> external AI call via QWEN_API_KEY / QWEN_BASE_URL -> stored journey result.",
            "SMS flow: production OTP delivery is wired to Aliyun SMS. Exact deployed hosting environment: Not found in repo.",
            "Exact live AI model selection is mixed in repo naming and config, so the final production model choice was Not found in repo.",
        ],
        "bullets",
    ),
    (
        "How To Run",
        [
            "1. Run npm install",
            "2. Copy .env.example to .env and set DATABASE_URL plus SESSION_SECRET",
            "3. Add QWEN_API_KEY for journey analysis; add Aliyun SMS vars only if you need real OTP sending",
            "4. Run npx prisma generate",
            "5. Run npx prisma migrate dev",
            "6. Run npm run dev and open http://localhost:3000",
            "7. In development, the OTP code is fixed to 000000",
        ],
        "bullets",
    ),
]

EVIDENCE_LINE = (
    "Evidence used: README.md, package.json, .env.example, prisma/schema.prisma, "
    "src/lib/db.ts, src/lib/session.ts, src/middleware.ts, src/app/api/*, and app page modules."
)


def draw_wrapped_text(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font_name: str,
    font_size: float,
    color: HexColor,
    leading: float,
    bullet: str | None = None,
) -> float:
    c.setFont(font_name, font_size)
    c.setFillColor(color)
    avg_char_width = font_size * 0.56
    max_chars = max(16, int(width / avg_char_width))
    lines = wrap(text, width=max_chars, break_long_words=False, break_on_hyphens=False)
    first_prefix = f"{bullet} " if bullet else ""
    continuation_prefix = "   " if bullet else ""
    for index, line in enumerate(lines):
        prefix = first_prefix if index == 0 else continuation_prefix
        c.drawString(x, y, prefix + line)
        y -= leading
    return y


def draw_section(
    c: canvas.Canvas,
    title: str,
    items: list[str],
    x: float,
    y: float,
    width: float,
    mode: str,
) -> float:
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#0f172a"))
    c.drawString(x, y, title)
    y -= 15

    for item in items:
        if mode == "bullets":
            y = draw_wrapped_text(
                c,
                item,
                x,
                y,
                width,
                "Helvetica",
                8.8,
                HexColor("#1f2937"),
                11,
                bullet="-",
            )
            y -= 2
        else:
            y = draw_wrapped_text(
                c,
                item,
                x,
                y,
                width,
                "Helvetica",
                9.0,
                HexColor("#1f2937"),
                11.2,
            )
            y -= 4

    return y - 6


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(OUTPUT_PATH), pagesize=A4)
    c.setTitle(TITLE)

    c.setFillColor(HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(HexColor("#dbe4f0"))
    c.rect(0, PAGE_H - 78, PAGE_W, 78, fill=1, stroke=0)

    c.setFillColor(HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN_X, PAGE_H - MARGIN_TOP, TITLE)
    c.setFont("Helvetica", 9.5)
    c.setFillColor(HexColor("#334155"))
    c.drawString(MARGIN_X, PAGE_H - MARGIN_TOP - 17, SUBTITLE)

    top_y = PAGE_H - 106
    left_x = MARGIN_X
    right_x = MARGIN_X + COL_W + GUTTER

    left_y = top_y
    for title, items, mode in LEFT_SECTIONS:
        left_y = draw_section(c, title, items, left_x, left_y, COL_W, mode)

    right_y = top_y
    for title, items, mode in RIGHT_SECTIONS:
        right_y = draw_section(c, title, items, right_x, right_y, COL_W, mode)

    footer_y = min(left_y, right_y) - 4
    c.setStrokeColor(HexColor("#cbd5e1"))
    c.line(MARGIN_X, footer_y + 10, PAGE_W - MARGIN_X, footer_y + 10)
    footer_y = draw_wrapped_text(
        c,
        EVIDENCE_LINE,
        MARGIN_X,
        footer_y - 2,
        PAGE_W - (MARGIN_X * 2),
        "Helvetica-Oblique",
        7.8,
        HexColor("#475569"),
        9.6,
    )

    min_y = min(left_y, right_y, footer_y)
    if min_y < MARGIN_BOTTOM:
        raise RuntimeError(f"Layout overflow detected; min y {min_y:.2f} < bottom margin {MARGIN_BOTTOM}")

    c.showPage()
    c.save()

    reader = PdfReader(str(OUTPUT_PATH))
    if len(reader.pages) != 1:
        raise RuntimeError(f"Expected 1 page, found {len(reader.pages)}")

    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
