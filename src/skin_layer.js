class SkinLayer {
  constructor (params = {}) {
    this.name = params.name;
    this.texture = params.texture;
  }

  current = false;
  name;
  texture;
}

export {SkinLayer};