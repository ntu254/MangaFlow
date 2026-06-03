import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/lib/utils";
import { User, Settings, LogOut } from "lucide-react";

export function UserAvatar() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1 rounded-xl transition-colors hover:bg-[#f8f1ff]",
          isOpen && "bg-[#f8f1ff]"
        )}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="size-8 rounded-full border-2 border-[#eadff6] object-cover"
          />
        ) : (
          <div className="size-8 rounded-full bg-[#9065d5] text-white flex items-center justify-center text-xs font-bold border-2 border-[#eadff6]">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#eadff6] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-[#eadff6]">
            <p className="text-sm font-semibold text-[#2f243a] truncate">{user?.fullName}</p>
            <p className="text-[10px] text-[#5f5270] truncate">{user?.email}</p>
          </div>

          <div className="p-1">
            <Link
              to="/app/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#5f5270] hover:bg-[#f8f1ff] hover:text-[#2f243a] transition-colors"
            >
              <User className="size-4" />
              Profile
            </Link>
            <Link
              to="/app/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#5f5270] hover:bg-[#f8f1ff] hover:text-[#2f243a] transition-colors"
            >
              <Settings className="size-4" />
              Settings
            </Link>
          </div>

          <div className="border-t border-[#eadff6] p-1">
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
