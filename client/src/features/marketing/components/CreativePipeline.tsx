import React from "react";

export function CreativePipeline() {
  const nodes = [
    { label: "Script", icon: "lightbulb", color: "primary" as const },
    { label: "Drafting", icon: "edit_document", color: "secondary" as const },
    { label: "Assistants", icon: "group", color: "tertiary" as const },
    { label: "Review", icon: "rate_review", color: "error" as const },
    {
      label: "Board Vote",
      icon: "how_to_vote",
      color: "primary-container" as const,
    },
  ];

  const colorMap: Record<string, string> = {
    primary: "#6f44b2",
    secondary: "#a52885",
    tertiary: "#a72d53",
    error: "#ba1a1a",
    "primary-container": "#885ecd",
  };

  return (
    <section className="py-xl mb-xxl relative">
      <div className="text-center mb-lg">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          The Creative Pipeline
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
          Built exactly how modern studios operate.
        </p>
      </div>

      {/*
        Sửa 1: Đổi items-center thành items-start để dễ quản lý căn dọc.
        Thêm pt-md (padding-top 16px) để đẩy nội dung xuống một chút.
      */}
      <div className="flex flex-col md:flex-row items-start justify-between relative px-xl pt-md">
        {/* Sửa 2: Căn chỉnh đường line nền. pt-md (16px) + nửa hình tròn (24px) = top-[40px] */}
        <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-outline-variant/30 -z-10" />

        {nodes.map((node, i) => (
          <React.Fragment key={node.label}>
            {/* Node */}
            <div className="flex flex-col items-center gap-sm z-10 bg-background px-sm">
              <div
                className="w-12 h-12 rounded-full bg-surface-container-lowest border-2 flex items-center justify-center shadow-ambient"
                style={{ borderColor: colorMap[node.color] ?? "#ccc3d4" }}
              >
                <span
                  className="material-symbols-outlined icon-fill"
                  style={{ color: colorMap[node.color] ?? "#6f44b2" }}
                >
                  {node.icon}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                {node.label}
              </span>
            </div>

            {/* Sửa 3: Đường line đứt đoạn - Căn mt-[23px] để đi qua đúng tâm hình tròn */}
            {i < nodes.length - 1 && (
              <div
                className="hidden md:block w-8 h-[2px] mt-[23px]"
                style={{
                  backgroundColor: colorMap[node.color] ?? "#ccc3d4",
                  opacity: 0.5,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
