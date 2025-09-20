import express from "express";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoriteTable } from "./db/schema.js";
import { eq, and } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
const PORT = ENV.PORT || 5001;

// Pga Render.com gratis versjon bruker vi job (cron.js)
if (ENV.NODE_ENV === "production") job.start();

app.use(express.json()); // Uten denne linjen blir alle value på linje 18 undefined "const { userId, recipeId, title, image, cookTime, servings } = req.body;"

// TEST
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    if (!userId || !recipeId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newFavorite = await db
      .insert(favoriteTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log("Error adding favorite", error);
    res.status(500).json({ error: "Something went wrong / internal error" }); // 500 betyr noe er ødelagt på server siden
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userFavorites = await db
      .select()
      .from(favoriteTable)
      .where(eq(favoriteTable.userId, userId));

    res.status(200).json(userFavorites);
  } catch (error) {
    console.log("Error fetching the favorite", error);
    res.status(500).json({ error: "Something went wrong: app.get()" });
  }
});

/*
app.get("/api/favorites", async (req, res) => {
  try {
    const allValues = await db.select().from(favoriteTable);

    res.status(200).json(allValues);
  } catch (e) {
    console.log("Error fetching values");
    res.status(500).json({ error: "Something went wrong: app.get()" });
  }
});
*/

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    await db.delete(favoriteTable).where(
      and(
        // Husk:: import { eq, and } from "drizzle-orm";
        eq(favoriteTable.userId, userId),
        eq(favoriteTable.recipeId, parseInt(recipeId))
      )
    );
    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing favorite", error);
    res.status(500).json({ error: "Something went wrong: app.delete()" });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});
