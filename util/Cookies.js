export default {
  /**
   * Returns an object of all registered cookies
   * @returns {object}
   */
  getAll() {
    let output = {};
    let cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      let c = cookie.trim().split('=');
      output[c[0]] = c[1];
    }
    return output;
  },

  /**
   * Returns the value of a cookie by name
   * @param {string} name
   * @returns {bool|object}
   */
  get(name) {
    let _cookies = this.getAll();
    return _cookies.hasOwnProperty(name) && _cookies[name] ? _cookies[name] : false;
  },

  /**
   * Set a cookie
   * @param {string} name
   * @param {object} value
   * @param {false|number} days Number of days the cookie will be stored. 0 will set the cookie for the current session only
   */
  set(name, value, days) {
    if (!name) return false;
    if (isNaN(days)) days = 30;
    let expires = parseInt(days);
    if (parseInt(days) !== 0) {
      let d = new Date();
      d.setTime(d.getTime() + (days*24*60*60*1000));
      expires = d.toUTCString();
    }
    document.cookie = `${name}=${value};expires=${expires};path=/`;
  },

  /**
   * Erases a cookie by name
   * @param {string} name
   */
  delete(name) {
    this.set(name, '', -1);
  }
};
