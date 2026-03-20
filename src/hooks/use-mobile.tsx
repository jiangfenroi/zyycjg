
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * 现代设备检测钩子：
 * 完全弃用 navigator.userAgent 以规避 Chrome 101+ User-Agent String Reduction 警告。
 * 采用 window.matchMedia 监听视口变化，这是 Next.js 和 Electron 环境下最稳定、合规的方案。
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // 采用 matchMedia 代替 navigator.userAgent
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // 初始执行
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // 监听变化
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
