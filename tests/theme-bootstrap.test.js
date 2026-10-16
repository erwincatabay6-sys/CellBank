import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function initialize({ saved = null, system = "light", blocked = false }) {
  const root = { dataset: {}, style: {} };

  runInNewContext(bootstrap, {
    document: { documentElement: root },
    localStorage: {
      getItem(key) {
        assert.equal(key, "cellbank-theme");

        if (blocked) {
          throw new Error("Storage unavailable");
        }

        return saved;
      },
      setItem() {
        assert.fail("System defaults must not be saved as explicit choices");
      },
    },
    window: {
      matchMedia(query) {
        assert.equal(query, "(prefers-color-scheme: dark)");
        return { matches: system === "dark" };
      },
    },
  });

  return root;
}

for (const system of ["light", "dark"]) {
  test(`first visit applies system ${system} before React loads`, () => {
    const root = initialize({ system });
    assert.equal(root.dataset.theme, system);
    assert.equal(root.style.colorScheme, system);
  });

  test(`invalid stored value falls back to system ${system}`, () => {
    assert.equal(initialize({ saved: "invalid", system }).dataset.theme, system);
  });

  test(`unavailable storage still applies system ${system}`, () => {
    assert.equal(initialize({ system, blocked: true }).dataset.theme, system);
  });

  const saved = system === "dark" ? "light" : "dark";

  test(`saved ${saved} overrides system ${system} before React loads`, () => {
    const root = initialize({ saved, system });
    assert.equal(root.dataset.theme, saved);
    assert.equal(root.style.colorScheme, saved);
  });
}
