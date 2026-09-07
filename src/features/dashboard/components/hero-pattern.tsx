"use client";

import { useTheme } from "next-themes";

import MoltenMetal from "@/components/auth/auth-background";
import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroPattern() {
    const { resolvedTheme } = useTheme();

    return (
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
            {resolvedTheme === "dark" ? (
                <>
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
                        mouseInteraction={false}
                        opacity={1}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,7,18,.08)_0%,rgba(10,7,18,.18)_48%,rgba(10,7,18,.32)_100%)]" />
                </>
            ) : (
                <WavyBackground
                    colors={["#EF4444", "#F43F5E", "#EC4899", "#D946EF"]}
                    backgroundFill="hsl(0 0% 100%)"
                    blur={3}
                    speed="slow"
                    waveOpacity={0.1}
                    waveWidth={60}
                    waveYOffset={250}
                    containerClassName="h-full"
                    className="hidden"
                />
            )}
        </div>
    );
}
