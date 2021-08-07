"use strict";
import PFBase from './PFBase';

class PFSingleton extends PFBase {
  static instance;

  constructor(selector, name) {
    selector = selector || '';
    super(selector, name);
    this.setInstance();
    return this.getInstance();
  }

  setInstance() {
    throw new Error(`setInstance function must be implemented in extended class: ${this.constructor.name}`);
  }

  getInstance() {
    throw new Error(`getInstance function must be implemented in extended class: ${this.constructor.name}`);
  }

  getExport() {
    return Object.freeze(this.getInstance());
  }
}

export {PFSingleton};
export default PFSingleton;