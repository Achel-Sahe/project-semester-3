import React, { useEffect, useRef } from 'react'
import { gsap, prefersReduced } from '../../lib/motion'
import img from './img/hero.webp'

function Hero() {
    const root = useRef(null)

    useEffect(() => {
        if (prefersReduced()) return

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

            tl.from('[data-hero-img]', { scale: 1.18, duration: 2, ease: 'power2.out' }, 0)

                .from('[data-hero-eyebrow]', { y: 22, autoAlpha: 0, duration: 0.6 }, 0.55)

                .from('[data-hero-line]', { yPercent: 108, duration: 0.95, stagger: 0.13 }, 0.65)

            gsap.to('[data-hero-img]', {
                yPercent: 6,
                ease: 'none',
                scrollTrigger: {
                    trigger: root.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            })
        }, root)

        return () => ctx.revert()
    }, [])

    return (
        <div
            id="home"
            ref={root}
            className='bg-black relative w-full h-[100vh] text-white overflow-hidden items-center'
        >
            <img
                data-hero-img
                src={img}
                alt="BLAUGRANA"
                className='object-cover absolute left-0 w-full h-[118%] top-[-9%]'
            />

            <div className='relative z-10 absolute top-1/2 left-5/100 -translate-y-1/2'>
                <p
                    data-hero-eyebrow
                    className='ml-2 text-[clamp(.5rem,5vw,.9rem)] mb-5 font-condensed tracking-[.4rem] text-white/80'
                >
                    BLAUGRANA EDITORIAL
                </p>

                <h2 className='font-bold text-[clamp(3.5rem,13vw,10rem)] leading-none'>

                    <span className='block overflow-hidden'>
                        <span data-hero-line className='block'>MÉS QUE</span>
                    </span>
                    <span className='block overflow-hidden'>
                        <span data-hero-line className='block'>UN CLUB</span>
                    </span>
                </h2>
            </div>

        </div>
    )
}

export default Hero