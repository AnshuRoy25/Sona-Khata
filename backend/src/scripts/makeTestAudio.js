import fs from "fs";
import { speak } from "../ai/gnani.js";

const parts = [
  "Every day across India, karigars take gold from jewellers to make jewellery. A hundred grams here, fifty grams there. And the record of all that gold? Usually just one diary. The jeweller's diary.",
  "So at the end of the month, when the numbers don't match, and they often don't, it's one person's word against the other's. The karigar has no record of his own. Whoever holds the diary wins.",
  "So I built GoldLedger. A shared gold ledger where every gram is on record, for both sides. And you don't type anything. You just speak.",
  "Here's how it works. The jeweller taps the mic and just talks, the way he normally would.",
  "Rajesh ko sau gram diya, rani haar ke liye, teen gram wastage, bees din mein.",
  "Gnani's Prisma model turns that into text, Hinglish and all. Then an AI agent picks out the karigar, the weight, the item, the wastage and the deadline, and fills in the entry by itself.",
  "Before anything is saved, Gnani Timbre reads it back out loud. So if something's wrong, you catch it right there.",
  "Now the same entry shows up for the karigar. He listens to it, checks it, and confirms. Only when both sides say yes does the entry get locked. After that, nobody can change it on their own.",
  "When the jewellery comes back, the returned gold gets confirmed the same way. Then GoldLedger does the hisaab. Gold given, gold returned, the agreed wastage, and the difference. Same numbers on both screens. No fights at month end.",
  "GoldLedger. The gold in a karigar's hands, on record for both of them. Built with Gnani Prisma and Timbre for the Great Indian AI Internship Challenge.",
];

async function run() {
  const buffers = [];
  for (let i = 0; i < parts.length; i++) {
    const audio = await speak(parts[i]);
    buffers.push(audio);
    console.log("Done part", i + 1, "of", parts.length);
  }
  fs.writeFileSync("voiceover.mp3", Buffer.concat(buffers));
  console.log("Saved voiceover.mp3");
}

run();