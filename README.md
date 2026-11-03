# SonaKhata

**Every gram of gold, on record for both sides.**

SonaKhata is a voice-first shared gold ledger for jewellers and karigars (artisan goldsmiths). Every gold movement between them is spoken once, read back, and counted only after both sides confirm it.

---

## The problem

Jewellers give gold to karigars by weight to make custom pieces, and get the finished work back with an agreed amount of wastage. In most workshops the only record of this is the jeweller's notebook or a paper slip. Wastage is agreed verbally, deadlines are chased over the phone, and accounts are squared up from memory at the end of the month.

Because only one side holds the record, the karigar has no copy of his own and no way to check it. When the numbers don't match, it becomes one person's word against the other's. This leads to unexplained gold losses, disputes that damage long working relationships, missed delivery dates for weddings and festivals, and artisans waiting weeks to be paid.

Any fix has to work under real constraints:
- Weights have to be accurate to the milligram.
- The record has to be one that both sides accept.
- It has to be fair to the karigar, who usually has less power.
- It has to work for people with low literacy, basic phones and mixed Hindi-English speech.

## The idea

The problem isn't a lack of record keeping. The problem is that the record belongs to only one side. A notebook can be perfectly accurate and still not be trusted, because the other person never agreed to it.

SonaKhata makes the record **shared**. Every gold movement is treated as a small agreement between the jeweller and the karigar:

1. One side records the entry, for example gold given or gold returned.
2. The other side sees it, or hears it read aloud, and either confirms it or rejects it with a reason.
3. Only when **both** have confirmed does the entry lock. After that, nobody can change it alone.
4. Mistakes are corrected with a new entry that the other side must also confirm, so the full history always stays visible.

The account for each order is built only from entries both sides confirmed. So at the end there is nothing left to argue about, only a figure both people already agreed to, step by step.

## The AI agent

People don't type into SonaKhata. They talk to it. At the core is an AI agent that understands what the user wants, plans the steps, uses tools to read or change data, and completes the task for them.

A jeweller can say:

> "I gave Rajesh 100 grams for a necklace, 3 grams wastage, due in 20 days."

The agent then:
- works out which karigar "Rajesh" is, from the jeweller's own contacts,
- turns "20 days" into a real deadline,
- checks that every required detail is there, and asks a follow-up question if something is missing,
- reads the full entry back and asks for confirmation,
- creates the order only after the user says yes.

The same agent handles the rest of the work. Users can:
- create orders and give extra gold on a running order
- record partial and final returns
- confirm or reject pending entries, with a reason
- ask "Is anything waiting for me?", "Which orders are late?" or "How much gold is with my karigars?"
- hear the full account of any order

Replies are spoken back, so the whole flow can happen by voice.

The agent is built to be trustworthy, not just capable:
- **It never acts without a clear yes.** Every tool that changes data needs the user's confirmation.
- **It follows the same rules as the app.** Write actions go through the same controllers as the buttons, so the agent can never skip a check.
- **It respects roles.** A karigar can never give gold, and a jeweller can never record a karigar's return.
- **Identity comes from the login,** never from what is said in the conversation.
- **The other side still confirms.** Anything the agent creates still needs the other person's approval.

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
Order delivered · account calculated
```

When an order is delivered, SonaKhata works out:

```
used        = gold given − gold returned
difference  = used − agreed wastage
```

All weights are stored as whole milligrams, so small rounding differences never pile up across hundreds of orders.

## Designed for real users

- **Voice first:** speak in Hindi, English or both.
- **Read aloud:** every entry and reply can be heard, not just read.
- **Hindi and English screens:** the whole interface switches in one tap.
- **No app to install:** it runs in any phone browser, even on low-cost phones.
- **Fair to the karigar:** he gets his own account and his own copy of every entry, across every jeweller he works with.

## Architecture

```
 Phone browser (React)
   │  voice (16 kHz WAV) / text
   ▼
 Node.js + Express API ──────────────► MongoDB
   │   auth · orders · entries · account
   │
   ├─► Speech to text  (Gnani Prisma)
   ├─► AI agent loop ──► LLM (tool calling) ──► tools ──► same controllers as the app
   └─► Text to speech  (Gnani Timbre)
```

**How the agent handles one message**

1. The user speaks, and the audio is turned into text.
2. The text, the recent conversation, the user's role and the list of tools go to the LLM.
3. The LLM either replies, or asks to run a tool, like reading orders or creating an order.
4. The backend runs the tool and sends the result back to the LLM. This repeats, up to 5 rounds.
5. The final reply is spoken back to the user.

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
    ai/            agent loop, tools, speech (Gnani)
    config/        environment config
    controllers/   auth, orders, entries, agent, voice
    models/        User, Order, Transaction
    routes/        API routes
    services/      account calculation, helpers
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
| GET | `/api/orders/:id` | One order with its entries and account |
| POST | `/api/orders/:id/issues` | Give extra gold (jeweller) |
| POST | `/api/orders/:id/returns` | Record a return (karigar) |
| POST | `/api/transactions/:id/confirm` | Confirm an entry |
| POST | `/api/transactions/:id/reject` | Reject an entry with a reason |
| POST | `/api/agent/chat` | Talk to the agent by text |
| POST | `/api/agent/voice` | Talk to the agent by voice |
| POST | `/api/voice/speak` | Turn text into speech |