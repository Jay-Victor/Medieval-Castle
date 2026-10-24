import * as THREE from "three";
import { rng, TAU } from "./helpers.js";

function c(hex) {
  return new THREE.Color(hex);
}

/* Keyed colour scripts for the diorama's day. The castle is lit like a
   stage set: a warm key light, cool bounce, and an ink-blue night. */
const KEYS = [
  {
    h: 0,
    top: c(0x06101c), horizon: c(0x15212b), fog: c(0x0f1a22),
    sun: c(0x1d2a36), sunI: 0, hemiSky: c(0x3c536d), hemiGround: c(0x241d16), hemiI: 0.63,
    ambient: c(0x4a5e76), ambI: 0.52, exposure: 0.96, stars: 0.92, moon: 1.05,
    sunSprite: 0, moonSprite: 1
  },
  {
    h: 4.4,
    top: c(0x152134), horizon: c(0x543b3d), fog: c(0x2b2d33),
    sun: c(0xffa764), sunI: 0, hemiSky: c(0x53627a), hemiGround: c(0x2b2119), hemiI: 0.52,
    ambient: c(0x4c4f58), ambI: 0.42, exposure: 0.88, stars: 0.7, moon: 0.72,
    sunSprite: 0, moonSprite: 0.8
  },
  {
    h: 6.1,
    top: c(0x52657b), horizon: c(0xd89a76), fog: c(0x9e8177),
    sun: c(0xffb876), sunI: 1.4, hemiSky: c(0xaeb0ac), hemiGround: c(0x614a35), hemiI: 0.65,
    ambient: c(0x977f72), ambI: 0.44, exposure: 0.95, stars: 0.12, moon: 0.08,
    sunSprite: 0.9, moonSprite: 0
  },
  {
    h: 8.1,
    top: c(0x7f9bac), horizon: c(0xe9cfaa), fog: c(0xcabda7),
    sun: c(0xffdfb0), sunI: 2.45, hemiSky: c(0xc2d2d3), hemiGround: c(0x6d5b42), hemiI: 0.86,
    ambient: c(0xb0a597), ambI: 0.46, exposure: 1.02, stars: 0, moon: 0,
    sunSprite: 0.32, moonSprite: 0
  },
  {
    h: 12.2,
    top: c(0x839faf), horizon: c(0xeee5d3), fog: c(0xd8d0bf),
    sun: c(0xfff3dc), sunI: 3.1, hemiSky: c(0xbfd0d1), hemiGround: c(0x72634a), hemiI: 0.96,
    ambient: c(0xbab4a8), ambI: 0.55, exposure: 1.06, stars: 0, moon: 0,
    sunSprite: 0.16, moonSprite: 0
  },
  {
    h: 16.0,
    top: c(0x7c99a8), horizon: c(0xf0d8b5), fog: c(0xd2c1a7),
    sun: c(0xffdbb0), sunI: 2.7, hemiSky: c(0xc4cdc5), hemiGround: c(0x6e5940), hemiI: 0.82,
    ambient: c(0xb0a18c), ambI: 0.48, exposure: 1.03, stars: 0, moon: 0,
    sunSprite: 0.26, moonSprite: 0
  },
  {
    h: 18.35,
    top: c(0x617286), horizon: c(0xe5a475), fog: c(0xb69479),
    sun: c(0xffad6f), sunI: 1.7, hemiSky: c(0xb0a69b), hemiGround: c(0x644a35), hemiI: 0.64,
    ambient: c(0x8f7968), ambI: 0.43, exposure: 0.94, stars: 0.08, moon: 0.02,
    sunSprite: 0.95, moonSprite: 0
  },
  {
    h: 19.55,
    top: c(0x293a50), horizon: c(0xb0634a), fog: c(0x6c5150),
    sun: c(0xe78254), sunI: 0.35, hemiSky: c(0x75747b), hemiGround: c(0x453428), hemiI: 0.48,
    ambient: c(0x6a5951), ambI: 0.42, exposure: 0.9, stars: 0.32, moon: 0.36,
    sunSprite: 0.45, moonSprite: 0.05
  },
  {
    h: 20.9,
    top: c(0x0d1928), horizon: c(0x263443), fog: c(0x18222d),
    sun: c(0x25313c), sunI: 0, hemiSky: c(0x364d67), hemiGround: c(0x211a14), hemiI: 0.58,
    ambient: c(0x465b70), ambI: 0.5, exposure: 0.94, stars: 0.85, moon: 0.9,
    sunSprite: 0, moonSprite: 0.8
  },
  {
    h: 24,
    top: c(0x06101c), horizon: c(0x15212b), fog: c(0x0f1a22),
    sun: c(0x1d2a36), sunI: 0, hemiSky: c(0x3c536d), hemiGround: c(0x241d16), hemiI: 0.63,
    ambient: c(0x4a5e76), ambI: 0.52, exposure: 0.96, stars: 0.92, moon: 1.05,
    sunSprite: 0, moonSprite: 1
  }
];

const tmpColorA = new THREE.Color();
const tmpColorB = new THREE.Color();

function lerpColor(a, b, t, target) {
  return target.copy(a).lerp(b, t);
}

function sample(hour) {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (hour >= KEYS[i].h && hour <= KEYS[i + 1].h) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const span = b.h - a.h || 1;
  const t = THREE.MathUtils.clamp((hour - a.h) / span, 0, 1);
  return { a, b, t };
}

function solarDirection(hour) {
  const angle = ((hour - 6) / 24) * Math.PI * 2;
  const y = Math.sin(angle);
  const x = Math.cos(angle) * 0.83;
  const z = 0.42;
  const v = new THREE.Vector3(x, y, z).normalize();
  return v;
}

export function timeBand(hour) {
  if (hour < 4.6) return { zh: "长夜", en: "DEEP NIGHT", phase: "night" };
  if (hour < 6.4) return { zh: "拂晓", en: "FIRST LIGHT", phase: "dawn" };
  if (hour < 9.2) return { zh: "晨光", en: "MORNING", phase: "day" };
  if (hour < 11.2) return { zh: "上午", en: "FORENOON", phase: "day" };
  if (hour < 13.6) return { zh: "正午", en: "HIGH NOON", phase: "day" };
  if (hour < 17.2) return { zh: "午后", en: "AFTERNOON", phase: "day" };
  if (hour < 19.2) return { zh: "暮色", en: "GOLDEN HOUR", phase: "dusk" };
  if (hour < 21.4) return { zh: "入夜", en: "BLUE HOUR", phase: "dusk" };
  return { zh: "夜", en: "NIGHT", phase: "night" };
}

export class Atmosphere {
  constructor(scene, renderer, textures, materials) {
    this.scene = scene;
    this.renderer = renderer;
    this.textures = textures;
    this.materials = materials;
    this.hour = 14.33;
    this.phase = "day";

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x839faf) },
      horizonColor: { value: new THREE.Color(0xeee5d3) },
      belowColor: { value: new THREE.Color(0x1b1813) },
      sunColor: { value: new THREE.Color(0xfff3dc) },
      sunDirection: { value: new THREE.Vector3(0, 1, 0.4) },
      glowStrength: { value: 0.35 },
      horizonGlow: { value: 0.4 }
    };

    const skyGeo = new THREE.SphereGeometry(280, 48, 28);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: "varying vec3 vWorld; void main(){ vWorld = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 belowColor; uniform vec3 sunColor; uniform vec3 sunDirection; uniform float glowStrength; uniform float horizonGlow; varying vec3 vWorld;" +
        "void main(){" +
        " vec3 dir = normalize(vWorld);" +
        " float h = smoothstep(-0.08, 0.62, dir.y);" +
        " vec3 col = mix(horizonColor, topColor, h);" +
        " float landing = smoothstep(0.02, -0.72, dir.y);" +
        " col = mix(col, belowColor, landing * 0.92);" +
        " float band = exp(-pow((dir.y - 0.01) * 7.0, 2.0)) * 0.7;" +
        " col += horizonColor * band * 0.12;" +
        " float sd = max(dot(dir, normalize(sunDirection)), 0.0);" +
        " float broad = pow(sd, 8.0) * 0.26 * glowStrength;" +
        " float tight = pow(sd, 130.0) * 0.78 * glowStrength;" +
        " float rim = pow(1.0 - abs(dir.y - 0.06), 16.0) * horizonGlow;" +
        " col += sunColor * (broad + tight);" +
        " col += sunColor * rim * 0.07;" +
        " gl_FragColor = vec4(col, 1.0);" +
        "}"
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.name = "sky-dome";
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    // stars
    const starCount = 1100;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const starR = rng(1234);
    for (let i = 0; i < starCount; i++) {
      let x;
      let y;
      let z;
      do {
        x = starR() * 2 - 1;
        y = starR() * 1.2 - 0.18;
        z = starR() * 2 - 1;
      } while (x * x + y * y + z * z > 1 || y < -0.1);
      const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(260);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      sizes[i] = 0.6 + starR() * 1.8;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xe8e1cb,
      size: 1.9,
      map: textures.glow,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    this.stars.name = "stars";
    this.stars.frustumCulled = false;
    scene.add(this.stars);

    this.sunSpriteMaterial = new THREE.SpriteMaterial({
      map: textures.glow,
      color: 0xffe3ac,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    this.sunSprite = new THREE.Sprite(this.sunSpriteMaterial);
    this.sunSprite.scale.set(36, 36, 1);
    this.sunSprite.name = "sun-glow";
    scene.add(this.sunSprite);

    this.moonSpriteMaterial = new THREE.SpriteMaterial({
      map: textures.glow,
      color: 0xd7e3e5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    this.moonSprite = new THREE.Sprite(this.moonSpriteMaterial);
    this.moonSprite.scale.set(16, 16, 1);
    this.moonSprite.name = "moon-glow";
    scene.add(this.moonSprite);

    this.moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 28),
      new THREE.MeshBasicMaterial({ color: 0xf2efda, transparent: true, opacity: 0 })
    );
    this.moonDisc.name = "moon-disc";
    scene.add(this.moonDisc);

    // light rig
    this.sun = new THREE.DirectionalLight(0xfff2da, 2.5);
    this.sun.name = "sun-light";
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 190;
    this.sun.shadow.camera.left = -58;
    this.sun.shadow.camera.right = 58;
    this.sun.shadow.camera.top = 58;
    this.sun.shadow.camera.bottom = -58;
    this.sun.shadow.bias = -0.00035;
    this.sun.shadow.normalBias = 0.022;
    this.sun.target.position.set(0, 4, 0);
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.moonLight = new THREE.DirectionalLight(0xa8c5dc, 0.0);
    this.moonLight.name = "moon-light";
    this.moonLight.castShadow = false;
    this.moonLight.target.position.set(0, 4, 0);
    scene.add(this.moonLight);
    scene.add(this.moonLight.target);

    this.nightFill = new THREE.DirectionalLight(0x6f8fb3, 0.0);
    this.nightFill.name = "night-rim-fill";
    this.nightFill.position.set(-52, 48, 28);
    this.nightFill.target.position.set(0, 6, 0);
    this.nightFill.castShadow = false;
    scene.add(this.nightFill);
    scene.add(this.nightFill.target);

    this.hemi = new THREE.HemisphereLight(0xb9ccd2, 0x66543b, 0.8);
    this.hemi.name = "sky-bounce";
    scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xb3aa9a, 0.4);
    this.ambient.name = "ambient";
    scene.add(this.ambient);

    this.scene.fog = new THREE.FogExp2(0xd8d0bf, 0.0018);
    this.currentState = {};
    this.lastPhase = "day";
    this.hour = 14.33;
    this.update(this.hour, true);
  }

  update(hour, force = false) {
    if (!force && Math.abs(hour - this.hour) < 0.0005) return this.currentState;
    this.hour = hour;
    const { a, b, t } = sample(hour);

    const blend = (k) => {
      if (typeof a[k] === "number") return THREE.MathUtils.lerp(a[k], b[k], t);
      return lerpColor(a[k], b[k], t, new THREE.Color());
    };
    const top = blend("top");
    const horizon = blend("horizon");
    const fog = blend("fog");
    const sunColor = blend("sun");
    const hemiSky = blend("hemiSky");
    const hemiGround = blend("hemiGround");
    const ambient = blend("ambient");
    const exposure = blend("exposure");
    const sunI = blend("sunI");
    const hemiI = blend("hemiI");
    const ambI = blend("ambI");
    const starsOpacity = blend("stars");
    const moonI = blend("moon");
    const sunSprite = blend("sunSprite");
    const moonSprite = blend("moonSprite");

    this.skyUniforms.topColor.value.copy(top);
    this.skyUniforms.horizonColor.value.copy(horizon);
    const below = new THREE.Color().copy(top).multiplyScalar(0.22).lerp(new THREE.Color(0x0a0a09), 0.52);
    this.skyUniforms.belowColor.value.copy(below);
    this.skyUniforms.sunColor.value.copy(sunColor);
    this.skyUniforms.glowStrength.value = 0.35 + 0.75 * Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    this.skyUniforms.horizonGlow.value = 0.26 + 0.32 * Math.abs(Math.sin(((hour - 6) / 12) * Math.PI));

    const sunDir = solarDirection(hour);
    this.skyUniforms.sunDirection.value.copy(sunDir);
    this.sun.position.copy(sunDir.clone().multiplyScalar(82)).add(new THREE.Vector3(0, 4, 0));
    this.sun.intensity = sunI;
    this.sun.color.copy(sunColor);
    this.sun.visible = sunDir.y > -0.08 && sunI > 0.01;

    this.hemi.color.copy(hemiSky);
    this.hemi.groundColor.copy(hemiGround);
    this.hemi.intensity = hemiI;
    this.ambient.color.copy(ambient);
    this.ambient.intensity = ambI;

    const nightness = THREE.MathUtils.clamp(1 - THREE.MathUtils.smoothstep(sunDir.y, -0.12, 0.22), 0, 1);
    const moonDir = solarDirection((hour + 12) % 24);
    this.moonLight.position.copy(moonDir.clone().multiplyScalar(75)).add(new THREE.Vector3(0, 4, 0));
    this.moonLight.intensity = moonI * 1.6;
    this.nightFill.intensity = nightness * 0.52;

    // sky fixtures
    const sunPos = sunDir.clone().multiplyScalar(240);
    this.sunSprite.position.copy(sunPos);
    this.sunSpriteMaterial.opacity = sunSprite;
    this.sunSprite.visible = sunDir.y > -0.1 && sunSprite > 0.005;
    const moonPos = moonDir.clone().multiplyScalar(238);
    this.moonSprite.position.copy(moonPos);
    this.moonSpriteMaterial.opacity = moonSprite * 0.9;
    this.moonSprite.visible = moonDir.y > -0.05 && moonSprite > 0.005;
    this.moonDisc.position.copy(moonPos);
    this.moonDisc.lookAt(0, 0, 0);
    this.moonDisc.material.opacity = moonSprite * 0.9;
    this.moonDisc.visible = moonDir.y > -0.05 && moonSprite > 0.005;
    this.stars.material.opacity = starsOpacity * 0.9;
    this.stars.visible = starsOpacity > 0.01;

    this.renderer.toneMappingExposure = exposure;
    if (this.scene.fog) {
      this.scene.fog.color.copy(fog);
      this.scene.fog.density = 0.00155 + (1 - Math.max(0, sunDir.y)) * 0.0008;
    }

    // windows, lanterns and stained glass inherit nightfall
    if (this.materials) {
      this.materials.glass.emissiveIntensity = 0.045 + nightness * 1.65;
      this.materials.stainedGlass.emissiveIntensity = 0.05 + nightness * 1.4;
    }

    const band = timeBand(hour);
    let phaseTheme = "day";
    if (band.phase === "night") phaseTheme = "night";
    else if (band.phase === "dusk") phaseTheme = "dusk";
    else if (band.phase === "dawn") phaseTheme = hour < 6.0 ? "night" : "day";
    this.phaseTheme = phaseTheme;
    this.phase = band.phase;
    this.nightness = nightness;

    const state = {
      hour,
      band,
      phaseTheme,
      nightness,
      sunAltitude: Math.round((Math.asin(Math.max(-1, Math.min(1, sunDir.y))) * 180) / Math.PI),
      sunDirection: sunDir,
      starsOpacity,
      top,
      horizon
    };
    this.currentState = state;
    return state;
  }
}

export function formatHour(hour) {
  const h = Math.floor(((hour % 24) + 24) % 24);
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
