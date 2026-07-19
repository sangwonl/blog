import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the startup script accepts three stored themes and defaults to TTY", async () => {
  const source = await readSource("src/layouts/ThemeScript.astro");

  assert.match(source, /\["light",\s*"dark",\s*"tty"\]/);
  assert.match(source, /:\s*"tty";/);
  assert.match(source, /classList\.remove\("light",\s*"dark",\s*"tty"\)/);
  assert.match(source, /tty:\s*"#031109"/);
});

test("the selector exposes accessible Light, Dark, and TTY choices", async () => {
  const source = await readSource("src/components/DarkModeToggle.astro");

  for (const theme of ["light", "dark", "tty"]) {
    assert.match(source, new RegExp(`data-theme="${theme}"`));
  }
  assert.match(source, /role="group"/);
  assert.match(source, /aria-label="Theme"/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /localStorage\.setItem\("theme"/);
});

test("the theme selector lives in the footer instead of the header", async () => {
  const header = await readSource("src/components/Header.astro");
  const footer = await readSource("src/components/Footer.astro");

  assert.doesNotMatch(header, /DarkModeToggle/);
  assert.match(footer, /import DarkModeToggle/);
  assert.match(footer, /<DarkModeToggle\s*\/>/);
});

test("TTY styles define terminal tokens, typography, and a safe scanline overlay", async () => {
  const source = await readSource("src/styles/global.css");

  assert.match(source, /\.theme-sleek\.tty\s*{/);
  assert.match(source, /\.theme-sleek\.tty[\s\S]*--color-primary-main:/);
  assert.match(source, /html\.tty::after/);
  assert.match(source, /pointer-events:\s*none/);
  assert.match(source, /font-family:\s*ui-monospace/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(source, /\.tty\s+(img|video)[^{]*{[^}]*filter:/);
});
