"use client";

import Link from "next/link";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Icon */}
          <div className="mb-8 fade-in-up">
            <div className="w-24 h-24 bg-secondary border border-destructive tactical-border flex items-center justify-center mx-auto mb-6 glow-primary">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
            <div className="font-tactical text-6xl text-destructive mb-2 glitch" data-text="404">
              404
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Target Not Found
            </h1>
          </div>

          {/* Description */}
          <div className="mb-12 fade-in-up" style={{animationDelay: '0.1s'}}>
            <p className="text-xl text-muted-foreground mb-4">
              The file you're looking for has either vanished or never existed.
            </p>
            <div className="tactical-card p-6 max-w-md mx-auto">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  File may have expired
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Invalid share link
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Page doesn't exist
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up" style={{animationDelay: '0.2s'}}>
            <Link
              href="/"
              className="btn-tactical-primary inline-flex items-center gap-2 justify-center px-6 py-3"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-tactical inline-flex items-center gap-2 justify-center px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Terminal-style message */}
          <div className="mt-12 fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="tactical-card p-4 bg-muted/20 text-left max-w-md mx-auto">
              <div className="font-tactical text-xs text-primary space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-success">{">"}</span>
                  <span className="typing-animation">Scanning for target...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-destructive">{">"}</span>
                  <span>ERROR: Target not found</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-warning">{">"}</span>
                  <span>Initiating redirect protocol...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
