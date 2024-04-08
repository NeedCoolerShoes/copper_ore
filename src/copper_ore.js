import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CanvasIntermediateTexture} from './canvas_intermediate_texture';
import {SkinGridBox} from './skin_grid';
import {SkinMesh} from './skin_mesh_creator';
import {SkinLayer} from './skin_layer';
import {Utils} from './utils';

class CopperOre extends EventTarget {
  constructor (params = {}) {
    super();
    this.defaultTexture = params.texture;
    this.defaultBind = params.bind;
    this.Tools = params.tools;
    this.renderCallback = params.render;
    this.tickCallback = params.tick;
    this.afterIntitialize = params.initialize;
    this.parent = params.parent || document.body;

    this.Initialize()
  }

  scene;
  gridScene;
  camera;
  controls;

  renderer;
  geometry;

  skinMesh;
  currentSkinTexture;
  oldTexture;
  dirtyTexture = false;

  layers = [];
  currentLayer = 0;

  // another, maybe cleaner approach
  // would be to use a queue and a pointer for the current texture
  // undo would decrease the pointer
  // redo would increase the pointer
  // will let this the way it is now but maybe someday(never) I will change it
  historyStack = [];
  revertStack = [];

  now;
  then;

  interval = 1000 / 100;

  IMAGE_WIDTH = 64;
  IMAGE_HEIGHT = 64;

  skinOffsets = {
    'headOverlay': new THREE.Vector3(0, 1.25, 0),
    'head': new THREE.Vector3(0, 1.25, 0),
    'rl': new THREE.Vector3(-0.25, -1.5, 0),
    'rlOverlay': new THREE.Vector3(-0.25, -1.5, 0),
    'll': new THREE.Vector3(+0.25, -1.5, 0),
    'llOverlay': new THREE.Vector3(+0.25, -1.5, 0),
    'lh': new THREE.Vector3(+0.75, 0, 0),
    'lhOverlay': new THREE.Vector3(+0.75, 0, 0),
    'rh': new THREE.Vector3(-0.75, 0, 0),
    'rhOverlay': new THREE.Vector3(-0.75, 0, 0),
  };

  hotkeys = {}

  grids = {};
  guiControls = {};
  currentTool;
  
  timeCounter = 0;
  raycaster = new THREE.Raycaster();
  mousePosition = new THREE.Vector2(1000000, 1000000);
  clicked = false;
  alreadyDowned = false;
  settings = {
    grid: false
  };
  disableTools = false;
  firstClick = true;

  tempCanvas;
  textureCanvas;
  layerCanvas;

  Loop() {
    this.now = Date.now();
    var elapsed = this.now - this.then;
    if (elapsed >= this.interval) {
      this.then = this.now;
      this.Tick();
      this.Render();
    }
    requestAnimationFrame(this.Loop.bind(this));
  }

  ChangeSkin(skinPath) {
    this.currentSkinTexture.dispose();
    this.currentSkinTexture = new THREE.TextureLoader().load(skinPath);
    this.currentSkinTexture.minFilter = THREE.NearestFilter;
    this.currentSkinTexture.magFilter = THREE.NearestFilter;
    this.skinMesh.UpdateTextureOnBodyParts(this.currentSkinTexture);
  }

  ChangeSkinFromTexture(texture) {
    this.currentSkinTexture = texture;
    this.currentSkinTexture.minFilter = THREE.NearestFilter;
    this.currentSkinTexture.magFilter = THREE.NearestFilter;
    this.skinMesh.UpdateTextureOnBodyParts(this.currentSkinTexture);
  }

  MouseClicked(event) {
    if (event.button == 0) {
      this.mousePosition.x = (event.clientX / this.parent.clientWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / this.parent.clientHeight) * 2 + 1;
    }
  }

  SetGridVisibility(status) {
    for (let gridPart of Object.values(this.grids)) {
      gridPart.Visible(status);
    }
  }

  MouseDown(event) {
    if (this.disableInput) {
      return;
    }

    if (event.button == 0) {
      this.mousePosition.x = (event.offsetX / this.parent.clientWidth) * 2 - 1;
      this.mousePosition.y = -(event.offsetY / this.parent.clientHeight) * 2 + 1;
      this.clicked = true;
      this.firstClick = true;

      if (!this.alreadyDowned) {
        this.alreadyDowned = true;
        this.oldTexture = this.currentSkinTexture;
      }
    }
  }

  MouseMove(event) {
    if (this.disableInput) {
      return;
    }

    if (event.button == 0) {
      if (this.clicked) {
        this.mousePosition.x = (event.offsetX / this.parent.clientWidth) * 2 - 1;
        this.mousePosition.y = -(event.offsetY / this.parent.clientHeight) * 2 + 1;
      }
    }
  }

  MouseUp(event) {
    if (event.button == 0) {
      this.clicked = false;
      this.AppendTextureToHistoryStack(this.oldTexture);
      this.alreadyDowned = false;
      this.dirtyTexture = false;
      this.disableTools = false;
      this.controls.enableRotate = true;
    }
  }

  AppendTextureToHistoryStack(texture) {
    if (this.dirtyTexture) { // only append previous texture if it was actually changed
      if (this.historyStack.length > 512 - 1) {
        this.historyStack = this.historyStack.slice(1); // remove the oldest entry in order to make room for the new one
      }
      this.historyStack.push(texture);
    }
  }

  TopOfHistoryStackTexture() {
    return this.historyStack.pop();
  }

  TopOfRevertedHistoryStackTexture() {
    return this.revertStack.pop();
  }

  AppendTextureToRevertedStack(texture) {
    this.revertStack.push(texture);
  }

  RevertPreviousRevert() { // ctrl + y oposite of undo
    let revertedTexture = this.TopOfRevertedHistoryStackTexture();
    if (revertedTexture == undefined) {
      return;
    }

    this.dirtyTexture = true;
    this.AppendTextureToHistoryStack(this.currentSkinTexture);

    var canvasTexture = new CanvasIntermediateTexture(revertedTexture, this.IMAGE_WIDTH, this.IMAGE_HEIGHT) // all of them have the same texture mapped
    this.currentSkinTexture = canvasTexture.FlushTexture();

    for (let bodyPart of Object.values(this.skinMesh.normalMeshes)) {
      bodyPart.material.map = this.currentSkinTexture;
      bodyPart.material.map.needsUpdate = true;
    }

    for (let bodyPartOverlay of Object.values(this.skinMesh.overlayMeshes)) {
      bodyPartOverlay.material.map = this.currentSkinTexture;
      bodyPartOverlay.material.map.needsUpdate = true;
    }
  }

  RevertToPreviousTexture() {
    let previousTexture = this.TopOfHistoryStackTexture();
    if (previousTexture == undefined) {
      return;
    }

    this.AppendTextureToRevertedStack(this.currentSkinTexture);

    var canvasTexture = new CanvasIntermediateTexture(previousTexture, this.IMAGE_WIDTH, this.IMAGE_HEIGHT) // all of them have the same texture mapped
    this.currentSkinTexture = canvasTexture.FlushTexture();

    for (let bodyPart of Object.values(this.skinMesh.normalMeshes)) {
      bodyPart.material.map = this.currentSkinTexture;
      bodyPart.material.map.needsUpdate = true;
    }

    for (let bodyPartOverlay of Object.values(this.skinMesh.overlayMeshes)) {
      bodyPartOverlay.material.map = this.currentSkinTexture;
      bodyPartOverlay.material.map.needsUpdate = true;
    }
  }

  ToolAction(part) {
    if (!typeof(this.Tools) == "object" || Object.getOwnPropertyNames(this.Tools).length === 0) { return; };
    if (!this.Tools[this.currentTool]) {
      this.currentTool = Object.keys(this.Tools)[0]
    }

    this.dispatchEvent(new CustomEvent('tool-action', {detail: {tool: this.currentTool, part: part}}));

    let pixel = new THREE.Vector2(part.uv.x * this.IMAGE_WIDTH, part.uv.y * this.IMAGE_HEIGHT);
    pixel.x = Math.floor(pixel.x);
    pixel.y = this.IMAGE_HEIGHT - Math.ceil(pixel.y);

    var canvasTexture = this.GetCurrentLayer().texture

    this.Tools[this.currentTool].call(this.defaultBind, part, canvasTexture, pixel)

    this.dirtyTexture = true;
    canvasTexture.Render();

    this.MergeLayers();
  }

  Tick() {
    this.controls.update();
    if (this.disableInput) {
      this.controls.enableRotate = false;
      return;
    }

    if (this.clicked) {
      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children);
      if (intersects.length > 0) {
        let currentIntersection = 0;
        let bad = false;
        while (!intersects[currentIntersection].object.visible) {
          ++currentIntersection;
          if (currentIntersection >= intersects.length) {
            bad = true;
            break;
          }
        }
        if (!bad && intersects[currentIntersection].object.userData.bodyModel == true) {
          if (!this.disableTools) {
            this.controls.enableRotate = false;
            this.ToolAction(intersects[currentIntersection]);
          }
        }
      } else {
        if (this.firstClick) {
          this.disableTools = true;
        }
      }
      this.firstClick = false;
    }

    if (typeof(this.tickCallback) == "function") {
      this.tickCallback.call(this.defaultBind);
    }
  }

  Render() {
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);

    this.renderer.autoClear = false;
    if (this.settings.grid) {
      this.renderer.render(this.gridScene, this.camera);
    }

    if (typeof(this.renderCallback) == "function") {
      this.renderCallback.call(this.defaultBind, this.renderer)
    }
  }

  CreateAndAddToSceneGridForBodypart(bodypart, scene, width, height, boxSize, skinOffsets, epsilon) {
    var gridBox = new SkinGridBox(boxSize, width, height, epsilon);
    for (let i = 0; i < gridBox.grids.length; ++i) {
      if (skinOffsets[bodypart] != undefined) {
        gridBox.grids[i].position.add(skinOffsets[bodypart]);
      }
      scene.add(gridBox.grids[i]);
    }
    return gridBox;
  }

  TogglePart(part) {
    let meshPart = this.skinMesh.normalMeshes[part];
    meshPart.visible = !meshPart.visible;
    this.grids[part].Visible(meshPart.visible);
  }

  ToggleOverlayPart(part) {
    let meshPart = this.skinMesh.overlayMeshes[part];
    meshPart.visible = !meshPart.visible;
    this.grids[part].Visible(meshPart.visible);
  }

  AddToScene(element) {
    this.scene.add(element);
  }

  SetCurrentTool(tool) {
    if (!this.Tools[tool]) { return false; }
    this.currentTool = tool;
    return true;
  }

  SetNewTexture(newTexture) {
    this.dirtyTexture = true;
    this.AppendTextureToHistoryStack(this.currentSkinTexture);

    this.ChangeSkinFromTexture(newTexture.FlushTexture());
  }

  CreateHelperCanvas(width, height) {
    return new OffscreenCanvas(width, height);
  }
  
  
  AddLayer(intermediateTexture) {
    let layer = new SkinLayer({
      app: this, texture: new CanvasIntermediateTexture(intermediateTexture, this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    })
    this.layers.push(layer);
    this.MergeLayers();
    this.dispatchEvent(new CustomEvent('layer-add', {detail: {layers: this.layers, newLayer: layer}}));
  }

  AddBlankLayer() {
    let canvasTexture = new CanvasIntermediateTexture(undefined, this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
    canvasTexture.ClearPixelsAlpha(this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
    this.AddLayer({image: canvasTexture.canvas});
  }

  AddImageLayer(imageSrc, width, height) {
    let image = new Image(width, height);
    image.addEventListener("load", event => {
      this.AddLayer(event.target);
    })
    image.src = imageSrc;
  }

  RemoveLayer(index) {
    let layer = this.layers.splice(index, 1)[0];
    if (this.layers.length < 1) { this.AddBlankLayer(); }
    this.MergeLayers();
    this.dispatchEvent(new CustomEvent('layer-remove', {detail: {layers: this.layers, layerId: layer.id}}));
  }

  ReorderLayer(layerId, toIndex) {
    let index = this.layers.findIndex(layer => {return layer.id == layerId;});
    if (index != toIndex) {
      this.layers.splice(toIndex, 0, this.layers.splice(index, 1)[0])
      this.MergeLayers()
    }
    this.dispatchEvent(new CustomEvent('layer-reorder', {detail: {from: index, to: toIndex, layers: this.layers}}))
  }

  GetCurrentLayer() {
    this.currentLayer = Utils.Clamp(this.currentLayer, 0, this.layers.length - 1);
    return this.layers[this.currentLayer];
  }

  MergeLayers() {
    let context = this.textureCanvas.getContext('2d');
    context.globalAlpha = 1.0;
    context.clearRect(0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    this.layers.forEach(layer => {
      context.drawImage(layer.texture.canvas, 0, 0)
    })
    let texture = new THREE.CanvasTexture(this.textureCanvas);
    this.ChangeSkinFromTexture(texture);
  }

  Initialize() {
    this.scene = new THREE.Scene();
    this.gridScene = new THREE.Scene(); // separated for intersections

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    this.renderer.sortObjects = false;
    this.renderer.setSize(this.parent.clientWidth, this.parent.clientHeight);
    this.renderer.setClearColor(new THREE.Color(0.1, 0.1, 0.1));
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    this.renderer.domElement.addEventListener('click', this.MouseClicked.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.MouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.MouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.MouseUp.bind(this));
    this.parent.appendChild(this.renderer.domElement);


    this.camera = new THREE.PerspectiveCamera(75, this.parent.clientWidth / this.parent.clientHeight, 0.01, 1000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: undefined,
      RIGHT: THREE.MOUSE.ROTATE
    };
    // window.addEventListener( 'resize', onWindowResize );
    ///

    this.tempCanvas = this.CreateHelperCanvas(this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    this.textureCanvas = this.CreateHelperCanvas(this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    this.layerCanvas = this.CreateHelperCanvas(this.IMAGE_WIDTH, this.IMAGE_HEIGHT)

    const overlayScalar = 0.05;

    // initialize position offsets somewhere
    this.skinMesh = new SkinMesh(this.IMAGE_WIDTH, this.IMAGE_HEIGHT, overlayScalar);
    this.skinMesh.InitializeFullMesh(this.currentSkinTexture);
    this.skinMesh.ApplyOffsetsToBodyParts(this.skinOffsets);
    let meshGroup = this.skinMesh.AddToScene(this.scene);

    if (this.defaultTexture) {
      this.AddImageLayer(this.defaultTexture, this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    } else {
      this.AddBlankLayer()
    }

    // skinMesh.normalMeshes['head'].visible = false;

    let boundingBox = new THREE.Box3();
    boundingBox.setFromObject(meshGroup);
    boundingBox.getCenter(this.controls.target);

    this.camera.position.z = 5;
    this.then = Date.now();

    const offset = 0;

    this.grids['head'] = this.CreateAndAddToSceneGridForBodypart('head', this.gridScene, 8, 8, new THREE.Vector3(1.0, 1.0, 1.0), this.skinOffsets, offset);
    this.grids['torso'] = this.CreateAndAddToSceneGridForBodypart('torso', this.gridScene, 8, 12, new THREE.Vector3(1.0, 1.5, 0.5), this.skinOffsets, offset);
    this.grids['rh'] = this.CreateAndAddToSceneGridForBodypart('rh', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5), this.skinOffsets, offset);
    this.grids['lh'] = this.CreateAndAddToSceneGridForBodypart('lh', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5), this.skinOffsets, offset);
    this.grids['rl'] = this.CreateAndAddToSceneGridForBodypart('rl', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5), this.skinOffsets, offset);
    this.grids['ll'] = this.CreateAndAddToSceneGridForBodypart('ll', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5), this.skinOffsets, offset);

    this.grids['headOverlay'] = this.CreateAndAddToSceneGridForBodypart('headOverlay', this.gridScene, 8, 8, new THREE.Vector3(1.0, 1.0, 1.0).addScalar(overlayScalar), this.skinOffsets, offset);
    this.grids['torsoOverlay'] = this.CreateAndAddToSceneGridForBodypart('torsoOverlay', this.gridScene, 8, 12, new THREE.Vector3(1.0, 1.5, 0.5).addScalar(overlayScalar), this.skinOffsets, offset);
    this.grids['rhOverlay'] = this.CreateAndAddToSceneGridForBodypart('rhOverlay', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5).addScalar(overlayScalar), this.skinOffsets, offset);
    this.grids['lhOverlay'] = this.CreateAndAddToSceneGridForBodypart('lhOverlay', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5).addScalar(overlayScalar), this.skinOffsets, offset);
    this.grids['rlOverlay'] = this.CreateAndAddToSceneGridForBodypart('rlOverlay', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5).addScalar(overlayScalar), this.skinOffsets, offset);
    this.grids['llOverlay'] = this.CreateAndAddToSceneGridForBodypart('llOverlay', this.gridScene, 4, 12, new THREE.Vector3(0.5, 1.5, 0.5).addScalar(overlayScalar), this.skinOffsets, offset);

    this.SetGridVisibility(true)

    this.controls.saveState();

    let resizeHandler = new ResizeObserver( (entries, _) => {
      let entry = entries[0];
      this.renderer.setSize(entry.contentRect.width, entry.contentRect.height);
      this.camera.aspect = entry.contentRect.width / entry.contentRect.height;
      this.camera.updateProjectionMatrix();
      this.Render();
    })

    resizeHandler.observe(this.parent);
    this.renderer.domElement.style.cssText += "max-width: 100%; max-height: 100%";

    this.Loop();
  }
}

export {
  CopperOre
};