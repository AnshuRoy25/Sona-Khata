# GoldLedger

**A shared, voice-first record of every gram of gold that moves between a jeweller and a karigar.**

> *"Jo gold karigar ke haath mein jaata hai, uska hisaab dono ke paas hota hai."*
> (When gold goes into a karigar's hands, both sides have the record of it.)

> **Status:** Early stage. This README describes what we plan to build, and the code isn't written yet.

## The problem

A jeweller gives gold to a karigar (the craftsperson who makes the jewellery). The karigar makes the piece and returns it. Some gold is always lost in the process, and this loss is called wastage.

Usually, only the jeweller writes any of this down, in a notebook. If the numbers don't match at the end of the month, the person with the notebook wins, and the karigar has no proof of their work.

## Our solution

GoldLedger gives both sides the same record:

1. **Speak:** Someone says what happened, in their own language, and the app turns it into a clear entry.
2. **Confirm:** The app shows the entry and reads it aloud. Nothing is saved until the speaker confirms it.
3. **Approve:** The other party checks the entry and approves it too.
4. **Settle:** The app compares the gold given and the gold returned, and both sides approve the final payment.

If they disagree later, they can check the timestamped record and replay the voice clip of the original agreement, which a notebook can't offer.

## Example

A karigar says:

> "Ramesh Jewellers se 100 gram mila, necklace ke liye, teen gram wastage, bees din mein dena hai."
> (I got 100 grams from Ramesh Jewellers for a necklace, with 3 grams of wastage, due in 20 days.)

The app shows this and asks the karigar to confirm it:

| Field | Value |
|---|---|
| Jeweller | Ramesh Jewellers |
| Weight | 100 g |
| Item | Necklace |
| Wastage | 3 g |
| Deadline | 20 days |

When the piece comes back, the app checks the numbers:

| | |
|---|---|
| Gold given | 100 g |
| Gold returned | 97 g |
| Agreed wastage | 3 g |
| **Difference** | **0 g: the numbers match** |

## Who uses it

| Who | What they do |
|---|---|
| **Jeweller** | Gives out gold, sets the wastage and deadline, and approves returns and payments |
| **Karigar** | Confirms gold received and pieces delivered, tracks what they're owed, and approves payments |
| **AI agent** | Understands speech, checks the numbers, sends reminders, and gathers evidence for disputes |

## Our main rule

**The AI never decides who is right.** No number enters the record until both people confirm it, and a settlement needs approval from both. The AI keeps the shared record so the two of them can settle things fairly.

## Main features

- **Voice entry:** Speak an entry, with typing and a number keypad always available as a backup.
- **Multiple languages:** Use the whole app in Hinglish, Hindi, Kannada or Tamil.
- **Read aloud:** Tap "Suno" to hear an order or settlement.
- **Same view for both sides:** The jeweller and karigar see the same order page and the same numbers.
- **Reminders:** Get alerts for deadlines, late pieces and pending payments.
- **Dispute evidence:** See timestamped entries, both confirmations and the original voice clips in one place.
- **Month-end settlement:** Review a summary of the month's orders, approved by both sides.
- **Work record:** Build a verified history of completed work, which could one day support a karigar's loan application.

## Main screens

| Screen | What it's for |
|---|---|
| **Onboarding** | Choose your role and language, then log in with your phone number |
| **Mera Hisaab** | Karigar home: money owed, gold in hand and upcoming deadlines |
| **Voice Capture** | Speak an entry, then check and confirm it |
| **Order Detail** | See an order's timeline, gold calculation and approvals |
| **Counter** | Jeweller home: open orders, late orders and actions needed |
| **Dispute** | Compare a claim against the record and the voice clips |
| **Settlement** | Review and approve the month's total |
| **Work Record** | See a karigar's verified work history |

## Planned tech stack

| Part | Tool |
|---|---|
| Frontend | Next.js and Tailwind, designed for phones first |
| Backend | Node.js and Express |
| Database | MongoDB Atlas |
| Speech to text | Gnani Prisma |
| Understanding and checking entries | Gnani Evon |
| Text to speech | Gnani Timbre |
| Login | Phone OTP (mocked for the demo) |
| Hosting | Vercel, plus Railway or Fly |
