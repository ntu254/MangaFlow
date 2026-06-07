import { Link } from "react-router-dom"
import { MFButton } from "@/shared/components/ui/MFButton"

export function HeroCTAGroup() {
  return (
    <div className="flex items-center justify-center gap-4">
      <Link to="/register">
        <MFButton size="lg">Get Started</MFButton>
      </Link>
      <Link to="/login">
        <MFButton variant="outline" size="lg">Sign In</MFButton>
      </Link>
    </div>
  )
}
