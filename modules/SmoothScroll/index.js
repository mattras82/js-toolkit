"use strict";
import PFBase from '../../lib/PFBase';
import Cookies from '../../util/Cookies';

class SmoothScroll extends PFBase {

  constructor() {
    super('.smooth-scroll', 'SmoothScroll');
    this.browserSupport = 'scrollBehavior' in document.documentElement.style;
    let pageLoad = Cookies.get('smooth-scroll');
    if (pageLoad) {
      let $dest = this.getNode(pageLoad);
      if ($dest) {
        this.processDestination($dest);
      }
    }
    return this;
  }

  init($links) {
    $links.forEach($link => {
      if (!$link.smoothScroll) {
        $link.addEventListener('click',(e) => {
          this.handleClick(e, $link);
        });
        $link.smoothScroll = true;
      }
    });
  }

  handleClick(e, $link) {
    let href = $link.getAttribute('href');
    if (!href) return false;
    if (href.startsWith('/')) {
      e.preventDefault();
      let parts = href.split('#');
      if (parts.length !== 2) return this.log(`The smooth scroll link has not been configured properly: ${href}`, 'warn');
      Cookies.set('smooth-scroll', `#${parts[1]}`, 1);
      if (parts[0]) location.href = parts[0];
    } else if (href.startsWith('#')) {
      this.processSelector(href, e);
    }
  }

  processSelector(selector, event) {
    let $dest = this.getNode(selector);
    if ($dest) {
      this.processDestination($dest, event);
    }
  }

  processDestination($dest, event = false) {
    let destination = $dest.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 4.5);
    if (isNaN(destination)) return false;
    if (event) event.preventDefault();
    this.setupScroll(destination);
  }

  setupScroll(d) {
    if (this.browserSupport) {
      window.scrollTo({
        top: d,
        behavior: 'smooth'
      });
      this.stop();
      return true;
    }
    this.destination = this.destination || d;
    if (this.getNode('.lightbox-transition, .lightbox-open')) {
      document.addEventListener('lightbox-closed', this.setupScroll.bind(this), {once:true});
      return false;
    }
    this.distance = Math.abs(this.destination - window.pageYOffset);
    this.duration = this.getDuration(this.distance);
    this.iterations = Math.ceil(this.duration / 15);
    this.chunk = this.distance / this.iterations * (this.destination > window.pageYOffset ? 1 : -1);
    this.iteration = 0;
    if (window.pfSmoothScroll) return false;
    this.interval = setInterval(this.iterate.bind(this), 15);
    window.pfSmoothScroll = true;
  }

  iterate() {
    if (this.iteration === this.iterations) {
      this.scroll(this.destination);
      this.stop();
    } else {
      this.scroll(pageYOffset + this.chunk);
      this.iteration++;
    }
  }

  scroll(yPos) {
    if (!this.animating) {
      this.scrollTo = yPos;
      window.requestAnimationFrame(this.animate.bind(this));
      this.animating = true;
    }
  }

  animate() {
    window.scrollTo(0, this.scrollTo);
    this.animating = false;
  }

  stop() {
    clearInterval(this.interval);
    this.destination = null;
    Cookies.delete('smooth-scroll');
    window.pfSmoothScroll = undefined;
  }

  /**
   * Static function to attach a SmoothScroll click listener to the element that is passed.
   * @param $el
   * @returns {boolean}
   */
  static Listen($el) {
    if ($el && $el.addEventListener && !$el.smoothScroll) {
      let instance = PF_Toolkit && PF_Toolkit.modules.SmoothScroll ? PF_Toolkit.modules.SmoothScroll : new SmoothScroll();
      $el.addEventListener('click',(e) => {
        instance.handleClick(e, $el);
      });
      $el.smoothScroll = true;
      return true;
    }
    return false;
  }

  /**
   * Static function to scroll directly to an element.
   * @param {string|Element} selector Either the selector string or the element object to scroll to
   * @returns {boolean}
   */
  static ScrollTo(selector) {
    if (selector) {
      let instance = PF_Toolkit && PF_Toolkit.modules.SmoothScroll ? PF_Toolkit.modules.SmoothScroll : new SmoothScroll();
      if (typeof selector === 'string') {
        instance.processSelector(selector);
        return true;
      } else if (typeof selector.getBoundingClientRect === 'function') {
        instance.processDestination(selector);
        return true;
      }
    }
    return false;
  }

  static getName() {
    return 'SmoothScroll';
  }

  getDuration(distance) {
    if (distance < 300) {
      return distance * 1.05;
    } else if (distance < 850) {
      return distance * 0.75;
    } else if (distance < 1000) {
      return distance * 0.65;
    } else if (distance < 1650) {
      return distance * 0.45;
    } else if (distance < 2500) {
      return distance * 0.25;
    }
    return distance * 0.15;
  }
}

export const Listen = SmoothScroll.Listen;
export const ScrollTo = SmoothScroll.ScrollTo;
export { SmoothScroll };