import { useEffect } from 'react'
import { initAOS } from './lib/motion'
import Navbar from './genio/navbar/Navbar'
import Players from './genio/Players/Players'
import Coaches from './genio/Coaches/Coaches'
import Hero from './ALFIN/Hero/Hero'
import Sejarah from './ALFIN/sejarah/Sejarah'
import Footer from './ALFIN/footer/Footer'

function App() {

  useEffect(() => {
    initAOS()
  }, [])

  return (
    <div>
      <Navbar />
      <Hero />
      <Sejarah />
      <Players />
      <Coaches />
      <Footer />
    </div>
  )
}

export default App