export type UserRow = {
  id: string;
  name: string;
  romaji: string;
  email: string;
  avatar: string;
  role: "Admin" | "Editor" | "Reader";
  plan: "Free" | "Premium" | "Premium+";
  status: "Active" | "Pending" | "Banned";
  joined: string;
  lastActive: string;
  reads: string;
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const make = (
  id: string,
  name: string,
  romaji: string,
  email: string,
  role: UserRow["role"],
  plan: UserRow["plan"],
  status: UserRow["status"],
  joined: string,
  lastActive: string,
  reads: string,
): UserRow => ({
  id,
  name,
  romaji,
  email,
  avatar: initials(name),
  role,
  plan,
  status,
  joined,
  lastActive,
  reads,
});

export const users: UserRow[] = [
  make(
    "u1",
    "Takezo Shinmen",
    "宮本 武蔵",
    "takezo@beachread.jp",
    "Admin",
    "Premium+",
    "Active",
    "Mar 12, 2023",
    "2 min ago",
    "12,847",
  ),
  make(
    "u2",
    "Matahachi Honiden",
    "本位田 又八",
    "mata@beachread.jp",
    "Editor",
    "Premium",
    "Active",
    "Aug 04, 2023",
    "1 h ago",
    "8,201",
  ),
  make(
    "u3",
    "Otsu Yoshioka",
    "お通",
    "otsu@beachread.jp",
    "Reader",
    "Premium",
    "Active",
    "Jan 22, 2024",
    "3 h ago",
    "6,540",
  ),
  make(
    "u4",
    "Sasaki Kojiro",
    "佐々木 小次郎",
    "kojiro@beachread.jp",
    "Reader",
    "Free",
    "Pending",
    "Feb 28, 2024",
    "Yesterday",
    "412",
  ),
  make(
    "u5",
    "Yagyu Sekishusai",
    "柳生 石舟斎",
    "sekishu@beachread.jp",
    "Editor",
    "Premium+",
    "Active",
    "May 09, 2023",
    "12 min ago",
    "9,310",
  ),
  make(
    "u6",
    "Akemi",
    "朱実",
    "akemi@beachread.jp",
    "Reader",
    "Free",
    "Banned",
    "Jul 17, 2023",
    "32 d ago",
    "1,025",
  ),
  make(
    "u7",
    "Inei Hozoin",
    "胤栄 宝蔵院",
    "inei@beachread.jp",
    "Reader",
    "Premium",
    "Active",
    "Oct 03, 2023",
    "5 h ago",
    "4,888",
  ),
  make(
    "u8",
    "Takuan Soho",
    "沢庵 宗彭",
    "takuan@beachread.jp",
    "Admin",
    "Premium+",
    "Active",
    "Dec 19, 2022",
    "Just now",
    "21,402",
  ),
  make(
    "u9",
    "Jotaro Mizoguchi",
    "城太郎",
    "jotaro@beachread.jp",
    "Reader",
    "Free",
    "Active",
    "Apr 14, 2024",
    "6 h ago",
    "203",
  ),
  make(
    "u10",
    "Hanagiri Jubei",
    "花桐 十兵衛",
    "jubei@beachread.jp",
    "Reader",
    "Premium",
    "Pending",
    "Jun 30, 2024",
    "2 d ago",
    "78",
  ),
];

export const stats = [
  { label: "Total Users", value: "12,847", delta: "+4.2%", positive: true },
  { label: "Active Today", value: "3,219", delta: "+8.1%", positive: true },
  { label: "New This Week", value: "284", delta: "+12%", positive: true },
  { label: "Banned", value: "47", delta: "-2.3%", positive: false },
];
