# PublicFunctions's JavaScript Toolkit

This package contains modules & tools to be used for quick and easy front-end development.

## Installation
```shell
$ npm i public-function-toolkit
```

## Basic Usage
To import & load all modules, you'll need to import the default object and add the theme's config file to it. This is as simple as the following example:
```javascript
// Include the site's main stylesheet
require('../styles/theme.scss');
// Import the PF Config file
import config from '../../config/config';
// Import the default Toolkit module
import Toolkit from 'public-function-toolkit';
Toolkit.addConfig(config);
```

## Detailed Usage
To import & load specific modules, list them out in the import declaration, then add them to the Toolkit object.
```javascript
// Include the site's main stylesheet
require('../styles/theme.scss');
// Import the PF Config file
import config from '../../config/config';
// Import each module individually. Unused imports will be filtered out in production mode
import {
  Toolkit,
  SocialSharing,
  SmoothScroll,
  LazyMedia,
  Lightbox
} from 'public-function-toolkit'
Toolkit.add(LazyMedia);
Toolkit.add(SmoothScroll);
Toolkit.add(Lightbox);
Toolkit.addConfig(config);
```

## Quick Reference
- [LazyMedia](#lazymedia)
- [Lightbox](#lightbox)
- [SmoothScroll](#smoothscroll)
- [SocialSharing](#socialsharing)
- [PWA](#pwa)
- [Cookies](#cookies)


# LazyMedia
This module adds functionality to lazy load images, background images, picture elements, and videos as they're about to be scrolled into the viewport.
- [Lazy Images](#lazy-images)
- [Lazy Backgrounds](#lazy-backgrounds)
- [Lazy Pictures](#lazy-pictures)
- [Lazy Videos](#lazy-videos)

### Lazy Images
To lazyload an `img` element, you'll need to add a `data-src` and/or `data-srcset` attribute to the HTML.

If you don't know the image's dimensions while rendering the markup, you can use an encoded PNG like this:
```html
<img data-src="/this/is/the/path/to/my/image.jpg" alt="My alt text" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN89h8AAtEB5wrzxXEAAAAASUVORK5CYII=">
```

If you *do* know the image's dimensions while rendering the markup, you can use an encoded SVG so that there's no loading "jank" or "stutter" while the image file is being downloaded by the browser.
```html
<img data-src="/this/is/the/path/to/my/image.jpg" alt="My alt text" width="500" height="300" src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20height='500'%20width='300'%3E%3C/svg%3E">
```
Notice that the width & height attributes are applied to the element, and those values are also added to the SVG code in the `src` attribute.

### Lazy Backgrounds
To lazyload a background image, you'll need to add the `data-lazy-bg` attribute to the HTML element with the value that you'll want as the `background-image` CSS property.

For a simple image, you can add the path to the attribute.
```html
<div data-lazy-bg="/the/path/to/my/background.jpg">
    <p>My Content</p>
</div>
```

If you want to use multiple images and/or a fallback gradient, then you'll need to add the CSS directly to the attribute.
```html
<div data-lazy-bg="url(/the/path/to/my/background.jpg), linear-gradient(#fff, #ccc)">
    <p>My Content</p>
</div>
```

### Lazy Pictures
Picture elements are used similar to the image elements. You can add the `data-src` and/or `data-srcset` attributes to the source element within a picture tag.
```html
<picture>
    <source type="image/webp" data-srcset="small.webp 400w, large.webp 800w">
    <img data-src="/fallback.jpg" alt="My alt text" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN89h8AAtEB5wrzxXEAAAAASUVORK5CYII=">
</picture>
```

### Lazy Videos
You can lazyload the video files as well as the poster image for video elements by using the `data-src` attribute on the source elements and the `data-poster` attribute on the video element.
```html
<video data-poster="/my-poster.jpg">
    <source type="video/mp4" data-src="/my-video.mp4">
    <source type="video/webm" data-src="/my-video.webm"
</video>
```

## SASS Reference

|Name|Type|Default Value|Description|
|:---|:---|:---|:---|
|$lazy-background| Color| #eaeaea| The background color of the image while it is loading
|$lazy-min-width| Number| 55px| The minimum width of a lazy image without a "width" attribute before it is loaded.
|$lazy-min-height| Number| 55px| The minimum height of a lazy image without a "height" attribute before it is loaded.


# Lightbox
This module adds functionality for a lightbox (also known as modal, fancybox, popup) with support for images, videos, iframes, embeds, and more.
- [Basic Lightbox](#basic-lightbox)
- [Nested Content Lightbox](#nested-content-lightbox)
- [Basic Image Lightbox](#basic-image-lightbox)
- [Secondary Image Lightbox](#secondary-image-lightbox)
- [Iframe Lightbox](#iframe-lightbox)
- [Embed (YouTube) Lightbox](#embed-lightbox)
- [Lightbox Options](#lightbox-options)

### Basic Lightbox
The most basic implementation is to add the "lightbox" class to a link with a relative anchor. You can also add a `data-lb-anchor` attribute, which will override the `href` attribute. It's best to use the `href` attribute to maintain high accessibility and compatibility for non-JavaScript users.
```html
<a href="#hidden" class="lightbox" id="lightbox-link">Show Hidden Text</a>
<div style="display: none">
    <div id="hidden">
        <p>I'm a hidden paragraph.</p>
    </div>
</div>
```

You can manually trigger a Lightbox to open by calling the `click()` function on the link element.
```js
let $link = document.querySelector('#lightbox-link');
if ($link) {
  $link.click();
}
```

### Nested Content Lightbox
You can nest hidden content within a clickable lightbox element by adding either the "lightbox-content" class or the `data-lb-content` attribute to a child element.

This technique is especially useful if you're looping through a series of elements that will all be lightboxes, such as product previews.
```html
<div class="lightbox">
    <p>Label text</p>
    <div style="display: none">
        <div class="lightbox-content">
            <p>Nested hidden content.</p>
        </div>
    </div>
</div>
```

### Basic Image Lightbox
If you want to open an image in a lightbox by clicking it, just add the "lightbox" class.
```html
<img src="/my-image.jpg" alt="My alt text" class="lightbox">
```

### Secondary Image Lightbox
If you want to open a secondary image in a lightbox by clicking a different image, add the URL to the secondary image to the `data-lb-src` attribute on the image element. 

This technique is helpful if you want to display a thumbnail image and then show the full size image when clicked.
```html
<img src="/my-thumbnail.jpg" alt="My alt text" data-lb-src="/my-full-size-img.png">
```

### Iframe Lightbox
To show an iframe in a lightbox, simply add the URL for the iframe as the `data-lb-iframe` attribute of the clickable element.
```html
<a href="#" data-lb-iframe="https://publicfunction.site">View Public Function Homepage</a>
```

### Embed Lightbox
If you want to show an embedded link (such as a YouTube embed) in a lightbox, just add the URL for the embed iframe as the `data-lb-iframe` attribute of the clickable element.
```html
<a href="#" data-lb-iframe="https://www.youtube.com/embed/xyuMvwWZv2w">View Video</a>
```

As a best practice, you should add the embed URL as the `href` of the link for non-JavaScript compatibility.
```html
<a href="https://www.youtube.com/embed/xyuMvwWZv2w" data-lb-iframe="https://www.youtube.com/embed/xyuMvwWZv2w" target="_blank" rel="noopener">View Video</a>
```

### Lightbox Options
The lightbox container element has a built-in button that will close the lightbox. This element can be targeted by adding your own CSS:
```css
.lightbox-container > .lightbox-close {
  background: red;
}
``` 
 You can add additional elements that will close the lightbox by adding the "lightbox-close" class. Those closing elements also play nicely with the SmoothScroll module of this toolkit. If you want to scroll to a section on the page after the lightbox is closed, simply add both classes to the link.
 ```html
<div class="lightbox-content">
    <p>My lightbox content.</p>
    <a href="#contact" class="lightbox-close smooth-scroll button">Go to Contact Form</a>
</div>
```

##### data-lb-class
If you need to add your own custom styles to a certain lightbox (or any lightbox), you can add a list of classes to the `data-lb-class` attribute of the clickable element. The value of that attribute will be added to the main ".lightbox-container" element when it's opened.
```html
<a href="#hidden-form" class="lightbox" data-lb-class="my-form-lightbox">View Form</a>
```
```css
/* This will only affect the lightbox container that is opened by the link above */
.my-form-lightbox {
  max-width: 300px;
  background-color: black;
  color: white;
}
```

There is one built-in class that you can leverage in this option for video lightboxes. If you'd like to force the lightbox into a 16:9 ratio for videos, simply add "lightbox-vid-ratio" in this option.
```html
<a data-lb-iframe="https://www.youtube.com/embed/xyuMvwWZv2w" data-lb-class="lightbox-vid-ratio">Open Video</a>
```

##### data-lb-copy
By default, any content on the same page is "cut" from its original place in the DOM and moved to the ".lightbox-container" element. This allows existing event listeners to remain intact. If you'd like to copy the HTML instead, simply add the `data-lb-copy` attribute to the clickable element.
```html
<a href="#hidden" class="lightbox" data-lb-copy>Copy the HTML content</a>
```

## JavaScript Events
All of the events are dispatched on the element that is sent to be opened in the lightbox, and they will bubble up the DOM as needed. Some events are cancelable, which will halt the current operation if canceld. 

The JavaScript events emitted by this module are:

|Name|Cancelable|Description|
|:---|:---|:---|
|lightbox-before-open| yes| Fired after the element to be opened has been determined, and before any options have been determined.|
|lightbox-opened| no| Fired after the "lightbox-open" class has been added, which makes the lightbox visible to the user.|
|lightbox-before-close| yes| Fired when the lightbox begins the close() method.|
|lightbox-closed| no| Fired after the "lightbox-open" class has been removed, which hides the lightbox.|
|lightbox-cleared| no| Fired after the container element has been cleared of the contents and the module has returned to a neutral state.|
|lightbox-forced-open| no| Fired when the lightbox begins the close() method, but the window.forceLightboxOpen variable is set to true. This event is used by other modules that force a lightbox to stay open (requiring user interaction).|

## JavaScript Exports
The module exports a few helper functions so that you can use the Smooth Scroll functionality after page load.

### LightboxListen()
This function attaches the Lightbox `click` event listener to the DOM element that is passed.

Parameters:
- `$el` *Element* DOM element to listen to

Returns *boolean*

#### Example
```javascript
import {LightboxListen} from 'public-function-toolkit';

// ES6 syntax
let $anchor = document.querySelector('#link');
LightboxListen($anchor);

// jQuery syntax
$('.custom-links').each(function() {
  var jQueryObject = $(this);
  LightboxListen(jQueryObject[0]);
});
```

### LightboxOpen()
This function opens the Lightbox with the given HTML or jQuery element and an optional set of configuration options.

Parameters:
- `$el` *Element* DOM element that will go in the lightbox
- `opts` *Object* Object with configuration options

Returns *boolean*

#### Example
```javascript
import {LightboxOpen} from 'public-function-toolkit';

// ES6 syntax
let $element = document.querySelector('#modal');
LightboxOpen($anchor);

// jQuery syntax
let $el = $('#modal');
let options = {
  class: 'custom-class',
  title: 'My jQuery Element'
};
LightboxOpen($el, options);
```

#### Supported Options
|Name|Type|Description|
|:---|:---|:---|
|class| String/Array| Class (or classes) to add to the lightbox container element. This is the same as using the `data-lb-class` HTML option.
|closeOnEscape| Boolean| Determines whether or not to add a keyup listener that will close the lightbox when the ESC button is pushed.
|title| String| Text for a prepended title element.
|titleElement| String| The element tag for the title element. Defaults to 'h2'.
|titleClass| String/Array|  Class (or classes) to add to the title element.
|close| Function|  A function that runs when the `lightbox-close` event fires. The function will only run once, and binds the `$el` variable as the `this` value.
|open| Function|  A function that runs when the `lightbox-opened` event fires. The function will only run once, and binds the `$el` variable as the `this` value.
|buttons| Array/Object|  A list of objects that define one or more buttons to append to the lightbox. If this property is an array, each object supports 3 values: `text`, `class`, `click`. If this property is an object, each key of the object will be the button text, and the value should be a function that will be added as the `click` listener.

### LightboxClose()
This function will close the lightbox, if applicable.

Returns *boolean*

#### Example
```javascript
import {LightboxClose} from 'public-function-toolkit';

let closeLightbox = true;
if (closeLightbox) {
  LightboxClose();
}
```

## SASS Reference

|Name|Type|Default Value|Description|
|:---|:---|:---|:---|
|$lightbox-container-bg| Color| $white or #ffffff| The background color of the main container.
|$lightbox-container-margin| Number| 1rem| The margin value of the main container.
|$lightbox-container-padding| Number| 1rem| The padding value of the main container.
|$lightbox-overlay-opacity| Number| 0.95| The opacity of the overlay element.
|$lightbox-overlay-color| Color| #333333| The color of the overlay element.
|$lightbox-loading-color| Color| get-color(primary) or #349bd7| The color of the loading spinner element when an image, video, or iframe is loading in the lightbox.
|$lightbox-loading-size| Number| 120px| The size of the loading spinner element.
|$lightbox-loading-thickness| Number| 16px| The thickness of the loading spinner element.


# SocialSharing
This module adds functionality to share content to popular social networking sites and/or email.

Supported Networks:
 - [x] FaceBook
 - [x] Twitter
 - [x] LinkedIn
 - [x] Email

In order to use this functionality, you'll need a container element with the following attributes: `data-social-links`, `data-title`, `data-url`. You can also add `data-desc` and `data-src` to add more data to the LinkedIn popup & email links.

WordPress example:
```php
<?php
while (have_posts()) : the_post() ?>
<div data-social-links 
    data-title="<?php the_title() ?>" 
    data-url="<?php the_permalink() ?>"
    data-desc="<?php the_excerpt() ?>"
    data-src="<?php bloginfo('name') ?>">
    <a href="#" data-popup="facebook">Share to Facebook</a>
    <a href="#" data-popup="twitter">Share to Twitter</a>
    <a href="#" data-popup="linkedin">Share to LinkedIn</a>
    <a href="#" data-popup="email">Share to Email</a>
</div>
<?php endwhile;
```

## SASS Reference
This module comes with some default styling by adding the "social-sharing-link" class to each link. This class is not necessary for the functionality, though. The variables to modify the styles for that class are listed below:

|Name|Type|Default Value|Description|
|:---|:---|:---|:---|
|$social-share-bg| Color| get-color(primary) or #349bd7| The background color link.
|$social-share-color| Color| $white or #ffffff| The foreground color of the link.
|$social-share-size| Number| 2.25rem| The width & height of the link.
|$social-share-margin| Number| 1rem 0.25rem| The margin property of the link.
|$social-share-hover-bg| Number| scale_color($social-share-bg, $lightness: -14%)| The background color when the link is hovered over by the user.


# SmoothScroll
This module adds functionality for internal links, either on the same page or a different page, to animate scrolling up or down to the linked content.

### Same Page SmoothScroll
The basic usage for this module is to add the "smooth-scroll" class to an internal link.
```html
<a href="#footer" class="smooth-scroll">Scroll to footer</a>
```

### Different Page SmoothScroll
If you want to link to a specific element on a separate page, but still have the smooth scrolling behavior, you'll need to format the link as a relative URL and add the ID of the element to scroll to.
```html
<a href="/separate-page#my-content" class="smooth-scroll">Go to page then scroll</a>
```

## JavaScript Exports
The module exports a few helper functions so that you can use the Smooth Scroll functionality after page load.

### ScrollListen()
This function attaches the `click` event listener to the DOM element that is passed.

Parameters:
- `$el` *Element* DOM element to listen to

Returns *boolean*

#### Example
```javascript
import {ScrollListen} from 'public-function-toolkit';

// ES6 syntax
let $anchor = document.querySelector('#link');
ScrollListen($anchor);

// jQuery syntax
$('.custom-links').each(function() {
  var jQueryObject = $(this);
  ScrollListen(jQueryObject[0]);
});
```

### ScrollTo()
This function scrolls directly to the DOM element *or* the DOM selector that is passed. 

Parameters:
- `$el` *String*|*Element* Query selector string or DOM element to scroll to

Returns *boolean*

#### Example
```javascript
import {ScrollTo} from 'public-function-toolkit';

// ES6 syntax with element
let $anchor = document.querySelector('#link');
ScrollTo($anchor);

// jQuery syntax with element
ScrollTo($('#link')[0]);

// Syntax for selector
ScrollTo('#link');
```

# PWA
This module registers & communicates with a Service Worker file (named "sw.js") that lives at the root of your site.


# Cookies
This module is simply a group of helper functions to access the `document.cookies` property.

## JavaScript Functions

### get()
Gets the value from the browser's cookies

Parameters:
- `name` *String* Name of the cookie

Returns *String*|*boolean* Will return the value of the cookie as a string, or `false` if the cookie doesn't exist

#### Example
```javascript
import {Cookies} from 'public-function-toolkit';

let val = Cookies.get('my-cookie');
```

### set()
Sets a cookie

Parameters:
- `name` *String* Name of the cookie
- `value` *String* Value of the cookie
- `expiration` *Int* Number of days before the cookie expires

#### Example
```javascript
import {Cookies} from 'public-function-toolkit';

// Set a cookie that will expire in 30 days
Cookies.set('my-cookie', 'value', 30);
```

### delete()
Deletes a cookie

Parameters:
- `name` *String* Name of the cookie

#### Example
```javascript
import {Cookies} from 'public-function-toolkit';

Cookies.delete('my-cookie');
```

### getAll()
Gets all of the browser's cookies

Returns *Object* Will return a JS object with the cookie names as the object's keys and the corresponding values

#### Example
```javascript
import {Cookies} from 'public-function-toolkit';

let allCookies = Cookies.getAll();
for (let name of Object.keys(allCookies)) {
  console.log(`Cookie ${name}: ${allCookies[name]}`);
}
```