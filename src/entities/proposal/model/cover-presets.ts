import berserk from "@/assets/covers/berserk.jpg";
import fullmetal from "@/assets/covers/fullmetal.jpg";
import gachiakuta from "@/assets/covers/gachiakuta.jpg";
import ghostfixers from "@/assets/covers/ghostfixers.jpg";
import gokuragukai from "@/assets/covers/gokuragukai.jpg";
import grandblue from "@/assets/covers/grandblue.jpg";
import kingdom from "@/assets/covers/kingdom.jpg";
import monster from "@/assets/covers/monster.jpg";

export const COVER_PRESETS = [
  { label: "Berserk", url: berserk },
  { label: "Grand Blue", url: grandblue },
  { label: "Monster", url: monster },
  { label: "Kingdom", url: kingdom },
  { label: "Gachiakuta", url: gachiakuta },
  { label: "Ghost Fixers", url: ghostfixers },
  { label: "Goku Raku Kai", url: gokuragukai },
  { label: "Fullmetal", url: fullmetal },
] as const;
