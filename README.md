
# SMOL

A static site generator.

This is my attempt for a staticgen to fit my needs. It's an organic mess, because I use it as a playground to tinker with ideas, but it's also tiny.

It uses

- [Simple-Markdown](https://github.com/Khan/simple-markdown), but a bastardized version I hacked up (removed flow, react, added some obscure stuff)
- [YAML](https://github.com/nodeca/js-yaml) + [front-matter](https://github.com/jxson/front-matter), for configuration, and meta-data stuff
- [Handlebars](http://handlebarsjs.com/), for inline page templating, and page layouts (e.g. per page theming)
- [highlight.js](https://highlightjs.org/), for automatic syntax highlighting

## Assets & Metadata

Assets are compiled using `fileRules`. At the moment there are only rules for markdown/HTML files, the rest are just copied as-is.

Each asset inherits a set of meta-data that it can override from site-wide settings to the asset itself. It's like this:

- site wide config (config.yml)
- route-specific settings
- generated parameters (e.g. file name, title)
- the asset's own front-matter, if it has any

For example if a page has the `layout` specified in the YAML front-matter it will use that. If not then it can fall back to the one specified by the route, and if that doesn't have one specified it will resort to the site configuration's default.

## TO-DO

- Site (.htaccess)
  - "if HTML exists, use that"

- Config, Meta-data
  - come up with a proper set of meta-data so the `<head>` can be created properly!

- Generator
  - DONE ~~context creation should happen _before_ file processing, so early-out can happen (e.g. for `is_draft`)~~
  - list pages, taxonomy support
    - DONE ~~preload content from all routes possibly needed~~
    - DONE ~~"text files" would have to be marked as such, and scanned for front matter in a prepass~~
    - site config could contain a list of index pages, with layout, sortBy, filterBy, etc
  - DONE ~~should work with any extension! e.g. compile markdown, use HTML, just copy binary files~~
  - DONE ~~`slug`: custom filename~~
  - DONE ~~`is_draft`: skip file~~
  - DONE ~~`pass_through`: don't do any compilation with the file, just let it through~~
  - add date handling for pages, via front matter/file info, create Handlebars helper(s)
  - add extra post-process ability (e.g. minify output)
  - `needsLayout` is wrong, maybe use e.g. `layout: NULL` instead, asset should overrule fileRule!
  - use semantic HTML throughout https://www.lifewire.com/why-use-semantic-html-3468271
  - RSS/Atom support
  - move syntax highlighting out of Simple-Markdown
  - instead of `skip`, make it possible to override `fileRules` in `config.yml` for files matching a pattern
  - DONE ~~use SVGO to optimize SVGs https://github.com/svg/svgo~~
  - make it possible to embed SVGs into pages
  - try sqip? https://github.com/axe312ger/sqip

- Assets
  - DONE ~~copy assets into place in `public` directory~~
  - compile SASS/SCSS maybe (if I'll need it)
  - DONE ~~Assets could be just another route, but all content is pass-through!~~
  - generate different versions of images (e.g. for thumbnails)

- Layouts and Partials
  - DONE ~~add theme support~~
  - create proper layouts for front page, posts, articles, cheatsheets, Weekly Review, etc
  - layouts should be able to use whatever extension, if at all

## refs

https://dev.to/niorad/keeping-the-footer-at-the-bottom-with-css-grid-15mf
