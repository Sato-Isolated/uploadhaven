"use client";

import { FileUpload } from "@/components/file-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16 fade-in-up">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-foreground mb-2 tracking-tight">
              <span className="font-tactical text-primary">Outer</span>
              <span className="text-foreground">Drop</span>
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <span className="text-primary font-medium">Deploy. Share. Vanish.</span>
            <br />
            Secure file sharing with zero-knowledge encryption. 
            No accounts required, no permanent storage.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <FileUpload />
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Zero Knowledge Card */}
          <div className="tactical-card p-6 text-center fade-in-up">
            <div className="w-12 h-12 bg-secondary border border-primary/30 tactical-border flex items-center justify-center mx-auto mb-4 glow-primary">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Zero Knowledge
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All encryption happens in your browser. We never see your files.
            </p>
          </div>

          {/* No Registration Card */}
          <div className="tactical-card p-6 text-center fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="w-12 h-12 bg-secondary border border-success/30 tactical-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Registration
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Upload and share instantly. No accounts, no tracking, no hassle.
            </p>
          </div>

          {/* Auto-Expiring Card */}
          <div className="tactical-card p-6 text-center fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="w-12 h-12 bg-secondary border border-warning/30 tactical-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Auto-Expiring
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Files automatically vanish after expiration. No permanent storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
