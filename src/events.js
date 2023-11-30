class EventBus {
  static #triggersStatic = {};
  #triggers = {};

  static signal(event, params) {
    if (!EventBus.#triggersStatic[event]) { return; }
    for (let i in EventBus.#triggersStatic[event]) {
      EventBus.#triggersStatic[event][i](params);
    }
  }

  static on(eventName, callback) {
    if(!EventBus.#triggersStatic[eventName]) {
      EventBus.#triggersStatic[eventName] = [];
    }
    EventBus.#triggersStatic[eventName].push(callback);
  }

  signal(event, params) {
    if (!this.#triggers[event]) { return; }
    for (let i in this.#triggers[event]) {
      this.#triggers[event][i](params);
    }
  }

  on(eventName, callback) {
    if(!this.#triggers[eventName]) {
      this.#triggers[eventName] = [];
    }
    this.#triggers[eventName].push(callback);
  }
}

export {EventBus};