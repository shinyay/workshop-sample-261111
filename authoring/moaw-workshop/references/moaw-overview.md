---
type: page
title: Understanding MOAW
description: The catalog, standard viewer, and CLI have different jobs.
---

# Understanding MOAW

**MOAW means The Mother Of All Workshops.** It is a collection of learning
materials and tools for finding, reading, creating, and sharing workshops.
It is not a service that automatically provisions participants' environments.

| Component | What it does | What it does not do |
| --- | --- | --- |
| Catalog | Indexes workshops, including external materials; supports discovery | Guarantee prerequisites, availability, quality, or free cloud resources |
| Standard viewer | Reads Markdown and metadata, then provides pages, a table of contents, exercises, and code-copy controls | Make source files private or upload them |
| MOAW CLI | Creates templates, previews files, generates links, preprocesses includes, converts AsciiDoc, and optionally translates | Publish a repository or register a catalog entry automatically |
| Public content host | Stores the Markdown and assets read by the viewer | Automatically add an entry to MOAW's catalog |

## Choose MOAW when

You want a hands-on, versioned learning experience whose instructions, exercises,
answers, and images can be reviewed as source files. A plain Markdown workshop
can be edited locally and shared independently of catalog registration.

Plan accounts, software, network access, cloud resources, cost controls, and
cleanup explicitly if a particular workshop needs them. MOAW itself does not
remove those requirements. The getting-started sample in this kit needs no Azure
resources or Copilot authentication for its required exercises.

## Two kinds of document

- A `workshop` splits into pages and provides workshop navigation.
- A `page` renders a supporting Markdown document on one page.

This kit uses the same official viewer for both its English documentation and its
bilingual workshop. It adds a small hosting/navigation adapter, not a replacement
Markdown renderer.

## Finding and reading are different

The catalog searches metadata, not every line of workshop text. The inspected
source baseline waits for at least three search characters. This is an
implementation observation, not a permanent API guarantee.

Catalog language filtering affects the list of results. It does not translate a
workshop or switch the current document's language. A directly addressable public
workshop can remain readable even when it is not in the catalog.

Use [the MOAW entry point](https://aka.ms/moaw) for discovery and
[the workshop shortcut](https://aka.ms/ws?src=create-workshop/) for a selected
workshop. Do not append arbitrary paths to a short URL: use the documented query
form or the destination website's full URL.

## Read next

[Workshop format](workshop-format.md) explains the file structure.
[Publishing and localization](publishing-and-localization.md) separates
previewing, sharing, and catalog registration. [Sources](sources.md) records
the inspected versions and upstream attribution.
