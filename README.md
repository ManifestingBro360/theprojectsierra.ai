# Project website

The site for the organisation and its projects. Static, no dependencies.

```bash
node build.mjs                 # writes dist/
python3 -m http.server 4173 --directory dist
```

- `config.json` holds the organisation name, the domain, the GitHub address,
  the list of projects and the list of adopters. Change a name or the domain
  there and rebuild; nothing else needs editing.
- `src/pages/*.html` are the pages. The first line of each is a JSON comment
  with its path, title and description.
- `src/_layout.html` is the shared head, header and footer.
- `src/static/` is copied as is.
- `node og/make.mjs` redraws the social preview images (needs Chrome).

## Add a project

1. Add an entry to `projects` in `config.json`.
2. Put its `mark.svg` in `src/static/assets/<slug>/`.
3. Add `src/pages/<slug>.html` with `"path": "/<slug>/"`.

## Add an adopter

1. Put the logo in `src/static/assets/adopters/`.
2. Add an entry to `adopters` in `config.json`:

```json
{ "name": "Example Co", "kind": "company", "url": "https://example.com", "logo": "example.svg", "uses": ["Canopy"] }
```

`kind` is `company`, `team` or `product`.

Pushing to `main` builds and deploys the site with GitHub Pages
(`.github/workflows/pages.yml`).
