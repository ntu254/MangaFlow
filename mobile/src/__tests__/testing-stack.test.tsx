import { render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Text } from "react-native";

const appConfig = require("../../app.json") as {
  expo: { experiments?: { reactCompiler?: boolean; typedRoutes?: boolean } };
};

it("renders React 19 components through jest-expo", () => {
  render(<Text accessibilityRole="header">Mobile workflow tests ready</Text>);
  expect(
    screen.getByRole("header", { name: "Mobile workflow tests ready" }),
  ).toBeVisible();
});

it("does not directly import the Worklets runtime in the splash overlay", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/animated-icon.tsx"), "utf8");
  expect(source).not.toContain("react-native-worklets");
});

it("keeps typed routes without enabling the React Compiler experiment", () => {
  expect(appConfig.expo.experiments?.typedRoutes).toBe(true);
  expect(appConfig.expo.experiments?.reactCompiler).toBeUndefined();
});
