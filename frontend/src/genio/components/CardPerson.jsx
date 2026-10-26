import React from 'react'
import { assetUrl } from '../../api/client'
import fallback from '../../images/foto.jpeg'

const CardPerson = ({
  nama,
  foto,
  posisi,
  nomorPunggung,
  lencana,
  kebangsaan,
  rasioGambar = 'aspect-square'
}) => {
  const src = assetUrl(foto) || fallback

  return (
    <div className="person-card border-1 border-white/50">

      <div className={`person-card-media ${rasioGambar}`}>
        <img
          src={src}
          alt={nama}
          className="object-cover w-full h-full"
          loading="lazy"
          onError={(event) => {

            if (event.target.src !== fallback) event.target.src = fallback
          }}
        />
        <span className="person-card-sheen" aria-hidden="true" />
      </div>

      <div className="p-3 border-t-1 border-white/40">
        <h2 className="person-card-name text-4xl font-display mb-5">{nama}</h2>

        <div className="flex justify-between items-center text-lg font-condensed">
          <p className="tracking-wider uppercase">{posisi}</p>

          {lencana ? (

            <span className="person-card-tag grid place-items-center px-6 shrink-0 border-r-1 border-l-1 border-white/30">
              {lencana}
            </span>
          ) : (
            nomorPunggung !== null && nomorPunggung !== undefined && (
              <p className="person-card-tag border-r-1 border-l-1 border-white/30 px-6">{nomorPunggung}</p>
            )
          )}

          <p className="uppercase">{kebangsaan}</p>
        </div>
      </div>
    </div>
  )
}

export default CardPerson

