// Background templates. `file` must match the filename in your repo's
// assets/templates/ folder (fetched at request time from TEMPLATE_BASE_URL,
// see env.TEMPLATE_BASE_URL in wrangler secrets).
export const TEMPLATES = {
  "1": {
    label: "Celestial Nova",
    file: "1_celestial_nova.png",
    accent: "rgb(178,140,255)",
    panelRgb: "12,8,30",
  },
  "2": {
    label: "Moonlit Pagoda",
    file: "2_moonlit_pagoda.png",
    accent: "rgb(240,190,255)",
    panelRgb: "20,10,35",
  },
  "3": {
    label: "Sakura Dream",
    file: "3_sakura_dream.png",
    accent: "rgb(255,214,224)",
    panelRgb: "60,8,24",
  },
  "4": {
    label: "Crimson Butterfly",
    file: "4_crimson_butterfly.png",
    accent: "rgb(94,230,230)",
    panelRgb: "15,4,10",
  },
  "5": {
    label: "Onsen Twilight",
    file: "5_onsen_twilight.png",
    accent: "rgb(255,205,130)",
    panelRgb: "35,14,20",
  },
};

export const ROLE_OPTIONS = ["Roam", "Mid", "Hyper", "Exp", "Gold"];

export const RANK_OPTIONS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
];
