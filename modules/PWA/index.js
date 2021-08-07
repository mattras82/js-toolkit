"use strict";
require('./styles.scss');
import PFBase from '../../lib/PFBase';

class PWA extends PFBase {

  constructor() {
    super('#add2home, .add2home', 'PWA');
    return this;
  }

  init($buttons) {
    let config = PF_Toolkit.config;
    if (!config) {
      return this.log('Config object must be added to the Toolkit for this module', 'warn');
    }
    if (config.use_pwa) {
      if (!config.env.production) {
        return this.log('Please run WebPack under production mode to register the service worker', 'warn');
      }
      this.registerSW();
      if ($buttons.length) {
        $buttons.forEach($button => {
          this.listenForPrompt($button);

          $button.addEventListener('click', e => {
            e.preventDefault();
            $button.classList.remove('active');
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice
              .then(choiceResult => {
                this.deferredPrompt = null;
              });
          });
        });
      }
    } else {
      this.removeSW();
    }
  }

  listenForPrompt($button) {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e;
      $button.classList.add('active');
    });
  }

  removeSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return false;
        if (reg.active) {
          this.sendMessage(reg.active, {action: 'remove'});
        }
        reg.unregister();
      });
    }
  }

  registerSW() {
    if (window.location.protocol !== 'https:')
      return this.log('This site is not using HTTPS, which is required by PWA standards.', 'error');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (typeof reg === 'object' && reg.active) {
          // We've already registered this service worker
          return true;
        } else {
          navigator.serviceWorker.register('/sw.js').then((registration) => {
            let worker = null;
            if (registration.installing) {
              worker = registration.installing;
            } else if (registration.waiting) {
              worker = registration.waiting;
            } else if (registration.active) {
              this.addCurrentPage(registration.active);
              return true;
            }
            if (worker) {
              worker.addEventListener('statechange', (event) => {
                if (event.target.state === 'activated') {
                  this.addCurrentPage(worker);
                }
              });
            }
          });
        }
      });
    }
  }

  addCurrentPage(worker = null) {
    this.sendMessage(worker, {
      action: 'cache',
      url: location.href
    });
  }

  sendMessage(worker = null, message = {}) {
    if (worker && ['activated', 'installed'].indexOf(worker.state) > -1) {
      worker.postMessage(message);
    }
  }

  static getName() {
    return 'PWA';
  }
}

export { PWA };