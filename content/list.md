---
title: Articles
created_at: 2019-07-13 13:52:47
layout: default
things:
  -
    target: blah.md
    num: 3
  -
    target: feh.md
    num: 9
  -
    target: luim.md
    num: 13
next_page: list2-2.md
gen_list:
  filter_by: tags=fancy
  sort_by: title,dec
---

# Articles

This is {{fileFullPath}}.

## Content

@@@
{{#assets filterBy="routeName=content" sortBy="title,dec"}}{{inc @index}}. <a href="{{sitelink}}">{{title}}</a>
{{/assets}}
@@@

## all assets

@@@
{{#each site.assets}}{{inc @index}}. {{title}}
{{/each}}
@@@

## by tags

@@@
{{#assets filterBy="tags=fancy" sortBy="title"}}{{inc @index}}. <a href="{{sitelink}}">{{title}}</a>
{{/assets}}
@@@

## has 'something'

@@@
{{#assets filterBy="something"}}{{inc @index}}. <a href="{{permalink}}">{{title}}</a>
{{/assets}}
@@@

## from the YAML header

@@@
<ul>
{{#each things}}  <li>{{num}}: {{target}}</li>
{{/each}}
</ul>
@@@

Here's some `{{{{raw-block}}}}{{handlebars}}{{{{/raw-block}}}}`.
