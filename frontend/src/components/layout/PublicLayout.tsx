import type { ReactNode } from "react";
import { LogIn, PackageCheck } from "lucide-react";
export function PublicLayout({ children, action, headerClassName = "" }: { children: ReactNode; action?: ReactNode; headerClassName?: string }) { return <><header className={`top ${headerClassName}`.trim()}><a className="brand" href="/"><PackageCheck />Vorbestellung</a><nav>{action}<a className="icon ghost" href="/login"><LogIn size={18} /> Admin</a></nav></header>{children}</>; }
