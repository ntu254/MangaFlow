export const WARDROBE_FILTER_GROUPS = [
  {
    label: "Loại",
    key: "category",
    options: [
      { value: "Tops", label: "Áo" },
      { value: "Bottoms", label: "Quần / Váy" },
      { value: "Shoes", label: "Giày dép" },
      { value: "Outerwear", label: "Áo khoác" },
      { value: "Accessories", label: "Phụ kiện" },
    ],
  },
  {
    label: "Phong cách",
    key: "style",
    options: [
      { value: "Casual", label: "Casual" },
      { value: "Minimal", label: "Minimal" },
      { value: "Streetwear", label: "Streetwear" },
      { value: "Office", label: "Công sở" },
      { value: "Sporty", label: "Thể thao" },
      { value: "Party", label: "Dạ tiệc" },
    ],
  },
  {
    label: "Màu sắc",
    key: "color",
    options: [
      { value: "Black", label: "Đen", color: "#1A1A1A" },
      { value: "White", label: "Trắng", color: "#FFFFFF" },
      { value: "Blue", label: "Xanh dương", color: "#1C3A5F" },
      { value: "Beige", label: "Be", color: "#D2B48C" },
      { value: "Gray", label: "Xám", color: "#808080" },
      { value: "Pink", label: "Hồng", color: "#F4A0A0" },
    ],
  },
  {
    label: "Mùa",
    key: "season",
    options: [
      { value: "Summer", label: "Hè" },
      { value: "Winter", label: "Đông" },
      { value: "All season", label: "Quanh năm" },
    ],
  },
] as const;
