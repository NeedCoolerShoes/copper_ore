class SkinLayer extends EventTarget {
  static lastLayerId = 0;

  constructor (params = {}) {
    super()
    this.app = params.app;
    this.name = params.name;
    this.setTexture(params.texture);
    this.id = ++SkinLayer.lastLayerId;
  }

  current = false;
  name;
  texture;
  id;

  #getLayerIndex() {
    return this.app.layers.indexOf(this);
  }

  setTexture(texture) {
    this.oldTexture = texture;
    this.texture = this.oldTexture.FlushCanvasTexture();

    this.texture.addEventListener('layer-preview', event => {
      this.dispatchEvent(new CustomEvent('layer-preview', event)) 
    })
  }

  remove() {
    let index = this.#getLayerIndex()
    this.app.RemoveLayer(index)
  }

  select() {
    let index = this.#getLayerIndex()
    this.app.currentLayer = index;
    this.current = true;
  }

  snapshot() {
    const texture = this.oldTexture;
    this.oldTexture = this.texture.FlushCanvasTexture();
    return texture;
  }

  deselect() {
    this.current = false;
  }

  // https://stackoverflow.com/questions/51371648/converting-from-a-uint8array-to-a-string-and-back
  serialize() {
    const binString = String.fromCharCode(...this.texture.imageData.data);
    return {
      name: this.name,
      current: this.current,
      data: btoa(binString)
    }
  }
}

export {SkinLayer};