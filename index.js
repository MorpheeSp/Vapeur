const express = require("express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const { execSync } = require("child_process");

// db
try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "ignore" });
  console.log("Base de données initialisée");
} catch (error) {
  console.log("Base de données déjà créée ou erreur:", error.message);
}

const app = express();
const prisma = new PrismaClient();

// автозаполнение жанров
async function initGenres() {
  const genres = ["Action", "Aventure", "RPG", "Simulation", "Sport", "MMORPG"];
  
  for (const genreName of genres) {
    const existing = await prisma.genres.findFirst({
      where: { titreGenre: genreName }
    });
    
    if (!existing) {
      await prisma.genres.create({
        data: { titreGenre: genreName }
      });
    }
  }
}

initGenres().catch(console.error);

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

// -------------------- CREATE JEU (FORM) --------------------
app.get("/games/new", async (req, res) => {
  const genres = await prisma.genres.findMany({
    orderBy: { titreGenre: "asc" }
  });
  const editeurs = await prisma.editeur.findMany({
    orderBy: { nom: "asc" }
  });
  
  res.render("games/new", { genres, editeurs });
});

// -------------------- EDIT JEU (FORM) --------------------
app.get("/games/:id/edit", async (req, res) => {
  const game = await prisma.jeux.findUnique({
    where: { id: Number(req.params.id) }
  });

  if (!game) {
    return res.redirect("/");
  }

  const genres = await prisma.genres.findMany({
    orderBy: { titreGenre: "asc" }
  });
  const editeurs = await prisma.editeur.findMany({
    orderBy: { nom: "asc" }
  });

  // отмечаем выбранные жанр и издатель
  const genresWithSelected = genres.map(genre => ({
    ...genre, //copy
    selected: genre.id === game.genreId
  }));
  const editeursWithSelected = editeurs.map(editeur => ({
    ...editeur,
    selected: editeur.id === game.editeurId
  }));

  res.render("games/edit", { game, genres: genresWithSelected, editeurs: editeursWithSelected });
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
      genreId: genreId && genreId !== "" ? Number(genreId) : null,
      editeurId: editorId && editorId !== "" ? Number(editorId) : null
    }
  });

  res.redirect("/");
});

// -------------------- UPDATE JEU --------------------
app.post("/games/:id/update", async (req, res) => {
  const { titre, description, genreId, editorId } = req.body;

  await prisma.jeux.update({
    where: { id: Number(req.params.id) },
    data: {
      titre,
      description,
      genreId: genreId && genreId !== "" ? Number(genreId) : null,
      editeurId: editorId && editorId !== "" ? Number(editorId) : null
    }
  });

  res.redirect("/");
});

// -------------------- DELETE JEU --------------------
app.post("/games/:id/delete", async (req, res) => {
  await prisma.jeux.delete({
    where: { id: Number(req.params.id) }
  });

  res.redirect("/");
});

// -------------------- SERVEUR --------------------
app.listen(3000, () => {
  console.log("Serveur lancé : http://localhost:3000");
});

