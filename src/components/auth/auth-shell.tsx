import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import MoltenMetal from "@/components/auth/auth-background";
import Image from "next/image";

type AuthShellProps = {
  children: ReactNode;
  headline: string;
};

export function AuthShell({ children, headline }: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-[#070707] text-white lg:grid lg:h-dvh lg:grid-cols-[34%_66%] lg:overflow-hidden font-sans">
      <section className="relative hidden h-dvh overflow-hidden border-r border-white/10 lg:block">
        <div className="absolute inset-0">
          <MoltenMetal
            color1="#5227FF"
            color2="#FF9FFC"
            color3="#FFFFFF"
            speed={0.35}
            scale={4}
            detail={3}
            glow={1.6}
            coreSize={0.1}
            swirl={1}
            fold={-0.2}
            blackPoint={0.05}
            brightness={1.3}
            colorMode="molten"
            grain
            grainIntensity={0.05}
            mouseInteraction
            mouseStrength={0.3}
            opacity={1}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,.12)_55%,rgba(0,0,0,.82))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.08)_45%,rgba(0,0,0,.58)_100%)]" />

        <div className="relative z-10 flex h-full min-h-dvh items-center justify-center px-12">
          <div className="max-w-sm">
            <Image
              src="/logo.svg"
              alt="Resonance"
              width={32}
              height={32}
              className="rounded-sm py-6 mx-1 brightness-150"
            />
            <h1 className="max-w-xs text-3xl font-medium leading-[1.08] tracking-[-0.04em] text-white mx-auto">
              {headline}
            </h1>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-dvh flex-col">
        <Link
          href="/"
          className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 text-sm font-normal text-white/60 transition-colors hover:text-white sm:left-10 sm:top-10"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Home
        </Link>

        <div className="flex flex-1 items-center justify-center px-5 py-24 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </main>
  );
}
