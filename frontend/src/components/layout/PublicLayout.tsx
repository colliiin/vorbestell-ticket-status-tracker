import type { ReactNode } from "react";
import { PackageCheck } from "lucide-react";
export function PublicLayout({ children, action, headerClassName = "" }: { children: ReactNode; action?: ReactNode; headerClassName?: string }) { return <><header className={`top ${headerClassName}`.trim()}><a className="brand" href="/"><PackageCheck />Vorbestellung</a><nav>{action}</nav></header>{children}<footer className="siteFooter"><a href="/impressum">Impressum</a></footer></>; }
