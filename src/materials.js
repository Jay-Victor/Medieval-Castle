import * as THREE from "three";

function std(params) {
  return new THREE.MeshStandardMaterial(params);
}

export function createMaterialLibrary(textures) {
  const wallStone = std({
    map: textures.stone,
    bumpMap: textures.stone,
    bumpScale: 0.045,
    color: 0xf2e9d8,
    roughness: 0.94,
    metalness: 0.0
  });

  const ashlar = std({
    map: textures.stoneLight,
    bumpMap: textures.stoneLight,
    bumpScale: 0.035,
    color: 0xf6ede0,
    roughness: 0.9
  });

  const weatheredStone = std({
    map: textures.stoneDark,
    bumpMap: textures.stoneDark,
    bumpScale: 0.055,
    color: 0xe9e1d2,
    roughness: 0.96
  });

  const slate = std({
    map: textures.slate,
    bumpMap: textures.slate,
    bumpScale: 0.09,
    color: 0xced4d2,
    roughness: 0.72,
    metalness: 0.03
  });

  const slateDark = std({
    map: textures.slate,
    bumpMap: textures.slate,
    bumpScale: 0.13,
    color: 0x9ea9a7,
    roughness: 0.68,
    metalness: 0.06
  });

  const lead = std({ color: 0x3d4645, roughness: 0.5, metalness: 0.5 });

  const wood = std({
    map: textures.wood,
    bumpMap: textures.wood,
    bumpScale: 0.02,
    roughness: 0.72,
    color: 0xf1dfc9
  });

  const woodDark = std({
    map: textures.woodDark,
    bumpMap: textures.woodDark,
    bumpScale: 0.02,
    roughness: 0.7,
    color: 0xc9b39a
  });

  const woodPale = std({
    map: textures.wood,
    color: 0xf6ead8,
    roughness: 0.84
  });

  const cobble = std({
    map: textures.cobble,
    bumpMap: textures.cobble,
    bumpScale: 0.06,
    color: 0xd8cdbb,
    roughness: 1
  });

  const gravel = std({
    map: textures.gravel,
    bumpMap: textures.gravel,
    bumpScale: 0.03,
    color: 0xe5dac2,
    roughness: 1
  });

  const stoneFloor = std({
    map: textures.stoneFloor,
    bumpMap: textures.stoneFloor,
    bumpScale: 0.035,
    color: 0xe5d9c4,
    roughness: 0.9
  });

  const grass = std({
    map: textures.grass,
    bumpMap: textures.grass,
    bumpScale: 0.035,
    color: 0xbfc5a8,
    roughness: 1
  });

  const grassDark = std({
    map: textures.grass,
    color: 0x8f9b7b,
    roughness: 1
  });

  const soil = std({ color: 0x403628, roughness: 1 });
  const moss = std({ color: 0x536345, roughness: 1 });

  const plaster = std({ color: 0xd9c8aa, roughness: 0.95 });
  const plasterWarm = std({ color: 0xcbb794, roughness: 0.98 });
  const ceiling = std({ color: 0xb8a17d, roughness: 0.9 });

  const iron = std({ color: 0x2e2d29, roughness: 0.42, metalness: 0.68 });
  const ironRust = std({ color: 0x5c4030, roughness: 0.72, metalness: 0.4 });
  const gold = std({ color: 0xbf9857, roughness: 0.28, metalness: 0.86 });
  const goldAntique = std({ color: 0x8f6b34, roughness: 0.42, metalness: 0.68 });
  const copperPatina = std({ color: 0x547d6b, roughness: 0.6, metalness: 0.42 });
  const silver = std({ color: 0xb7b9b4, roughness: 0.3, metalness: 0.78 });

  const clothCrimson = std({ color: 0x752c25, roughness: 0.96, side: THREE.DoubleSide });
  const clothCrimsonDeep = std({ color: 0x4c1e19, roughness: 1, side: THREE.DoubleSide });
  const clothBlue = std({ color: 0x263d47, roughness: 0.97, side: THREE.DoubleSide });
  const clothIvory = std({ color: 0xcdbd9f, roughness: 0.95, side: THREE.DoubleSide });
  const clothGold = std({ color: 0x9b773d, roughness: 0.86, side: THREE.DoubleSide });
  const linen = std({ color: 0xd8c9ae, roughness: 0.98, side: THREE.DoubleSide });
  const linenLight = std({ color: 0xe7dbc4, roughness: 1, side: THREE.DoubleSide });
  const velvetGreen = std({ color: 0x31483a, roughness: 0.94, side: THREE.DoubleSide });

  const leather = std({ color: 0x5d3d26, roughness: 0.62, metalness: 0.04 });
  const leatherRed = std({ color: 0x6a2c22, roughness: 0.55 });

  const wax = std({ color: 0xe4d9bd, roughness: 0.84 });
  const parchment = std({ map: textures.parchmentMap, color: 0xf4e8cf, roughness: 0.96 });
  const paper = std({ color: 0xe6d9bf, roughness: 0.96, side: THREE.DoubleSide });
  const bookBlue = std({ color: 0x2b3a46, roughness: 0.72 });
  const bookRed = std({ color: 0x662f28, roughness: 0.72 });
  const bookGreen = std({ color: 0x374631, roughness: 0.76 });
  const bookBrown = std({ color: 0x5c422b, roughness: 0.72 });
  const bookCream = std({ color: 0xb5a588, roughness: 0.84 });

  const water = new THREE.MeshPhysicalMaterial({
    color: 0x2e4d4c,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.91,
    bumpMap: textures.waterBump,
    bumpScale: 0.25,
    side: THREE.DoubleSide
  });

  const fountainWater = new THREE.MeshPhysicalMaterial({
    color: 0x8db7ac,
    roughness: 0.08,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.8,
    bumpMap: textures.waterBump,
    bumpScale: 0.35,
    side: THREE.DoubleSide
  });

  const glass = std({
    color: 0xefe0b6,
    emissive: 0xffa954,
    emissiveMap: textures.windowGlow,
    emissiveIntensity: 0.05,
    map: textures.windowGlow,
    roughness: 0.36,
    metalness: 0.08
  });

  const stainedGlass = std({
    color: 0xf8e6bc,
    map: textures.stainedGlass,
    emissive: 0xff9f55,
    emissiveMap: textures.stainedGlass,
    emissiveIntensity: 0.05,
    roughness: 0.25,
    metalness: 0.06
  });

  const flame = new THREE.MeshBasicMaterial({
    color: 0xff9638,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });

  const flameCore = new THREE.MeshBasicMaterial({
    color: 0xffc766,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
  });

  const glow = new THREE.MeshBasicMaterial({
    color: 0xffb765,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ember = new THREE.MeshBasicMaterial({ color: 0x8f2f13 });

  const glassPlain = new THREE.MeshPhysicalMaterial({
    color: 0x9bb0b0,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide
  });

  const rugAurelia = std({
    map: textures.rugAurelia,
    roughness: 0.98,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const rugSolar = std({
    map: textures.rugSolar,
    roughness: 0.98,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const rugLibrary = std({
    map: textures.rugLibrary,
    roughness: 0.98,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

  const tapestryCrimson = std({
    map: textures.tapestryCrimson,
    roughness: 0.98,
    side: THREE.DoubleSide
  });

  const tapestryIndigo = std({
    map: textures.tapestryIndigo,
    roughness: 0.98,
    side: THREE.DoubleSide
  });

  const banner = std({
    map: textures.banner,
    roughness: 0.92,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.18
  });

  const leafDeep = std({ color: 0x3d5537, roughness: 0.93 });
  const leafMid = std({ color: 0x566c45, roughness: 0.9 });
  const leafLight = std({ color: 0x78855a, roughness: 0.9 });
  const leafOlive = std({ color: 0x6d7551, roughness: 0.92 });
  const hedge = std({ color: 0x3f5136, roughness: 0.96 });
  const hedgeLight = std({ color: 0x526440, roughness: 0.95 });
  const bark = std({ color: 0x4e3a29, roughness: 1 });
  const terracotta = std({ color: 0x9f5d3d, roughness: 0.82 });
  const terracottaDark = std({ color: 0x78422d, roughness: 0.88 });
  const plasterWhite = std({ color: 0xdfd2bb, roughness: 0.95 });
  const chalk = std({ color: 0xddd2bd, roughness: 0.98 });
  const charcoal = std({ color: 0x24231f, roughness: 0.9 });
  const foodBread = std({ color: 0xb18045, roughness: 0.92 });
  const foodCheese = std({ color: 0xd9b55a, roughness: 0.8 });
  const foodFruit = std({ color: 0x9a3f26, roughness: 0.62 });
  const foodGreen = std({ color: 0x66763e, roughness: 0.8 });
  const waxSeal = std({ color: 0x8b2f20, roughness: 0.5, metalness: 0.05 });
  const whiteCloth = std({ color: 0xe9deca, roughness: 0.98, side: THREE.DoubleSide });
  const beddingBlue = std({ color: 0x4d6267, roughness: 0.98, side: THREE.DoubleSide });

  const flowerPink = std({ color: 0xb76e66, roughness: 0.8 });
  const flowerCream = std({ color: 0xd8c79b, roughness: 0.8 });
  const flowerYellow = std({ color: 0xc8a859, roughness: 0.8 });
  const flowerPurple = std({ color: 0x70627d, roughness: 0.8 });
  const flowerRed = std({ color: 0x8f3d31, roughness: 0.82 });
  const flowerWhite = std({ color: 0xd8d2be, roughness: 0.84 });

  return {
    wallStone,
    ashlar,
    weatheredStone,
    slate,
    slateDark,
    lead,
    wood,
    woodDark,
    woodPale,
    cobble,
    gravel,
    stoneFloor,
    grass,
    grassDark,
    soil,
    moss,
    plaster,
    plasterWarm,
    ceiling,
    iron,
    ironRust,
    gold,
    goldAntique,
    copperPatina,
    silver,
    clothCrimson,
    clothCrimsonDeep,
    clothBlue,
    clothIvory,
    clothGold,
    linen,
    linenLight,
    velvetGreen,
    leather,
    leatherRed,
    wax,
    parchment,
    paper,
    bookBlue,
    bookRed,
    bookGreen,
    bookBrown,
    bookCream,
    water,
    fountainWater,
    glass,
    stainedGlass,
    flame,
    flameCore,
    glow,
    ember,
    glassPlain,
    rugAurelia,
    rugSolar,
    rugLibrary,
    tapestryCrimson,
    tapestryIndigo,
    banner,
    leafDeep,
    leafMid,
    leafLight,
    leafOlive,
    hedge,
    hedgeLight,
    bark,
    terracotta,
    terracottaDark,
    plasterWhite,
    chalk,
    charcoal,
    foodBread,
    foodCheese,
    foodFruit,
    foodGreen,
    waxSeal,
    whiteCloth,
    beddingBlue,
    flowerPink,
    flowerCream,
    flowerYellow,
    flowerPurple,
    flowerRed,
    flowerWhite,
    bottles: [std({ color: 0x35503d, roughness: 0.22, metalness: 0.15 }), std({ color: 0x5a3a26, roughness: 0.28 })]
  };
}

export function setEmissiveStrength(materials, strength) {
  const windows = [materials.glass, materials.stainedGlass];
  windows.forEach((m, i) => {
    m.emissiveIntensity = (i === 0 ? 1.36 : 1.05) * strength;
  });
}
