import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/modules/auth/auth.model.js";
import { Series } from "../src/modules/series/series.model.js";
import { Submission } from "../src/modules/submission/submission.model.js";
import { Notification } from "../src/shared/workflow/events.js";
import { createTokenPair } from "../src/modules/auth/auth.service.js";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mangaflow";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // 1. Create Editor User
  let editor = await User.findOne({ email: "editor@mangaflow.com" });
  if (!editor) {
    editor = await User.create({
      email: "editor@mangaflow.com",
      passwordHash: "dummy",
      name: "Tantou Editor",
      role: "EDITOR",
      isActive: true,
    });
  }

  // 2. Create Board User
  let board = await User.findOne({ email: "board@mangaflow.com" });
  if (!board) {
    board = await User.create({
      email: "board@mangaflow.com",
      passwordHash: "dummy",
      name: "Board Member",
      role: "BOARD",
      isActive: true,
    });
  }

  // 3. Generate Tokens
  const editorTokens = await createTokenPair(editor._id.toString(), "EDITOR");
  const boardTokens = await createTokenPair(board._id.toString(), "BOARD");

  const editorToken = editorTokens.accessToken;
  const boardToken = boardTokens.accessToken;

  console.log("=== TOKENS ===");
  console.log("EDITOR_TOKEN:", editorToken);
  console.log("BOARD_TOKEN:", boardToken);

  // 4. Create some Editor Series
  await Series.deleteMany({ editorId: editor._id });
  const series1 = await Series.create({
    title: "Aurora Ink",
    slug: "aurora-ink-mobile",
    synopsis: "A great fantasy series.",
    status: "EDITOR_REVIEW",
    editorId: editor._id,
    authorId: editor._id,
    ownerId: editor._id,
    currentChapter: 12,
  });

  const series2 = await Series.create({
    title: "Paper Moon Arcade",
    slug: "paper-moon-mobile",
    synopsis: "Comedy series.",
    status: "BOARD_REVIEW",
    editorId: editor._id,
    authorId: editor._id,
    ownerId: editor._id,
    currentChapter: 7,
  });

  // 5. Create some Submissions for Editor to review
  await Submission.deleteMany({ submittedBy: editor._id });
  const sub1 = await Submission.create({
    taskId: new mongoose.Types.ObjectId(),
    submittedBy: editor._id, // Just mock
    assetIds: [],
    status: "EDITOR_FINAL_REVIEW",
    mangakaNote: "Finished background drawing for Page 1",
  });

  // 6. Create some Notifications
  await Notification.deleteMany({ userId: editor._id });
  await Notification.create({
    userId: editor._id,
    event: "SUBMISSION_REVIEW_REQUESTED",
    title: "New Manuscript to Review",
    message: "Aurora Ink Chapter 12 is ready for review.",
    isRead: false,
    isArchived: false,
  });

  await Notification.deleteMany({ userId: board._id });
  await Notification.create({
    userId: board._id,
    event: "SERIES_NEEDS_VOTE",
    title: "Vote needed for Paper Moon",
    message: "Please vote on Paper Moon Arcade publication.",
    isRead: false,
    isArchived: false,
  });

  console.log("Seed complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
