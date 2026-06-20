import berserk from "@/shared/assets/cover-berserk.jpg";
import jojo from "@/shared/assets/cover-jojo.jpg";
import vagabondSmall from "@/shared/assets/cover-vagabond-small.jpg";
import onepiece from "@/shared/assets/cover-onepiece.jpg";
import monster from "@/shared/assets/cover-monster.jpg";
import slamdunk from "@/shared/assets/cover-slamdunk.jpg";
import vinland from "@/shared/assets/cover-vinland.jpg";
import fma from "@/shared/assets/cover-fma.jpg";
import grandblue from "@/shared/assets/cover-grandblue.jpg";
import kingdom from "@/shared/assets/cover-kingdom.jpg";
import ghostFixers from "@/shared/assets/cover-ghostfixers.jpg";
import gokuragukai from "@/shared/assets/cover-gokuragukai.jpg";
import gachiakuta from "@/shared/assets/cover-gachiakuta.jpg";

import newsHeron from "@/shared/assets/news-heron.jpg";
import newsGachi from "@/shared/assets/news-gachiakuta.jpg";
import newsDandadan from "@/shared/assets/news-dandadan.jpg";
import newsOnePiece from "@/shared/assets/news-onepiece.jpg";

export const ranking = [
  { rank: 1, title: "Berserk", romaji: "ベルセルク", chapters: 376, reads: "717,293", cover: berserk },
  { rank: 2, title: "JoJo no Kimyou na Bouken Part 7: Steel Ball Run", romaji: "Part 7 STEEL BALL RUN", chapters: 95, reads: "717,293", cover: jojo },
  { rank: 3, title: "Vagabond", romaji: "バガボンド", chapters: 327, reads: "717,293", cover: vagabondSmall },
  { rank: 4, title: "One Piece", romaji: "ONE PIECE", chapters: 1122, reads: "717,293", cover: onepiece },
  { rank: 5, title: "Monster", romaji: "MONSTER", chapters: 162, reads: "717,293", cover: monster },
  { rank: 6, title: "Slam Dunk", romaji: "SLAM DUNK", chapters: 376, reads: "717,293", cover: slamdunk },
  { rank: 7, title: "Vinland Saga", romaji: "ヴィンランド・サガ", chapters: 95, reads: "717,293", cover: vinland },
  { rank: 8, title: "Fullmetal Alchemist", romaji: "鋼の錬金術師", chapters: 327, reads: "717,293", cover: fma },
  { rank: 9, title: "Grand Blue", romaji: "ぐらんぶる", chapters: 1122, reads: "717,293", cover: grandblue },
  { rank: 10, title: "Kingdom", romaji: "キングダム", chapters: 162, reads: "717,293", cover: kingdom },
];

export const featured = [
  {
    title: "Ghost Fixers",
    author: "Tanaka Yasuki",
    cover: ghostFixers,
    chapters: ['Vol. 3 Ch. 19 – "Victory"', 'Vol. 3 Ch. 18 – "Dependent"', 'Vol. 3 Ch. 17 – "First Love"', 'Vol. 3 Ch. 16 – "Comrades"'],
    tags: ["Action", "Supernatural", "Shonen", "Mystery"],
  },
  {
    title: "Gokuragukai",
    author: "Sano Yuto",
    cover: gokuragukai,
    chapters: ['Vol. 5 Ch. 20 – "Take my Love!"', 'Vol. 4 Ch. 19 – "Let\'s make a..."', 'Vol. 4 Ch. 18 – "Girl Trouble"', 'Vol. 4 Ch. 17 – "Tons of probe..."'],
    tags: ["Action", "Supernatural", "Shonen", "Mystery"],
  },
  {
    title: "Gachiakuta",
    author: "Kei Urana",
    cover: gachiakuta,
    chapters: ['Vol. 5 Ch. 20 – "Take my Love!"', 'Vol. 4 Ch. 19 – "Let\'s make a..."', 'Vol. 4 Ch. 18 – "Girl Trouble"', 'Vol. 4 Ch. 17 – "Tons of probe..."'],
    tags: ["Action", "Supernatural", "Shonen", "Mystery"],
  },
];

export const recent = [
  { title: "Ghost Fixers", tag: "Shounen / Drama", cover: ghostFixers },
  { title: "Gokuragukai", tag: "Seinen / Action", cover: gokuragukai },
  { title: "Gachiakuta", tag: "Shounen / Action", cover: gachiakuta },
  { title: "Ghost Fixers", tag: "Shounen / Drama", cover: ghostFixers },
  { title: "Gokuragukai", tag: "Seinen / Action", cover: gokuragukai },
  { title: "Gachiakuta", tag: "Shounen / Action", cover: gachiakuta },
  { title: "Ghost Fixers", tag: "Shounen / Drama", cover: ghostFixers },
  { title: "Gokuragukai", tag: "Seinen / Action", cover: gokuragukai },
  { title: "Gachiakuta", tag: "Shounen / Action", cover: gachiakuta },
];

export const news = {
  feature: {
    title: "Historic second Oscars win for Miyazaki sparks celebration in Japan as Asian talent increasingly recognized",
    image: newsHeron,
  },
  side: [
    { title: "Gachiakuta anime confirmed for 2025", image: newsGachi },
    { title: "'Dandadan' gets first full trailer for English dub", image: newsDandadan },
    { title: "One Piece English dub: Dr. Vegapunk voice actor...", image: newsOnePiece },
  ],
};
