import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface SplashProps {
    onComplete?: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const pathRef = useRef<SVGPathElement | null>(null);
    const arrowHeadRef = useRef<SVGPathElement | null>(null);
    const maskGroupRef = useRef<SVGGElement | null>(null);

    useLayoutEffect(() => {
        const overlay = overlayRef.current;
        const path = pathRef.current;
        const arrowHead = arrowHeadRef.current;
        const maskGroup = maskGroupRef.current;

        if (!overlay || !path || !arrowHead || !maskGroup) return;

        const length =
            // @ts-ignore
            typeof path.getTotalLength === "function" ? path.getTotalLength() : 260;

        gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
        });

        gsap.set(arrowHead, {
            opacity: 0,
            scale: 0.9,
            transformOrigin: "50% 50%",
            transformBox: "fill-box",
        });

        gsap.set(maskGroup, {
            scale: 1,
            transformOrigin: "50% 50%",
            transformBox: "fill-box",
        });

        const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => onComplete?.(),
        });

        tl.to(path, {
            strokeDashoffset: 0,
            duration: 1.8,
        });

        tl.to(
            arrowHead,
            {
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: "back.out(2)",
            },
            "-=0.4"
        );

        tl.to(
            maskGroup,
            {
                scale: 20,
                duration: 0.8,
                ease: "power2.inOut",
            },
            "+=0.15"
        );

        tl.to(
            overlay,
            {
                opacity: 0,
                duration: 0.4,
                ease: "power1.out",
            },
            "-=0.3"
        );

        return () => {
            tl.kill();
        };
    }, [onComplete]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50"
        >
            <svg
                className="w-full h-full"
                viewBox="0 0 638 816"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <mask id="vCutoutMask">
                        <rect x="0" y="0" width="638" height="816" fill="white" />

                        <g ref={maskGroupRef}>
                            <path
                                ref={pathRef}
                                d="M97 68.1 L306 608 L495.1 324"
                                fill="none"
                                stroke="black"
                                strokeWidth={100}
                                strokeLinecap="butt"
                                strokeLinejoin="miter"
                            />

                            <path
                                ref={arrowHeadRef}
                                d="M0 84 L150 180 L158 0 Z"
                                transform="translate(419 194)"
                                fill="black"
                            />
                        </g>
                    </mask>
                </defs>

                <rect
                    x="0"
                    y="0"
                    width="638"
                    height="816"
                    fill="black"
                    mask="url(#vCutoutMask)"
                />
            </svg>
        </div>
    );
}
