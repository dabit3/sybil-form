'use client'
import dynamic from "next/dynamic"

const Admin = dynamic(
  () => import("./Admin").then((res) => res.default),
  {
    ssr: false,
  }
)

export default function Home() {
  return (
    <Admin />
  )
}