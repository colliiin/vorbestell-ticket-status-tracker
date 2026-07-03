import type { ReactNode } from "react";
import { LogIn, PackageCheck } from "lucide-react";
export function PublicLayout({ children, action }: { children: ReactNode; action?: ReactNode }) { return <><header className="top"><a className="brand" href="/"><PackageCheck />Vorbestellung</a><nav>{action}<a className="icon ghost" href="/login"><LogIn size={18} /> Admin</a></nav></header>{children}</>; }