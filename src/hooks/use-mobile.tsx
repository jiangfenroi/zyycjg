
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * 设备检测钩子：遵循现代浏览器标准，规避 navigator.userAgent 弃用风险
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // 采用 window.matchMedia 代替 navigator.userAgent，确保在 Chrome 101+ 环境下的稳定性
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
