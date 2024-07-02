import { HistoryEntry } from "./entry.js";

class ReorderLayerEntry extends HistoryEntry {
  constructor(app, fromIndex, toIndex) {
    super(app);

    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }

  onPerform() {
    const app = this.app;
    app.layers.splice(this.toIndex, 0, app.layers.splice(this.fromIndex, 1)[0])
    app.MergeLayers()
    app.dispatchEvent(new CustomEvent('layer-reorder', {detail: {from: this.fromIndex, to: this.toIndex, layers: app.layers}}))
  }

  onRevert() {
    const app = this.app;
    app.layers.splice(this.fromIndex, 0, app.layers.splice(this.toIndex, 1)[0])
    app.MergeLayers()
    app.dispatchEvent(new CustomEvent('layer-reorder', {detail: {from: this.toIndex, to: this.fromIndex, layers: app.layers}}))
  }
}

export { ReorderLayerEntry }