"use strict";

class PFBase {
  #activeSelector;
  $elements = null;
  defaultTimeout = 1000;

  constructor(selector, name = 'PFBase') {
    this.name = name;
    this.setSelector(selector);
    this.polyfills();
    return this;
  }

  static getName() {
    return 'PFBase';
  }

  setSelector(query) {
    this.#activeSelector = query;
  }

  run() {
    switch (typeof this.#activeSelector) {
      case 'undefined':
        throw new Error(`Selector was not passed in ${this.name}'s super() constructor.`);
      case 'string':
        this.$elements = this.getNodes(this.#activeSelector);
        if (this.$elements.length > 0) this.init(this.$elements);
        break;
      case 'boolean':
        if (this.#activeSelector) this.init();
        break;
    }
  }

  init() {
    throw new Error(`Init function must be implemented in extended class: ${this.name}`);
  }

  /**
   * This is a helper method for querySelector. Defaults to document
   * @param query
   * @param obj
   * @returns {Element}
   */
  getNode(query, obj = document) {
    return obj.querySelector(query);
  }

  /**
   * This is a helper method for querySelectorAll that returns an array of the results. Defaults to document
   * @param query
   * @param obj
   * @returns <Element>[]
   */
  getNodes(query, obj = document) {
    return [...obj.querySelectorAll(query)];
  }

  timeout(length = this.defaultTimeout) {
    return new Promise(r => setTimeout(r, length));
  }

  /**
   * This is a helper method to log a message to the console using log, warn, or error methods. Defaults to log.
   * @param message
   * @param type
   */
  log(message = '', type = 'log') {
    message = `Message from PF.${this.name}: \n${message}`;
    switch (type) {
      case 'log':
        console.log(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      default:
        console.log(message);
        break;
    }
  }

  polyfills() { }
}

export { PFBase };
export default PFBase;