import React from 'react'
import BarcaCrest from '../../genio/components/BarcaCrest'
import { useClub } from '../../hooks/useClub'

const YEAR = new Date().getFullYear()

const MEMBERS = [
    { name: 'CHELO', nim: '15250907' },
    { name: 'NABIL', nim: '15250634' },
    { name: 'ADAM', nim: '15250540' },
    { name: 'NEO', nim: '15250346' },
    { name: 'ALFIN', nim: '15250003' }
]

const LINKS = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'PLAYERS', href: '#players' },
    { label: 'COACH', href: '#coaches' }
]

function Footer() {
    const club = useClub()

    return (
        <footer className='bg-black text-white'>

            <div className='px-6 md:px-10 pt-16 md:pt-24 pb-10 md:pb-14'>
                <div data-aos="fade-up" className='flex items-start justify-between gap-6'>
                    <div className='font-mono text-white/50 text-sm'>
                        <p>05 - KELOMPOK 3</p>
                        <p className='mt-1'>TUGAS BASIS DATA</p>
                        {club && (
                            <p className='mt-1'>
                                {club.country} &middot; {club.founded_year}
                            </p>
                        )}
                    </div>

                    <BarcaCrest className='w-10 md:w-14 shrink-0' />
                </div>

                <h2 data-aos="fade-up" data-aos-delay="120" className='font-display text-[11vw] leading-[0.8] tracking-tight mt-8 md:mt-12 whitespace-nowrap'>
                    FC BARCELONA
                </h2>
            </div>

            <div className='grid grid-cols-2 h-px'>
                <div className='bg-barca-garnet' />
                <div className='bg-barca-blue' />
            </div>

            <nav data-aos="fade-up" className='grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10'>
                {LINKS.map((link, i) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className='footer-link group bg-black px-6 md:px-10 py-5 flex items-baseline gap-3 hover:bg-charcoal transition-colors'
                    >
                        <span className='font-mono text-white/30 text-xs group-hover:text-barca-gold transition-colors'>
                            0{i + 1}
                        </span>
                        <span className='font-condensed uppercase tracking-wider group-hover:opacity-70 transition-opacity'>
                            {link.label}
                        </span>
                    </a>
                ))}
            </nav>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 border-t border-white/10'>
                {MEMBERS.map((member, i) => (
                    <div
                        key={member.nim}
                        data-aos="fade-up" data-aos-delay={i * 80} className='group bg-black px-6 md:px-10 py-8 md:py-10'
                    >
                        <p className='font-mono text-white/30 text-xs group-hover:text-barca-gold transition-colors'>
                            0{i + 1}
                        </p>

                        <p className='font-display text-3xl md:text-4xl mt-4 relative w-fit'>
                            {member.name}
                            <span className='absolute -bottom-1 left-0 h-px w-0 bg-barca-garnet group-hover:w-full transition-[width] duration-300' />
                        </p>

                        <p className='font-mono text-white/50 text-sm mt-3'>
                            {member.nim}
                        </p>
                    </div>
                ))}
            </div>

            <div data-aos="fade-up" className='px-6 md:px-10 py-6 flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-start md:items-center font-mono text-white/40 text-xs'>
                <p>&copy; {YEAR} Copyright by Kelompok 3</p>
                <p className='tracking-[0.3em]'>MES QUE UN CLUB</p>
            </div>

        </footer>
    )
}

export default Footer
