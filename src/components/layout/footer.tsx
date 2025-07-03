"use client";

import Link from "next/link";
import { Shield, Github, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-secondary border border-primary tactical-border flex items-center justify-center glow-primary">
                  <Shield className="w-3 h-3 text-primary" />
                </div>
                <div className="font-tactical text-lg">
                  <span className="text-primary">Outer</span>
                  <span className="text-foreground">Drop</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Secure file sharing with zero-knowledge encryption. Deploy. Share. Vanish.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground font-tactical">
                Quick Links
              </h3>
              <nav className="space-y-2">
                <Link
                  href="/"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/admin"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="https://github.com/Sato-Isolated/uploadhaven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-3 h-3" />
                  Source Code
                </Link>
              </nav>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground font-tactical">
                Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  Zero-knowledge encryption
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-success rounded-full"></div>
                  Auto-expiring files
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-warning rounded-full"></div>
                  No registration required
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-destructive rounded-full"></div>
                  Password protection
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 mt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground font-tactical">
                © {currentYear} OuterDrop. Open source file sharing platform.
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                Made with
                <Heart className="w-3 h-3 text-destructive" />
                by the community
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
