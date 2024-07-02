class HistoryStack {
  #history = [];
  #redoHistory = [];

  add(entry) {
    if (entry.perform()) {
      this.#history.push(entry);
      this.#redoHistory = [];
      return true;
    }
    return false;
  }

  addGhost(entry) {
    if (entry.perform()) {
      return true;
    }
    return false;
  }

  undo() {
    if (this.#history.length < 1) { return; }
    const entry = this.#history.pop();
    entry.revert();
    this.#redoHistory.push(entry);
  }

  redo() {
    if (this.#redoHistory.length < 1) { return; }
    const entry = this.#redoHistory.pop();
    entry.perform();
    this.#history.push(entry);
  }
}

export {HistoryStack}