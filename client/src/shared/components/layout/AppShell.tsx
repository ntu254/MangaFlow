import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
  header?: ReactNode;
};

export function AppShell({ children, sidebar, header }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-mf-bg">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        {header}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
