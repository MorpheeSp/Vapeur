const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "hbs");

// -------------------- HOME (jeux mis en avant) --------------------
app.get("/", async (req, res) => {
  const games = await prisma.game.findMany({
    where: { featured: true },
    orderBy: { title: "asc" },
    include: { genre: true, editor: true }
  });

  res.render("home", { games });
});

// -------------------- LISTE DES JEUX --------------------
app.get("/games", async (req, res) => {
  const games = await prisma.game.findMany({
    orderBy: { title: "asc" },
    include: { genre: true, editor: true }
  });

  res.render("games/list", { games });
});

// -------------------- DETAIL JEU --------------------
app.get("/games/:id", async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(req.params.id) },
    include: { genre: true, editor: true }
  });

  res.render("games/detail", { game });
});

// -------------------- CREATE JEU --------------------
app.post("/games/create", async (req, res) => {
  const { title, description, releaseDate, genreId, editorId, featured } = req.body;

  await prisma.game.create({
    data: {
      title,
      description,
      releaseDate: new Date(releaseDate),
      genreId: Number(genreId),
      editorId: Number(editorId),
      featured: featured === "on"
    }
  });

  res.redirect("/games");
});

// -------------------- SERVEUR --------------------
app.listen(3000, () => {
  console.log("Serveur lancé : http://localhost:3000");
});