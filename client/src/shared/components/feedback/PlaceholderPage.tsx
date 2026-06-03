import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  backPath?: string;
};

export function PlaceholderPage({ title, description, icon: Icon = Sparkles, backPath }: PlaceholderPageProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 py-12">
      {/* Glow Effect / Gradient Container */}
      <div className="relative group mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#9065d5] via-[#e560bc] to-[#d97706] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <div className="relative p-5 bg-white border border-[#eadff6] rounded-2xl shadow-sm flex items-center justify-center">
          <Icon className="size-12 text-[#9065d5] animate-pulse" />
        </div>
      </div>

      {/* Badge */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f8f1ff] text-[#9065d5] border border-[#eadff6] mb-4">
        <Sparkles className="size-3 text-[#9065d5] animate-spin" /> Feature Preview
      </span>

      {/* Typography */}
      <h1 className="text-3xl font-extrabold text-[#2f243a] tracking-tight sm:text-4xl mb-3">
        {title}
      </h1>
      <p className="text-[#5f5270] max-w-lg text-sm sm:text-base leading-relaxed mb-8">
        {description}
      </p>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleBack}
          variant="outline"
          className="border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff] px-6 py-5 h-auto text-sm font-medium rounded-xl flex items-center gap-2"
        >
          <ArrowLeft className="size-4" /> Go Back
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-[#9065d5] to-[#7f55c7] hover:from-[#7f55c7] hover:to-[#6d44b5] text-white px-6 py-5 h-auto text-sm font-medium rounded-xl shadow-md"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
