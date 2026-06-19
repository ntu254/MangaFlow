import { DefaultTheme, Slot, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Slot />
      <StatusBar style="dark" />
    </ThemeProvider>
  )
}
