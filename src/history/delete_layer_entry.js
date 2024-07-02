import { HistoryEntry } from "./entry.js";

class DeleteLayerEntry extends HistoryEntry {
  constructor(app, index) {
    super(app);

    this.index = index;
  }
  #addedBlank = false;

  layer;

  onPerform() {
    const app = this.app;
    this.layer = app.layers.splice(this.index, 1)[0];
    if (app.layers.length < 1) {
      this.#addedBlank = true;
      app.AddBlankLayer(true);
    }
    app.MergeLayers();
    app.dispatchEvent(new CustomEvent('layer-remove', {detail: {layers: app.layers, layerId: this.layer.id}}));
  }

  onRevert() {
    const app = this.app;
    if (this.#addedBlank) {
      const blankLayer = app.layers.at(0);
      app.layers.splice(0, 1);
      this.#addedBlank = false;
      app.dispatchEvent(new CustomEvent('layer-remove', {detail: {layers: app.layers, layerId: blankLayer.id}}));
    }
    app.layers.splice(this.index, 0, this.layer);
    this.layer.texture.RenderPreview();
    app.MergeLayers();
    app.dispatchEvent(new CustomEvent('layer-add', {detail: {layers: app.layers, newLayer: this.layer, index: this.index}}));
  }
}

export { DeleteLayerEntry }