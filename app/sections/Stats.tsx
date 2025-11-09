import { useEffect, useRef, useState } from 'react'

type Stat = {
    id: number
    name: string
    value: number
    suffix?: string
}

const stats: Stat[] = [
    { id: 1, name: 'of startups are vibecoded', value: 25, suffix: '%' },
    { id: 2, name: 'of codebases are AI-generated', value: 95, suffix: '%' },
    { id: 3, name: 'less time to onboard to a new repo', value: 80, suffix: '%' },
]

function AnimatedNumber({
    value,
    suffix = '',
    duration = 1000, // ms
}: {
    value: number
    suffix?: string
    duration?: number
}) {
    const [displayValue, setDisplayValue] = useState(0)
    const ref = useRef<HTMLSpanElement | null>(null)
    const hasAnimated = useRef(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated.current) {
                        hasAnimated.current = true

                        const start = performance.now()

                        const animate = (time: number) => {
                            const elapsed = time - start
                            const progress = Math.min(elapsed / duration, 1)

                            // Simple ease-out
                            const eased = 1 - Math.pow(1 - progress, 3)
                            const current = Math.round(eased * value)

                            setDisplayValue(current)

                            if (progress < 1) {
                                requestAnimationFrame(animate)
                            }
                        }

                        requestAnimationFrame(animate)
                    }
                })
            },
            {
                threshold: 0.4, // ~40% visible before animating
            },
        )

        observer.observe(node)

        return () => {
            observer.disconnect()
        }
    }, [value, duration])

    return (
        <span ref={ref}>
            {displayValue}
            {suffix}
        </span>
    )
}

export default function Stats() {
    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                    {stats.map((stat) => (
                        <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4">
                            <dt className="text-base/7 text-gray-400">{stat.name}</dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    )
}