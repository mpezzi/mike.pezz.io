import { formatUptime } from "~/lib/format";
import { useEffects } from "~/hooks/useEffectsMode";
import { useShell } from "~/hooks/useShell";
import { useTheme } from "~/themes/ThemeProvider";

const ASCII = [
  "┌───────────────────┐",
  "│                   │",
  "│   p e z z O S     │",
  "│   ───────────     │",
  "│   v1.0 (web)      │",
  "│                   │",
  "└───────────────────┘",
].join("\n");

export function Banner() {
  const { theme } = useTheme();
  const { mode } = useEffects();
  const { sessionStartMs } = useShell();

  const info: [string, string][] = [
    ["user", "mike@pezz.io"],
    ["os", "pezzOS 1.0 (web)"],
    ["shell", "psh 0.1.0"],
    ["theme", theme.id],
    ["effects", mode],
    // Snapshot at render: the banner is a point-in-time neofetch printout.
    // eslint-disable-next-line react-hooks/purity
    ["uptime", formatUptime(Date.now() - sessionStartMs)],
    ["cpu", "1x rubber duck"],
  ];

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      <pre aria-hidden="true" className="term-accent" style={{ margin: 0 }}>
        {ASCII}
      </pre>
      <dl style={{ margin: 0 }}>
        {info.map(([key, value]) => (
          <div key={key} style={{ display: "flex", gap: "1ch" }}>
            <dt className="term-accent" style={{ minWidth: "8ch" }}>
              {key}
            </dt>
            <dd style={{ margin: 0 }}>{value}</dd>
          </div>
        ))}
        <div
          aria-hidden="true"
          style={{ display: "flex", gap: "0.25ch", marginTop: "0.5rem" }}
        >
          {theme.colors.ansi.slice(0, 8).map((color, i) => (
            <span
              key={i}
              style={{ width: "2ch", height: "1em", background: color, display: "inline-block" }}
            />
          ))}
        </div>
      </dl>
    </div>
  );
}
