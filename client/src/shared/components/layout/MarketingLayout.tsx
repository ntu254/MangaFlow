import { Outlet } from "react-router-dom"
import { MarketingNavbar } from "./MarketingNavbar"
import { MarketingFooter } from "./MarketingFooter"

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main><Outlet /></main>
      <MarketingFooter />
    </div>
  )
}
