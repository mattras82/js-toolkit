"use strict";
require('./styles.scss');
import PFSingleton from '../../lib/PFSingleton';
import { LazyLoad } from "../LazyMedia";

class Lightbox extends PFSingleton {

  constructor() {
    super('.lightbox, [data-lb-src], [data-lb-iframe], [data-lb-anchor]', 'Lightbox');
    this.defaultTimeout = 350;
    this.tempClasses = [];
    this.beforeContent = [];
    this.afterContent = [];
    this.videoExtensions = ['mp4', 'webm', 'ogg', 'avi'];
    this.scrollPos = 0;
    this.iOSTest = null;
    this.closeOnEscape = true;
    return this.getInstance();
  }

  init($links) {
    if (!Lightbox.instance) {
      this.setInstance();
    }
    if (this === Lightbox.instance) {
      this.addElements();
      // Test for CustomEvent browser support
      this.customEvent = new CustomEvent('test');
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
    this.$body.append(this.$container);
  }

  getCloseButton() {
    return this.stringToHTML(`<button class="lightbox-close" type="button" aria-label="Close popup" tabindex="1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
                                <path d="M11,14.143,3.143,22,0,18.853,7.855,11,0,3.148,3.142.007,11,7.859,18.856,0,22,3.143,14.14,11,22,18.859,18.857,22Z"/>
                                </svg>
                              </button>`
                            );
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
    this.keyupListenerRef = this.keyupListener.bind(this);
  }

  keyupListener(e) {
    if (this.$body.classList.contains('lightbox-open') && e.code === 'Escape') {
      this.close();
    }
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
   * Open a lightbox with the given HTML element as the content
   * @param {HTMLElement | String | Object} $el The element, HTML, or jQuery object to be placed into the Lightbox
   * @param {Object | null} opts Options
   * @returns {boolean}
   * @constructor
   */
  static OpenContent($el, opts) {
    if (!Lightbox.instance) {
      Toolkit.add(Lightbox);
    }
    if (Lightbox.instance.$body.classList.contains('lightbox-open')) {
      return false;
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

  /**
   * Closes the lightbox if it's currently open
   * @returns {boolean}
   * @constructor
   */
  static CloseContent() {
    if (!Lightbox.instance) {
      Toolkit.add(Lightbox);
    }
    if (Lightbox.instance.$body.classList.contains('lightbox-open')) {
      return Lightbox.instance.close();
    }
    return false;
  }

  close() {
    this.$eventElement = this.$eventElement || document;
    if (window.forceLightboxOpen) {
      if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-forced-open', { bubbles: true }));
      return false;
    }
    if (this.customEvent) {
      if (!this.$eventElement.dispatchEvent(new CustomEvent('lightbox-before-close', { cancelable: true, bubbles: true }))) return false;
    }
    this.$body.classList.add('lightbox-transition');
    this.timeout(300).then(this.clearLightbox.bind(this));
    if (this.scrollPos > 0) {
      window.scrollTo(0, this.scrollPos);
      this.scrollPos = null;
    }
    document.removeEventListener('keyup', this.keyupListenerRef);
    this.$container.tabIndex = 0;
  }

  clearLightbox() {
    this.$body.classList.remove('lightbox-transition', 'lightbox-open');
    this.clearContainer();
    if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-closed', { bubbles: true }));
    this.closeOnEscape = true;
    this.$eventElement = null;
  }

  clearContainer() {
    this.beforeContent = this.beforeContent.filter($el => $el.remove() && false);
    this.afterContent = this.afterContent.filter($el => $el.remove() && false);

    let removeList = [];
    for (let $child of this.$container.children) {
      if (!$child.classList.contains('lightbox-keep')) {
        let remove = { el: $child, parent: this.$contentParent };
        if (this.$contentParent && this.$contentParent.children.length > 0) {
          remove.adjacent = this.$contentParent.children.length <= this.contentPosition ? null : this.$contentParent.children[this.contentPosition];
        }
        removeList.push(remove);
      }
    }
    removeList.forEach(remove => {
      if (remove.parent) {
        if (remove.adjacent) {
          remove.parent.insertBefore(remove.el, remove.adjacent);
        } else {
          remove.parent.append(remove.el);
        }
      } else {
        remove.el.remove();
      }
    });

    this.$contentParent = null;
    this.contentPosition = null;
    this.tempClasses = this.tempClasses.filter(c => this.$container.classList.remove(c) && false);
  }

  open(content) {
    if (this.$body.classList.contains('lightbox-transition')) {
      this.timeout().then(() => {
        this.open(content);
      });
      return false;
    }
    if (this.isIOS()) {
      this.scrollPos = window.scrollY ? window.scrollY : window.pageYOffset;
    }
    if (this.beforeContent.length) {
      this.beforeContent.forEach($el => this.$container.append($el));
    }
    this.$container.append(content);
    if (this.afterContent.length) {
      this.afterContent.forEach($el => this.$container.append($el));
    }
    this.tempClasses.forEach(c => this.$container.classList.add(c));
    this.$container.tabIndex = 1;
    this.$body.classList.add('lightbox-open');
    this.$container.focus();
    if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-opened', { bubbles: true }));
    this.getNodes('.lightbox-close', this.$container).forEach($e => {
      $e.addEventListener('click', this.close.bind(this));
    });
    if (this.closeOnEscape) {
      document.addEventListener('keyup', this.keyupListenerRef);
    }
  }

  beforeOpen(opts, $el = document) {
    
    this.$eventElement = $el;

    if (this.customEvent) {
      if (!this.$eventElement.dispatchEvent(new CustomEvent('lightbox-before-open', { cancelable: true, bubbles: true }))) {
        return false;
      }
    }

    this.beforeContent.push(this.getCloseButton());

    if (opts.class) {
      if (typeof opts.class === 'string') opts.class = opts.class.split(' ');
      this.tempClasses = this.tempClasses.concat(opts.class);
    }

    if (typeof opts.closeOnEscape === 'boolean') {
      this.closeOnEscape = opts.closeOnEscape;
    }

    if (opts.title || $el.title) {
      let $title = document.createElement(opts.titleElement || 'h2');
      $title.innerHTML = opts.title || $el.title;
      if (opts.titleClass) {
        if (typeof opts.titleClass === 'string') {
          opts.titleClass = opts.titleClass.split(' ');
        }
      } else {
        opts.titleClass = [];
      }
      opts.titleClass.push('lightbox-title');
      $title.classList.add(...opts.titleClass);

      this.beforeContent.push($title);
    }

    if (typeof opts.close === 'function') {
      let closeFunction = e => {
        opts.close(e);
        document.removeEventListener('lightbox-closed', closeFunction);
      };
      document.addEventListener('lightbox-closed', closeFunction);
    }

    if (typeof opts.open === 'function') {
      let openFunction = e => {
        opts.open(e);
        document.removeEventListener('lightbox-opened', openFunction);
      };
      document.addEventListener('lightbox-opened', openFunction);
    }

    if (opts.buttons || opts.buttonOk) {
      const createButton = btn => {
        let $btn = document.createElement('button');
        $btn.type = 'button';
        $btn.tabIndex = 1;
        $btn.addEventListener('click', btn.click);
        $btn.innerHTML = btn.text;
        if (btn.class) {
          if (typeof btn.class === 'string') {
            btn.class = btn.class.split(' ');
          }
        } else {
          btn.class = [];
        }
        $btn.classList.add(...btn.class);
        return $btn;
      };

      let $buttons = document.createElement('div');
      $buttons.classList.add('lightbox-buttons');
      if (opts.buttons instanceof Array) {
        opts.buttons.forEach(btn => {
          $buttons.append(createButton(btn));
        });
      } else if (opts.buttons) {
        Object.keys(opts.buttons).forEach(label => {
          $buttons.append(
            createButton({
              text: label,
              click: opts.buttons[label]
            })
          );
        });
      } else if (opts.buttonOk) {
        $buttons.append(
          createButton({
            text: 'OK',
            class: 'lightbox-close'
          })
        );
      }
      if ($buttons.children.length) this.afterContent.push($buttons);
    }

    return true;
  }

  openFromElement($el, opts = {}) {
    if (!($el instanceof Element)) return false;
    if (!$el.classList.contains('lightbox-loaded')) this.preLoadContent($el);

    if (opts.copy) {
      $el = this.stringToHTML($el.innerHTML);
    } else if ($el.parentNode) {
      this.$contentParent = $el.parentNode;
      this.contentPosition = [...$el.parentNode.children].indexOf($el);
    }

    if (this.beforeOpen(opts, $el)) {
      this.open($el);
      return true;
    }
    return false;
  }

  handleClick(e, $a) {
    e.preventDefault();

    let anchor = $a.dataset.lbAnchor || $a.getAttribute('href'),
      src = $a.dataset.lbSrc || $a.getAttribute('src'),
      content = null,
      $content = this.getNode('[data-lb-content]', $a) || this.getNode('.lightbox-content', $a),
      opts = {};

    if ($a.title) {
      opts.title = $a.title;
    };

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
          this.$eventElement = content;
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
        this.$eventElement = content;
      }
    }
    if ($a.dataset.lbClass) {
      this.tempClasses = this.tempClasses.concat($a.dataset.lbClass.split(' '));
    }

    if (content && this.beforeOpen(opts, content)) this.open(content);
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
export const Close = Lightbox.CloseContent;
export { Lightbox };