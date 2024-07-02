import { HistoryEntry } from "./entry.js";
import { SkinLayer } from "../skin_layer.js";
import { CanvasIntermediateTexture } from "../canvas_intermediate_texture.js";


class AddLayerEntry extends HistoryEntry {
  constructor(app, texture) {
    super(app);

    this.layer = new SkinLayer({
      app: app, texture: new CanvasIntermediateTexture(texture, app.IMAGE_WIDTH, app.IMAGE_HEIGHT)
    });
  }

  onPerform() {
    const app = this.app;
    app.layers.push(this.layer);
    this.layer.texture.RenderPreview();
    app.MergeLayers();
    app.dispatchEvent(new CustomEvent('layer-add', {detail: {layers: this.layers, newLayer: this.layer, index: -1}}));
  }

  onRevert() {
    const app = this.app;
    app.layers.pop();
    app.MergeLayers();
    app.dispatchEvent(new CustomEvent('layer-remove', {detail: {layers: app.layers, layerId: this.layer.id}}));
  }
}

export { AddLayerEntry }