---
type: page
title: MOAW workshop format
description: Metadata, pages, headings, exercises, images, and variables.
---

# MOAW workshop format

Begin with YAML front matter, then write Markdown. Start with the
[valid minimal template](../templates/workshop.md).

## Metadata

```yaml
---
published: false
type: workshop
title: A first MOAW workshop
short_title: First workshop
description: Practice a small task and check the result.
level: beginner
authors:
  - MOAW Copilot Kit contributors
contacts:
  - https://github.com/shinyay/moaw-copilot-kit
duration_minutes: 15
tags: moaw, markdown, beginner
navigation_levels: 2
navigation_numbering: true
sections_title:
  - Introduction
---
```

| Field | Requirement |
| --- | --- |
| `type` | `workshop` for a paged workshop; `page` for a supporting document |
| `title`, `description` | Nonempty descriptions of the actual learning material |
| `level` | `beginner`, `intermediate`, or `advanced` |
| `authors`, `contacts` | Nonempty lists, with the same number of entries in corresponding order |
| `duration_minutes` | A positive number, in minutes; do not quote it as a string |
| `tags` | A comma-separated string, not a YAML list |
| `published` | Optional boolean; a publishing/indexing signal, never access control |
| `short_title` | Optional shorter header title |
| `banner_url`, `video_url`, `audience` | Optional presentation/audience metadata |
| `navigation_levels`, `navigation_numbering` | Optional heading depth and boolean numbering control |
| `sections_title` | Optional list overriding page labels by position |

The upstream format permits partial `sections_title` overrides. This kit
deliberately requires a complete matching list when the field is supplied, so
English/Japanese page correspondence cannot silently drift.

Use spaces for YAML indentation. Changing metadata does not automatically change
headings written in the body. A supporting `page` needs its appropriate type and
title; it does not need workshop duration or difficulty metadata.

## Pages and headings

The pinned renderer splits raw Markdown on a line containing exactly three
hyphens, with an empty line before and after it. This also happens inside code
fences. Here is a *diagram*, not a paste-ready block:

```text
01  End of the first page.
02  [empty line]
03  ---
04  [empty line]
05  ## The next page
```

Use an `h1` for the introduction/title, then `h2` and `h3` headings for useful
navigation. A `step` query parameter is zero-based: `step=5` selects page 6.
Keep section labels in the same order as the pages.

## Admonitions and answers

The five admonition classes are `info`, `tip`, `warning`, `important`, and `task`.
Keep the blank lines around the blockquote and HTML tags.

```markdown
<div class="task" data-title="Try it">

> Create one heading and three unchecked checklist items.

</div>
```

````markdown
<details>
<summary>Show an example answer</summary>

```markdown
# Preparation

- [ ] Open the editor
- [ ] Open the workshop
- [ ] Check the working folder
```

</details>
````

## Images and literal examples

Put assets beside the workshop in an `assets` directory. Use forward slashes in
Markdown URLs even when filesystem commands use Windows backslashes.

Proactively use [SVG explanations](svg-diagrams.md) when a process, decision,
or relationship is clearer visually. Keep the diagram near its explanation
with useful alternative text and a visible caption.

```markdown
![A meaningful description](\assets/diagram.svg)
```

**Copy this example from the MOAW-rendered page.** In this reference's raw source,
the leading backslash protects the example from MOAW's asset rewriting. A real
image link in your workshop must use `assets` followed by `/diagram.svg`, without
that protective backslash. A translation one directory deeper can use a
parent-relative link, for example `../assets` followed by `/diagram.svg`.

## Variables and conditional visibility

The rendered copyable example below uses an event default:

```markdown
Event: **\$$event:Self-paced learning$$**
```

Add `?vars=event:Team%20Workshop,bonus:1` to a URL with no existing query, or
`&vars=...` when there is already a query. Commas separate variables; the colon
separates each key from its value. Avoid delimiter characters in values.

```html
<div data-visible="\$$bonus$$">

> An optional public exercise.

</div>

<div data-hidden="\$$bonus$$">

> The ordinary version.

</div>
```

These attributes control visibility, not permission to read the source.
Do not put secrets or restricted answers in conditional blocks or query strings.
See [rendering pitfalls](rendering-pitfalls.md) before copying raw examples.
