"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Library, BookOpen, Home, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isReader = pathname.startsWith("/read/");

  if (isReader) return null;

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
            <span className="text-white">fuse</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant={pathname === link.href ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <link.icon className="w-4 h-4" />{link.label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="rounded-full"><Search className="w-5 h-5" /></Button>
            </Link>
            <ThemeToggle />
            {session?.user ? (
              <Link href="/library">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="icon" className="rounded-full"><User className="w-5 h-5" /></Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t border-border/50">
              <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <Button variant={pathname === link.href ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                      <link.icon className="w-4 h-4" />{link.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className={cn("md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl", isReader && "hidden")} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', touchAction: 'manipulation' }}>
        <nav className="flex items-center justify-around h-14 px-1">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/search", icon: Search, label: "Search" },
            { href: "/browse", icon: BookOpen, label: "Browse" },
            { href: "/library", icon: Library, label: "Library" },
            { href: session ? "/library" : "/auth/login", icon: User, label: "Profile" },
          ].map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] relative" style={{ touchAction: 'manipulation' }}>
                <item.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[10px]", active ? "text-primary font-medium" : "text-muted-foreground")}>{item.label}</span>
                {active && <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
