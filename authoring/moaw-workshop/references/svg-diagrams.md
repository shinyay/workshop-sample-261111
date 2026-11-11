---
type: page
title: Explain with SVG diagrams
description: Proactively use self-contained diagrams to clarify learning without inventing evidence or revealing exercise answers.
---

# Explain with SVG diagrams

When creating or materially revising a workshop, look for places where a visual
explanation would reduce the reader's effort. Add a useful SVG without waiting
for a separate request. For a review-only task, propose the improvement rather
than treating the review as permission to edit.

Use diagrams to supplement the explanation, not replace the learner's actions,
success conditions, or recovery hints. These are kit authoring recommendations,
not a MOAW requirement to put an image on every page.

## Choose a learning question

Start with one question the figure should answer. Put it near the first
explanation that needs it, before the exercise that relies on that understanding.
A concise overview can introduce the whole workshop; add local diagrams where
the overview does not explain enough. Avoid quotas and decorative box collections.

| What the learner needs to understand | Useful diagram | Preserve |
| --- | --- | --- |
| How the sections fit together | A learning flow with inputs and handoffs | The actual chapter names and order |
| How an observation supports a conclusion | An evidence chain with a return path for unknowns | Facts, assumptions, and unanswered questions |
| What changes as use grows | Qualitative stages or a measured trend | Whether values are assumptions or observations; units and time spans |
| How alternatives or scopes differ | A comparison, dependency map, or selection flow | Required conditions, deferred work, risks, and decision criteria |
| Who decides, acts, or checks | A role-based flow with approval points | Human authorization, stopping conditions, and failure paths |
| What a change should preserve | A before/after or verification flow | Expected outcomes versus actual results |

For each figure, identify its learning question, source facts, placement, and the
action it prepares the learner to take. If prose or a small table is clearer,
keep that instead.

## Protect the exercise and the evidence

- Explain the reasoning or procedure, not a completed analysis that learners are
  supposed to produce. Put worked answers only in the intended answer or solution
  location, not in an introductory diagram.
- Label illustrative examples, qualitative curves, proposed designs, and expected
  outcomes. Do not draw an untested path as a measured success.
- Preserve conditions, exceptions, dependencies, units, and uncertainty. Do not
  invent numbers to make a chart look complete.
- Distinguish current behavior from future requirements. A target architecture
  is not the same as the subset being implemented.
- Keep required protections and approval boundaries visible. A smaller exercise
  scope does not make required controls optional.

Use only material appropriate for the workshop's sharing scope. Do not transfer
customer details, credentials, private screenshots, or local machine paths into
a reusable figure.

## Draw a self-contained SVG

Author editable SVG text using shapes, connectors, and real text labels. No
image-generation service or additional drawing dependency is required.

1. Use a `viewBox` and consistent spacing, typography, and colors. Prefer the
   workshop's existing visual style. Choose text sizes for the final displayed
   width, not just the full-size source.
2. Make relationships explicit with arrow directions, groups, branch labels,
   and return paths. Do not rely on position or color alone to explain a decision.
3. Keep labels short and manually break long lines. Split an overloaded diagram
   rather than shrinking the text until it is unreadable.
4. Include a meaningful `title` and `desc`, `role="img"`, and `aria-labelledby`
   pointing to their IDs. Keep labels as text, not outlines or embedded screenshots.
   Give multiple inline SVGs distinct IDs if adapting them for another format.
5. Keep the asset self-contained: no scripts, event handlers, `foreignObject`,
   external images, remote fonts, or tracking. Use local fragment references for
   markers. Do not load an unreviewed external SVG as executable content.

The [illustrated template](../templates/workshop.md) includes a practice loop
with a retry path. It explains how to work, not what a finished checklist should
contain. Adapt its wording and relationships to the new learning objective.

## Keep the image, prose, and files together

Copy the template's Markdown and its entire sibling `assets` directory into the
new workshop folder, retaining this layout. Inspect an existing target first;
do not overwrite an unrelated workshop.

```text
my-workshop
  workshop.md
  assets
    learning-cycle.svg
```

Place the actual Markdown image near the relevant explanation. Add alternative
text that states the relationship, then a short visible caption explaining what
to notice and any important limitation. The SVG description alone does not
replace Markdown alternative text or a visible explanation.

```markdown
![Read the goal, make one change, check it, and revise if it does not match.](\assets/learning-cycle.svg)

The return arrow means to revise and check again. This is a practice workflow,
not evidence that an exercise has passed.
```

**Copy that example from the MOAW-rendered page.** The protective backslash in
this reference's raw source prevents asset rewriting inside the teaching
example. Remove it for an actual image link. Keep forward slashes in Markdown
URLs even when filesystem commands use Windows backslashes.

When translating, update the diagram's labels, title, description, alternative
text, and caption together. A translation in `translations` needs the appropriate
parent-relative image path. Keep the figure's meaning and conditions unchanged.
See [workshop format](workshop-format.md) and
[rendering pitfalls](rendering-pitfalls.md) for the standard viewer's path rules.

## Check the result in the actual viewer

- Parse the SVG as XML and resolve every local image reference, including
  case-sensitive paths and translated paths.
- Open the relevant page with the official MOAW viewer. Confirm the image loads,
  has useful alternative text, and sits next to the intended explanation.
- Inspect the rendered figure: text must fit its boxes and `viewBox`, connectors
  must not cross labels, and direction and branch meanings must be clear.
- Check the intended reading width and a narrow layout. If details become too
  small, simplify or split the figure and keep its meaning in nearby prose;
  the absence of horizontal overflow alone does not prove readability.
- Check the rendered copyable Markdown separately from the displayed image.
  Reopen the saved files and confirm the preview uses the latest revision.
- Report what was actually checked. SVG metadata is not a screen-reader test,
  and showing a verification flow is not executing its business or cloud checks.

Use the [validation checklist](validation-checklist.md) for the rest of the
workshop. Keep preview, source publication, and deployment separately authorized.
