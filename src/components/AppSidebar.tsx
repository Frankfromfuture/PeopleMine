"use client"

import React, { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  User,
  UserPlus,
  Briefcase,
  Globe,
  Building2,
  Target,
  Thermometer,
  Lightbulb,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shuffle,
} from "lucide-react"

const MIN_W = 56
const MAX_W = 299
const DEFAULT_W = 209
const NARROW_THRESHOLD = 100

const NAV_MAIN = [
  { icon: LayoutDashboard, label: "首页",     href: "/dashboard" },
  { icon: User,            label: "我",       href: "/me" },
  { icon: UserPlus,        label: "+ 人脉",   href: "/contacts/new" },
  { icon: Briefcase,       label: "人脉资产", href: "/contacts" },
]

const NAV_UNIVERSE = [
  { icon: Globe,     label: "人脉宇宙", href: "/journey" },
  { icon: Building2, label: "企业宇宙", href: "/companies/universe" },
  { icon: Target,    label: "目标分析", href: "/goal-analysis" },
]

const NAV_INSIGHTS = [
  { icon: Thermometer,  label: "关系温度", href: "/relationship" },
  { icon: Lightbulb,    label: "社交建议", href: "/social-advice" },
  { icon: FlaskConical, label: "游乐场",   href: "/playground" },
]

const NAV_SYSTEM = [
  { icon: Settings, label: "设置", href: "/settings" },
]

function NavBtn({
  icon: Icon,
  label,
  href,
  isActive,
  isNarrow,
}: {
  icon: React.ElementType
  label: string
  href: string
  isActive: boolean
  isNarrow: boolean
}) {
  return (
    <Link
      href={href}
      title={isNarrow ? label : undefined}
      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
        isActive ? "text-gray-800" : "text-gray-500 hover:text-gray-700"
      }`}
      style={{ background: isActive ? "#EBEBEB" : "transparent" }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F0F0F0"
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"
      }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-0.5 h-5 rounded-full ${isActive ? "bg-[#FF7F27]" : "bg-transparent"}`} />
        <Icon
          size={18}
          strokeWidth={1.5}
          className={isActive ? "text-gray-800" : "text-gray-400"}
        />
      </div>
      {!isNarrow && (
        <span className="truncate" style={{ fontSize: 13 }}>{label}</span>
      )}
    </Link>
  )
}

function Divider({ accent = false }: { accent?: boolean }) {
  return (
    <div
      className="mx-4 my-2"
      style={{ borderTop: accent ? "1px solid #D8D8D8" : "1px solid #E8E8E8" }}
    />
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const [width, setWidth]           = useState(DEFAULT_W)
  const [resizing, setResizing]     = useState(false)
  const [handleHovered, setHandleHovered] = useState(false)
  const [searchQuery, setSearchQuery]     = useState("")
  const [randCount, setRandCount]         = useState(10)
  const [randRandomness, setRandRandomness] = useState(50)
  const [generating, setGenerating]       = useState(false)

  const startX    = useRef(0)
  const startW    = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)

  const isNarrow = width < NARROW_THRESHOLD

  function isActive(href: string) {
    if (href === "/dashboard")          return pathname === "/dashboard"
    if (href === "/contacts/new")       return pathname === "/contacts/new"
    if (href === "/contacts")           return pathname.startsWith("/contacts") && !pathname.startsWith("/contacts/new")
    if (href === "/journey")            return pathname.startsWith("/journey")
    if (href === "/companies/universe") return pathname === "/companies/universe"
    if (href === "/me")                 return pathname === "/me"
    if (href === "/settings")           return pathname === "/settings"
    return pathname === href
  }

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      startW.current = width
      setResizing(true)
      document.body.style.cursor     = "col-resize"
      document.body.style.userSelect = "none"

      const onMove = (ev: MouseEvent) => {
        const next = Math.min(MAX_W, Math.max(MIN_W, startW.current + ev.clientX - startX.current))
        setWidth(next)
      }
      const onUp = () => {
        setResizing(false)
        document.body.style.cursor     = ""
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [width]
  )

  const toggleCollapse = () => {
    setWidth((w) => (w < NARROW_THRESHOLD ? DEFAULT_W : MIN_W))
  }

  const generateRandom = async () => {
    setGenerating(true)
    try {
      await fetch("/api/contacts/generate-random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: randCount }),
      })
    } catch {}
    setGenerating(false)
  }

  const openSearch = () => {
    if (isNarrow) setWidth(DEFAULT_W)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  const renderGroup = (items: typeof NAV_MAIN) =>
    items.map((item) => (
      <NavBtn
        key={item.label}
        icon={item.icon}
        label={item.label}
        href={item.href}
        isActive={isActive(item.href)}
        isNarrow={isNarrow}
      />
    ))

  return (
    <div
      className="relative flex flex-col h-screen shrink-0"
      style={{
        width,
        background: "#F7F7F7",
        borderRight: "1px solid #E8E8E8",
        transition: resizing ? "none" : "width 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center px-4 py-5 shrink-0 overflow-hidden"
        style={{ borderBottom: "1px solid #E8E8E8" }}
      >
        {isNarrow ? (
          <svg
            viewBox="0 0 570 314"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: 32, height: 32, flexShrink: 0 }}
          >
            <path d="M120 214C120 186.386 142.386 164 170 164H220C247.614 164 270 186.386 270 214V264C270 291.614 247.614 314 220 314H170C142.386 314 120 291.614 120 264V214Z" fill="url(#lpm_g0)"/>
            <path d="M270 50C270 22.3858 292.386 0 320 0H370C397.614 0 420 22.3858 420 50V100C420 127.614 397.614 150 370 150H320C292.386 150 270 127.614 270 100V50Z" fill="url(#lpm_g1)"/>
            <path d="M270 100C270 127.614 292.386 150 320 150C292.386 150 270 172.386 270 200V214C270 186.386 247.614 164 220 164C247.614 164 270 141.614 270 114V100Z" fill="url(#lpm_g2)"/>
            <path d="M420 197C420 169.386 442.386 147 470 147H520C547.614 147 570 169.386 570 197V247C570 274.614 547.614 297 520 297H470C442.386 297 420 274.614 420 247V197Z" fill="#8F959E"/>
            <path d="M300 222C300 202.67 315.67 187 335 187H355C374.33 187 390 202.67 390 222V242C390 261.33 374.33 277 355 277H335C315.67 277 300 261.33 300 242V222Z" fill="#8F959E"/>
            <path d="M150 82C150 62.67 165.67 47 185 47H205C224.33 47 240 62.67 240 82V102C240 121.33 224.33 137 205 137H185C165.67 137 150 121.33 150 102V82Z" fill="#F58220"/>
            <path d="M0 242C0 222.67 15.67 207 35 207H55C74.33 207 90 222.67 90 242V262C90 281.33 74.33 297 55 297H35C15.67 297 0 281.33 0 262V242Z" fill="#F58220"/>
            <defs>
              <linearGradient id="lpm_g0" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/>
                <stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
              <linearGradient id="lpm_g1" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/>
                <stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
              <linearGradient id="lpm_g2" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/>
                <stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <svg
            viewBox="0 0 2180 314"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: 22, width: "auto", maxWidth: "100%", flexShrink: 0 }}
          >
            <path d="M120 214C120 186.386 142.386 164 170 164H220C247.614 164 270 186.386 270 214V264C270 291.614 247.614 314 220 314H170C142.386 314 120 291.614 120 264V214Z" fill="url(#lpm_f0)"/>
            <path d="M270 50C270 22.3858 292.386 0 320 0H370C397.614 0 420 22.3858 420 50V100C420 127.614 397.614 150 370 150H320C292.386 150 270 127.614 270 100V50Z" fill="url(#lpm_f1)"/>
            <path d="M270 100C270 127.614 292.386 150 320 150C292.386 150 270 172.386 270 200V214C270 186.386 247.614 164 220 164C247.614 164 270 141.614 270 114V100Z" fill="url(#lpm_f2)"/>
            <path d="M420 197C420 169.386 442.386 147 470 147H520C547.614 147 570 169.386 570 197V247C570 274.614 547.614 297 520 297H470C442.386 297 420 274.614 420 247V197Z" fill="#8F959E"/>
            <path d="M300 222C300 202.67 315.67 187 335 187H355C374.33 187 390 202.67 390 222V242C390 261.33 374.33 277 355 277H335C315.67 277 300 261.33 300 242V222Z" fill="#8F959E"/>
            <path d="M150 82C150 62.67 165.67 47 185 47H205C224.33 47 240 62.67 240 82V102C240 121.33 224.33 137 205 137H185C165.67 137 150 121.33 150 102V82Z" fill="#F58220"/>
            <path d="M0 242C0 222.67 15.67 207 35 207H55C74.33 207 90 222.67 90 242V262C90 281.33 74.33 297 55 297H35C15.67 297 0 281.33 0 262V242Z" fill="#F58220"/>
            <path d="M2112 256C2112 242.193 2123.19 231 2137 231H2155C2168.81 231 2180 242.193 2180 256V274C2180 287.807 2168.81 299 2155 299H2137C2123.19 299 2112 287.807 2112 274V256Z" fill="#F58220"/>
            <path d="M692.85 295.676H654.66C653.553 295.676 653 295.122 653 294.014L653.664 60.1526C653.664 59.2661 654.107 58.8229 654.992 58.8229H720.412C741.223 58.8229 757.661 65.1944 769.726 77.9373C781.903 90.5695 787.991 107.8 787.991 129.629C787.991 145.586 784.836 159.492 778.527 171.349C772.106 183.094 763.804 192.181 753.62 198.608C743.437 205.035 732.367 208.248 720.412 208.248H694.51V294.014C694.51 295.122 693.957 295.676 692.85 295.676ZM720.412 99.2125L694.51 99.545V167.027H720.412C727.607 167.027 733.862 163.592 739.175 156.722C744.488 149.741 747.145 140.71 747.145 129.629C747.145 120.765 744.765 113.507 740.005 107.856C735.245 102.094 728.714 99.2125 720.412 99.2125Z" fill="url(#lpm_t0)"/>
            <path d="M919.661 295.676H809.742C808.857 295.676 808.414 295.122 808.414 294.014L808.746 60.1526C808.746 59.2661 809.189 58.8229 810.074 58.8229H919.329C920.214 58.8229 920.657 59.3769 920.657 60.485V98.5477C920.657 99.4342 920.214 99.8774 919.329 99.8774H849.592V153.065H919.329C920.214 153.065 920.657 153.509 920.657 154.395L920.989 192.956C920.989 193.843 920.546 194.286 919.661 194.286H849.592V253.79H919.661C920.546 253.79 920.989 254.344 920.989 255.452V294.346C920.989 295.233 920.546 295.676 919.661 295.676Z" fill="url(#lpm_t1)"/>
            <path d="M1014.14 299C1002.07 299 990.948 295.897 980.764 289.692C970.691 283.487 962.555 275.232 956.356 264.926C950.268 254.51 947.224 243.097 947.224 230.687L947.556 122.815C947.556 110.183 950.6 98.8247 956.688 88.7411C962.665 78.5468 970.746 70.4024 980.93 64.3079C991.114 58.1026 1002.18 55 1014.14 55C1026.54 55 1037.66 58.0472 1047.51 64.1417C1057.47 70.2362 1065.44 78.436 1071.42 88.7411C1077.51 98.9355 1080.55 110.293 1080.55 122.815L1080.89 230.687C1080.89 243.097 1077.9 254.455 1071.92 264.76C1065.83 275.176 1057.75 283.487 1047.68 289.692C1037.6 295.897 1026.42 299 1014.14 299ZM1014.14 257.945C1021 257.945 1026.98 255.175 1032.07 249.635C1037.16 243.984 1039.71 237.668 1039.71 230.687L1039.38 122.815C1039.38 115.28 1037 108.908 1032.24 103.7C1027.48 98.4923 1021.44 95.8883 1014.14 95.8883C1007.16 95.8883 1001.19 98.4369 996.205 103.534C991.224 108.631 988.734 115.058 988.734 122.815V230.687C988.734 238.111 991.224 244.538 996.205 249.967C1001.19 255.286 1007.16 257.945 1014.14 257.945Z" fill="url(#lpm_t2)"/>
            <path d="M1146.47 295.676H1108.28C1107.18 295.676 1106.62 295.122 1106.62 294.014L1107.29 60.1526C1107.29 59.2661 1107.73 58.8229 1108.61 58.8229H1174.03C1194.85 58.8229 1211.28 65.1944 1223.35 77.9373C1235.53 90.5695 1241.61 107.8 1241.61 129.629C1241.61 145.586 1238.46 159.492 1232.15 171.349C1225.73 183.094 1217.43 192.181 1207.24 198.608C1197.06 205.035 1185.99 208.248 1174.03 208.248H1148.13V294.014C1148.13 295.122 1147.58 295.676 1146.47 295.676ZM1174.03 99.2125L1148.13 99.545V167.027H1174.03C1181.23 167.027 1187.48 163.592 1192.8 156.722C1198.11 149.741 1200.77 140.71 1200.77 129.629C1200.77 120.765 1198.39 113.507 1193.63 107.856C1188.87 102.094 1182.34 99.2125 1174.03 99.2125Z" fill="url(#lpm_t3)"/>
            <path d="M1375.94 295.676H1266.02C1265.14 295.676 1264.69 295.122 1264.69 294.014L1265.02 60.485C1265.02 59.3769 1265.58 58.8229 1266.69 58.8229H1304.54C1305.65 58.8229 1306.2 59.3769 1306.2 60.485L1305.87 253.79H1375.94C1377.05 253.79 1377.6 254.344 1377.6 255.452V294.014C1377.6 295.122 1377.05 295.676 1375.94 295.676Z" fill="url(#lpm_t4)"/>
            <path d="M1511.1 295.676H1401.18C1400.29 295.676 1399.85 295.122 1399.85 294.014L1400.18 60.1526C1400.18 59.2661 1400.62 58.8229 1401.51 58.8229H1510.76C1511.65 58.8229 1512.09 59.3769 1512.09 60.485V98.5477C1512.09 99.4342 1511.65 99.8774 1510.76 99.8774H1441.03V153.065H1510.76C1511.65 153.065 1512.09 153.509 1512.09 154.395L1512.43 192.956C1512.43 193.843 1511.98 194.286 1511.1 194.286H1441.03V253.79H1511.1C1511.98 253.79 1512.43 254.344 1512.43 255.452V294.346C1512.43 295.233 1511.98 295.676 1511.1 295.676Z" fill="url(#lpm_t5)"/>
            <path d="M1582.49 295.676H1543.97C1543.09 295.676 1542.64 295.122 1542.64 294.014L1543.31 60.1526C1543.31 59.2661 1543.75 58.8229 1544.64 58.8229H1586.15C1587.03 58.8229 1587.81 59.2661 1588.47 60.1526L1619.52 105.03L1650.4 60.1526C1651.07 59.2661 1651.9 58.8229 1652.9 58.8229H1694.57C1695.57 58.8229 1696.07 59.2661 1696.07 60.1526L1696.73 294.014C1696.73 295.122 1696.29 295.676 1695.4 295.676H1656.88C1655.99 295.676 1655.55 295.122 1655.55 294.014L1655.22 120.322L1619.52 172.18L1584.15 120.322L1583.82 294.014C1583.82 295.122 1583.38 295.676 1582.49 295.676Z" fill="url(#lpm_t6)"/>
            <path d="M1765.47 295.676H1726.95C1725.84 295.676 1725.29 295.122 1725.29 294.014L1725.62 60.1526C1725.62 59.2661 1726.06 58.8229 1726.95 58.8229H1765.14C1766.02 58.8229 1766.47 59.2661 1766.47 60.1526L1766.8 294.014C1766.8 295.122 1766.36 295.676 1765.47 295.676Z" fill="url(#lpm_t7)"/>
            <path d="M1833.71 295.676H1799.67C1797.9 295.676 1797.02 294.9 1797.02 293.349L1796.69 61.4823C1796.69 59.7094 1797.57 58.8229 1799.34 58.8229H1830.06L1887.51 192.956L1885.85 61.4823C1885.85 59.7094 1886.85 58.8229 1888.84 58.8229H1922.54C1923.87 58.8229 1924.54 59.7094 1924.54 61.4823L1924.87 293.681C1924.87 295.011 1924.32 295.676 1923.21 295.676H1893.32L1834.38 170.352L1836.87 293.016C1836.87 294.789 1835.82 295.676 1833.71 295.676Z" fill="url(#lpm_t8)"/>
            <path d="M2065.67 295.676H1955.75C1954.87 295.676 1954.42 295.122 1954.42 294.014L1954.76 60.1526C1954.76 59.2661 1955.2 58.8229 1956.08 58.8229H2065.34C2066.22 58.8229 2066.67 59.3769 2066.67 60.485V98.5477C2066.67 99.4342 2066.22 99.8774 2065.34 99.8774H1995.6V153.065H2065.34C2066.22 153.065 2066.67 153.509 2066.67 154.395L2067 192.956C2067 193.843 2066.56 194.286 2065.67 194.286H1995.6V253.79H2065.67C2066.56 253.79 2067 254.344 2067 255.452V294.346C2067 295.233 2066.56 295.676 2065.67 295.676Z" fill="url(#lpm_t9)"/>
            <defs>
              <linearGradient id="lpm_f0" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/><stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
              <linearGradient id="lpm_f1" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/><stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
              <linearGradient id="lpm_f2" x1="120" y1="305.468" x2="420" y2="8.532" gradientUnits="userSpaceOnUse">
                <stop offset="0.365385" stopColor="#F58220"/><stop offset="0.625" stopColor="#8F959E"/>
              </linearGradient>
              <linearGradient id="lpm_t0" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t1" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t2" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t3" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t4" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t5" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8F959E"/><stop offset="1" stopColor="#333538"/>
              </linearGradient>
              <linearGradient id="lpm_t6" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58220"/><stop offset="1" stopColor="#8F4C13"/>
              </linearGradient>
              <linearGradient id="lpm_t7" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58220"/><stop offset="1" stopColor="#8F4C13"/>
              </linearGradient>
              <linearGradient id="lpm_t8" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58220"/><stop offset="1" stopColor="#8F4C13"/>
              </linearGradient>
              <linearGradient id="lpm_t9" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58220"/><stop offset="1" stopColor="#8F4C13"/>
              </linearGradient>
            </defs>
          </svg>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Search */}
        {!isNarrow ? (
          <div className="px-3 mb-2">
            <div
              className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg"
              style={{ background: "#EFEFEF", border: "1px solid #E2E2E2" }}
            >
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索人脉..."
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
                style={{ fontSize: 12 }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); searchRef.current?.focus() }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 leading-none"
                  style={{ fontSize: 14 }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={openSearch}
            title="搜索"
            className="w-full flex items-center justify-center py-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
        )}

        {renderGroup(NAV_MAIN)}
        <Divider />
        {renderGroup(NAV_UNIVERSE)}
        <Divider />
        {renderGroup(NAV_INSIGHTS)}
        <Divider accent />
        {renderGroup(NAV_SYSTEM)}
      </nav>

      {/* Random generator */}
      <div className="px-3 py-3 shrink-0 overflow-hidden" style={{ borderTop: "1px solid #E8E8E8" }}>
        {isNarrow ? (
          <button
            onClick={generateRandom}
            disabled={generating}
            title={`随机生成人脉\n数量：${randCount}  波动性：${randRandomness}%`}
            className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Shuffle size={16} strokeWidth={1.5} />
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Shuffle size={12} className="text-gray-400 shrink-0" />
              <span className="text-gray-500" style={{ fontSize: 11 }}>随机生成人脉</span>
            </div>

            {/* 数量 */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 flex-1" style={{ fontSize: 10 }}>数量</span>
              <button
                onClick={() => setRandCount((c) => Math.max(1, c - 5))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer select-none"
                style={{ fontSize: 13, lineHeight: 1 }}
              >−</button>
              <span className="tabular-nums text-gray-700 text-center" style={{ fontSize: 11, minWidth: 24 }}>{randCount}</span>
              <button
                onClick={() => setRandCount((c) => Math.min(100, c + 5))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer select-none"
                style={{ fontSize: 13, lineHeight: 1 }}
              >+</button>
            </div>

            {/* 波动性 */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 flex-1" style={{ fontSize: 10 }}>波动性</span>
              <button
                onClick={() => setRandRandomness((r) => Math.max(0, r - 10))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer select-none"
                style={{ fontSize: 13, lineHeight: 1 }}
              >−</button>
              <span className="tabular-nums text-gray-700 text-center" style={{ fontSize: 11, minWidth: 28 }}>{randRandomness}%</span>
              <button
                onClick={() => setRandRandomness((r) => Math.min(100, r + 10))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer select-none"
                style={{ fontSize: 13, lineHeight: 1 }}
              >+</button>
            </div>

            {/* 一键生成 with tooltip */}
            <div className="relative group">
              <button
                onClick={generateRandom}
                disabled={generating}
                className="w-full py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer disabled:opacity-60"
                style={{ fontSize: 10 }}
              >
                {generating ? "生成中…" : "一键生成"}
              </button>
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-0 right-0 mb-1.5 hidden group-hover:block pointer-events-none z-50"
              >
                <div
                  className="bg-gray-800 text-white rounded-lg px-3 py-2 shadow-lg"
                  style={{ fontSize: 10, lineHeight: 1.6 }}
                >
                  <div className="font-semibold mb-1" style={{ fontSize: 10.5 }}>随机生成规则</div>
                  <div>· 随机生成 <span className="text-orange-300">{randCount}</span> 位虚拟人脉联系人</div>
                  <div>· 波动性 <span className="text-orange-300">{randRandomness}%</span>：值越高，姓名 / 职位 / 行业越发散</div>
                  <div>· 0% = 规范典型画像，100% = 高度随机化</div>
                  <div>· 数据仅用于测试，不影响真实人脉</div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2937" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User profile */}
      <div className="px-4 py-3 shrink-0 overflow-hidden" style={{ borderTop: "1px solid #E8E8E8" }}>
        <div className={`flex items-center ${isNarrow ? "justify-center" : "gap-2.5"}`}>
          <div
            className="w-7 h-7 rounded-full bg-[#3d3d3d] flex items-center justify-center text-white shrink-0"
            style={{ fontSize: 11 }}
          >
            P
          </div>
          {!isNarrow && (
            <div className="flex flex-col leading-none gap-[3px] min-w-0">
              <span className="text-gray-700 truncate" style={{ fontSize: 12 }}>PeopleMine</span>
              <span className="text-gray-400 truncate" style={{ fontSize: 10 }}>人脉管理平台</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer z-20 transition-colors"
        style={{ border: "1px solid #E0E0E0", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        {isNarrow ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHandleHovered(true)}
        onMouseLeave={() => setHandleHovered(false)}
        className="absolute top-0 bottom-0 z-10"
        style={{ right: -3, width: 6, cursor: "col-resize" }}
      >
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-150"
          style={{
            width: handleHovered || resizing ? 3 : 1,
            background: resizing
              ? "#FF7F27"
              : handleHovered
              ? "rgba(255,127,39,0.55)"
              : "transparent",
          }}
        />
      </div>
    </div>
  )
}
