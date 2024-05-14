const UVMAP = {
  classic: {
    face: [8, 8, 8, 8],
    face_back: [24, 8, 8, 8],
    face_overlay: [40, 8, 8, 8],
    face_overlay_back: [56, 8, 8, 8],
    torso: [20, 20, 8, 12],
    torso_back: [32, 20, 8, 12],
    torso_overlay: [20, 36, 8, 12],
    torso_overlay_back: [32, 36, 8, 12],
    left_arm: [36, 52, 4, 12],
    left_arm_back: [44, 52, 4, 12],
    left_arm_overlay: [52, 52, 4, 12],
    left_arm_overlay_back: [60, 52, 4, 12],
    right_arm: [44, 20, 4, 12],
    right_arm_back: [52, 20, 4, 12],
    right_arm_overlay: [44, 36, 4, 12],
    right_arm_overlay_back: [52, 36, 4, 12],
    left_leg: [20, 52, 4, 12],
    left_leg_back: [28, 52, 4, 12],
    left_leg_overlay: [4, 52, 4, 12],
    left_leg_overlay_back: [12, 52, 4, 12],
    right_leg: [4, 20, 4, 12],
    right_leg_back: [12, 20, 4, 12],
    right_leg_overlay: [4, 36, 4, 12],
    right_leg_overlay_back: [12, 36, 4, 12]
  }
}

const LAYOUT = {
  classic: [
    {uv: ['face_back', 'face_overlay_back'], coordinates: [24, 0]},
    {uv: ['face', 'face_overlay'], coordinates: [4, 0]},
    {uv: ['torso', 'torso_overlay'], coordinates: [4, 8]},
    {uv: ['torso_back', 'torso_overlay_back'], coordinates: [24, 8]},
    {uv: ['torso', 'torso_overlay'], coordinates: [4, 8]},
    {uv: ['torso_back', 'torso_overlay_back'], coordinates: [24, 8]},
    {uv: ['right_leg', 'right_leg_overlay'], coordinates: [4, 20]},
    {uv: ['right_leg_back', 'right_leg_overlay_back'], coordinates: [28, 20]},
    {uv: ['left_leg', 'left_leg_overlay'], coordinates: [8, 20]},
    {uv: ['left_leg_back', 'left_leg_overlay_back'], coordinates: [24, 20]},
    {uv: ['right_arm', 'right_arm_overlay'], coordinates: [0, 8]},
    {uv: ['right_arm_back', 'right_arm_overlay_back'], coordinates: [32, 8]},
    {uv: ['left_arm', 'left_arm_overlay'], coordinates: [12, 8]},
    {uv: ['left_arm_back', 'left_arm_overlay_back'], coordinates: [20, 8]}
  ]
}

function LayerToPreview(image, variant = 'classic') {
  // exports a blob url
  image.convertToBlob().then(function (result) {localStorage.setItem('skinRef', URL.createObjectURL(result))})
  
  const canvas = new OffscreenCanvas(36, 32);
  const ctx = canvas.getContext('2d');

  const uvmap = UVMAP[variant];
  const layout = LAYOUT[variant];

  layout.forEach(segment => {
    segment.uv.forEach(area => {
      const from = uvmap[area];
      const to = segment.coordinates;
      ctx.drawImage(image, ...from, ...to, from[2], from[3],
                    image, 0, 0, canvas.width, canvas.height
        )
    })
  })

  return canvas;
}

export {LayerToPreview};
