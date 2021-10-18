"use strict";
import PFSingleton from './PFSingleton';

class Toolkit extends PFSingleton {

  constructor() {
    super(true, 'Toolkit');
    this.modules = [];
    this.version = '1.0.2';
    window.addEventListener('DOMContentLoaded', this.run.bind(this));
    return this;
  }

  init() {
    if (!Toolkit.instance) {
      this.setInstance();
    }
    if (this === Toolkit.instance && !window.PF_Toolkit) {
      if (!this.config) {
        this.config = {
          version: this.version,
          name: 'Public Function JS Toolkit'
        };
      }
      this.addToWindow();
      for (let m in this.modules) {
        this.modules[m].run();
      }
    }
  }

  addToWindow() {
    if (!window.PF_Toolkit) {
      window.PF_Toolkit = {
        modules: this.modules,
        config: this.config,
        version: this.version,
        get: this.getModule
      };
      if (typeof CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('pf-toolkit-init'));
      }
    }
  }

  addModule(moduleClass) {
    let i = moduleClass.getName();
    if (this.modules.hasOwnProperty(i)) {
    } else {
      if (typeof moduleClass === 'function') {
        if (moduleClass.hasOwnProperty('instance')) {
          let mod = moduleClass.instance;
          if (mod) {
            return this.modules[i] = mod;
          }
        }
        let mod = new moduleClass();
        if (mod) {
          this.modules[i] = mod;
          return mod;
        }
      }
    }
    return this;
  }

  getModule(name) {
    return this.modules[name] || {};
  }

  static add(moduleClass) {
    if (!Toolkit.instance) {
      new Toolkit().setInstance();
    }
    Toolkit.instance.addModule(moduleClass);
  }

  static get(name) {
    if (!Toolkit.instance) {
      new Toolkit().setInstance();
    }
    return Toolkit.instance.getModule(name);
  }

  static addConfig(config) {
    if (!Toolkit.instance) {
      new Toolkit().setInstance();
    }
    Toolkit.instance.config = config;
    if (window.__rocketLoaderEventCtor) {
      // Fix for CloudFlare's RocketLoader messing with
      // the DOMContentLoaded event
      Toolkit.instance.init();
    }
  }

  getInstance() {
    if (!Toolkit.instance) {
      new Toolkit().setInstance();
    }
    return Toolkit.instance;
  }

  setInstance() {
    if (!Toolkit.instance) {
      Toolkit.instance = this;
    }
  }
}

export {
  Toolkit
};

export default new Toolkit().getInstance();