import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithApp } from "~/test/utils";
import { MenuList } from "./MenuList";

const items = [
  { to: "/blog", name: "blog/" },
  { to: "/work", name: "work/", detail: "projects" },
  { to: "/contact", name: "contact.txt" },
];

describe("MenuList", () => {
  it("renders real links with hrefs", () => {
    renderWithApp(<MenuList items={items} label="site" />);
    expect(screen.getByRole("link", { name: /blog/ })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("list", { name: "site" })).toBeInTheDocument();
  });

  it("moves focus with arrow keys, Home, and End", async () => {
    const user = userEvent.setup();
    renderWithApp(<MenuList items={items} label="site" />);
    const links = screen.getAllByRole("link");
    links[0]!.focus();
    await user.keyboard("{ArrowDown}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(links[2]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(links[2]).toHaveFocus(); // clamped at end
    await user.keyboard("{ArrowUp}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(links[0]).toHaveFocus();
    await user.keyboard("{End}");
    expect(links[2]).toHaveFocus();
  });
});
