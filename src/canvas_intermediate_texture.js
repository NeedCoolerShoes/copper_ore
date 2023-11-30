import * as THREE from 'three';
import {EventBus} from './events';

class CanvasIntermediateTexture {
    constructor(texture, imgWidth, imgHeight){
        // w and h are only read if the texture is undefined, meaning this canvas will be empty
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.canvas = new OffscreenCanvas(imgWidth, imgHeight);
        this.context = this.canvas.getContext('2d');
        if (Image.prototype.isPrototypeOf(texture)) {
            this.context.drawImage(texture, 0, 0);
        } else if (texture) {
            this.context.drawImage(texture.image, 0, 0);
        }
        this.imageData = this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height);
        this.data = this.imageData.data;
        this.visitedTable = {};
        this.events = new EventBus;

        this.RenderBlob()
    }

    layerBlob;
    layerURL = "";

    ClearPixelsAlpha(w, h) {
        for(let i = 0; i < this.canvas.width * this.canvas.height; ++i){
            this.data[i * 4 + 0] = 0;
            this.data[i * 4 + 1] = 0;
            this.data[i * 4 + 2] = 0;
            this.data[i * 4 + 3] = 0;
        }
    }

    ClearPixels(w, h, color) {
        for(let i = 0; i < this.canvas.width * this.canvas.height; ++i){
            this.data[i * 4 + 0] = color.r * 255;
            this.data[i * 4 + 1] = color.g * 255;
            this.data[i * 4 + 2] = color.b * 255;
            this.data[i * 4 + 3] = 255;
        }
    }

    PixelAt(point) {
        return [this.data[(point.x * 4 + 0) + point.y * this.imgWidth * 4],
                this.data[(point.x * 4 + 1) + point.y * this.imgWidth * 4],
                this.data[(point.x * 4 + 2) + point.y * this.imgWidth * 4]]
    }

    GetColorAt(point) {
        var pixel = PixelAt(point);
        return new THREE.Color(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255);
    }
    
    ChangePixelAt(point, color) {
        this.data[(point.x * 4 + 0) + point.y * this.imgWidth * 4] = color.r * 255;
        this.data[(point.x * 4 + 1) + point.y * this.imgWidth * 4] = color.g * 255;
        this.data[(point.x * 4 + 2) + point.y * this.imgWidth * 4] = color.b * 255;
        this.data[(point.x * 4 + 3) + point.y * this.imgWidth * 4] = color.a * 255;
    }

    ChangePixelAtArray(point, colorArray) {
        this.data[(point.x * 4 + 0) + point.y * this.imgWidth * 4] = colorArray[0];
        this.data[(point.x * 4 + 1) + point.y * this.imgWidth * 4] = colorArray[1];
        this.data[(point.x * 4 + 2) + point.y * this.imgWidth * 4] = colorArray[2];
        this.data[(point.x * 4 + 3) + point.y * this.imgWidth * 4] = colorArray[3];
    }
    
    // TODO add user data to the uvs on faces so that we can't fill things on other parts
    Fill(point, originalPixel, newColor) {
        let thisPixel = this.PixelAt(point);
        if(point.x < 0 || point.x > this.imgWidth - 1 || point.y < 0 || point.y > this.imgHeight - 1){
            return;
        }
        if( this.visitedTable[point.x + ":" + point.y] != undefined ||
            thisPixel[0] != originalPixel[0] ||
            thisPixel[1] != originalPixel[1] ||
            thisPixel[2] != originalPixel[2]){
                
            return;
        }
        this.visitedTable[point.x + ":" + point.y] = true;
        this.ChangePixelAt(point, newColor);
        
        this.Fill(new THREE.Vector3(point.x + 1, point.y), originalPixel, newColor);
        this.Fill(new THREE.Vector3(point.x - 1, point.y), originalPixel, newColor);
        this.Fill(new THREE.Vector3(point.x, point.y + 1), originalPixel, newColor);
        this.Fill(new THREE.Vector3(point.x, point.y - 1), originalPixel, newColor);
    }

    Render() {
        this.context.putImageData(this.imageData, 0, 0);
        this.RenderBlob();
    }

    RenderBlob() {
        this.canvas.convertToBlob().then(blob => {
            this.layerURL = URL.createObjectURL(blob);
            if (this.layerBlob) { URL.revokeObjectURL(this.layerBlob); }
            this.layerBlob = blob;
            this.events.signal("blob", {blob: this.layerBlob, url: this.layerURL})
        });
    }

    FlushTexture() {
        this.Render()
    
        var newTexture = new THREE.Texture(this.canvas);
        newTexture.minFilter = THREE.NearestFilter;
        newTexture.magFilter = THREE.NearestFilter;
        return newTexture.clone();
    }
}

export {CanvasIntermediateTexture};