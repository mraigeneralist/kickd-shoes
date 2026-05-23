import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center gap-4 py-32 text-center">
      <p className="text-7xl font-extrabold text-brand">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back home
      </Link>
    </div>
  );
}
