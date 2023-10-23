import * as THREE from 'three';

function SkinMesh(width, height, overlayScalar){
    const IMAGE_WIDTH = width;
    const IMAGE_HEIGHT = height;
    const OVERLAY_SCALAR = overlayScalar;

    this.overlayMeshes = {};
    this.normalMeshes  = {};
    this.rotationPivot = {};
    this.meshGroups = {};
    this.originalPosition = {};

    function CoordsToUVs(p0, p1, p2, p3, width, height){
        //p0 p1
        //p2 p3
        var result = [];
        var p;
        p = {x: p0.x/width,y: 1-p0.y/height};
        result.push(p);
    
        p = {x: p1.x/width,y: 1-p1.y/height};
        result.push(p);
    
        p = {x: p2.x/width,y: 1-p2.y/height};
        result.push(p);
    
        p = {x: p3.x/width,y: 1-p3.y/height};
        result.push(p);
    
        return result;
    }
    
    function SquareToUVs(x0, y0, sw, sh, my = false){
        let x1 = x0 + sw;
        let y1 = y0 + sh;
        if(my){
            let aux = y1;
            y1 = y0;
            y0 = aux;
        }
        // apperantely this is how three js stores uvs for each cube face
        // 0, 1
        // 1, 1
        // 0, 0
        // 1, 0
        return CoordsToUVs({x:x0, y:y0}, {x:x1, y:y0}, {x:x0, y:y1}, {x:x1, y:y1}, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
    
    function SetFaceUVs(face, uvs, uvAttribute){
        uvAttribute.setXY(face * 4 + 0, uvs[0].x, uvs[0].y);
        uvAttribute.setXY(face * 4 + 1, uvs[1].x, uvs[1].y);
        uvAttribute.setXY(face * 4 + 2, uvs[2].x, uvs[2].y);
        uvAttribute.setXY(face * 4 + 3, uvs[3].x, uvs[3].y);
    }
    
    const FRONT_FACE = 4;
    const BACK_FACE = 5;
    
    const LEFT_FACE = 1;
    const RIGHT_FACE = 0;
    
    const BOTTOM_FACE = 3;
    const TOP_FACE = 2;
    
    function CreateHeadMesh(skin){
        var box = new THREE.BoxGeometry(1, 1, 1);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(1 * 8, 1 * 8, 8, 8), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(2 * 8, 0 * 8, 8, 8, true), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(0 * 8, 1 * 8, 8, 8), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(2 * 8, 1 * 8, 8, 8), uvAttribute);
        
        SetFaceUVs(TOP_FACE,    SquareToUVs(1 * 8, 0 * 8, 8, 8), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(3 * 8, 1 * 8, 8, 8), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateHeadOverlayMesh(skin){
        var size = 1 + OVERLAY_SCALAR
        var box = new THREE.BoxGeometry(size, size, size);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(4* 8 + 1 * 8, 1 * 8, 8, 8), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(4* 8 +2 * 8, 0 * 8, 8, 8, true), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(4* 8 +0 * 8, 1 * 8, 8, 8), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(4* 8 +2 * 8, 1 * 8, 8, 8), uvAttribute);
        
        SetFaceUVs(TOP_FACE,    SquareToUVs(4* 8 +1 * 8, 0 * 8, 8, 8), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(4* 8 +3 * 8, 1 * 8, 8, 8), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }
    
    function CreateTorsoMesh(skin){
        var box = new THREE.BoxGeometry(1, 1.5, 0.5);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(20, 20, 8, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(32, 20, 8, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(16, 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(28, 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(20, 16, 8, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(28, 16, 8, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateTorsoOverlayMesh(skin){
        var box = new THREE.BoxGeometry(1 + OVERLAY_SCALAR, 1.5 + OVERLAY_SCALAR, 0.5 + OVERLAY_SCALAR);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(20, 16 + 20, 8, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(32, 16 + 20, 8, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(16, 16 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(28, 16 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(20, 16 + 16, 8, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(28, 16 + 16, 8, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }
    
    function CreateRightLegMesh(skin){
        var box = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(4, 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(12, 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(0, 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(8, 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(4, 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(8, 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateRightLegOverlayMesh(skin){
        var box = new THREE.BoxGeometry(0.5 + OVERLAY_SCALAR, 1.5 + OVERLAY_SCALAR, 0.5 + OVERLAY_SCALAR);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(4, 16 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(12, 16 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(0, 16 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(8, 16 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(4, 16 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(8, 16 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }
    
    function CreateLeftLegMesh(skin){
        var box = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(16 + 4,  32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(16 + 12, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(16 + 0, 32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(16 + 8, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(16 + 4, 32 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(16 + 8, 32 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateLeftLegOverlayMesh(skin){
        var box = new THREE.BoxGeometry(0.5 + OVERLAY_SCALAR, 1.5 + OVERLAY_SCALAR, 0.5 + OVERLAY_SCALAR);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(4,  32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(12, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(0, 32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(8, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(4, 32 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(8, 32 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;

        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }
    
    function CreateLeftHandMesh(skin){
        var box = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(16 * 2 + 4,  32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(16 * 2 + 12, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(16 * 2 + 0, 32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(16 * 2 + 8, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(16 * 2 + 4, 32 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(16 * 2 + 8, 32 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateLeftHandOverlayMesh(skin){
        var box = new THREE.BoxGeometry(0.5 + OVERLAY_SCALAR, 1.5 + OVERLAY_SCALAR, 0.5 + OVERLAY_SCALAR);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(16 * 3 + 4,  32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(16 * 3 + 12, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(16 * 3 + 0, 32 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(16 * 3 + 8, 32 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(16 * 3 + 4, 32 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(16 * 3 + 8, 32 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }
    
    function CreateRightHandMesh(skin){
        var box = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(40 + 4, 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(40 + 12, 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(40 + 0, 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(40 + 8, 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(40 + 4, 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(40 + 8, 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, alphaTest:1, side:THREE.DoubleSide});
        return new THREE.Mesh( box, material );
    }
    
    function CreateRightHandOverlayMesh(skin){
        var box = new THREE.BoxGeometry(0.5 + OVERLAY_SCALAR, 1.5 + OVERLAY_SCALAR, 0.5 + OVERLAY_SCALAR);
        var uvAttribute = box.attributes.uv;
    
        SetFaceUVs(FRONT_FACE,  SquareToUVs(40 + 4, 16 + 20, 4, 12), uvAttribute);
        SetFaceUVs(BACK_FACE,   SquareToUVs(40 + 12, 16 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(LEFT_FACE,   SquareToUVs(40 + 0, 16 + 20, 4, 12), uvAttribute);
        SetFaceUVs(RIGHT_FACE,  SquareToUVs(40 + 8, 16 + 20, 4, 12), uvAttribute);
    
        SetFaceUVs(TOP_FACE,    SquareToUVs(40 + 4, 16 + 16, 4, 4), uvAttribute);
        SetFaceUVs(BOTTOM_FACE, SquareToUVs(40 + 8, 16 + 16, 4, 4), uvAttribute);
    
        uvAttribute.needsUpdate = true;
    
        const material = new THREE.MeshBasicMaterial({map:skin, side:THREE.DoubleSide});
        material.transparent = true;
        return new THREE.Mesh( box, material );
    }

    // The texture is needed at this point so all body parts have
    // the material skin assign

    this.InitializeFullMesh = (texture) => {
        this.headOverlay = CreateHeadOverlayMesh(texture);
        this.headOverlay.userData.bodyModel = true;
        this.headOverlay.userData.isOverlay = true;
    
        this.head = CreateHeadMesh(texture);
        this.head.userData.bodyModel = true;
        this.head.userData.isOverlay = false;
    
        this.torso = CreateTorsoMesh(texture);
        this.torso.userData.bodyModel = true;
        this.torso.userData.isOverlay = false;
    
        this.torsoOverlay = CreateTorsoOverlayMesh(texture);
        this.torsoOverlay.userData.bodyModel = true;
        this.torsoOverlay.userData.isOverlay = true;
    
        this.rl = CreateRightLegMesh(texture);
        this.rl.userData.bodyModel = true;
        this.rl.userData.isOverlay = false;
    
        this.rlOverlay = CreateRightLegOverlayMesh(texture);
        this.rlOverlay.userData.bodyModel = true;
        this.rlOverlay.userData.isOverlay = true;
    
        this.ll = CreateLeftLegMesh(texture);
        this.ll.userData.bodyModel = true;
        this.ll.userData.isOverlay = false;
    
        this.llOverlay = CreateLeftLegOverlayMesh(texture);
        this.llOverlay.userData.bodyModel = true;
        this.llOverlay.userData.isOverlay = true;
    
        this.lh = CreateLeftHandMesh(texture);
        this.lh.userData.bodyModel = true;
        this.lh.userData.isOverlay = false;
    
        this.lhOverlay = CreateLeftHandOverlayMesh(texture);
        this.lhOverlay.userData.bodyModel = true;
        this.lhOverlay.userData.isOverlay = true;
    
        this.rh = CreateRightHandMesh(texture);
        this.rh.userData.bodyModel = true;
        this.rh.userData.isOverlay = false;

        this.rhOverlay = CreateRightHandOverlayMesh(texture);
        this.rhOverlay.userData.bodyModel = true;
        this.rhOverlay.userData.isOverlay = true;

        this.overlayMeshes['headOverlay'] = this.headOverlay;
        this.overlayMeshes['torsoOverlay'] = this.torsoOverlay;
        this.overlayMeshes['rhOverlay'] = this.rhOverlay;
        this.overlayMeshes['lhOverlay'] = this.lhOverlay;
        this.overlayMeshes['rlOverlay'] = this.rlOverlay;
        this.overlayMeshes['llOverlay'] = this.llOverlay;
        
        this.normalMeshes['head'] = this.head;
        this.normalMeshes['head'].castShadow = true;
        this.normalMeshes['torso'] = this.torso;
        this.normalMeshes['torso'].castShadow = true;
        this.normalMeshes['rh'] = this.rh;
        this.normalMeshes['rh'].castShadow = true;
        this.normalMeshes['lh'] = this.lh;
        this.normalMeshes['lh'].castShadow = true;
        this.normalMeshes['rl'] = this.rl;
        this.normalMeshes['rl'].castShadow = true;
        this.normalMeshes['ll'] = this.ll;
        this.normalMeshes['ll'].castShadow = true;

    }

    this.ApplyOffsetsToBodyParts = (offsets) => {
        this.headOverlay.position.add(offsets['headOverlay']);
        this.head.position.add(offsets['head']);
        
        this.rl.position.add(offsets['rl']);
        this.rlOverlay.position.add(offsets['rlOverlay']);
        
        this.ll.position.add(offsets['ll']);
        this.llOverlay.position.add(offsets['llOverlay']);
        
        this.lh.position.add(offsets['lh']);
        this.lhOverlay.position.add(offsets['lhOverlay']);
        
        this.rh.position.add(offsets['rh']);
        this.rhOverlay.position.add(offsets['rhOverlay']);

        this.meshGroups['ll'] = new THREE.Group();
        this.meshGroups['ll'].add(this.ll);
        this.meshGroups['ll'].add(this.llOverlay);

        this.originalPosition['ll'] = this.meshGroups['ll'].position.clone();

        this.meshGroups['rl'] = new THREE.Group();
        this.meshGroups['rl'].add(this.rl);
        this.meshGroups['rl'].add(this.rlOverlay);

        this.originalPosition['rl'] = this.meshGroups['rl'].position.clone();

        this.meshGroups['lh'] = new THREE.Group();
        this.meshGroups['lh'].add(this.lh);
        this.meshGroups['lh'].add(this.lhOverlay);

        this.originalPosition['lh'] = this.meshGroups['lh'].position.clone();

        this.meshGroups['rh'] = new THREE.Group();
        this.meshGroups['rh'].add(this.rh);
        this.meshGroups['rh'].add(this.rhOverlay);

        this.originalPosition['rh'] = this.meshGroups['rh'].position.clone();
    }

    this.AddToScene = (scene) => {
        scene.add(this.head);
        scene.add(this.torso);
        // scene.add(this.rl);
        // scene.add(this.ll);
        scene.add(this.meshGroups['rl']);
        scene.add(this.meshGroups['ll']);
        scene.add(this.meshGroups['rh']);
        scene.add(this.meshGroups['lh']);
        // scene.add(this.lh);
        // scene.add(this.rh);
    
        scene.add(this.headOverlay);
        scene.add(this.torsoOverlay);
        // scene.add(this.rlOverlay);
        // scene.add(this.llOverlay);
        // scene.add(this.lhOverlay);
        // scene.add(this.rhOverlay);
    }

    function DisposeOfMesh(mesh){
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    this.UpdateTextureOnBodyParts = (newTexture) => {
        for (let part of Object.values(this.normalMeshes)) {
            part.material.map = newTexture;
            part.material.needsUpdate = true;
        }
        for (let part of Object.values(this.overlayMeshes)) {
            part.material.map = newTexture;
            part.material.needsUpdate = true;
        }
    }

    this.ClearMeshes = () => {
        DisposeOfMesh(this.head);
        DisposeOfMesh(this.torso);
        DisposeOfMesh(this.rh);
        DisposeOfMesh(this.lh);
        DisposeOfMesh(this.rl);
        DisposeOfMesh(this.ll);
        DisposeOfMesh(this.headOverlay);
        DisposeOfMesh(this.torsoOverlay);
        DisposeOfMesh(this.rhOverlay);
        DisposeOfMesh(this.lhOverlay);
        DisposeOfMesh(this.rlOverlay);
        DisposeOfMesh(this.llOverlay);
        delete this.head;
        delete this.torso;
        delete this.rh;
        delete this.lh;
        delete this.rl;
        delete this.ll;
        delete this.headOverlay;
        delete this.torsoOverlay;
        delete this.rhOverlay;
        delete this.lhOverlay;
        delete this.rlOverlay;
        delete this.llOverlay;
    }
}

export {SkinMesh};