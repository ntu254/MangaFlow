import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function BlockedPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#ffe7de] rounded-full">
            <ShieldAlert className="size-10 text-[#e15f2f]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#2f243a] mb-3">Account Suspended</h1>
        <p className="text-[#5f5270] text-sm mb-8">
          Your account has been suspended by an administrator.
          Please contact support for assistance.
        </p>

        <div className="space-y-3">
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
