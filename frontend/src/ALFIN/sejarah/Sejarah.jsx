import React from 'react'
import img1 from './img/barcelona-sixtuple-background.webp'
import { useClub } from '../../hooks/useClub'

function Sejarah() {
  const club = useClub()

  return (
    <section
      id="about"
      className="min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,1), rgba(0,0,0,.7)), url(${img1})`,
      }}
    >
<div className="grid min-h-screen items-center gap-10 p-6 md:p-10 lg:grid-cols-2">

        <img
          src={img1}
          alt=""
          data-aos="fade-right"
          className="w-full border border-white"
        />

        <div>
          <p data-aos="fade-up">02 - OUR HISTORY</p>
          <h2
            data-aos="fade-up"
            data-aos-delay="80"
            className="text-5xl md:text-8xl font-bold leading-none"
          >
            HOW GOOD WE ARE
          </h2>
          <p data-aos="fade-up" data-aos-delay="160" className="mt-4 text-gray-300">
            {club?.desc ?? ''}
          </p>
          <p data-aos="fade-up" data-aos-delay="240">
            {club ? `${club.founded_year} - present` : ''}
          </p>

        </div>

      </div>
    </section>
  )
}

export default Sejarah