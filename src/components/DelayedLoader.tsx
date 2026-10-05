import { useEffect, useState } from "react";
import PageLoader from "./PageLoader";

/** Branded loader shown only if a page takes longer than `delay` ms to be ready. */
const DelayedLoader = ({ delay = 200 }: { delay?: number }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? <PageLoader variant="page" /> : null;
};

export default DelayedLoader;
