
# SMOL

A static site generator.

This is my attempt for a staticgen to fit my needs. It's scruffy and dirty, but I can tinker with it in any way I like. And it's tiny, and doesn't have all the cruft of the generators I've come across.

It uses

- YAML + front-matter, for configuration, and meta-data stuff
- Handlebars, for inline page templating, and page layouts (e.g. per page theming)
- highlight.js, for automatic syntax highlighting

## Metadata

Each page inherits a set of meta-data that it can override from site-wide settings to the page itself. It's like this:

- site wide config (config.yml)
- route-specific settings
- generated parameters (e.g. file name, title)
- the page's own front-matter

For example if a page has the `layout` specified in the YAML front-matter it will use that. If not then it can fall back to the one specified by the route, and if that doesn't have one specified it will resort to the site configuration's default.

## TO-DO

- Site (.htaccess)
  - "if HTML exists, use that"

- Config, Meta-data
  - come up with a proper set of meta-data so the `<head>` can be created properly!

- Generator
  - should work with any extension! e.g. compile markdown, use HTML, just copy binary files
  - `slug`: custom filename
  - `is_draft`: skip file
  - `passThrough`: don't do any compilation with the file, just let it through
  - use semantic HTML throughout https://www.lifewire.com/why-use-semantic-html-3468271

- Assets
  - copy assets into place in `public` directory
  - compile SASS/SCSS maybe (if I'll need it)
  - Assets could be just another route, but all content is pass-through!

- Layouts and Partials
  - create proper layouts for front page, posts, articles, cheatsheets, Weekly Review, etc
  - layouts and partials should be able to use whatever extension, if at all

## refs

https://dev.to/niorad/keeping-the-footer-at-the-bottom-with-css-grid-15mf
