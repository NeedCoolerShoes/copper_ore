class SkinLayer extends EventTarget {
  static lastLayerId = 0;

  constructor (params = {}) {
    super()
    this.app = params.app;
    this.name = params.name;
    this.texture = params.texture;
    this.id = ++SkinLayer.lastLayerId;

    this.texture.addEventListener('layer-preview', event => {
      this.dispatchEvent(new CustomEvent('layer-preview', event)) 
    })
  }

  current = false;
  name;
  texture;
  id;

  #getLayerIndex() {
    return this.app.layers.indexOf(this);
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

  deselect() {
    this.current = false;
  }

  serialize() {
    const binString = Array.from(this.texture.imageData.data, (byte) => String.fromCodePoint(byte)).join("");
    return {
      name: this.name,
      current: this.current,
      data: btoa(binString)
    }
  }
}

export {SkinLayer};