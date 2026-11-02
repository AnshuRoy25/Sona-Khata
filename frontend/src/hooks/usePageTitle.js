import { useEffect } from "react";

// sets the browser tab title, e.g. "Orders · GoldLedger"
export function usePageTitle(title) {
  useEffect(
    function () {
      document.title = title ? title + " · GoldLedger" : "GoldLedger";
    },
    [title]
  );
}
