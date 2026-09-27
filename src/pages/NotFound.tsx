import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="editorial-number mb-4 text-8xl font-medium">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="border-b border-primary pb-1 font-semibold text-primary hover:text-foreground">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
