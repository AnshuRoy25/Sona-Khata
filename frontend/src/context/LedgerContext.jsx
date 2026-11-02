import { createContext, useContext } from "react";
import { useLedger } from "../hooks/useLedger.js";

// loads the ledger once for the whole logged-in app
const LedgerContext = createContext(null);

export function LedgerProvider({ children }) {
  const ledger = useLedger();
  return <LedgerContext.Provider value={ledger}>{children}</LedgerContext.Provider>;
}

export function useLedgerData() {
  return useContext(LedgerContext);
}

// the people this user has worked with, from their orders
// jeweller → karigars, karigar → jewellers. Each: { id, name, phone }
export function collectPeople(orders, role) {
  const people = [];
  const seen = {};

  for (let i = 0; i < orders.length; i++) {
    const person = role === "jeweller" ? orders[i].karigar : orders[i].jeweller;
    if (!person || seen[person._id]) continue;
    seen[person._id] = true;

    let name = person.name;
    if (role === "karigar" && person.shopName) name = person.shopName;
    people.push({ id: person._id, name: name, phone: person.phone });
  }

  return people;
}
