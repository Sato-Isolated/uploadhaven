"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield, User, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Admin", href: "/admin" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-secondary border border-primary tactical-border flex items-center justify-center glow-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
              <Shield className="w-4 h-4" />
            </div>
            <div className="font-tactical text-xl">
              <span className="text-primary">Outer</span>
              <span className="text-foreground">Drop</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}

            {/* Auth Section */}
            {!isPending && (
              <div className="flex items-center gap-4 ml-4 border-l border-border pl-4">
                {session ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden lg:inline">
                        {session.user.name || session.user.email}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden lg:inline">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/auth/login"
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="btn-tactical px-4 py-2 text-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden btn-tactical p-2"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden tactical-card mt-2 mb-4 p-4 border-primary">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block p-2 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              {!isPending && (
                <div className="border-t border-border pt-2 mt-2">
                  {session ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors font-medium w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="block p-2 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block p-2 text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
