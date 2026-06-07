import { createContext, useContext, type ReactNode } from "react"

interface PageTitleValue {
  title: string
  subtitle?: string
  setTitle: (title: string, subtitle?: string) => void
}

const PageTitleContext = createContext<PageTitleValue>({
  title: "",
  setTitle: () => {},
})

export function usePageTitle(title?: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext)
  if (title !== undefined) {
    ctx.setTitle(title, subtitle)
  }
  return ctx
}

export function PageTitleProvider({
  children,
  value,
}: {
  children: ReactNode
  value: PageTitleValue
}) {
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>
}

export { PageTitleContext }
