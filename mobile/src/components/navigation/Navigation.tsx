import { Ionicons } from "@expo/vector-icons";
import { Text, View, type ColorValue } from "react-native";
import { ActionButton } from "../Primitives";
import { appStyles as styles } from "../../styles/appStyles";
import type { MobileRole, EditorTab, BoardTab } from "../../types";

const editorTabs: EditorTab[] = ["Home", "Series", "Reviews", "Publication", "Notifications"];
const boardTabs: BoardTab[] = ["Home", "Approvals", "Ranking", "Decisions", "Notifications"];

const tabIcons = {
  Home: "home-outline",
  Series: "albums-outline",
  Reviews: "chatbubbles-outline",
  Publication: "calendar-outline",
  Notifications: "notifications-outline",
  Approvals: "checkmark-done-outline",
  Ranking: "stats-chart-outline",
  Decisions: "shield-checkmark-outline"
} as const;

import { colors } from "../../theme";

export function RoleSwitch({
  role,
  setRole
}: {
  role: MobileRole;
  setRole: (role: MobileRole) => void;
}) {
  return (
    <View style={styles.roleSwitch}>
      {(["EDITOR", "BOARD"] as const).map((nextRole) => (
        <ActionButton
          key={nextRole}
          label={nextRole === "EDITOR" ? "Tantou Editor" : "Editorial Board"}
          onPress={() => setRole(nextRole)}
          variant={role === nextRole ? "primary" : "secondary"}
        />
      ))}
    </View>
  );
}

export function BottomTabs({
  role,
  tab,
  setTab
}: {
  role: MobileRole;
  tab: string;
  setTab: (tab: string) => void;
}) {
  const tabs = role === "EDITOR" ? editorTabs : boardTabs;

  return (
    <View style={styles.tabs}>
      {tabs.map((item) => {
        const active = item === tab;
        return (
          <Text
            accessibilityRole="button"
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tabItem, active ? styles.tabItemActive : null]}
          >
            <Ionicons
              name={tabIcons[item]}
              size={18}
              color={(active ? colors.primary : colors.textMuted) as ColorValue}
            />{" "}
            {item}
          </Text>
        );
      })}
    </View>
  );
}
