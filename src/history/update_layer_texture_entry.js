import { HistoryEntry } from "./entry.js";

class UpdateLayerTextureEntry extends HistoryEntry {
  constructor(app, layer) {
    super(app);

    this.layer = layer;
    this.oldTexture = layer.snapshot();
    this.newTexture = layer.texture;
  }

  onPerform() {
    this.layer.setTexture(this.newTexture);
    this.layer.texture.Render();
    this.app.MergeLayers();
  }

  onRevert() {
    this.layer.setTexture(this.oldTexture);
    this.layer.texture.Render();
    this.app.MergeLayers();
  }
}

export { UpdateLayerTextureEntry }