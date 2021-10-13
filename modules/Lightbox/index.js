"use strict";
require('./styles.scss');
import PFSingleton from '../../lib/PFSingleton';
import { LazyLoad } from "../LazyMedia";

class Lightbox extends PFSingleton {

  constructor() {
    super('.lightbox, [data-lb-src], [data-lb-iframe], [data-lb-anchor]', 'Lightbox');
    this.defaultTimeout = 350;
    this.tempClasses = [];
    this.videoExtensions = ['mp4', 'webm', 'ogg', 'avi'];
    this.scrollPos = 0;
    this.iOSTest = null;
    return this.getInstance();
  }

  init($links) {
    if (!Lightbox.instance) {
      this.setInstance();
    }
    if (this === Lightbox.instance) {
      this.addElements();
      this.beforeOpenEvent = new CustomEvent('lightbox-before-open');
      this.openedEvent = new CustomEvent('lightbox-opened');
      this.beforeCloseEvent = new CustomEvent('lightbox-before-close');
      this.closedEvent = new CustomEvent('lightbox-closed');
      this.forcedOpenEvent = new CustomEvent('lightbox-forced-open');
      this.addListeners($links);
    }
  }

  addElements() {
    let bodySelector = 'body';
    if (this.isIOS()) {
      bodySelector = '#form, .off-canvas-content, main, body > div';
    }
    this.$body = this.getNode(bodySelector);
    this.addOverlay();
    this.addContainer();
    this.$body.classList.add('lightbox-ready');
    this.$contentParent = null;
  }

  addOverlay() {
    this.$overlay = document.createElement('div');
    this.$overlay.classList.add('lightbox-overlay');
    this.$body.append(this.$overlay);
  }

  addContainer() {
    this.$container = document.createElement('div');
    this.$container.classList.add('lightbox-container');
    this.$container.innerHTML = `<button class="lightbox-close" type="button" aria-label="Close popup">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
                                    <path d="M11,14.143,3.143,22,0,18.853,7.855,11,0,3.148,3.142.007,11,7.859,18.856,0,22,3.143,14.14,11,22,18.859,18.857,22Z"/>
                                  </svg>
  
                                 </button>`;
    this.$body.append(this.$container);
  }

  addListeners() {
    this.getNodes('.lightbox-close', this.$container).forEach($cl => $cl.addEventListener('click', this.close.bind(this)));
    this.$overlay.addEventListener('click', this.close.bind(this));
    this.$container.addEventListener('click', e => {
      let transparentClasses = ['lightbox-image', 'lightbox-video', 'lightbox-iframe'];
      let closed = false;
      transparentClasses.forEach(name => {
        if (!closed && e.target && e.target.classList.contains(name)) {
          closed = true;
          this.close();
        }
      });
    });
    this.$elements.forEach($el => $el.addEventListener('click', e => { this.handleClick(e, $el); }));
  }

  /**
   * Static function to attach a Lightbox click listener to the element that is passed.
   * @param {HTMLElement} $el The element to attach the click listener to
   * @returns {boolean}
   * @constructor
   */
  static Listen($el) {
    if (!Lightbox.instance) {
      Toolkit.add(Lightbox);
    }
    if ($el && $el.addEventListener) {
      $el.addEventListener('click', e => { Lightbox.instance.handleClick(e, $el) });
      return true;
    }
    return false;
  }

  /**
   * 
   * @param {HTMLElement | String | Object} $el The element, HTML, or jQuery object to be placed into the Lightbox
   * @param {Object | null} opts Options
   * @returns {boolean}
   * @constructor
   */
  static OpenContent($el, opts) {
    if (!Lightbox.instance) {
      Toolkit.add(Lightbox);
    }
    if (typeof $el === 'string') {
      $el = Lightbox.instance.stringToHTML($el);
    } else if (typeof jQuery === 'function' && $el instanceof jQuery) {
      $el = $el[0];
    }
    if ($el instanceof HTMLElement) {
      return Lightbox.instance.openFromElement($el, opts);
    }
    return false;
  }

  open(content) {
    if (this.beforeOpenEvent) {
      if (!document.dispatchEvent(this.beforeOpenEvent)) return;
    }
    if (this.$body.classList.contains('lightbox-transition')) {
      this.timeout().then(() => {
        this.open(content);
      });
      return false;
    }
    if (this.isIOS()) {
      this.scrollPos = window.scrollY ? window.scrollY : window.pageYOffset;
    }
    this.$container.append(content);
    this.$body.classList.add('lightbox-open');
    this.tempClasses.forEach(c => this.$container.classList.add(c));
    if (this.openedEvent) document.dispatchEvent(this.openedEvent);
    this.getNodes('.lightbox-close', this.$container).forEach($e => {
      $e.addEventListener('click', this.close.bind(this));
    });
    document.addEventListener('keyup', e => {
      if (e.code === 'Escape') {
        this.close();
      }
    }, { once: true });
  }

  close() {
    if (window.forceLightboxOpen) {
      if (this.forcedOpenEvent) document.dispatchEvent(this.forcedOpenEvent);
      return false;
    }
    if (this.beforeCloseEvent) {
      if (!document.dispatchEvent(this.beforeCloseEvent)) return;
    }
    this.$body.classList.remove('lightbox-open');
    if (this.scrollPos > 0) {
      window.scrollTo(0, this.scrollPos);
      this.scrollPos = null;
    }
    this.$body.classList.add('lightbox-transition');
    this.timeout().then(this.clearLightbox.bind(this));
  }

  clearLightbox() {
    this.clearContainer();
    this.$body.classList.remove('lightbox-transition');
    if (this.closedEvent) document.dispatchEvent(this.closedEvent);
  }

  clearContainer() {
    for (let $child of this.$container.children) {
      if (!$child.classList.contains('lightbox-close')) {
        if (this.$contentParent) {
          if (this.contentPosition > 0) {
            this.$contentParent.insertBefore(this.contentPosition);
          } else {
            this.$contentParent.append($child);
          }
        } else {
          $child.remove();
        }
      }
    }
    this.$contentParent = null;
    this.contentPosition = null;
    this.tempClasses = this.tempClasses.filter(c => this.$container.classList.remove(c) && false);
  }

  openFromElement($el, opts = {}) {
    if (!($el instanceof Element)) return false;
    if (!$el.classList.contains('lightbox-loaded')) this.preLoadContent($content);
    
    if (opts.class) {
      if (typeof opts.class === 'string') opts.class = opts.class.split(' ');
      this.tempClasses = this.tempClasses.concat(opts.class);
    }
    if (opts.copy) {
      $el = this.stringToHTML($el.innerHTML);
    } else {
      this.$contentParent = $el.parentNode;
      this.contentPosition = [...$el.parentNode.children].indexOf($el);
    }

    this.open($el);
    return true;
  }

  handleClick(e, $a) {
    e.preventDefault();

    let anchor = $a.dataset.lbAnchor || $a.getAttribute('href'),
      src = $a.dataset.lbSrc || $a.getAttribute('src'),
      content = null,
      $content = this.getNode('[data-lb-content]', $a) || this.getNode('.lightbox-content', $a);

    if ($a.dataset.lbIframe) {
      content = this.getIframeContent($a.dataset.lbIframe);
    } else if (src) {
      let isVideo = false;
      this.videoExtensions.forEach(ext => {
        if (src.endsWith(ext)) {
          isVideo = true
        }
      });
      content = isVideo ? this.getVideoContent(src) : this.getImageContent(src);
    } else if (anchor) {
      if (typeof $a.dataset.lbCopy === 'string') {
        content = this.copyAnchorContent(anchor);
      } else {
        try {
          content = this.getNode(anchor);
          if (!content.classList.contains('lightbox-loaded')) this.preLoadContent(content);
          this.$contentParent = content.parentNode;
          this.contentPosition = [...content.parentNode.children].indexOf(content);
        } catch (e) {
          this.log(`Error in src: ${src}\n${e}`, 'warn');
        }
      }
    } else if ($content) {
      if (!$content.classList.contains('lightbox-loaded')) this.preLoadContent($content);
      if (typeof $a.dataset.lbCopy === 'string') {
        content = this.stringToHTML($content.innerHTML);
      } else {
        content = $content;
        this.$contentParent = content.parentNode;
        this.contentPosition = [...content.parentNode.children].indexOf(content);
      }
    }
    if ($a.dataset.lbClass) {
      this.tempClasses = this.tempClasses.concat($a.dataset.lbClass.split(' '));
    }

    if (content) this.open(content);
  }

  preLoadContent($content) {
    this.getNodes('img[data-src]', $content).forEach($img => {
      if (!$img.classList.contains('loaded')) {
        LazyLoad($img);
      }
    });
    this.getNodes('noscript', $content).forEach($n => $n.remove());
    $content.classList.add('lightbox-loaded');
  }

  getIframeContent(src) {
    let $frame = document.createElement('iframe');
    $frame.src = src;
    $frame.setAttribute('allowfullscreen', 'allowfullscreen');
    $frame.addEventListener('load', () => {
      this.$container.classList.remove('loading');
    }, { once: true });
    this.tempClasses.push('loading');
    this.tempClasses.push('lightbox-iframe');
    return $frame;
  }

  getImageContent(src) {
    let $image = document.createElement('img');
    $image.src = src;
    $image.addEventListener('load', () => {
      this.$container.classList.remove('loading');
    }, { once: true });
    this.tempClasses.push('loading');
    this.tempClasses.push('lightbox-image');
    return $image;
  }

  copyAnchorContent(anchor) {
    try {
      let $el = this.getNode(anchor);
      if (!$el.classList.contains('lightbox-loaded')) this.preLoadContent($el);
      return this.stringToHTML($el.innerHTML);
    } catch (e) {
      this.log(`Could not copy the anchor content\n${e}`, 'warn');
    }
    return null;
  }

  getVideoContent(src) {
    let $video = document.createElement('video');
    $video.src = src;
    $video.setAttribute('autoplay', '');
    $video.setAttribute('playsinline', '');
    $video.setAttribute('controls', '');
    $video.setAttribute('loop', 'loop');
    $video.addEventListener('loadeddata', () => {
      this.$container.classList.remove('loading');
    }, { once: true });
    document.addEventListener('lightbox-opened', () => {
      $video.play();
    }, { once: true });
    this.tempClasses.push('loading');
    this.tempClasses.push('lightbox-video');
    return $video;
  }

  stringToHTML(string) {
    if (!this.parser) {
      this.parser = new DOMParser();
    }
    return this.getNode('body', this.parser.parseFromString(string, 'text/html')).firstChild;
  }

  isIOS() {
    if (this.iOSTest === null) {
      let ua = window.navigator.userAgent;
      let iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      let webkit = !!ua.match(/WebKit/i);
      this.iOSTest = iOS && webkit && !ua.match(/CriOS/i);
    }
    return this.iOSTest;
  }

  getInstance() {
    if (!Lightbox.instance) {
      new Lightbox().setInstance();
    }
    return Lightbox.instance;
  }

  setInstance() {
    if (!Lightbox.instance) {
      Lightbox.instance = this;
    }
  }

  static getName() {
    return 'Lightbox';
  }

  polyfills() {
    if (window.NodeList && !NodeList.prototype.forEach) {
      NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (let i = 0; i < this.length; i++) {
          callback.call(thisArg, this[i], i, this);
        }
      };
    }
    if (window.Element && !Element.prototype.append) {
      Object.defineProperty(Element.prototype, 'append', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function append() {
          let argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

          argArr.forEach(function (argItem) {
            let isNode = argItem instanceof Node;
            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });

          this.appendChild(docFrag);
        }
      });
      Object.defineProperty(Element.prototype, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode !== null)
            this.parentNode.removeChild(this);
        }
      });
    }
    if (typeof window.CustomEvent !== 'function') {
      const CustomEvent = (event, params) => {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        let evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };

      CustomEvent.prototype = window.Event.prototype;

      window.CustomEvent = CustomEvent;
    }
  }
}

export const Listen = Lightbox.Listen;
export const Open = Lightbox.OpenContent;
export { Lightbox };