#!/usr/bin/env node

/**
 * Reset the Expo project to a blank app shell.
 *
 * This is the default template helper kept for local experiments. It moves or
 * deletes /src and /scripts, then recreates /src/app with a minimal route.
 */

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const root = process.cwd()
const oldDirs = ["src", "scripts"]
const exampleDir = "example"
const newAppDir = "src/app"
const exampleDirPath = path.join(root, exampleDir)

const indexContent = `import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
`

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      await fs.promises.mkdir(exampleDirPath, { recursive: true })
      console.log(`Created /${exampleDir} directory.`)
    }

    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir)
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir)
          await fs.promises.rename(oldDirPath, newDirPath)
          console.log(`Moved /${dir} to /${exampleDir}/${dir}.`)
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true })
          console.log(`Deleted /${dir}.`)
        }
      } else {
        console.log(`/${dir} does not exist, skipping.`)
      }
    }

    const newAppDirPath = path.join(root, newAppDir)
    await fs.promises.mkdir(newAppDirPath, { recursive: true })
    console.log("\nNew /src/app directory created.")

    const indexPath = path.join(newAppDirPath, "index.tsx")
    await fs.promises.writeFile(indexPath, indexContent)
    console.log("src/app/index.tsx created.")

    const layoutPath = path.join(newAppDirPath, "_layout.tsx")
    await fs.promises.writeFile(layoutPath, layoutContent)
    console.log("src/app/_layout.tsx created.")

    console.log("\nProject reset complete. Next steps:")
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/app/index.tsx to edit the main screen.\n3. Put application code in /src; keep route files in /src/app.${
        userInput === "y" ? `\n4. Delete /${exampleDir} when done referencing it.` : ""
      }`,
    )
  } catch (error) {
    console.error(`Error during script execution: ${error.message}`)
  }
}

rl.question("Move existing files to /example instead of deleting them? (Y/n): ", (answer) => {
  const userInput = answer.trim().toLowerCase() || "y"
  if (userInput === "y" || userInput === "n") {
    moveDirectories(userInput).finally(() => rl.close())
  } else {
    console.log("Invalid input. Please enter 'Y' or 'N'.")
    rl.close()
  }
})
