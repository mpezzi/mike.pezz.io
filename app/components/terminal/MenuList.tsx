import { useRef } from "react";
import { Link } from "react-router";

export interface MenuItem {
  to: string;
  name: string;
  detail?: string;
}

/**
 * ls-style navigable menu: real links (mouse, middle-click, SEO) with
 * arrow-key roving focus for keyboard users.
 */
export function MenuList({ items, label }: { items: MenuItem[]; label: string }) {
  const listRef = useRef<HTMLUListElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const links = [...(listRef.current?.querySelectorAll("a") ?? [])];
    if (links.length === 0) return;
    const active = document.activeElement;
    const index = links.findIndex((l) => l === active);
    let next = index;
    if (e.key === "ArrowDown") next = Math.min(index + 1, links.length - 1);
    if (e.key === "ArrowUp") next = Math.max(index - 1, 0);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = links.length - 1;
    if (index === -1) next = 0;
    e.preventDefault();
    links[next]?.focus();
  }

  return (
    <ul ref={listRef} className="term-menu" aria-label={label}>
      {items.map((item) => (
        <li key={item.to}>
          <Link to={item.to} onKeyDown={onKeyDown}>
            <span className="term-menu-name">{item.name}</span>
            {item.detail !== undefined && (
              <span className="term-dim">{"  "}{item.detail}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
