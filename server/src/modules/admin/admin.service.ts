import { FileAsset } from "../chapter/chapter.model.js"
import { checkObjectExists } from "../chapter/file.service.js"
export * from "./services/admin-user.service.js"
export * from "./services/admin-board-member.service.js"
export * from "./services/admin-task-type.service.js"
export * from "./services/admin-dashboard.service.js"

export async function reconcileFilesService() {
  const activeFiles = await FileAsset.find({ status: "ACTIVE" })
  let missingCount = 0

  for (const file of activeFiles) {
    const exists = await checkObjectExists(file.r2Key)
    if (!exists) {
      file.status = "MISSING"
      await file.save()
      missingCount++
    }
  }

  return { totalScanned: activeFiles.length, missingCount }
}
