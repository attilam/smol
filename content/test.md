---
title: My New Thing!
created_at: 2019-07-09 10:43:47
layout: post
slug: tesuto
thingies:
  - one
  - too
  - tree
something: two things
customCSS: |-
  body {
    color: #292a2c;
    background: #F0F0F0;
  }
tags: [fancy]
---

World! What's up I have a keyboard shortcut for you: `Y`. You like it?

```csharp
public class MyClass {
  public void Hello() {
    Debug.Log("Hello!");
  }
}
```

This is some \`text\` with 'single' "double quotes" and shit.

I have {{something}} that's _italics_, and **bold**.

> A block quote to boot!

@@@
<ol>
{{#each thingies }}
<li>{{inc @index}}. {{this}}</li>
{{/each}}
</ol>
@@@

Something ordered perhaps:

- new thing
  - sub thing
- other thing

A [link](http://index.hu/)
A ![pic](c4d.jpeg)

Some inline html:

@@@
<a href="http://blah.hu">blah!</a>
@@@

That's that.

```js
console.log('some more code.')
```
