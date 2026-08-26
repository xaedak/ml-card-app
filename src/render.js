import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

import poppinsBold from "../assets/fonts/Poppins-Bold.ttf";
import poppinsMedium from "../assets/fonts/Poppins-Medium.ttf";
import poppinsRegular from "../assets/fonts/Poppins-Regular.ttf";
import bigShouldersBold from "../assets/fonts/BigShoulders-Bold.ttf";

import { TEMPLATES } from "./templates.js";

const WIDTH = 1280;
const HEIGHT = 720;

let wasmReady = false;
async function ensureWasm() {
  if (!wasmReady) {
    await initWasm(resvgWasm);
    wasmReady = true;
  }
}

function toDataUri(buf, mime = "image/png") {
  const b64 = Buffer.from(buf).toString("base64");
  return `data:${mime};base64,${b64}`;
}

async function fetchAsDataUri(url, cache) {
  const cached = await cache.match(url);
  if (cached) {
    const buf = await cached.arrayBuffer();
    return toDataUri(buf);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  await cache.put(url, new Response(buf.slice(0), { headers: { "cache-control": "max-age=86400" } }));
  return toDataUri(buf);
}

function pill(text, accent) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        backgroundColor: accent,
        color: "#141420",
        fontSize: 20,
        fontFamily: "Poppins-Medium",
        padding: "9px 18px",
        borderRadius: 999,
        marginRight: 12,
      },
      children: text,
    },
  };
}

function stat(x, label, value, accent) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        left: x,
        top: 0,
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontSize: 18, color: accent, fontFamily: "Poppins-Medium", textTransform: "uppercase" },
            children: label,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 30, color: "#ffffff", fontFamily: "Poppins-Bold", marginTop: 4 },
            children: value,
          },
        },
      ],
    },
  };
}

export async function renderCard({ answers, avatarUrl, cache }) {
  await ensureWasm();

  const style = TEMPLATES[answers.templateKey];
  const templateUrl = `${answers.templateBaseUrl}/${style.file}`;

  const [bgDataUri, avatarDataUri] = await Promise.all([
    fetchAsDataUri(templateUrl, cache),
    avatarUrl ? fetchAsDataUri(avatarUrl, cache).catch(() => null) : Promise.resolve(null),
  ]);

  const rolesRow = (answers.roles || []).length
    ? answers.roles.map((r) => pill(r, style.accent))
    : [{ type: "div", props: { style: { fontSize: 20, color: "#cfcfd8", fontFamily: "Poppins-Regular" }, children: "Not specified" } }];

  const tree = {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        position: "relative",
        fontFamily: "Poppins-Regular",
      },
      children: [
        // background
        {
          type: "img",
          props: {
            src: bgDataUri,
            width: WIDTH,
            height: HEIGHT,
            style: { position: "absolute", top: 0, left: 0, objectFit: "cover" },
          },
        },
        // top scrim
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: WIDTH,
              height: 190,
              display: "flex",
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))`,
            },
          },
        },
        // bottom panel
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: 0,
              left: 0,
              width: WIDTH,
              height: 374,
              display: "flex",
              backgroundImage: `linear-gradient(to bottom, rgba(${style.panelRgb},0.35), rgba(${style.panelRgb},0.93))`,
            },
          },
        },
        // avatar (with colored ring)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 40,
              left: 48,
              width: 142,
              height: 142,
              borderRadius: 999,
              display: "flex",
              backgroundColor: style.accent,
              padding: 6,
            },
            children: avatarDataUri
              ? [
                  {
                    type: "img",
                    props: {
                      src: avatarDataUri,
                      width: 130,
                      height: 130,
                      style: { borderRadius: 999, objectFit: "cover" },
                    },
                  },
                ]
              : [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: 130,
                        height: 130,
                        borderRadius: 999,
                        display: "flex",
                        backgroundColor: "#28283c",
                      },
                    },
                  },
                ],
          },
        },
        // name + birthday
        {
          type: "div",
          props: {
            style: { position: "absolute", top: 48, left: 204, display: "flex", flexDirection: "column" },
            children: [
              { type: "div", props: { style: { fontSize: 46, color: "#ffffff", fontFamily: "Poppins-Bold" }, children: answers.displayName } },
              { type: "div", props: { style: { fontSize: 24, color: "#e1e1eb", fontFamily: "Poppins-Medium", marginTop: 8 }, children: `Birthday:  ${answers.birthday}` } },
            ],
          },
        },
        // title, top right
        {
          type: "div",
          props: {
            style: { position: "absolute", top: 40, right: 44, display: "flex", flexDirection: "column", alignItems: "flex-end" },
            children: [
              { type: "div", props: { style: { fontSize: 30, color: style.accent, fontFamily: "BigShoulders-Bold", letterSpacing: 1 }, children: "PLAYER CARD" } },
              { type: "div", props: { style: { fontSize: 18, color: "#e1e1eb", fontFamily: "Poppins-Regular", marginTop: 4 }, children: "MOBILE LEGENDS: BANG BANG" } },
            ],
          },
        },
        // stat grid
        {
          type: "div",
          props: {
            style: { position: "absolute", top: 420, left: 60, width: WIDTH - 120, height: 160, display: "flex" },
            children: [
              stat(0, "Player ID", answers.mlId, style.accent),
              stat(600, "Server ID", answers.mlServer, style.accent),
              { type: "div", props: { style: { position: "absolute", left: 0, top: 90, display: "flex", flexDirection: "column" }, children: [
                { type: "div", props: { style: { fontSize: 18, color: style.accent, fontFamily: "Poppins-Medium", textTransform: "uppercase" }, children: "Main Hero" } },
                { type: "div", props: { style: { fontSize: 30, color: "#ffffff", fontFamily: "Poppins-Bold", marginTop: 4 }, children: answers.mainHero } },
              ]}},
              { type: "div", props: { style: { position: "absolute", left: 600, top: 90, display: "flex", flexDirection: "column" }, children: [
                { type: "div", props: { style: { fontSize: 18, color: style.accent, fontFamily: "Poppins-Medium", textTransform: "uppercase" }, children: "Highest Rank" } },
                { type: "div", props: { style: { fontSize: 30, color: "#ffffff", fontFamily: "Poppins-Bold", marginTop: 4 }, children: answers.highestRank } },
              ]}},
            ],
          },
        },
        // roles
        {
          type: "div",
          props: {
            style: { position: "absolute", left: 60, top: 610, display: "flex", flexDirection: "column" },
            children: [
              { type: "div", props: { style: { fontSize: 18, color: style.accent, fontFamily: "Poppins-Medium", textTransform: "uppercase" }, children: "Roles" } },
              { type: "div", props: { style: { display: "flex", flexDirection: "row", marginTop: 10 }, children: rolesRow } },
            ],
          },
        },
        // bot credit, bottom right corner
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: 18,
              right: 24,
              display: "flex",
              fontSize: 15,
              fontFamily: "Poppins-Regular",
              color: "rgba(255,255,255,0.55)",
            },
            children: "Bot by @Mikun190",
          },
        },
      ],
    },
  };

  const svg = await satori(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Poppins-Bold", data: poppinsBold, weight: 700, style: "normal" },
      { name: "Poppins-Medium", data: poppinsMedium, weight: 500, style: "normal" },
      { name: "Poppins-Regular", data: poppinsRegular, weight: 400, style: "normal" },
      { name: "BigShoulders-Bold", data: bigShouldersBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const pngData = resvg.render();
  return pngData.asPng(); // Uint8Array
}
