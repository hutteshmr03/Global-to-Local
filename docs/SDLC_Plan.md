Global to Local — SDLC Plan 
Oct 8, 2026 · @Huttesh M R 
The rebuild runs as Agile one-week sprints over about 11 weeks for one to three developers, with a "UI 
and colors unchanged" check as a gate in every sprint. 
1. Approach 
• Methodology: Agile (Scrum-lite), one-week sprints, a demo at the end of each sprint 
• Source control: trunk-based Git; short-lived branches, pull requests, squash merge to main 
• Previews: every pull request gets a Vercel preview URL and a screenshot comparison against the 
baseline taken from the current site 
• Definition of done: tests pass, no new color or font, mobile Lighthouse performance 90 or 
higher, keyboard and screen-reader checked, reduced motion respected 
• Roles: product owner (store management), developer(s), design reviewer who owns the "UI 
unchanged" gate, tester 
2. Phases 
Phase Weeks Activities and 
deliverables 
Exit gate 
0. Discovery and 
requirements 
1 Export colors, fonts and 
spacing from live CSS 
into a locked token file; 
inventory every page; 
capture screenshot 
baselines; export about 
230 products and 
images; sign off the 
URS 
Owner approves scope 
and data 
1. Design and 
architecture 
1–2 Use the study stack: 
React + Vite, Python 
FastAPI, SQLAlchemy, 
Alembic, PostgreSQL 
16, JWT, and Razorpay. 
Define the API 
contract, database 
schema, component 
list, and animation 
spec. Record React 
Native + Expo + 
TypeScript as a future 
Specs reviewed and 
admin screen list 
approved 

Phase Weeks Activities and 
deliverables 
Exit gate 
mobile phase 
2. Foundation 2–3 React + Vite repository, 
FastAPI service, CI, 
environments, layout 
shell, JWT 
authentication, 
SQLAlchemy models 
and Alembic migrations 
Empty shell matches 
the live site pixel for 
pixel 
3. Catalogue 3–5 Shelves, products, 
product page, search, 
filters, image pipeline, 
admin product editing, 
CSV import, admin 
screens for products, 
stock, categories and 
makers 
All products browsable 
and editable 
4. Bag and checkout 5–8 Bag, addresses, 
shipping quote, 
Razorpay payment, 
orders, emails, My 
Account, refunds and 
cancellation 
Test-mode order 
completes end to end 
5. Content and forms 8–9 Story, Social Corner, 
News, FAQs, policies, 
contact, bulk and 
hamper enquiries, 
admin inbox 
Staff can edit all 
content without a 
deploy 
6. Motion and polish 9–10 Animation layer, 
performance and 
accessibility fixes 
Parity and performance 
budgets pass 
7. Testing, hardening 
and launch 
10–11 Load, security and user 
acceptance testing; 
backups; DNS cutover 
Go-live checklist 
complete 
8. Maintenance after launch Monitoring, monthly 
dependency updates, 
backlog 
Ongoing 

Build milestones. Each milestone ends with its tests passing and a short demo before the next one 
starts, so an AI coding assistant is never asked to build everything at once. 
• M1 Foundation and catalogue: repository, database migrations, locked design tokens, all 13 
shelves, all products, product pages, search and filters. 
• M2 Accounts, bag and checkout: registration, login, one-time codes, addresses, bag merge, 
shipping quote, Razorpay payment, webhooks, orders and emails. 
• M3 Staff admin: product editing, CSV import, stock, orders, tracking, refunds, enquiries, content, 
settings, users and audit log. 
• M4 Content and forms: story, social corner, news, FAQs, policies, contact, bulk and hamper 
enquiries. 
• M5 Motion, accessibility, search optimisation and launch checks. 
3. Risks 
Risk Mitigation 
Animation or refactoring drifts from the current 
look 
Screenshot-diff tests against the baseline; token 
file is read-only 
Catalogue and image migration is slow or messy Scripted export to CSV, owner reviews once, 
import script is repeatable 
Payment account approval delays checkout Apply for Razorpay in week 1; build against test 
mode 
Shipping charges by weight and city need real 
rates 
Get the courier's rate card early and seed the rate 
tables 
Heavy motion hurts low-end phones Animate only transform and opacity, set per-page 
budgets, honor reduced motion 
Scope creep (hamper checkout, subscriptions) Keep in the backlog until after launch 
Login cookies are not sent between the 
storefront and the API 
Serve both from one registrable domain or proxy 
/api/v1; test login on a preview URL in week 2 
Client-rendered pages hurt search results and link 
previews 
Prerender public routes in the Vite build; check 
the HTML with a crawler test in CI 
Third-party accounts and keys arrive late 
(Razorpay, email, SMS, courier, CAPTCHA, 
database) 
List them in week 1; build against test or sandbox 
keys and keep the real keys out of the repository 
4. Test plan 
Layer Tooling Covers 
Unit Vitest for React; pytest for Price, shipping and stock 

Layer Tooling Covers 
FastAPI calculations; validators 
API and database pytest and HTTPX with a test 
PostgreSQL database 
Every FastAPI endpoint, 
SQLAlchemy constraints, 
transactions, webhook 
idempotency 
Component Testing Library Bag drawer, filters, forms 
End to end Playwright on Chrome, Safari, 
Firefox and a mobile viewport 
Browse, search, register, pay in 
test mode, track an order, 
admin edits 
Visual parity Playwright screenshots against 
the baseline 
Enforces "UI and colors 
unchanged" 
Accessibility axe in CI plus manual screen-
reader pass 
WCAG 2.2 AA 
Performance Lighthouse CI, WebPageTest Mobile LCP under 2.5 s, INP 
under 200 ms, CLS under 0.1 
Load k6 50 concurrent checkouts 
Security Dependency audit, OWASP ZAP, 
manual authorization tests 
Access control, injection, rate 
limits 
5. Environments and pipeline 
• Local (Docker Compose for PostgreSQL and Redis), Preview (per pull request), Staging, 
Production 
• GitHub Actions: install frontend dependencies, lint and run Vitest, build with Vite; install Python 
dependencies, lint and run pytest; validate Alembic migrations against PostgreSQL; deploy 
preview 
• Alembic migrations versioned in the repository and applied automatically to staging, by approval 
to production 
• Secrets in the hosts' secret stores; separate Razorpay keys per environment 
• Monitoring: Sentry for errors, uptime checks on /health, alerts on failed webhooks 
• Backups: daily snapshot with point-in-time restore; a restore drill before launch 
6. Go-live checklist 
• ☐ Visual parity suite passes on all pages at 360, 768 and 1440 px 
• ☐ All about 230 products and images imported and spot-checked by the owner 
• ☐ Razorpay live keys set; one real low-value payment and refund tested 
• ☐ Shipping zones and rate table loaded and checked against the courier's rate card 

• ☐ Email and SMS templates reviewed; sender domain verified (SPF, DKIM) 
• ☐ Privacy, terms, shipping and returns pages reviewed and published 
• ☐ Redirects for any changed URL; sitemap submitted to Google Search Console 
• ☐ Backups and restore tested; error alerts reach a real person 
• ☐ DNS cutover plan with rollback to the old site for the first 48 hours 
• Hamper pincode rule, order cancellation and refunds tested in Razorpay test mode 
• Prerendered public pages checked: title, description, Open Graph tags and structured data 
7. Post-launch backlog 
1. Online gift-hamper ordering for Goa addresses 
2. Maker profile pages linking products to self-help groups 
3. Konkani, Hindi and Marathi interface options 
4. WhatsApp order updates 
5. Wishlist, product reviews and back-in-stock alerts 
6. Instagram feed on Our Social Corner 
7. Gift cards, coupons and subscription boxes 
8. Installable web app for repeat shoppers 