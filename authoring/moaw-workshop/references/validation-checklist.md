---
type: page
title: Workshop validation checklist
description: Validate the source, actual renderer, translation, and publication.
---

# Workshop validation checklist

## Source and content

- Parse YAML with a YAML parser; check required fields, types, aligned authors
  and contacts, and a string value for tags.
- Count pages using the pinned MOAW raw separator behavior. If page labels are
  supplied, check their intended relationship to the actual pages.
- Check fence balance, meaningful headings, admonition spacing, foldable
  answers, and useful image alternative text.
- Resolve every actual local image and link using the source file's directory.
  Check case-sensitive behavior; Windows-only success is insufficient.
- Keep literal asset and variable examples escaped for MOAW preprocessing.
- Check exercises against observable success conditions and realistic
  prerequisites. Do not conflate an example command with a command the learner
  can run in the supplied project.
- Inspect content intended for publication for secrets, private data, internal
  paths, and inappropriate localhost navigation links.

## SVG explanations

- Check whether a process, decision, or relationship would benefit from a diagram.
  Do not impose a figure count or add decoration without a learning purpose.
- Verify that each figure matches the surrounding text, chapter names, source
  facts, and exercise boundaries. Distinguish illustrative assumptions, expected
  outcomes, and actual results; do not expose a completed answer prematurely.
- Parse the SVG as XML. Check its `viewBox`, title, description, accessible ID
  references, useful Markdown alternative text, and visible caption.
- Keep SVGs self-contained, without scripts, event handlers, `foreignObject`,
  external images, fonts, or tracking.
- Inspect every rendered figure for clipped text, overlapping arrows or labels,
  unexplained colors, and legibility at the intended and narrow reading widths.
  No overflow does not necessarily mean readable text.
- Copy template assets with the Markdown and preserve relative paths.
  Follow the [SVG guide](svg-diagrams.md); record accessibility checks actually
  performed rather than claiming screen-reader coverage from metadata alone.

## Actual standard viewer

- Open every page, follow previous/next controls, and use the table of contents.
- Expand and collapse answers. Check real image loading, not just an image tag.
- Inspect or copy each important code example from the rendered page.
- Try event variables with and without values, and both states of conditional
  content.
- Open direct/deep links, reload, navigate back, and follow documentation links.
- Try a narrow screen and keyboard access. Ensure controls do not cover content.

## Translations

- Compare the same pages in both languages, including diagrams and accessibility
  text. Counts alone cannot establish equivalent meaning.
- Preserve exercise numbering, timings, commands, questions, and answers.
- Check parent-relative image paths and localized copyable examples.
- If a hosting site provides a language switch, preserve document, chapter, and
  approved variables; do not carry a locale-specific heading hash blindly.

## Validator checks

Run valid fixtures and intentionally invalid fixtures. Examples of failures that
must be observed include a missing required metadata field, wrong metadata type,
missing image, unmatched fence, and a raw separator inside a fenced example.
Assert the reason, not just a nonzero exit. A process-launch failure must not
masquerade as a rejected fixture.

## Distribution and publication

For a standalone Skill, copy the entire folder and confirm its references still
resolve. For a Plugin, validate the official schema and the marketplace entry,
then actually install and discover the Skill in an isolated configuration.

Keep the user's normal plugins, credentials, and settings unchanged. Do not send
management slash commands through `-p`; use actual non-interactive commands when
available, or an explicitly authorized interactive session.

For a website, check the deployed HTML, scripts, styles, Markdown, and SVGs under
the real project subpath. Check the final published revision and deployment
result, not just a workflow submission.

Record which checks ran, the versions involved, failures and repairs, and any
remaining limitations. Do not claim runtime verification from schema validation
or source inspection alone.
