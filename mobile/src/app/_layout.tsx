import { DefaultTheme, Slot, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { MobileQueryProvider } from "@/providers/mobile-query-provider"

export default function TabLayout() {
  return (
    <MobileQueryProvider>
      <ThemeProvider value={DefaultTheme}>
        <Slot />
        <StatusBar style="dark" />
      </ThemeProvider>
    </MobileQueryProvider>
  )
}
