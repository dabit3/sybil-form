'use client'

import dynamic from "next/dynamic"

const Passport = dynamic(
  () => import("./Passport").then((res) => res.default),
  {
    ssr: false,
  }
)

export default function Home() {
  return (
    <Passport />
  )
}