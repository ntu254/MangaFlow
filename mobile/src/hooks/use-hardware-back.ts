import { useEffect } from "react"
import { BackHandler } from "react-native"

// Android hardware back pops the open detail screen instead of exiting the
// app (BackHandler's default with no consuming listener). No-op on iOS/web,
// where BackHandler.addEventListener is a stub that never fires.
export function useHardwareBackToClose(isOpen: boolean, onBack: () => void) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isOpen) return false
      onBack()
      return true
    })
    return () => subscription.remove()
  }, [isOpen, onBack])
}
