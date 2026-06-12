import { Image } from "expo-image"
import { useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { colors } from "@/design/tokens"

const editorHeaderWash = require("../../assets/images/nen.jpg")
const boardHeaderWash = require("../../assets/images/nen1.jpg")

interface MFHeaderBackgroundProps {
  role?: "board" | "editor"
}

export function MFHeaderBackground({ role = "editor" }: MFHeaderBackgroundProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { width } = useWindowDimensions()
  const imageWidth = width
  const imageHeight = Math.min(Math.max(width * 0.82, 310), 390)
  const source = role === "board" ? boardHeaderWash : editorHeaderWash

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { width: imageWidth, height: imageHeight }]}
    >
      <View style={styles.fallbackWash} />
      {imageFailed ? <FallbackMotif role={role} /> : null}
      {!imageFailed ? (
        <Image
          source={source}
          style={[styles.image, role === "board" && styles.imageBoard]}
          contentFit="cover"
          contentPosition="right top"
          transition={0}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <View style={styles.topVeil} />
      <View style={styles.leftVeil} />
      <View style={styles.bottomFadeStrong} />
      <View style={styles.bottomFadeSoft} />
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
    top: 0,
    left: 0,
    zIndex: 0,
  },
  fallbackWash: {
    position: "absolute",
    inset: 0,
    backgroundColor: colors.headerWash,
    opacity: 0.22,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.24,
  },
  imageBoard: {
    opacity: 0.26,
  },
  topVeil: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255, 255, 255, 0.32)",
  },
  leftVeil: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "46%",
    backgroundColor: "rgba(248, 249, 250, 0.58)",
  },
  bottomFadeStrong: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 124,
    backgroundColor: "rgba(248, 249, 250, 0.84)",
  },
  bottomFadeSoft: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    height: 108,
    backgroundColor: "rgba(248, 249, 250, 0.42)",
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
