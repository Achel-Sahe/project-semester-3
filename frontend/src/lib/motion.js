import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AOS from 'aos'
import 'aos/dist/aos.css'

gsap.registerPlugin(ScrollTrigger)

export const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let aosReady = false

export const initAOS = () => {
  if (aosReady) return
  aosReady = true

  AOS.init({
    once: true,
    duration: 700,
    easing: 'ease-out-cubic',
    offset: 60,

    disable: prefersReduced()
  })
}

export const refreshMotion = () => {
  ScrollTrigger.refresh()
  AOS.refresh()
}

export const stopTriggers = (ctx) => {
  ctx.data.forEach((item) => item?.scrollTrigger?.kill())
}

export { gsap }