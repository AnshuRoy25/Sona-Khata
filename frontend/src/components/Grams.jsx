import { formatGrams } from "../lib/format.js";

// a weight the way a scale shows it: 100.000 g, with the decimals quieter
export default function Grams({ value, size }) {
  const text = formatGrams(value);
  const dot = text.indexOf(".");
  const whole = dot === -1 ? text : text.slice(0, dot);
  const decimals = dot === -1 ? "" : text.slice(dot);

  return (
    <span className={"grams grams-" + (size || "md")}>
      <span className="grams-whole">{whole}</span>
      <span className="grams-dec">{decimals}</span>
      <span className="grams-unit">g</span>
    </span>
  );
}
