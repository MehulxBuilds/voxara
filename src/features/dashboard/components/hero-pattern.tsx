import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroPattern() {
    return (
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
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
        </div>
    );
}