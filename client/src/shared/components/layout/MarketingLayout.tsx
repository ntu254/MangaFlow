import { Outlet } from "react-router-dom"
import { MarketingNavbar } from "./MarketingNavbar"
import { MarketingFooter } from "./MarketingFooter"

export function MarketingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="max-w-7xl mx-auto px-container-padding pb-xxl overflow-x-hidden"><Outlet /></main>
      <MarketingFooter />
    </div>
  )
}
