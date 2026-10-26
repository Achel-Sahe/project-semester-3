import React from 'react'
import crestUrl from '../../assets/barca-crest.svg'

const BarcaCrest = ({ className = 'w-5 h-5', judulGambar = 'FC Barcelona' }) => (
  <img
    src={crestUrl}
    alt={judulGambar}

    className={`object-contain ${className}`}
    loading="lazy"
  />
)

export default BarcaCrest
