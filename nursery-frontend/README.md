# Plant Nursery - Person 2 frontend (Daily Care and Expenses)

Next.js 14 (app router) + Tailwind CSS.

## Run
    npm install
    npm run dev        # http://localhost:3000

With no backend URL set, the app uses sample data and shows a role switcher (staff / manager / owner) in the navbar.
To use the real API: copy `.env.local.example` to `.env.local` and set NEXT_PUBLIC_API_URL.

## Pages
/watering, /health-checks, /treatments, /expenses (owner and manager only)

## Backend endpoints these screens expect (edit lib/api.ts if the contract changes)
GET  /batches                    -> [{batch_id, name, sown_date, stock}]
GET  /watering/overdue           -> [{batch_id, name, last_watered, days_overdue}]
POST /watering                   {batch_id, watered_on, amount_litres, notes}
GET  /observations?batch_id=     POST /observations {batch_id, observed_on, health_status, avg_height_cm, plants_lost, notes}
GET  /issues                     -> [{issue_id, name, type}]
GET  /treatments?batch_id=       POST /treatments {batch_id, issue_id, found_on, treatment, resolved_on}
GET  /expenses?batch_id=         POST /expenses {batch_id, spent_on, category, amount, description}
Errors: non-2xx with {"error": "message"} (the stock-trigger message is shown to the user as is).
