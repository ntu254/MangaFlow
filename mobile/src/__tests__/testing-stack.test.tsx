import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

it("renders React 19 components through jest-expo", () => {
  render(<Text accessibilityRole="header">Mobile workflow tests ready</Text>);
  expect(
    screen.getByRole("header", { name: "Mobile workflow tests ready" }),
  ).toBeVisible();
});
