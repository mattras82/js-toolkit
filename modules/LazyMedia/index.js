"use strict";
import { Toolkit } from "../../lib/Toolkit";

require('./styles.scss');
import PFSingleton from '../../lib/PFSingleton';
require('@iconfu/svg-inject');

const selectors = 'img[data-src], img[data-srcset], source[data-src], source[data-srcset], video[data-poster], [data-lazy-bg]';

class LazyMedia extends PFSingleton {

  constructor() {
    super(selectors, 'LazyMedia');
    this._queue = [];
    this.processed = [];
  }

  init($els) {
    if (!LazyMedia.instance) {
      this.setInstance();
    }
    if (this === LazyMedia.instance) {
      if ('IntersectionObserver' in window) {
        if (!this.observer) {
          this.observer = new IntersectionObserver(this.watch.bind(this), { rootMargin: '20%', threshold: 0.01 });
        }
        this.supportsNative = 'loading' in HTMLImageElement.prototype;
        $els.forEach($el => {
          if ($el.tagName.toLowerCase() === 'source') {
            let $parent = $el.parentNode;
            $parent.classList.add('queued', 'queued-parent');
            if (!this._queue.includes($parent)) {
              this._queue.push($parent);
              this.observer.observe($parent);
            }
          } else if (this.supportsNative && $el.getAttribute('loading') === 'lazy') {
            // Default to native browser lazy-loading
            this.show($el);
          } else {
            $el.classList.add('queued');
            this._queue.push($el);
            this.observer.observe($el);
          }
        });
      } else {
        $els.forEach($el => {
          this.show($el);
        });
      }
      if (this._queue.length > 0) {
        SVGInject.setOptions({
          afterInject: ($img, $svg) => {
            if (!$svg || !$svg.classList) return;
            $svg.classList.add('replaced-svg');
          }
        });
      }
    }
  }

  watch(entries) {
    this.processed = [];
    entries.forEach(e => {
      if (e.isIntersecting) {
        this.show(e.target);
        this.processed.push(e.target);
      }
    });
    this.checkQueue();
  }

  checkQueue($check) {
    if ($check) {
      this.show($check);
      this.processed.push($check);
    }
    this.processed.forEach($el => {
      this._queue = this._queue.filter($e => $e !== $el);
      if (this.observer) this.observer.unobserve($el);
    });
    if (this.observer && this._queue.length === 0) {
      this.observer.disconnect();
    }
  }

  show($el) {
    if ($el.dataset.srcset) {
      $el.srcset = $el.dataset.srcset;
    }
    if ($el.dataset.src) {
      $el.src = $el.dataset.src;
    }
    if ($el.dataset.poster) {
      $el.poster = $el.dataset.poster;
    }
    if ($el.dataset.lazyBg) {
      $el.style.backgroundImage = $el.dataset.lazyBg.startsWith('url') ? $el.dataset.lazyBg : `url(${$el.dataset.lazyBg})`;
      $el.classList.remove('queued');
      $el.classList.add('loaded');
      return true;
    }
    if ($el.classList.contains('queued-parent')) {
      this.getNodes('[data-src], [data-srcset]', $el).forEach(this.show.bind(this));
      if (typeof $el.load === 'function') $el.load();
    }
    $el.classList.remove('queued', 'queued-parent');
    if ($el.tagName.toLowerCase() === 'video') {
      $el.classList.add('loading');
      if ($el.readyState === 4) {
        this.loadComplete($el);
      }
      $el.addEventListener('loadeddata', () => {
        this.loadComplete($el);
      }, { once: true });
    } else if ($el.tagName.toLowerCase() === 'img') {
      $el.classList.add('loading');
      if ($el.complete) {
        this.loadComplete($el);
      } else {
        $el.addEventListener('load', () => {
          this.loadComplete($el);
        }, { once: true });
      }
    }
  }

  loadComplete($el) {
    $el.classList.remove('loading');
    $el.classList.add('loaded');
    if ($el.parentNode && $el.parentNode.tagName.toLowerCase() === 'picture') {
      this.loadComplete($el.parentNode);
    }
    if ($el.src && $el.src.endsWith('.svg')) {
      return SVGInject($el);
    }
    if (parseInt($el.getAttribute('width')) !== $el.naturalWidth
      && $el.naturalWidth > 0) {
      $el.setAttribute('width', $el.naturalWidth);
    }
    if (parseInt($el.getAttribute('height')) !== $el.naturalHeight
      && $el.naturalHeight > 0) {
      $el.setAttribute('height', $el.naturalHeight);
    }
  }

  observeMutations(target) {
    if ('MutationObserver' in window) {
      if (!this.mutationObserver) {
        this.mutationObserver = new MutationObserver(this.watchMutations.bind(this));
      }
      if (typeof target === 'string') {
        target = this.getNode(target);
      }
      if (target.nodeType) {
        this.mutationObserver.observe(target, {
          childList: true,
          subtree: true
        });
      }
    }
  }

  watchMutations(mutations) {
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        let $els = this.getNodes(selectors, mutation.target);
        if ($els && $els.length) {
          this.init($els);
        }
      }
    });
  }

  getInstance() {
    if (!LazyMedia.instance) {
      new LazyMedia().setInstance();
    }
    return LazyMedia.instance;
  }

  setInstance() {
    if (!LazyMedia.instance) {
      LazyMedia.instance = this;
    }
  }

  static LazyLoad($el) {
    if ($el) {
      if (LazyMedia.instance) {
        Toolkit.add(LazyMedia);
      }
      LazyMedia.instance.checkQueue($el);
      return true;
    }
    return false;
  }

  static getName() {
    return 'LazyMedia';
  }
}

export const LazyLoad = LazyMedia.LazyLoad;

export { LazyMedia };