# ngDocEdit
A web technology based document editor for offline use with structured document support

Even when using Stylesheets in office applications one cannot define the whole template and make the content independent from it.
This is a lightweight, modular and plattform-independent approach using Angular.js and the powerful document editing functions
([execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)) of modern browsers that can be used to
implement WYSIWYG-editors in [a view lines](https://codepen.io/ElijahFowler/pen/fyILl) .

One intention is to make the editing features unobtrusive and let a document look like a webpage.

It is is modular in that way that it includes various javascript functions as well as angular directives and filters that can
be used in other projects with small modifications. It is written in jQuery style without requiring jQuery.

## Features (and reusable snippets)
* JSON.stringify variant, that serializes functions
* partial JQuery replacement (using angular and document.querySelectorAll)
* toggle readonly using bookmarklet javascript:setReadonly(false)
* make contenteditable working with Angular.js
* variable level heading tag `<hx></hx>`
* base64 Image pasting (for Chrome)
* automatic table of contents
* doubleclick code selecting
* blob data download
* dom observing
* Code highlighting using [hljs](https://highlightjs.org/)
* Keybindings for ESC and Ctrl+S
* Although using modern browser features, partly working for IE
