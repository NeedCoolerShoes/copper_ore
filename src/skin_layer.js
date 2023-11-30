import {EventBus} from './events';

class SkinLayer {
  static lastLayerId = 0;
  constructor (params = {}) {
    this.name = params.name;
    this.texture = params.texture;
    this.id = ++SkinLayer.lastLayerId;

    this.texture.events.on("blob", event => {
      EventBus.signal("layer-blob-url", {layerId: this.id, url: event.layerURL})
    })
  }

  current = false;
  name;
  texture;
  id;
}

export {SkinLayer};