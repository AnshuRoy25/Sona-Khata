import { useEffect } from "react";

// sets the browser tab title, e.g. "Orders · SonaKhata"
export function usePageTitle(title) {
  useEffect(
    function () {
      document.title = title ? title + " · SonaKhata" : "SonaKhata";
    },
    [title]
  );
}
