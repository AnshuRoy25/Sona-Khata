# SonaKhata

**Every gram of gold, on record for both sides.**

SonaKhata is a voice-first, AI-powered shared gold ledger for jewellers and karigars (artisan goldsmiths). Users speak in Hindi, English or other Indian languages, an AI agent does the work, and every gold movement counts only after both sides confirm it.

**Live app:** https://sonakhata.vercel.app (demo login: any 10-digit number, code `123456`)

---

## The problem

Jewellers give gold to karigars by weight to make custom pieces, and get the finished work back with an agreed amount of wastage. In most workshops the only record is one line in the jeweller's notebook. Wastage is agreed verbally, deadlines are chased over the phone, and accounts are squared up from memory at the end of the month.

Because only one side holds the record, the karigar has no copy of his own. When the numbers don't match, it becomes one person's word against the other's. This leads to unexplained gold losses, disputes that damage long working relationships, missed delivery dates and artisans waiting weeks to be paid.

Any fix has to work under real constraints:
- Weights have to be accurate to the milligram.
- The record has to be one that both sides accept.
- It has to be fair to the karigar, who usually has less power.
- It has to work for people with low literacy, basic phones and mixed-language speech.

## The solution

SonaKhata replaces the one-sided notebook with one shared record that both the jeweller and the karigar own.

- **Speak, don't type.** Users talk in Hindi, English or other Indian languages. The agent extracts the details, reads them back, and saves only after a clear yes.
- **Two-sided confirmation.** Every entry goes to the other side, who confirms it or rejects it with a reason. This covers new orders, extra gold, partial returns and final returns.
- **Locked records.** Only entries confirmed by both sides are locked, so neither side can change or delete an agreed entry alone. Mistakes are corrected with a new entry, so the full history stays visible.
- **Automatic hisaab.** When an order is delivered, SonaKhata calculates gold given, returned and used against the agreed wastage, counting only confirmed entries.
- **Always visible.** Pending entries, late orders, gold currently with karigars and labour dues are visible to both sides at any time.

## The AI agent

![SonaKhata AI agent workflow](docs/agent-workflow.png)

At the core is a custom tool-calling agent. It understands the request, plans the steps, calls tools to read or change data, and speaks the result back.

**How one message is handled**

1. The user speaks, and Gnani Prisma turns the audio into text.
2. The text, the recent conversation, the app's rules and the list of tools go to the LLM.
3. The LLM either replies, or asks to run a tool.
4. The backend runs the tool and sends the result back to the LLM. This repeats for up to 5 rounds.
5. The final reply is spoken back with Gnani Timbre.

**Tools**

| Read | Write (only after the user says yes) |
|---|---|
| `list_orders` | `create_order` |
| `get_order_details` (entries + hisaab) | `issue_extra_gold` |
| `get_late_orders` | `record_return` |
| `get_balance` (gold with karigars, labour due) | `confirm_entry` |
| `find_person` | `reject_entry` |
| `list_pending_entries` | |

**Built to be trusted**
- It never changes data without a clear yes from the user.
- Write tools go through the same controllers as the app's buttons, so every role and validation check still applies.
- Identity comes from the login token, never from what is said in the conversation.
- Users only ever see orders they are part of.
- Anything the agent records still needs the other side's confirmation.

## How an order moves

```
Jeweller gives gold (by voice)
        │
        ▼
Karigar hears the entry ──► rejects with reason ──► order cancelled
        │ confirms
        ▼
Entry locked · work in progress
        │   (extra gold and partial returns, each confirmed the same way)
        ▼
Karigar records the final return
        │
        ▼
Jeweller confirms ──► rejects with reason ──► karigar records it again
        │
        ▼
Order delivered · hisaab calculated
```

When an order is delivered:

```
used        = gold given − gold returned
difference  = used − agreed wastage
```

All weights are stored as whole milligrams, so small rounding differences never pile up across hundreds of orders.

## Designed for real users

- **Voice first:** speak in Hindi, English or other Indian languages.
- **Read aloud:** every reply can be heard, not just read.
- **Hindi and English screens:** the interface switches in one tap.
- **No app to install:** it runs in any phone browser, even on low-cost phones.
- **Fair to the karigar:** he gets his own account and his own copy of every entry, across every jeweller he works with.

## Architecture

```
 Phone browser (React)
   │  voice (16 kHz WAV) / text
   ▼
 Node.js + Express API ──────────────► MongoDB
   │   auth · orders · entries · hisaab
   │
   ├─► Speech to text  (Gnani Prisma)
   ├─► AI agent loop ──► LLM (tool calling) ──► tools ──► same controllers as the app
   └─► Text to speech  (Gnani Timbre)
```

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React (Vite), React Router, Web Audio API |
| Backend | Node.js, Express, JWT, Multer |
| Database | MongoDB with Mongoose |
| AI agent | Custom tool-calling loop over an OpenAI-compatible chat API (Gemini by default, swappable) |
| Speech | Gnani Prisma (speech to text), Gnani Timbre (text to speech) |

## Project structure

```
backend/
  src/
    ai/
      agent/       prompt.js, llm.js, runAgent.js (the agent loop)
      tools/       definitions.js, readTools.js, writeTools.js, helpers.js, index.js
      voice/       gnani.js (speech to text and text to speech)
    config/        environment config
    controllers/   auth, orders, entries, agent, voice
    models/        User, Order, Transaction
    routes/        API routes
    services/      hisaab calculation, helpers
    utils/         weights, tokens, OTP, order numbers
frontend/
  src/
    api/           API client
    components/    layout, forms, assistant panel
    context/       auth, language, ledger data
    lib/           text (English/Hindi), formatting, audio
    pages/         home, login, dashboard, orders, order detail
```

## Running locally

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # fill in the values
npm run dev
```

Environment variables:

```
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
GNANI_API_KEY=
LLM_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
LLM_API_KEY=
LLM_MODEL=gemini-2.5-flash
```

Any OpenAI-compatible model works by changing `LLM_URL`, `LLM_API_KEY` and `LLM_MODEL`.

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open http://localhost:5173.

## API overview

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register/send-otp`, `/verify-otp` | Create an account |
| POST | `/api/auth/login/send-otp`, `/verify-otp` | Log in |
| GET | `/api/user/me` | Current user |
| GET / POST | `/api/orders` | List orders / create an order (jeweller) |
| GET | `/api/orders/:id` | One order with its entries and hisaab |
| POST | `/api/orders/:id/issues` | Give extra gold (jeweller) |
| POST | `/api/orders/:id/returns` | Record a return (karigar) |
| POST | `/api/transactions/:id/confirm` | Confirm an entry |
| POST | `/api/transactions/:id/reject` | Reject an entry with a reason |
| POST | `/api/agent/chat` | Talk to the agent by text |
| POST | `/api/agent/voice` | Talk to the agent by voice |
| POST | `/api/voice/speak` | Turn text into speech |