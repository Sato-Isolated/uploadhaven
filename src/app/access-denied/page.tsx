import Link from "next/link";
import { Shield, ArrowLeft, User } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 border border-destructive tactical-border flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Accès Refusé
          </h2>
          <p className="text-muted-foreground mb-8">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Cette section est réservée aux administrateurs.
          </p>
        </div>

        <div className="tactical-card p-6 border-destructive">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Permissions Requises
            </h3>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Rôle administrateur requis</li>
            <li>• Contactez votre administrateur système</li>
            <li>• Vérifiez vos permissions d'accès</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 btn-tactical px-4 py-2 text-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <Link
            href="/"
            className="flex-1 btn-secondary px-4 py-2 text-center"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
