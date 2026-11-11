---
type: page
title: An authoring workflow
description: Move from a learning objective to a tested MOAW workshop.
---

# An authoring workflow

## Define a small, observable outcome

Write one sentence describing what the learner will produce. State the audience,
required tools, prior knowledge, expected duration, language, and any costs.
For each exercise, specify both an action and a visible success condition.

Use a progression such as introduction, guided practice, independent change, and
reflection. Keep recovery hints and foldable answers close to their exercises.
Do not assume the environment is ready just because MOAW can display the page.

## Plan the visual explanations

Proactively identify where a diagram would clarify the learning flow, evidence,
dependencies, decisions, or expected changes. Record the question each figure
answers and place it next to the explanation the learner needs. Do not force a
diagram onto every page or substitute a decorative picture for clear instructions.

Use [SVG explanations](svg-diagrams.md) to make self-contained, accessible
figures with captions and meaningful connections. Keep illustrative assumptions
distinct from observations, and avoid giving away work learners should produce.
The [template](../templates/workshop.md) includes a reusable SVG; copy its sibling
`assets` directory too, then adapt both the diagram and its explanation.

## Create and preview

Inside an existing Node.js project, a project-local CLI avoids changing a global
installation. Use the project's lockfile when one is present.

```shell
npm install --save-dev --save-exact @moaw/cli@1.6.1
npx --no-install moaw new my-workshop
```

Inspect an existing target directory rather than overwriting it. Edit the
generated `workshop.md`, then run a preview on an unused loopback port.

PowerShell:

```powershell
npx --no-install moaw serve .\my-workshop\workshop.md --host 127.0.0.1 --port 4445
```

POSIX shell:

```sh
npx --no-install moaw serve ./my-workshop/workshop.md --host 127.0.0.1 --port 4445
```

Open the exact URL printed by the CLI. Keep the terminal open while using the
preview. Stop only your own server with `Ctrl+C` when finished. Basic authoring
and preview do not require Azure or a Copilot login.

## Match the command to its job

| Command | Job | Important boundary |
| --- | --- | --- |
| `moaw new NAME` | Create the official starter files | Inspect existing directories first |
| `moaw serve PATH` | Preview Markdown and watch local changes | A loopback URL is not public hosting |
| `moaw link FILE --branch REF` | Produce a viewer URL for content in a GitHub repository | Does not create a repository, push, or upload |
| `moaw build FILE` | Resolve `include::...[]` into a combined Markdown file | Does not build a complete HTML website |
| `moaw convert FILE` | Convert AsciiDoc into Markdown | Review output and unsupported constructs |
| `moaw translate FILE -l LANGUAGES` | Translate with GitHub Copilot CLI | Requires its additional installation/authentication; review the result |

Inspect `moaw --help` for the installed version before using optional flags.
Do not perform translation through an external service without the user's
authorization for that content.

## Validate while editing

After each meaningful change, check metadata, page count, navigation, images,
admonitions, answers, and copyable examples in the actual standard viewer.
Try variables with and without values. A successful server startup does not
prove that Markdown loaded.

For SVGs, inspect the real rendered text, connectors, labels, and captions at
the intended reading width. A valid XML file or loaded image can still be hard
to understand. Check code examples separately from actual image references.

Use the [validation checklist](validation-checklist.md), including a narrow
screen and keyboard navigation. When fixing a validator, run a deliberately
broken example as well as the valid workshop.

## Prepare sharing separately

Keep local preview, publishing source, generating a link, deploying a viewer, and
catalog registration as distinct operations. Do only the operations the user
authorized. Record the content revision, tools, license, and original authors.

For translations, maintain a page-by-page comparison of exercises and answers,
not just a count of files. See [publishing and localization](publishing-and-localization.md).
