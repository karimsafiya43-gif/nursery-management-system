"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role, setDemoRole } from "@/lib/api";
import { useUser } from "@/lib/useUser";

const links: { href: string; label: string; roles: Role[] }[] = [
  { href: "/watering", label: "Watering", roles: ["owner", "manager", "staff"] },
  { href: "/health-checks", label: "Health checks", roles: ["owner", "manager", "staff"] },
  { href: "/treatments", label: "Treatments", roles: ["owner", "manager", "staff"] },
  { href: "/expenses", label: "Expenses", roles: ["owner", "manager"] },
];

export default function Navbar() {
  const path = usePathname();
  const user = useUser();
  const demo = true;

  return (
    <nav className="bg-canopy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3">
        <Link href="/watering" className="flex items-center gap-2.5">
          <svg aria-hidden width="26" height="26" viewBox="0 0 100 100" fill="none" stroke="#9AD3A4" strokeWidth="6" strokeLinecap="round">
            <path d="M50 94V30M50 30C50 12 30 8 14 14C14 32 30 40 50 30ZM50 52C50 36 68 30 86 36C86 54 68 62 50 52Z" />
          </svg>
          <span className="font-display text-xl font-semibold">{user?.nursery_name ?? "Nursery"}</span>
        </Link>

        <ul className="-mx-1 flex flex-1 gap-1 overflow-x-auto">
          {links.filter((l) => !user || l.roles.includes(user.role)).map((l) => {
            const active = path === l.href;
            return (
              <li key={l.href}>
                <Link href={l.href} aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors ${active ? "bg-white/15 font-medium text-white" : "text-sage hover:bg-white/10"}`}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {user && (
          <div className="flex items-center gap-3 text-sm text-sage">
            <span>{user.full_name}</span>
            {demo ? (
              <select aria-label="Demo role" value={user.role}
                onChange={(e) => { setDemoRole(e.target.value as Role); location.reload(); }}
                className="rounded-lg border border-white/20 bg-canopy px-2 py-1 text-white">
                <option value="staff">staff</option><option value="manager">manager</option><option value="owner">owner</option>
              </select>
            ) : <span className="rounded-full bg-white/10 px-2.5 py-0.5">{user.role}</span>}
          </div>
        )}
      </div>
    </nav>
  );
}
