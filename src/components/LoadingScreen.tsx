import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
