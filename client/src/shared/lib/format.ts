export const jpy = (n: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(n);

export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

export const num = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const payrollMoney = (n: number, currency = "VND") => {
  if (currency.toUpperCase() === "POINT") return `${num(n)} pts`;
  return vnd(n);
};
