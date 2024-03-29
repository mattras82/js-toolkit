"use strict";
require('./styles.scss');
import PFSingleton from '../../lib/PFSingleton';
import Toolkit from '../../lib/Toolkit';

class Lightbox extends PFSingleton {

  iOSBodySelector = '#form, .off-canvas-wrapper, main, body > div';
  transparentClasses = ['lightbox-image', 'lightbox-video', 'lightbox-iframe'];
  focusableElementsString = "a[href], area[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";

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
    this.defaultContentID = 'lightbox-aria-desc';
    this.defaultLabelID = 'lightbox-aria-label';
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
      bodySelector = this.iOSBodySelector;
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
    this.$overlay.ariaHidden = 'true';
    this.$overlay.tabIndex = -1;
    this.$body.append(this.$overlay);
  }

  addContainer() {
    this.$container = document.createElement('div');
    this.$container.classList.add('lightbox-container');
    this.$container.setAttribute('role', 'dialog');
    this.$container.ariaModal = 'true';
    this.$body.append(this.$container);
  }

  getCloseButton() {
    return this.stringToHTML(`<button class="lightbox-close" type="button" aria-label="Close popup">
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
      let closed = false;
      this.transparentClasses.forEach(name => {
        if (!closed && e.target && e.target.classList.contains(name)) {
          closed = true;
          this.close();
        }
      });
    });
    this.$elements.forEach($el => $el.addEventListener('click', e => { this.handleClick(e, $el); }));
    this.keydownListenerRef = this.keydownListener.bind(this);
  }

  keydownListener(e) {
    if (e.keyCode === 9) {
      if (e.shiftKey) {
        // SHIFT + TAB
        if (document.activeElement === this.$firstTabStop) {
          e.preventDefault();
          this.$lastTabStop.focus();
        }
      } else {
        // TAB
        if (document.activeElement === this.$lastTabStop) {
          e.preventDefault();
          this.$firstTabStop.focus();
        }
      }
    }

    if (this.closeOnEscape && this.$body.classList.contains('lightbox-open') && e.code === 'Escape') {
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
    if (!this.closing) {
      this.closing = true;
      if (window.forceLightboxOpen) {
        if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-forced-open', { bubbles: true }));
        this.closing = false;
        return false;
      }
      if (this.customEvent) {
        if (!this.$eventElement.dispatchEvent(new CustomEvent('lightbox-before-close', { cancelable: true, bubbles: true }))) {
          this.closing = false;
          return false;
        }
      }
      this.$body.classList.add('lightbox-transition');
      this.timeout().then(this.clearLightbox.bind(this));
      if (this.scrollPos > 0) {
        // Keeping this line for IE compatibility (for now)
        window.scrollTo(0, this.scrollPos);
        // Forcing the scroll to instant in case the site is using CSS for smooth scrolling
        window.scrollTo({top:this.scrollPos,behavior:'instant'});
        this.scrollPos = null;
      }
      document.removeEventListener('keydown', this.keydownListenerRef);
      this.$container.tabIndex = -1;
      [...this.$container.parentElement.children].forEach($e => {
        if ($e !== this.$container && $e !== this.$overlay && $e.nodeName !== 'SCRIPT') {
          if ($e.dataset.oldAh) {
            $e.ariaHidden = $e.dataset.oldAh;
            $e.removeAttribute('data-old-ah');
          } else {
            $e.removeAttribute('aria-hidden');
          }
          if ($e.dataset.oldTi) {
            $e.tabIndex = $e.dataset.oldTi;
            $e.removeAttribute('data-old-ti');
          } else {
            $e.removeAttribute('tab-index');
          }
        }
      });
      this.$returnFocusEl.focus();
      this.$returnFocusEl = null;
    }
  }

  clearLightbox() {
    this.$body.classList.remove('lightbox-transition', 'lightbox-open');
    if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-closed', { bubbles: true }));
    let $desc = this.$container.querySelector(`#${this.defaultContentID}`);
    if ($desc) {
      $desc.removeAttribute('id');
    }
    let $label = this.$container.querySelector(`#${this.defaultLabelID}`);
    if ($label) {
      $label.removeAttribute('id');
    }
    this.clearContainer();
    if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-cleared', { bubbles: true }));
    this.closeOnEscape = true;
    this.$eventElement = null;
    this.$tabableElements = [];
    this.$firstTabStop = null;
    this.$lastTabStop = null;
    this.closing = false;
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
    this.ariaLabel = null;
    this.tempClasses = this.tempClasses.filter(c => this.$container.classList.remove(c) && false);
    this.$container.removeAttribute('aria-label');
    this.$container.removeAttribute('aria-labelledby');
    this.$container.removeAttribute('aria-describedby');
  }

  open(content) {
    if (!this.opening) {
      this.opening = true;
      this.$returnFocusEl = document.activeElement;
      if (this.$body.classList.contains('lightbox-transition')) {
        this.timeout().then(() => {
          this.open(content);
        });
        this.opening = false;
        return false;
      }
      if (this.isIOS()) {
        this.scrollPos = window.scrollY ? window.scrollY : window.pageYOffset;
      }
      if (this.beforeContent.length) {
        this.beforeContent.forEach($el => this.$container.append($el));
      }
      content.id = content.id || this.defaultContentID;
      this.$container.append(content);
      this.$container.setAttribute('aria-describedby', content.id);
      if (this.afterContent.length) {
        this.afterContent.forEach($el => this.$container.append($el));
      }
      this.$tabableElements = [...this.$container.querySelectorAll(this.focusableElementsString)];
      this.$firstTabStop = this.$tabableElements[0];
      this.$lastTabStop = this.$tabableElements[this.$tabableElements.length - 1];
      let $title = this.$container.querySelector('.lightbox-title, h1, .h1, h2, .h2')
      if ($title) {
        $title.id = $title.id || this.defaultLabelID;
        this.$container.setAttribute('aria-labelledby', $title.id);
      } else if (this.ariaLabel) {
        this.$container.ariaLabel = this.ariaLabel;
      } else if (this.$tabableElements.filter($e => !$e.classList.contains('lightbox-close') && $e.innerText.toUpperCase() !== 'OK').length) {
        this.$container.ariaLabel = 'Your response is needed';
      } else {
        this.$container.ariaLabel = 'Informative Message';
      }
      this.tempClasses.forEach(c => this.$container.classList.add(c));
      this.$container.tabIndex = 0;
      this.$body.classList.add('lightbox-open');
      [...this.$container.parentElement.children].forEach($e => {
        if ($e !== this.$container && $e !== this.$overlay && $e.nodeName !== 'SCRIPT') {
          if ($e.ariaHidden && !$e.dataset.oldAh) {
            $e.setAttribute('data-old-ah', $e.ariaHidden);
          }
          if ($e.tabIndex && !$e.dataset.oldTi) {
            $e.setAttribute('data-old-ti', $e.tabIndex);
          }
          $e.ariaHidden = 'true';
          $e.tabIndex = -1;
        }
      });
      this.$firstTabStop.focus();
      if (this.customEvent) this.$eventElement.dispatchEvent(new CustomEvent('lightbox-opened', { bubbles: true }));
      this.getNodes('.lightbox-close', this.$container).forEach($e => {
        $e.addEventListener('click', this.close.bind(this));
      });
      document.addEventListener('keydown', this.keydownListenerRef);
      this.opening = false;
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

    if (opts.title || $el.getAttribute('title')) {
      let $title = document.createElement(opts.titleElement || 'h2');
      $title.innerHTML = opts.title || $el.getAttribute('title');
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

    if (typeof opts.onClose === 'function') {
      let closeFunction = e => {
        opts.onClose.bind($el)(e);
        $el.removeEventListener('lightbox-closed', closeFunction);
      };
      $el.addEventListener('lightbox-closed', closeFunction);
    }

    if (typeof opts.onOpen === 'function') {
      let openFunction = e => {
        opts.onOpen.bind($el)(e);
        $el.removeEventListener('lightbox-opened', openFunction);
      };
      $el.addEventListener('lightbox-opened', openFunction);
    }

    if (opts.buttons) {
      const createButton = btn => {
        let $btn = document.createElement('button');
        $btn.type = 'button';
        if (typeof btn.click === 'function') {
          $btn.addEventListener('click', btn.click.bind($el));
        }
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
      }
      if ($buttons.children.length) this.afterContent.push($buttons);
    }

    return true;
  }

  openFromElement($el, opts = {}) {
    if (!($el instanceof Element)) return false;
    if (!$el.classList.contains('lightbox-loaded')) this.preLoadContent($el);

    if (this.opening) {
      return false;
    }
    if (this.closing) {
      this.timeout(100).then(() => {
        this.openFromElement($el, opts);
      });
      return false;
    }

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

    if (this.opening) {
      return false;
    }
    if (this.closing) {
      this.timeout(100).then(() => {
        this.handleClick(e, $a);
      });
      return false;
    }

    let anchor = $a.dataset.lbAnchor || $a.getAttribute('href'),
      src = $a.dataset.lbSrc || $a.getAttribute('src'),
      content = null,
      $content = this.getNode('[data-lb-content]', $a) || this.getNode('.lightbox-content', $a),
      opts = {};

    if ($a.title) {
      opts.title = $a.title;
    } else if (src && $a.alt) {
      this.ariaLabel = $a.alt;
    }

    if ($a.dataset.lbLabel) {
      this.ariaLabel = $a.dataset.lbLabel;
    }

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
        let lm = Toolkit.getModule('LazyMedia');
        if (lm && lm.checkQueue) {
          lm.checkQueue($img);
        } else {
          $img.loading = 'loading';
          $img.src = $img.dataset.src;
        }
      }
    });
    this.getNodes('noscript', $content).forEach($n => $n.remove());
    $content.classList.add('lightbox-loaded');
  }

  getIframeContent(src) {
    let $frame = document.createElement('iframe');
    $frame.src = src;
    $frame.setAttribute('allowfullscreen', 'allowfullscreen');
    $frame.setAttribute('allow', 'fullscreen; autoplay');
    $frame.addEventListener('load', () => {
      this.$container.classList.remove('loading');
    }, { once: true });
    this.tempClasses.push('loading');
    this.tempClasses.push('lightbox-iframe');
    if (!this.ariaLabel) this.ariaLabel = 'Embedded frame';
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
    if (!this.ariaLabel) this.ariaLabel = 'Image';
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
    if (!this.ariaLabel) this.ariaLabel = 'Video';
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