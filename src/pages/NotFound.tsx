import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-20">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-25 mask-fade-edges" />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[110px]"
      />

      <div className="relative text-center">
        <p className="font-display text-[7rem] font-bold leading-none text-gradient-primary sm:text-[10rem]">
          404
        </p>

        <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page <span className="font-mono text-foreground">{location.pathname}</span> doesn&apos;t exist
          or has moved.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/demo">
              <Compass className="h-4 w-4" />
              Explore the demo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
