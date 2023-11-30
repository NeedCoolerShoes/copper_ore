import * as THREE from 'three';
import * as dat from "dat.gui";
import * as UI from 'copperore/ui';

import {CopperOre} from './copper_ore.js'
import {CanvasIntermediateTexture} from 'copperore/canvas_intermediate_texture';

// todo fix bug with colorpicking on overlay meshes
// todo fix mismatching back face for torso

var copperOre;

var uiColorSlotsWindow;
var uiDrawingToolsWindow;
var uiColorSlot0;

var uiScene;
var uiCamera;

var currentSelectedColor;
var currentBrushOpacity = 1;

var loadingScreen;

var windowUIClicked = false;

const interval = 1000/100;

var hotkeys = {
}

var guiControls = {};

var settings = {
    grid: false,
    walk: false
};

var colors = {
    brushColor: [0, 0, 0],
    clearColor: [255, 255, 255]
};
var brushSize = {
    size: 1
};

var brushOpacity = {
    opacity: 255
}

const Tools = {
    Brush: 1,
    BucketFill: 2,
    Eraser: 3,
    ColorPick: 4,
};

var currentTool = Tools.Brush;
var timeCounter = 0;

var currentColorSlot = undefined;

function KeyDown(event) {
    event = event || window.event;
    let keyCode = event.which || event.keyCode;
    let hotkeyExists = false;

    for (const [key, value] of Object.entries(hotkeys)) {
        if(keyCode == key){
            hotkeyExists = true;
        }
    }
    if(hotkeyExists){
        hotkeys[keyCode]();
        return;
    }

    if (keyCode == 90 && event.ctrlKey){
        copperOre.RevertToPreviousTexture();
        AnnounceText("Undo");
    } else if (keyCode == 89 && event.ctrlKey){
        copperOre.RevertPreviousRevert()
        AnnounceText("Redo");
    }
}

function ApplyBrush(intermediateTexture, point, color){
    intermediateTexture.ChangePixelAtArray(point, color);
}

function FillColor(intermediateTexture, point, newColor){
    intermediateTexture.visitedTable = {}; // this should be in the intermediate texture class
    var originalPixel = intermediateTexture.PixelAt(point);
    intermediateTexture.Fill(point, originalPixel, newColor);
    intermediateTexture.ChangePixelAt(point, newColor);
}

function GetCurrentSlotColor(){
    currentColorSlot.material.color.a ||= 255;
    return currentColorSlot.material.color;
}

function GetColorForPart(part) {
    let color = {};
    Object.assign(color, GetCurrentSlotColor())

    if (!part.object.userData.isOverlay) {
        color.a = 1;
    }

    return color;
}

function UseBrush(part, canvasTexture, pixel) {
    let color = GetColorForPart(part);
    let arr = [color.r * 255, color.g * 255, color.b * 255, color.a * 255];
    ApplyBrush(canvasTexture, pixel, arr);
}

function UseBucket(part, canvasTexture, pixel) {
    FillColor(canvasTexture, pixel, GetColorForPart(part));
}

function UseEraser(part, canvasTexture, pixel) {
    ApplyBrush(canvasTexture, pixel, [0, 0, 0, 0]);
}

function UseColorPicker(part, canvasTexture, pixel) {
    let selectedPixel = canvasTexture.PixelAt(pixel);
    colors.brushColor = selectedPixel;
    
    UpdateCurrentSlotColor(colors.brushColor);
    guiControls['brushColor'].updateDisplay(); // update the color display
}

function Tick() {    
    uiColorSlotsWindow.TickChildren();
    uiDrawingToolsWindow.TickChildren();

    windowUIClicked = (uiColorSlotsWindow.DRAGGABLE_OBJECT_CLICKED || uiDrawingToolsWindow.DRAGGABLE_OBJECT_CLICKED);
    if (windowUIClicked) {
        copperOre.controls.enableRotate = false;
    }
}

function Render(renderer) {
    renderer.render( uiScene, uiCamera );
}

function AnnounceText(text){
    let alreadyAnnouncers = document.getElementsByClassName("fade-out");
    for(let i = 0; i < alreadyAnnouncers.length; ++i){
        document.body.removeChild(alreadyAnnouncers[i]);
    }

    var announcerText = document.createElement('div');
    announcerText.className = "fade-out";
    announcerText.innerHTML = text;
    document.body.appendChild(announcerText);
    setTimeout(() => {
        document.body.removeChild(announcerText);
    }, 1000)
}

function SelectBrush(){
    copperOre.SetCurrentTool("brush");
    AnnounceText("Brush");
}

function SelectEraser(){
    copperOre.SetCurrentTool("eraser");
    AnnounceText("Eraser");
}

function SelectBucketFill(){
    copperOre.SetCurrentTool("bucket");
    AnnounceText("Bucket Fill");
}

function SelectColorPick(){
    copperOre.SetCurrentTool("color_picker");
    AnnounceText("Color Pick");
}

function SelectColorSlot(button){
    currentColorSlot = button;
    currentSelectedColor = button.material.color;

    colors.brushColor = [currentSelectedColor.r * 255, currentSelectedColor.g * 255, currentSelectedColor.b * 255];
    guiControls['brushColor'].updateDisplay();
}

function ShowLoadingScreen(){
    loadingScreen.style.visibility = 'visible';
}

function HideLoadingScreen(){
    loadingScreen.style.visibility = 'hidden';
}

function UpdateCurrentSlotColor(color){
    currentColorSlot.material.color = new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255);
    currentColorSlot.material.color.a = (color[3] || 255) / 255
    currentColorSlot.material.needsUpdate = true;
}

const GetTextureFromURL = (url) => new Promise((finalResolve, finalReject) => {
    var canvas = document.createElement("canvas");
    canvas.width = copperOre.IMAGE_WIDTH;
    canvas.height = copperOre.IMAGE_HEIGHT;
    var context = canvas.getContext("2d");

    const loadImage = (url) => new Promise((resolve, reject) => {
        const skinImage = new Image();
        skinImage.crossOrigin = "anonymous";
        skinImage.addEventListener('load', () => resolve(skinImage));
        skinImage.addEventListener('error', (err) => reject(err));
        skinImage.src = url;
    });

    loadImage(url)
        .then(img => {
            context.drawImage(img, 0, 0);
            if(img.height < 64){
                // fill in the rest of the texture
                let fillerImage = new Image(64, 32);
                context.drawImage(fillerImage, 0, 32);
            }
    
            var newTexture = new THREE.Texture(canvas);
            newTexture.minFilter = THREE.NearestFilter;
            newTexture.magFilter = THREE.NearestFilter;
            finalResolve(newTexture.clone());
        })
        .catch(err => console.error(err));
});

function CreateSkybox(index){
    let backgroundMaterials = [
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/pz.png'), side:THREE.DoubleSide } ),
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/nz.png'), side:THREE.DoubleSide } ),
        
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/py.png'), side:THREE.DoubleSide } ),
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/ny.png'), side:THREE.DoubleSide } ),
        
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/nx.png'), side:THREE.DoubleSide } ),
        new THREE.MeshBasicMaterial( {map : new THREE.TextureLoader().load('/assets/skybox' + index + '/px.png'), side:THREE.DoubleSide } ),
    ]

    var backgroundBox = new THREE.BoxGeometry(256, 256, 256);
    return new THREE.Mesh(backgroundBox, backgroundMaterials);
}

function TogglePart(part) {
    copperOre.TogglePart(part)
}

function ToggleOverlayPart(part) {
    copperOre.ToggleOverlayPart(part)
}

function Initialize() {
    copperOre = new CopperOre({
        texture: 'assets/mncs-mascot.png',
        bind: this,
        render: Render,
        tick: Tick,
        tools: {
            brush: UseBrush,
            bucket: UseBucket,
            eraser: UseEraser,
            color_picker: UseColorPicker
        }
    });

    window.addEventListener('keydown', KeyDown);

    hotkeys[66] = SelectBrush; // b
    hotkeys[69] = SelectEraser; // e
    hotkeys[73] = SelectColorPick; // i
    hotkeys[71] = SelectBucketFill; // g

    currentSelectedColor = colors.brushColor;
    
    let fields = {
        'username': ""
    }

    let width = copperOre.IMAGE_WIDTH;
    let height = copperOre.IMAGE_HEIGHT;

    let buttons = {
        'clearSkinFullTransparent': () => {
            let canvasTexture = new CanvasIntermediateTexture(undefined, width, height);
            canvasTexture.ClearPixelsAlpha(width, height);
            copperOre.SetNewTexture(canvasTexture);
        },
        'clearSkin': () => {
            let canvasTexture = new CanvasIntermediateTexture(undefined, width, height);
            canvasTexture.ClearPixels(width, height, new THREE.Color(colors.clearColor[0] / 255, colors.clearColor[1] / 255, colors.clearColor[2] / 255));
            copperOre.SetNewTexture(canvasTexture);
        },
        'save': () => {
            let canvas = document.createElement('canvas');
            let currentSkinTexture = copperOre.currentSkinTexture;
            canvas.width = currentSkinTexture.image.width;
            canvas.height = currentSkinTexture.image.height;
            let context = canvas.getContext('2d');
            context.drawImage(currentSkinTexture.image, 0, 0);

            var link = document.getElementById('link');
            link.setAttribute('download', 'skin.png');
            link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
            link.click();
        },
        'open': () => {
            document.getElementById('fileInput').click();
        },
        'useUsernameSkin': ()=>{
            ShowLoadingScreen();
            var imageLoaded = false;
            setTimeout(() => {
                if(imageLoaded){
                    HideLoadingScreen();
                }
            }, 1000)
            let link = "https://api.ashcon.app/mojang/v2/user/" + fields['username'];
            
            fetch(link, {})  
                .then(response => response.json())
                .then(json => {
                    let textureURL = json['textures']['skin']['url'];
                    GetTextureFromURL(textureURL)
                        .then(texture => copperOre.ChangeSkinFromTexture(texture));
                });
            imageLoaded = true;
        },
        'resetView': ()=>{
            copperOre.controls.reset();
        }
    };

    let fileUploader = document.getElementById('fileInput');
    fileUploader.onchange = (event) => {
        let file = event.target.files[0];
        var fileReader = new FileReader();
        fileReader.onload = () => {
            GetTextureFromURL(fileReader.result)
            .then(texture => copperOre.ChangeSkinFromTexture(texture));
        };
        fileReader.readAsDataURL(file);
    };

    const gui = new dat.GUI();
    const editFolder = gui.addFolder("Edit");
    editFolder.open();
    guiControls['brushSize'] = editFolder.add(brushSize, 'size', 0, 8, 1).name("Brush Size");
    guiControls['normalGridToggle'] = editFolder.add(copperOre.settings, 'grid', false).name("Grid");
    guiControls['brushColor'] = editFolder.addColor(colors, 'brushColor').name("Brush Color").onChange(() => {
        UpdateCurrentSlotColor(colors.brushColor);
        currentColorSlot.material.color.a = currentBrushOpacity;
    });
    guiControls['brushOpacity'] = editFolder.add(brushOpacity, 'opacity', 0, 255, 1).name("Brush Opacity").onChange(() => {
        currentBrushOpacity = (brushOpacity.opacity / 255);
        currentColorSlot.material.color.a = currentBrushOpacity;
    });
    
    guiControls['clearSkinColor'] = editFolder.add(buttons, 'clearSkin').name("Clear Skin with Color");
    guiControls['clearColor'] = editFolder.addColor(colors, 'clearColor').name("Clear Color").onChange(() => {
        buttons.clearSkin();
    });
    guiControls['clearSkinFullTransparent'] = editFolder.add(buttons, 'clearSkinFullTransparent').name("Clear Skin Full Transparant");
    guiControls['resetView'] = editFolder.add(buttons, 'resetView').name("Reset View");

    const fileFolder = gui.addFolder("File");
    fileFolder.open();
    guiControls['saveFile'] = fileFolder.add(buttons, 'save').name("Download Skin to Disk");
    guiControls['openFile'] = fileFolder.add(buttons, 'open').name("Open skin file from Disk");

    guiControls['usernameField'] = fileFolder.add(fields, 'username').name("Username");
    guiControls['useUsernameSkin'] = fileFolder.add(buttons, 'useUsernameSkin').name("Use skin from username");

    uiCamera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, 1, 1000);
    uiCamera.position.z = 1;

    uiScene = new THREE.Scene();

    uiColorSlotsWindow = new UI.Window(new THREE.Vector2(300, 300), new THREE.Vector2(100, 100), "AAAAAAAAAA");
    uiDrawingToolsWindow = new UI.Window(new THREE.Vector2(200, 300), new THREE.Vector2(32 + 32, 185));

    uiScene.add(uiColorSlotsWindow.mesh);
    uiScene.add(uiColorSlotsWindow.dragBarMesh);

    for(let i = 0; i < 16; ++i){
        let colorSlot = new UI.EmptyButton(uiColorSlotsWindow, 
            new THREE.Vector2(4 + 16 + (i % 4) * (4 + 16), 4 + 16 + Math.floor(i/4) * (4 + 16)), new THREE.Vector2(16, 16), (button) => {
            SelectColorSlot(button);
        });
        if(i == 0) {currentColorSlot = colorSlot;}
        uiScene.add(colorSlot.mesh);
    }

    uiScene.add(uiDrawingToolsWindow.mesh);
    uiScene.add(uiDrawingToolsWindow.dragBarMesh);

    let toolIconSize = 32;

    uiScene.add(new UI.IconButton(uiDrawingToolsWindow, 
        new THREE.Vector2(toolIconSize, toolIconSize), new THREE.Vector2(toolIconSize, toolIconSize), "assets/brushIcon.png", (button) => {
        SelectBrush();
    }).mesh);

    uiScene.add(new UI.IconButton(uiDrawingToolsWindow, 
        new THREE.Vector2(toolIconSize, toolIconSize + toolIconSize + 8), new THREE.Vector2(toolIconSize, toolIconSize), "assets/bucketFillIcon.png", (button) => {
        SelectBucketFill();
    }).mesh);

    uiScene.add(new UI.IconButton(uiDrawingToolsWindow, 
        new THREE.Vector2(toolIconSize, toolIconSize * 2 + toolIconSize + 8 * 2), new THREE.Vector2(toolIconSize, toolIconSize), "assets/colorPickIcon.png", (button) => {
        SelectColorPick();
    }).mesh);

    uiScene.add(new UI.IconButton(uiDrawingToolsWindow, 
        new THREE.Vector2(toolIconSize, toolIconSize * 3 + toolIconSize + 8 * 3), new THREE.Vector2(toolIconSize, toolIconSize), "assets/eraserIcon.png", (button) => {
        SelectEraser();
    }).mesh);

    var skyboxes = [
        CreateSkybox(0),
        CreateSkybox(1)
    ];

    copperOre.AddToScene(skyboxes[0]);

    loadingScreen = document.getElementsByClassName('loading')[0];
    HideLoadingScreen();
}

export {Initialize, TogglePart, ToggleOverlayPart};