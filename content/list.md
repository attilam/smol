---
title: Articles
created_at: 2019-07-13 13:52:47
layout: default
---

# Articles

This is {{fileFullPath}}.

## Content

@@@
{{#assets filterBy="routeName=content" sortBy="title,inc"}}{{inc @index}}. <a href="{{sitelink}}">{{title}}</a>
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
