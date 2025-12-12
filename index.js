const express = require("express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const app = express();
const prisma = new PrismaClient();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// -------------------- HOME (jeux mis en avant) --------------------
app.get("/", async (req, res) => {
  const games = await prisma.jeux.findMany({
    orderBy: { titre: "asc" },
    include: { genre: true, editeur: true }
  });

  res.render("home", { games });
});

// -------------------- LISTE DES JEUX --------------------
app.get("/games", async (req, res) => {
  const games = await prisma.jeux.findMany({
    orderBy: { titre: "asc" },
    include: { genre: true, editeur: true }
  });

  res.render("games/list", { games });
});

// -------------------- DETAIL JEU --------------------
app.get("/games/:id", async (req, res) => {
  const game = await prisma.jeux.findUnique({
    where: { id: Number(req.params.id) },
    include: { genre: true, editeur: true }
  });

  if (!game) {
    return res.status(404).render("games/detail", { game: null });
  }

  res.render("games/detail", { game });
});

// -------------------- CREATE JEU --------------------
app.post("/games/create", async (req, res) => {
  const { titre, description, genreId, editorId } = req.body;

  await prisma.jeux.create({
    data: {
      titre,
      description,
      genreId: genreId ? Number(genreId) : null,
      editeurId: editorId ? Number(editorId) : null
    }
  });

  res.redirect("/games");
});

// -------------------- SERVEUR --------------------
app.listen(3000, () => {
  console.log("Serveur lancé : http://localhost:3000");
});

