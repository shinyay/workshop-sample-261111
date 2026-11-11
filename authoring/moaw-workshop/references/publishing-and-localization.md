---
type: page
title: Publishing and localization
description: Preview, source hosting, viewer links, catalog registration, and translation.
---

# Publishing and localization

## Keep the operations separate

| Operation | Result |
| --- | --- |
| `moaw serve` | A local preview |
| Push approved files to a public repository | Publicly retrievable source and assets |
| `moaw link` or a viewer URL | A link selecting that source; no upload |
| Deploy a static viewer | A separately hosted reading experience |
| Propose an external catalog entry | A reviewable registration request, not immediate listing |

`published: false` is not a privacy setting. A public repository, raw file URL,
or direct viewer link can expose the contents regardless of that flag. Visibility
conditions and query variables also do not protect restricted material.

## Build a viewer link

```text
https://aka.ms/ws?src=gh:OWNER/REPOSITORY/REF/docs/
```

The placeholders identify an existing public GitHub source. The trailing `/`
selects `docs/workshop.md`. For another file, include its full filename:

```text
https://aka.ms/ws?src=gh:OWNER/REPOSITORY/REF/docs/solution.md
```

Use a simple ref such as `main`, a tag, or a commit SHA. The shortcut's path
segments can make branch names containing `/` ambiguous; do not promise they
work without testing. For a reproducible event, prefer an immutable content
revision and verify the final link before distribution.

The [MOAW entry point](https://aka.ms/moaw) is a shortlink; arbitrary appended
paths are not interchangeable with the actual website's routes. The inspected
upstream README says the `moaw.dev` domain is to be relinquished in 2027.
Retain a current upstream reference and recheck links before an event.

## Catalog registration

MOAW's `packages/database/external.yml` describes external workshops. Review its
current format, add accurate title, description, URL, language, date, authors,
contacts, level, duration, and tags, and submit a pull request only with permission.
Listing follows review, merge, and a website update.

Changing `published` alone does not add an external repository to the catalog.
Catalog language is registration metadata. It does not translate a document.
External workshops may have licenses different from MOAW's own materials.

## Translate the complete learning experience

Preserve page order, exercise numbers, goals, prerequisites, durations, expected
results, answers, warnings, and qualifications. Translate diagram labels and
alternative text. Keep commands, identifiers, URLs, and machine-readable keys
unchanged unless the locale or repository layout requires a tested adaptation.

For MOAW's conventional translation layout:

```text
workshop.md
assets/
translations/
  workshop.ja.md
```

The translation sits one level deeper, so image links may need `../` before the
assets directory. The official CLI handles serving a file in `translations`,
but it does not provide this kit's language selector.

## This kit's explicit language map

The hosted sample maps the English and Japanese workshop, starter, and solution
in `site/content-map.json`. English is the default.

The hosting adapter preserves the document, a valid zero-based `step`, and
`vars` during a switch. It drops an unmapped heading hash because translated
heading IDs are not interchangeable. Invalid steps are normalized before the
native viewer loads. The selected language and document language are updated.

This is a small site integration, not a MOAW language-filter feature. Ordinary
MOAW workshops created with this Skill do not need this adapter.

## Credit and license adaptations

Retain the original creators, source links, license, and an indication of
modifications. MOAW workshop content and this kit's prose/diagrams use
CC BY-SA 4.0; MOAW tooling and this kit's integration code use MIT.
See [Sources](sources.md) for the baseline and attribution.
