import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useDesignCopy } from "@/hooks/useDesignCopy";

export default function BackToTop() {
  const copy = useDesignCopy();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight * 2);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  if (!visible) return null;
  return <button className="design-back-to-top" aria-label={copy("Back to top")} title={copy("Back to top")} onClick={() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }}><ArrowUp aria-hidden="true" /></button>;
}
