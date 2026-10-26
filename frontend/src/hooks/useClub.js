import { useEffect, useState } from 'react'
import { getClubs } from '../api/client'

let inflight = null

const fetchClub = () => {
  inflight ??= getClubs()
    .then((list) => list[0] ?? null)
    .catch((err) => {

      inflight = null
      throw err
    })
  return inflight
}

export const useClub = () => {
  const [club, setClub] = useState(null)

  useEffect(() => {
    let alive = true

    fetchClub().then((data) => {
      if (alive) setClub(data)
    }).catch(() => {})

    return () => { alive = false }
  }, [])

  return club
}