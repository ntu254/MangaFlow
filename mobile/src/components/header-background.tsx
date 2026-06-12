import { StyleSheet, View } from "react-native"
import { colors } from "@/design/tokens"

interface MFHeaderBackgroundProps {
  compact?: boolean
  role?: "board" | "editor"
}

export function MFHeaderBackground({ compact = false, role = "editor" }: MFHeaderBackgroundProps) {
  const isBoard = role === "board"

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, compact && styles.rootCompact]}
    >
      <View style={styles.washLarge} />
      <View style={styles.washSmall} />
      {isBoard ? <BoardMotif /> : <EditorMotif />}
      <View style={styles.mangaPanel}>
        <View style={styles.panelLine} />
        <View style={[styles.panelLine, styles.panelLineSecond]} />
        <View style={styles.speechBubble} />
      </View>
      <View style={styles.branch} />
      <View style={[styles.branch, styles.branchLower]} />
    </View>
  )
}

function EditorMotif() {
  return (
    <>
      <View style={styles.torii}>
        <View style={styles.toriiTop} />
        <View style={styles.toriiBeam} />
        <View style={styles.toriiLegLeft} />
        <View style={styles.toriiLegRight} />
      </View>
      <View style={styles.pagoda}>
        <View style={styles.pagodaRoofTop} />
        <View style={styles.pagodaTier} />
        <View style={[styles.pagodaTier, styles.pagodaTierLower]} />
        <View style={styles.pagodaBase} />
      </View>
    </>
  )
}

function BoardMotif() {
  return (
    <>
      <View style={styles.castle}>
        <View style={styles.castleRoofTop} />
        <View style={styles.castleRoofWide} />
        <View style={styles.castleBody} />
        <View style={styles.castleBase} />
      </View>
      <View style={styles.gPen}>
        <View style={styles.gPenNib} />
        <View style={styles.gPenStem} />
      </View>
    </>
  )
}

const ink = "rgba(127, 53, 242, 0.13)"
const inkStrong = "rgba(127, 53, 242, 0.2)"

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: -26,
    right: -36,
    width: 310,
    height: 210,
    overflow: "hidden",
  },
  rootCompact: {
    top: -34,
    right: -42,
    transform: [{ scale: 0.86 }],
  },
  washLarge: {
    position: "absolute",
    right: 6,
    top: 22,
    width: 260,
    height: 144,
    borderRadius: 54,
    backgroundColor: colors.headerWash,
    opacity: 0.86,
    transform: [{ rotate: "-8deg" }],
  },
  washSmall: {
    position: "absolute",
    right: 82,
    top: 74,
    width: 154,
    height: 92,
    borderRadius: 40,
    backgroundColor: colors.inkWash,
    opacity: 0.72,
    transform: [{ rotate: "10deg" }],
  },
  torii: {
    position: "absolute",
    right: 30,
    top: 74,
    width: 92,
    height: 86,
    opacity: 0.62,
  },
  toriiTop: {
    position: "absolute",
    top: 0,
    left: 2,
    width: 88,
    height: 9,
    borderRadius: 8,
    backgroundColor: inkStrong,
  },
  toriiBeam: {
    position: "absolute",
    top: 18,
    left: 12,
    width: 68,
    height: 7,
    borderRadius: 6,
    backgroundColor: inkStrong,
  },
  toriiLegLeft: {
    position: "absolute",
    left: 21,
    top: 24,
    width: 7,
    height: 58,
    borderRadius: 6,
    backgroundColor: ink,
  },
  toriiLegRight: {
    position: "absolute",
    right: 21,
    top: 24,
    width: 7,
    height: 58,
    borderRadius: 6,
    backgroundColor: ink,
  },
  pagoda: {
    position: "absolute",
    right: 136,
    top: 76,
    width: 84,
    height: 94,
    opacity: 0.48,
  },
  pagodaRoofTop: {
    position: "absolute",
    top: 0,
    left: 20,
    width: 44,
    height: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: 3,
    borderBottomColor: inkStrong,
  },
  pagodaTier: {
    position: "absolute",
    top: 25,
    left: 9,
    width: 66,
    height: 18,
    borderTopWidth: 3,
    borderTopColor: inkStrong,
    borderBottomWidth: 2,
    borderBottomColor: ink,
    transform: [{ skewX: "-12deg" }],
  },
  pagodaTierLower: {
    top: 51,
    left: 2,
    width: 80,
  },
  pagodaBase: {
    position: "absolute",
    left: 24,
    bottom: 0,
    width: 36,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ink,
  },
  castle: {
    position: "absolute",
    right: 38,
    top: 60,
    width: 118,
    height: 108,
    opacity: 0.54,
  },
  castleRoofTop: {
    position: "absolute",
    top: 0,
    left: 39,
    width: 40,
    height: 16,
    borderBottomWidth: 4,
    borderBottomColor: inkStrong,
    transform: [{ skewX: "-18deg" }],
  },
  castleRoofWide: {
    position: "absolute",
    top: 24,
    left: 18,
    width: 82,
    height: 18,
    borderBottomWidth: 4,
    borderBottomColor: inkStrong,
    transform: [{ skewX: "14deg" }],
  },
  castleBody: {
    position: "absolute",
    top: 39,
    left: 32,
    width: 54,
    height: 44,
    borderWidth: 2,
    borderColor: ink,
    borderRadius: 6,
  },
  castleBase: {
    position: "absolute",
    left: 10,
    bottom: 0,
    width: 98,
    height: 20,
    borderTopWidth: 3,
    borderTopColor: inkStrong,
  },
  gPen: {
    position: "absolute",
    right: 158,
    top: 82,
    width: 84,
    height: 84,
    opacity: 0.52,
    transform: [{ rotate: "-28deg" }],
  },
  gPenNib: {
    position: "absolute",
    left: 7,
    top: 8,
    width: 24,
    height: 38,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 3,
    borderColor: inkStrong,
  },
  gPenStem: {
    position: "absolute",
    left: 27,
    top: 39,
    width: 58,
    height: 8,
    borderRadius: 8,
    backgroundColor: ink,
  },
  mangaPanel: {
    position: "absolute",
    right: 198,
    top: 44,
    width: 90,
    height: 74,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(127, 53, 242, 0.09)",
    transform: [{ rotate: "-8deg" }],
    opacity: 0.74,
  },
  panelLine: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 22,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(127, 53, 242, 0.1)",
  },
  panelLineSecond: {
    top: 48,
    width: 46,
  },
  speechBubble: {
    position: "absolute",
    right: 12,
    top: 10,
    width: 28,
    height: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(127, 53, 242, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.42)",
  },
  branch: {
    position: "absolute",
    right: 72,
    top: 36,
    width: 150,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(127, 53, 242, 0.1)",
    transform: [{ rotate: "-22deg" }],
  },
  branchLower: {
    right: 32,
    top: 140,
    width: 176,
    transform: [{ rotate: "12deg" }],
  },
})
