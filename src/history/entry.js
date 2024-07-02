class HistoryEntry {
  constructor(app) {
    this.app = app;
  }

  #hasPeformed = false;

  perform() {
    if (this.#hasPeformed) { return false; }
    this.onPerform();
    this.#hasPeformed = true;
    return true;
  }

  revert() {
    if (!this.#hasPeformed) { return false; }
    this.onRevert();
    this.#hasPeformed = false;
    return true;
  }

  onPerform() {}
  onRevert() {}
}

export { HistoryEntry };