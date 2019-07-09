---
title: My New Thing!
created_at: 2019-07-09 10:43:47
layout: post
thingies:
  - one
  - too
  - tree
something: two things
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

{{#each thingies }}
{{inc @index}}. {{this}}
{{/each}}

Something ordered perhaps:



- new thing
  - sub thing
- other thing

A [link](http://index.hu/)
A ![pic](blah.gif)

Some inline html:

@@@
<a href="http://blah.hu">blah!</a>
@@@

That's that.

```js
console.log('some more code.')
```
