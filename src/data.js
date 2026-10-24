export const WORLD = {
  base: { w: 84, d: 72, h: 2.6 },
  island: { x: 31.5, z: 27.5 },
  moat: { innerX: 31.6, innerZ: 27.6, outerX: 35.2, outerZ: 31.2, y: -0.72 },
  bank: { x: 41.5, z: 35.5 },
  wall: { x: 25, z: 21, height: 6.8, thickness: 1.05 },
  tower: { radius: 3.2, height: 12.8 },
  gatehouse: { z: 21.7, towerX: 4.9, towerR: 2.45, towerH: 12.2, bodyW: 9.2, bodyH: 8.3 },
  keep: {
    w: 18,
    d: 13,
    floors: [0, 5.2, 10.1, 13.8],
    roomFloor: [0.3, 5.55, 10.45],
    roofH: 6.4
  },
  wings: { x0: 9, x1: 14.7, z: 4.1, height: 4.55 },
  garden: { minX: -19.2, maxX: 19.2, minZ: 8.2, maxZ: 19.1, centerZ: 13.65 },
  paths: { width: 3.1 }
};

export const FLOOR_GROUPS = {
  0: { architecture: "keep-ground", furniture: "floor-ground", decor: "decor-ground" },
  1: { architecture: "keep-solar", furniture: "floor-solar", decor: "decor-solar" },
  2: { architecture: "keep-library", furniture: "floor-library", decor: "decor-library" }
};

export const ROOMS = [
  {
    id: "greatHall",
    numeral: "I",
    name: "大厅",
    latin: "The Great Hall",
    floor: 0,
    interior: true,
    bounds: { minX: -8.15, maxX: 8.15, minZ: -5.65, maxZ: 5.65, y: 0.3, height: 4.9 },
    anchor: [0.2, 3.4, 0.7],
    labelOffset: [0.7, -0.25],
    labelPriority: 10,
    atlasNote: "十席长桌、乐师廊与一面会讲故事的挂毯。",
    description:
      "整座城堡的心脏。一张橡木长桌从巨大壁炉前伸向高台，正午的光从南向高窗落到餐盘上；入夜后，铁环吊灯与炉火接替太阳。",
    light: "南窗 / 炉火",
    meta: ["层高 4.9 m", "器物 33 件"],
    features: ["十席长桌", "领主高台", "乐师廊", "壁炉与织毯", "铁环吊灯"],
    camera: { position: [15, 27, 17], target: [0, 1.8, 0] },
    floorMode: "ground"
  },
  {
    id: "solar",
    numeral: "II",
    name: "领主套房",
    latin: "The Lord's Solar",
    floor: 1,
    interior: true,
    bounds: { minX: -8.15, maxX: 8.15, minZ: -5.65, maxZ: 5.65, y: 5.55, height: 4.5 },
    anchor: [3.6, 8.15, -1.8],
    labelOffset: [0.85, -0.1],
    labelPriority: 7,
    atlasNote: "四柱床、炉边双椅，以及一扇朝南的露台门。",
    description:
      "领主与夫人的起居之所。胡桃木四柱床藏在帷幔深处，火炉边摆着两把面向阳台的扶手椅；每天第一束光都会先经过晨露露台。",
    light: "南向 / 壁炉",
    meta: ["层高 4.5 m", "器物 24 件"],
    features: ["四柱帷幔床", "炉边双椅", "写字台", "南露台", "胡桃木衣柜"],
    camera: { position: [14, 35, 16], target: [0, 6.2, 0] },
    floorMode: "solar"
  },
  {
    id: "library",
    numeral: "III",
    name: "藏书阁",
    latin: "The Library",
    floor: 2,
    interior: true,
    bounds: { minX: -8.15, maxX: 8.15, minZ: -5.65, maxZ: 5.65, y: 10.45, height: 3.3 },
    anchor: [-2.0, 12.45, -0.4],
    labelOffset: [-0.85, -0.45],
    labelPriority: 6,
    atlasNote: "沿墙书柜、天球仪，以及通往星象露台的窄门。",
    description:
      "屋顶下最后一间温暖的房间。书架从地面长到阴影里，卷轴、天球与墨香挤在窗边；北面的星象露台没有屋顶，专门留给夜。",
    light: "北窗 / 烛台",
    meta: ["层高 3.3 m", "器物 26 件"],
    features: ["整墙书柜", "天球仪", "读经长桌", "星象露台", "黄铜望远镜"],
    camera: { position: [14, 39, 16], target: [0, 10.6, 0] },
    floorMode: "library"
  },
  {
    id: "chapel",
    numeral: "IV",
    name: "礼拜堂",
    latin: "The Chapel",
    floor: 0,
    interior: true,
    bounds: { minX: 9.4, maxX: 14.2, minZ: -3.4, maxZ: 3.4, y: 0.3, height: 4.2 },
    anchor: [12.3, 3.0, 0.2],
    labelOffset: [0.9, -0.45],
    labelPriority: 5,
    atlasNote: "一扇玫瑰彩窗把东边的光切成七种颜色。",
    description:
      "附在东翼的小礼拜堂。尽头的祭坛被六支蜡烛照亮，玫瑰彩窗在石地上投出颜色；长椅面向晨光，最安静的角落留给忏悔与沉默。",
    light: "东向彩窗 / 烛火",
    meta: ["层高 4.2 m", "器物 17 件"],
    features: ["玫瑰彩窗", "石祭坛", "诵经长椅", "圣物龛", "黄铜烛台"],
    camera: { position: [16, 32, 10], target: [11.5, 1.4, 0] },
    floorMode: "ground"
  },
  {
    id: "kitchen",
    numeral: "V",
    name: "膳房",
    latin: "The Kitchen",
    floor: 0,
    interior: true,
    bounds: { minX: -14.25, maxX: -9.35, minZ: -3.4, maxZ: 3.4, y: 0.3, height: 4.2 },
    anchor: [-12.2, 2.85, -0.8],
    labelOffset: [-0.9, -0.45],
    labelPriority: 5,
    atlasNote: "铜锅、面包炉和倒挂的百里香，一直暖到深夜。",
    description:
      "西翼的烟火中心。大灶、面包炉与铜锅日夜不熄，长桌上堆着刚从花园摘下的香草和根茎；窗台上排着制干酪的陶罐。",
    light: "西窗 / 灶火",
    meta: ["层高 4.2 m", "器物 23 件"],
    features: ["石砌大灶", "铜锅与吊钩", "面包炉", "香料桌", "酒桶与陶罐"],
    camera: { position: [-16, 32, 10], target: [-11.5, 1.4, 0] },
    floorMode: "ground"
  },
  {
    id: "southBalcony",
    numeral: "VI",
    name: "晨露露台",
    latin: "The Morning Balcony",
    floor: 1,
    interior: false,
    bounds: { minX: -4.4, maxX: 4.4, minZ: 6.4, maxZ: 9.4, y: 5.55, height: 2.2 },
    anchor: [0.4, 7.15, 7.65],
    labelOffset: [0.85, -0.2],
    labelPriority: 4,
    atlasNote: "石栏、玫瑰与两只朝南的椅子。",
    description:
      "悬在前庭花园上方的石露台。雕花栏杆把风切成细小的段落，玫瑰从陶盆里探出来；早餐桌只摆两只杯子，因为这里总是两个人的地方。",
    light: "南向 / 晨光",
    meta: ["离地 5.6 m", "器物 8 件"],
    features: ["雕花石栏", "双人茶桌", "两把藤椅", "玫瑰陶盆", "铁艺灯"],
    camera: { position: [-12, 14, 20], target: [0, 6.5, 8.1] },
    floorMode: "solar"
  },
  {
    id: "northBalcony",
    numeral: "VII",
    name: "星象露台",
    latin: "The Stargazing Balcony",
    floor: 2,
    interior: false,
    bounds: { minX: -3.9, maxX: 3.9, minZ: -8.9, maxZ: -6.2, y: 10.45, height: 2.0 },
    anchor: [0.2, 11.95, -7.55],
    labelOffset: [-0.9, -0.2],
    labelPriority: 4,
    atlasNote: "黄铜望远镜、星图，和一把等夜深的椅子。",
    description:
      "从藏书阁北门伸出的观星台。黄铜望远镜对准北方，星图压在石桌上；这里没有壁炉，只有酒、毛毯与整片会旋转的天空。",
    light: "北向 / 星光",
    meta: ["离地 10.5 m", "器物 7 件"],
    features: ["黄铜望远镜", "星图石桌", "观星椅", "毛毯木箱", "防风灯"],
    camera: { position: [12, 19, -22], target: [0, 11.2, -7.8] },
    floorMode: "library"
  },
  {
    id: "frontGarden",
    numeral: "VIII",
    name: "前庭花园",
    latin: "The Southern Parterre",
    floor: 0,
    interior: false,
    bounds: { minX: -19.0, maxX: 19.0, minZ: 8.4, maxZ: 19.0, y: 0, height: 4 },
    anchor: [0, 1.6, 13.4],
    labelOffset: [0.9, -0.3],
    labelPriority: 8,
    atlasNote: "黄杨、玫瑰与喷泉，左右各执一半的秩序。",
    description:
      "南庭是一座被几何驯服的花园。喷泉坐在正中，四条砾石小径将它围成星形，黄杨与花色沿轴线严格镜像；后庭是它的倒影。",
    light: "全天 / 南向",
    meta: ["面积约 410 m²", "镜像布局"],
    features: ["中央喷泉", "黄杨迷宫花坛", "玫瑰拱门", "石凳与日晷", "橄榄树"],
    camera: { position: [30, 28, 38], target: [0, 0.2, 13.2] },
    floorMode: "all"
  },
  {
    id: "rearGarden",
    numeral: "IX",
    name: "后庭花园",
    latin: "The Northern Parterre",
    floor: 0,
    interior: false,
    bounds: { minX: -19.0, maxX: 19.0, minZ: -19.0, maxZ: -8.4, y: 0, height: 4 },
    anchor: [0, 1.6, -13.4],
    labelOffset: [-0.9, -0.3],
    labelPriority: 8,
    atlasNote: "前庭的倒影，只有风向与树影略有不同。",
    description:
      "北庭与前庭共享同一条几何谱线。穿过藏书阁下的暗廊，眼前的花坛、喷泉与坐凳逐寸对应，只是阳光从相反的方向来，影子也落在另一侧。",
    light: "全天 / 北向",
    meta: ["面积约 410 m²", "镜像布局"],
    features: ["中央喷泉", "黄杨迷宫花坛", "玫瑰拱门", "石凳与日晷", "橄榄树"],
    camera: { position: [30, 28, -38], target: [0, 0.2, -13.2] },
    floorMode: "all"
  }
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));

export const GARDEN_ROOMS = new Set(["frontGarden", "rearGarden", "southBalcony", "northBalcony"]);

export const LAYER_GROUPS = {
  structure: ["keep-ground", "keep-solar", "keep-library", "shell-general"],
  roofs: ["roofs"],
  furniture: ["floor-ground", "floor-solar", "floor-library"],
  decor: ["decor-ground", "decor-solar", "decor-library", "decor-outdoor"],
  gardens: ["gardens"],
  terrain: ["terrain"]
};

export const FLOOR_LABELS = {
  all: "全览 · 所有楼层与屋顶开放",
  ground: "大厅层剖面 · 上层与屋顶暂时隐去",
  solar: "领主层剖面 · 藏书层与屋顶暂时隐去",
  library: "藏书层剖面 · 屋顶暂时隐去",
  roof: "塔顶视图 · 室内陈设暂时隐去"
};
