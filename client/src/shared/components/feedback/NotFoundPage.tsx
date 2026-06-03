import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

type NotFoundPageProps = {
  homePath?: string;
};

export function NotFoundPage({ homePath = "/" }: NotFoundPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 bg-mf-bg-soft rounded-2xl mb-6">
        <FileQuestion className="size-12 text-mf-primary" />
      </div>
      <h1 className="text-3xl font-bold text-mf-text mb-2">Page Not Found</h1>
      <p className="text-mf-text-secondary max-w-md mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to={homePath}>
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
