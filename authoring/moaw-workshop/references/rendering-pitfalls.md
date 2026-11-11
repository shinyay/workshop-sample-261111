---
type: page
title: Rendering pitfalls
description: Problems that source-only Markdown checks can miss.
---

# Rendering pitfalls

These notes describe the pinned `@moaw/cli` 1.6.1 distribution. Its embedded
viewer reports build `sha.9deeac0`; the separately inspected upstream source
baseline is recorded in [Sources](sources.md). Recheck behavior when upgrading.

## A fence does not protect a page separator

MOAW splits the body using the raw pattern
`/(?:\n\n|\r\n\r\n)---(?:\n\n|\r\n\r\n)/`.
An example containing that pattern can unexpectedly create more pages.

To explain the boundary, use a numbered diagram or a description rather than a
literal blank-line-surrounded separator inside a fence. Count the actual pages
after rendering; do not rely only on a general Markdown parser.

## Asset rewriting also affects code

The loader rewrites unescaped occurrences of the asset directory prefix before
Markdown rendering. This is not limited to image elements. It can corrupt an
inline example or a POSIX copy command that happens to contain the same prefix.

```markdown
![An actual exercise image](\assets/diagram.svg)
```

In this reference's raw source, the backslash is deliberate. The MOAW page
removes it and leaves a copyable relative URL. If you read the source directly,
remove that single protective backslash before adding a real image to a workshop.
Do not change Windows filesystem backslashes as though they were MOAW escapes.

For a translated file in `translations`, use an actual parent-relative image
path pointing into the sibling assets directory. Check filename case on Linux
as well as Windows. Both the real image and its alternative text must be useful.

## A loaded SVG can still be unclear

An image request returning HTTP 200 does not prove that its text is legible.
Inspect the actual figure for clipped labels, connectors crossing text, unclear
branches, and labels that become too small when the viewer scales it down.
Use the `viewBox` and rendered text bounds to locate overflow, then inspect the
relationships visually too. Split a dense figure instead of merely shrinking it.

Keep a visible explanation and meaningful Markdown alternative text alongside
the SVG. Internal `title` and `desc` elements are useful, but are not a substitute
for those explanations or proof of screen-reader behavior. See the
[SVG guide](svg-diagrams.md).

## Variable substitution also affects code

Use source-level escaping for a *literal teaching example*:

```markdown
Event: **\$$event:Self-paced learning$$**
```

Use an unescaped token in an actual dynamic sentence. Check the rendered
example with variables absent and present; it should remain copyable in both
cases. The active sentence, in contrast, should change.

Variables are substituted before YAML parsing as well as before Markdown
rendering. Keep them out of metadata unless that behavior is intentional and
tested. Avoid quotes, delimiters, markup, or sensitive data in event values.

## HTML needs its blank lines

For admonitions and foldable answers, keep empty lines between opening HTML,
Markdown content, and closing HTML. Nest fences of different lengths when showing
a Markdown code block inside another Markdown code block.

## URLs and hosting

- Use the URL printed by the CLI, including the translation filename when
  applicable. `127.0.0.1` always means the reader's own machine.
- A folder source ending in `/` gets `workshop.md` appended. A different
  filename must be explicit.
- Use `https://aka.ms/ws?src=create-workshop/`, not an invented path below a
  short URL. For the full catalog route, use the destination website URL.
- A project GitHub Pages deployment needs the correct base path for scripts,
  styles, content, images, routing, and the 404 fallback.
- The distributed HTML shell contains upstream `/moaw/` base logic and a
  Clarity tag. A separate host must adapt the shell and remove that tag.
  Preserve the renderer bundles and their licenses; do not patch minified JS.

## Diagnose from the visible failure

| Symptom | Check |
| --- | --- |
| Could not load workshop/page | Requested Markdown URL, HTTP status, front matter, browser console |
| Extra pages | Raw separator patterns, including inside fences |
| Missing image | Rewritten URL, relative translation path, case, actual file |
| Copy command points at a URL | Unescaped asset prefix in the source example |
| Example shows an event value instead of syntax | Missing variable escape in the teaching example |
| Page crashes on a deep link | `step` validity and content page count |
| Language changes but content does not | Whether the native component was reloaded with the new source |
| Styles disappear on refresh | Project base and 404 fallback, not Markdown content |
| CLI waits before printing a preview URL | BrowserSync's external DNS connectivity probe, including blocked DNS on a restricted network |

Do not disable certificate verification to work around network failures.
Report untested behavior rather than presenting it as verified.

For an offline diagnostic with the pinned CLI, BrowserSync recognizes the
process-local environment variable `TESTING=1` and skips its connectivity probe.
In a separate PowerShell terminal, use `$env:TESTING = '1'` before the usual
preview command, then close that terminal when finished. In a POSIX shell, prefix
the preview command with `TESTING=1`. This is a dependency-specific diagnostic,
not a general MOAW option; it does not disable TLS checks or change permissions.
