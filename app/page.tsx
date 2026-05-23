import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getFeaturedProducts, getCategories } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
  ]);

  const categoryImages: Record<string, string> = {
    sneakers: "/images/sneakers/img-2.webp",
    "running-shoes": "/images/running-shoes/img-2.webp",
    boots: "/images/boots/img-2.webp",
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/5 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white px-4 py-1.5 text-sm font-medium text-brand">
              New Season · Free shipping across India
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Step up your
              <br />
              <span className="text-brand">game.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-muted">
              Premium sneakers, running shoes, and boots. Clean design, honest
              prices, delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Shop all <ArrowRight size={18} />
              </Link>
              <Link href="/category/sneakers" className="btn-outline">
                Browse sneakers
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-up">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-card-hover">
              <Image
                src="/images/sneakers/img-1.webp"
                alt="Featured Kickd sneaker"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-brand px-5 py-4 text-white shadow-card-hover sm:block">
              <p className="text-2xl font-extrabold">9+</p>
              <p className="text-xs font-medium opacity-90">styles in stock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-ink/5">
        <div className="container-x grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Free shipping", text: "On every order, anywhere in India" },
            { icon: ShieldCheck, title: "Secure checkout", text: "Payments protected by Razorpay" },
            { icon: RotateCcw, title: "Easy returns", text: "7-day hassle-free returns" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
                <f.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink">{f.title}</p>
                <p className="text-sm text-ink-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Shop by category</h2>
            <p className="mt-1 text-ink-muted">Find the right pair for every step.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100"
            >
              <Image
                src={categoryImages[cat.slug] ?? cat.image_url ?? "/images/sneakers/img-1.webp"}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-extrabold">{cat.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium">
                  Shop now <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-x pb-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Featured</h2>
              <p className="mt-1 text-ink-muted">Our most-loved pairs right now.</p>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-brand hover:underline sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-x pb-20">
        <div className="overflow-hidden rounded-3xl bg-ink px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to find your next pair?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-neutral-300">
            Browse the full Kickd collection. Free shipping, secure checkout,
            easy returns.
          </p>
          <Link href="/products" className="btn-primary mt-7">
            Shop the collection <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
