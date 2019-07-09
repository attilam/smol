---
title: my new thing!
layout: post
thingies:
  - one
  - too
  - tree
something: two things
---

World! What's up I have a keyboard shortcut for you: \`Y\`. You like it?

\`\`\`csharp
public class MyClass {
  public void Hello() {
    Debug.Log("Hello!");
  }
}
\`\`\`

```csharp
public class MyClass {
  public void Hello() {
    Debug.Log("Hello!");
  }
}
```

This is some \`text\` with "quotes" and shit.

I have {{something}} that's _italics_, and **bold**.

{{#each thingies }}
- {{inc @index}}: {{this}}
{{/each}}

Something ordered perhaps:

1. one
2. two
3. three


- new thing
  - sub thing
- other thing

A [link](http://index.hu/)
A ![pic](blah.gif)

Some inline html:

@@@
<a href="http://blah.hu">blah!</a>
@@@
