import React from 'react'
import SquadGrid from '../components/SquadGrid'
import CardPerson from '../components/CardPerson'
import { getPlayers } from '../../api/client'

const renderKartuPemain = (pemain) => (
  <CardPerson
    nama={pemain.name}
    foto={pemain.photo_url}
    posisi={pemain.position?.name}
    nomorPunggung={pemain.squad_number}
    kebangsaan={pemain.nationality}
  />
)

const Players = () => (
  <SquadGrid
    id="players"
    ambilData={getPlayers}
    renderKartu={renderKartuPemain}
    labelSeksi="OUR PLAYERS"
    judul="THE SQUAD"
    satuanData="PLAYERS"
    tampilkanFilter
  />
)

export default Players
