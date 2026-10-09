import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-[70vh] flex items-center justify-center">
      <div className="mx-auto max-w-md px-5 text-center">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
          404 Error
        </span>
        <h1 className="mt-2 font-display text-4xl font-bold text-content sm:text-5xl">
          Page Not Found
        </h1>
        <p className="mt-4 text-base text-content-muted leading-relaxed">
          The page or product shelf you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill bg-palm px-6 py-3 text-sm font-semibold text-white hover:bg-palm-shade transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            to="/shop"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill border border-border bg-surface px-6 py-3 text-sm font-semibold text-content hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Shelves</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
