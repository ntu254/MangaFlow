import { Image } from "expo-image"
import { useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { colors } from "@/design/tokens"

const editorHeaderWash = require("../../assets/images/nen.jpg")
const boardHeaderWash = require("../../assets/images/nen1.jpg")

interface MFHeaderBackgroundProps {
  compact?: boolean
  role?: "board" | "editor"
}

export function MFHeaderBackground({ compact = false, role = "editor" }: MFHeaderBackgroundProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { width } = useWindowDimensions()
  const imageWidth = Math.min(Math.max(width * (compact ? 1.05 : 1), compact ? 360 : 380), compact ? 540 : 560)
  const imageHeight = Math.round(imageWidth * 0.47)
  const source = role === "board" ? boardHeaderWash : editorHeaderWash

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, compact && styles.rootCompact, { width: imageWidth, height: imageHeight }]}
    >
      <View style={styles.fallbackWash} />
      {imageFailed ? <FallbackMotif role={role} /> : null}
      {!imageFailed ? (
        <Image
          source={source}
          style={[styles.image, role === "board" && styles.imageBoard]}
          contentFit="contain"
          contentPosition="right top"
          transition={0}
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </View>
  )
}

function FallbackMotif({ role }: { role: "board" | "editor" }) {
  return (
    <View style={styles.fallbackMotif}>
      <View style={[styles.fallbackLine, role === "board" && styles.fallbackLineBoard]} />
      <View style={styles.fallbackPanel} />
      <View style={styles.fallbackStem} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: -18,
    right: -70,
    zIndex: 0,
  },
  rootCompact: {
    top: -24,
    right: -86,
  },
  fallbackWash: {
    position: "absolute",
    inset: 0,
    borderRadius: 44,
    backgroundColor: colors.headerWash,
    opacity: 0.12,
    transform: [{ rotate: "-4deg" }],
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.64,
  },
  imageBoard: {
    opacity: 0.68,
  },
  fallbackMotif: {
    position: "absolute",
    right: 18,
    top: 28,
    width: 172,
    height: 116,
    opacity: 0.28,
  },
  fallbackLine: {
    position: "absolute",
    right: 4,
    top: 22,
    width: 134,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  fallbackLineBoard: {
    transform: [{ rotate: "-16deg" }],
  },
  fallbackPanel: {
    position: "absolute",
    right: 34,
    top: 48,
    width: 72,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: "-8deg" }],
  },
  fallbackStem: {
    position: "absolute",
    right: 112,
    top: 34,
    width: 4,
    height: 72,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
})
