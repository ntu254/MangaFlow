import type { Role } from "@/shared/lib/role";

export type Staff = {
  id: string;
  name: string;
  jp: string;
  role: Role;
  avatar: string;
  payoutRate?: number; // JPY per task default
};

const initials = (s: string) =>
  s
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const staff: Staff[] = [
  {
    id: "s_admin",
    name: "Takuan Soho",
    jp: "沢庵 宗彭",
    role: "admin",
    avatar: initials("Takuan Soho"),
  },
  {
    id: "s_man_takezo",
    name: "Takezo Shinmen",
    jp: "宮本 武蔵",
    role: "mangaka",
    avatar: initials("Takezo Shinmen"),
  },
  {
    id: "s_man_kei",
    name: "Kei Urana",
    jp: "ウラナ",
    role: "mangaka",
    avatar: initials("Kei Urana"),
  },
  {
    id: "s_man_sano",
    name: "Sano Yuto",
    jp: "佐野 雄人",
    role: "mangaka",
    avatar: initials("Sano Yuto"),
  },
  {
    id: "s_ed_otsu",
    name: "Otsu Yoshioka",
    jp: "お通",
    role: "editor",
    avatar: initials("Otsu Yoshioka"),
  },
  {
    id: "s_ed_inei",
    name: "Inei Hozoin",
    jp: "胤栄 宝蔵院",
    role: "editor",
    avatar: initials("Inei Hozoin"),
  },
  {
    id: "s_as_jubei",
    name: "Hanagiri Jubei",
    jp: "花桐 十兵衛",
    role: "assistant",
    avatar: initials("Hanagiri Jubei"),
    payoutRate: 4500,
  },
  {
    id: "s_as_akemi",
    name: "Akemi",
    jp: "朱実",
    role: "assistant",
    avatar: initials("Akemi"),
    payoutRate: 4200,
  },
  {
    id: "s_as_jotaro",
    name: "Jotaro Mizoguchi",
    jp: "城太郎",
    role: "assistant",
    avatar: initials("Jotaro Mizoguchi"),
    payoutRate: 3800,
  },
  {
    id: "s_bd_sekishu",
    name: "Yagyu Sekishusai",
    jp: "柳生 石舟斎",
    role: "board",
    avatar: initials("Yagyu Sekishusai"),
  },
  {
    id: "s_bd_kojiro",
    name: "Sasaki Kojiro",
    jp: "佐々木 小次郎",
    role: "board",
    avatar: initials("Sasaki Kojiro"),
  },
  {
    id: "s_bd_mata",
    name: "Matahachi Honiden",
    jp: "本位田 又八",
    role: "board",
    avatar: initials("Matahachi Honiden"),
  },
];

export const currentUserByRole: Record<Role, Staff> = {
  admin: staff.find((s) => s.id === "s_admin")!,
  mangaka: staff.find((s) => s.id === "s_man_kei")!,
  editor: staff.find((s) => s.id === "s_ed_otsu")!,
  assistant: staff.find((s) => s.id === "s_as_jubei")!,
  board: staff.find((s) => s.id === "s_bd_sekishu")!,
};

export const findStaff = (id: string) => staff.find((s) => s.id === id);
