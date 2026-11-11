---
type: page
title: Sources, versions, and attribution
description: Primary sources and the boundaries of the evidence used by this kit.
---

# Sources, versions, and attribution

## MOAW

The authoring knowledge is adapted and expanded from materials by **Yohan
Lasorsa and Microsoft MOAW contributors**. The original Japanese learning sample
was authored with GitHub Copilot, attributed as "GitHub Copilot (learning sample)"
and "GitHub Copilot (completed example)", and provided for this repository.

This kit translates the sample, retains its exercises and answers, adapts setup
paths for this public repository, adds POSIX alternatives, corrects shortlink
usage, and adds a separate bilingual hosting adapter.

The inspected documentation/source baseline is
[`99e0e09fd5f5f6c2324aa679967d10910014640c`](https://github.com/microsoft/moaw/tree/99e0e09fd5f5f6c2324aa679967d10910014640c).
The pinned runtime is **`@moaw/cli` 1.6.1**, whose bundled viewer reports
**`sha.9deeac0`**. These are not the same revision. Runtime tests use the installed
distribution rather than assuming the source baseline and bundle are identical.

| Primary source | Purpose |
| --- | --- |
| [MOAW README](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/README.md) | Overview, license split, domain-transition notice |
| [Workshop template](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/template/workshop/workshop.md) | Metadata and starting structure |
| [Authoring workshop](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/workshops/create-workshop/workshop.md) | Pages, admonitions, assets, variables, publishing |
| [CLI README](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/packages/cli/README.md) | Command responsibilities and translation prerequisites |
| [Loader](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/packages/website/src/app/shared/loader.ts) | Preprocessing and content fetching |
| [Router](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/packages/website/src/app/router.ts) | Base path, routing, query state |
| [Contribution guide](https://github.com/microsoft/moaw/blob/99e0e09fd5f5f6c2324aa679967d10910014640c/CONTRIBUTING.md) | Contributions and catalog process |

## GitHub Copilot and hosting

| Primary source | Purpose |
| --- | --- |
| [Adding Skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills) | Skill structure, discovery, installation |
| [Creating Plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating) | Plugin authoring |
| [Plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) | Manifest fields and management commands |
| [Creating a marketplace](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace) | Marketplace layout and relative sources |
| [Agent Plugins 1.0 schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json) | Canonical closed manifest schema |
| [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) | Validated artifact deployment |

The package's installation checks target **GitHub Copilot CLI 1.0.98**.
Client documentation and actual CLI checks are distinct evidence. This project
does not claim to have exercised every Copilot client, account entitlement,
organization policy, or every workshop in the MOAW catalog.

## Licensing and evidence boundaries

This Skill, its references and template, the documentation, and sample diagrams
are licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Retain attribution, source links, and modification notices when adapting them.
MOAW tooling is MIT-licensed. The vendored Agent Plugins schema is Apache-2.0.
Other third-party components retain their licenses.

The project is a community resource, not an official Microsoft or GitHub product
or an endorsement by its upstream authors. Source and documentation observations
are identified above; the repository's test and maintenance instructions describe
how to reproduce runtime checks after changes.
