import {
    motion,
    useScroll,
    useTransform,
    useMotionValue,
    useAnimationFrame,
    useVelocity,
    useSpring,
} from "framer-motion";
import { useEffect, useRef } from "react";

type Orb = {
    size: number;
    color: string;
    xCenter: string;
    yCenter: number;
    radius: number;
    speed: number;
    omega: number;
    phase: number;
    blur?: number;
    center?: string;
    scale?: number;
    opacity?: number;
};

const ORBS: Orb[] = [
    { size: 520, color: "hsla(330,100%,70%,1)", xCenter: "18%", yCenter: 240, radius: 160, speed: 0.30, omega: 0.35, phase: 0.0, blur: 72, center: "35% 45%", scale: 1.7, opacity: 0.45 },
    { size: 680, color: "hsla(220,100%,70%,1)", xCenter: "72%", yCenter: 360, radius: 220, speed: 0.55, omega: -0.28, phase: 1.0, blur: 80, center: "60% 35%", scale: 1.8, opacity: 0.4 },
    { size: 600, color: "hsla(160,90%,60%,1)", xCenter: "36%", yCenter: 880, radius: 200, speed: 0.40, omega: 0.22, phase: 2.1, blur: 76, center: "40% 65%", scale: 1.6, opacity: 0.42 },
    { size: 760, color: "hsla(45,100%,60%,1)", xCenter: "85%", yCenter: 1180, radius: 260, speed: 0.75, omega: -0.18, phase: 2.8, blur: 88, center: "70% 50%", scale: 2.0, opacity: 0.38 },
];

const setAlpha = (hsla: string, a: number) =>
    hsla.replace(/hsla\(([^,]+,[^,]+,[^,]+),[^)]+\)/, `hsla($1,${a})`);

function makeGradient(orb: Orb) {
    const center = orb.center ?? "50% 50%";
    const axis = `${Math.round(140 * (orb.scale ?? 1.0))}% ${Math.round(140 * (orb.scale ?? 1.0))}%`;

    const c0 = setAlpha(orb.color, 0.28);
    const c1 = setAlpha(orb.color, 0.18);
    const c2 = setAlpha(orb.color, 0.13);

    return `radial-gradient(${axis} at ${center}, ${c0} 0%, ${c1} 35%, ${c2} 60%, transparent 85%)`;
}

export default function Background() {
    const { scrollY } = useScroll();
    const vel = useVelocity(scrollY);

    const idleSpeed = 0.05;
    const maxBoost = 6;
    const speedRaw = useTransform(vel, (v) => {
        const a = Math.min(Math.abs(v), 3000);
        const t = a / 3000;
        return idleSpeed + t * maxBoost;
    });
    const speed = useSpring(speedRaw, { stiffness: 120, damping: 24, mass: 0.25 });

    const angle = useMotionValue(0);
    const last = useRef<number | null>(null);
    useAnimationFrame((t) => {
        if (last.current == null) {
            last.current = t;
            return;
        }
        const dt = (t - last.current) / 250;
        last.current = t;
        angle.set(angle.get() + speed.get() * dt);
    });

    useEffect(() => {
        const id = setInterval(() => {
            const a = angle.get();
            if (Math.abs(a) > 10_000) angle.set(a % (Math.PI * 2));
        }, 5000);
        return () => clearInterval(id);
    }, [angle]);

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gray-900" />
            <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_0%,transparent,rgba(17,24,39,0.9)_55%,#111827_75%)]" />

            {ORBS.map((orb, i) => {
                const theta = useTransform(angle, (a) => a * orb.omega + orb.phase);
                const xOrbit = useTransform(theta, (th) => orb.radius * Math.cos(th));
                const yOrbit = useTransform(theta, (th) => orb.radius * Math.sin(th));
                const yParallax = useTransform(scrollY, (v) => orb.yCenter + v * orb.speed);

                const physSize = Math.round(orb.size * (orb.scale ?? 1.0));

                return (
                    <motion.div
                        key={i}
                        style={{ left: orb.xCenter as any, top: yParallax }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                        <motion.div
                            style={{
                                x: xOrbit,
                                y: yOrbit,
                                width: physSize,
                                height: physSize,
                                backgroundImage: makeGradient(orb),
                                filter: `blur(${orb.blur ?? 72}px)`,
                                opacity: orb.opacity ?? 0.4,
                                willChange: "transform",
                            }}
                            className="mix-blend-screen rounded-full"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
