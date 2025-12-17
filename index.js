const express = require("express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Format dates pour affichage simple
function withReadableDates(games) {
  return games.map((game) => ({
    ...game,
    releaseDateText: game.releaseDate ? game.releaseDate.toISOString().slice(0, 10) : null
  }));
}

// Pré-remplit les genres s'ils n'existent pas
async function ensureGenres() {
  const genres = ["Action", "Aventure", "RPG", "Simulation", "Sport", "MMORPG"];
  for (const titreGenre of genres) {
    const exists = await prisma.genres.findFirst({ where: { titreGenre } });
    if (!exists) {
      await prisma.genres.create({ data: { titreGenre } });
    }
  }
}

// -------------------- ROUTES JEUX --------------------
app.get("/", async (req, res) => {
  const games = await prisma.jeux.findMany({
    where: { isFeatured: true },
    orderBy: { titre: "asc" },
    include: { genre: true, editeur: true }
  });
  res.render("home", { games: withReadableDates(games) });
});

app.get("/games", async (req, res) => {
  const games = await prisma.jeux.findMany({
    orderBy: { titre: "asc" },
    include: { genre: true, editeur: true }
  });
  res.render("games/list", { games: withReadableDates(games) });
});

app.get("/games/new", async (req, res) => {
  const [genres, editeurs] = await Promise.all([
    prisma.genres.findMany({ orderBy: { titreGenre: "asc" } }),
    prisma.editeur.findMany({ orderBy: { nom: "asc" } })
  ]);
  res.render("games/new", { genres, editeurs });
});

app.get("/games/:id", async (req, res) => {
  const game = await prisma.jeux.findUnique({
    where: { id: Number(req.params.id) },
    include: { genre: true, editeur: true }
  });
  if (!game) return res.status(404).render("games/detail", { game: null });
  res.render("games/detail", { game: withReadableDates([game])[0] });
});

app.get("/games/:id/edit", async (req, res) => {
  const game = await prisma.jeux.findUnique({ where: { id: Number(req.params.id) } });
  if (!game) return res.redirect("/");

  const [genres, editeurs] = await Promise.all([
    prisma.genres.findMany({ orderBy: { titreGenre: "asc" } }),
    prisma.editeur.findMany({ orderBy: { nom: "asc" } })
  ]);

  res.render("games/edit", {
    game: { ...game, releaseDateText: game.releaseDate ? game.releaseDate.toISOString().slice(0, 10) : "" },
    genres: genres.map((g) => ({ ...g, selected: g.id === game.genreId })),
    editeurs: editeurs.map((e) => ({ ...e, selected: e.id === game.editeurId }))
  });
});

app.post("/games/create", async (req, res) => {
  const { titre, description, releaseDate, genreId, editeurId, isFeatured } = req.body;
  await prisma.jeux.create({
    data: {
      titre,
      description,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      isFeatured: Boolean(isFeatured),
      genreId: genreId ? Number(genreId) : null,
      editeurId: editeurId ? Number(editeurId) : null
    }
  });
  res.redirect("/");
});

app.post("/games/:id/update", async (req, res) => {
  const { titre, description, releaseDate, genreId, editeurId, isFeatured } = req.body;
  await prisma.jeux.update({
    where: { id: Number(req.params.id) },
    data: {
      titre,
      description,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      isFeatured: Boolean(isFeatured),
      genreId: genreId ? Number(genreId) : null,
      editeurId: editeurId ? Number(editeurId) : null
    }
  });
  res.redirect("/games/" + req.params.id);
});

app.post("/games/:id/delete", async (req, res) => {
  await prisma.jeux.delete({ where: { id: Number(req.params.id) } });
  res.redirect("/games");
});

// -------------------- ROUTES GENRES --------------------
app.get("/genres", async (req, res) => {
  const genres = await prisma.genres.findMany({
    orderBy: { titreGenre: "asc" }
  });
  res.render("genres/list", { genres });
});

app.get("/genres/:id", async (req, res) => {
  const genre = await prisma.genres.findUnique({
    where: { id: Number(req.params.id) }
  });
  if (!genre) return res.status(404).render("genres/detail", { genre: null, games: [] });

  const games = await prisma.jeux.findMany({
    where: { genreId: genre.id },
    orderBy: { titre: "asc" },
    include: { editeur: true }
  });
  res.render("genres/detail", { genre, games: withReadableDates(games) });
});

// -------------------- ROUTES EDITEURS --------------------
app.get("/editeurs", async (req, res) => {
  const editeurs = await prisma.editeur.findMany({
    orderBy: { nom: "asc" }
  });
  res.render("editeurs/list", { editeurs });
});

app.get("/editeurs/new", (req, res) => {
  res.render("editeurs/new");
});

app.post("/editeurs/create", async (req, res) => {
  const { nom } = req.body;
  await prisma.editeur.create({ data: { nom } });
  res.redirect("/editeurs");
});

app.get("/editeurs/:id", async (req, res) => {
  const editeur = await prisma.editeur.findUnique({
    where: { id: Number(req.params.id) }
  });
  if (!editeur) return res.status(404).render("editeurs/detail", { editeur: null, games: [] });

  const games = await prisma.jeux.findMany({
    where: { editeurId: editeur.id },
    orderBy: { titre: "asc" },
    include: { genre: true }
  });
  res.render("editeurs/detail", { editeur, games: withReadableDates(games) });
});

app.get("/editeurs/:id/edit", async (req, res) => {
  const editeur = await prisma.editeur.findUnique({
    where: { id: Number(req.params.id) }
  });
  if (!editeur) return res.redirect("/editeurs");
  res.render("editeurs/edit", { editeur });
});

app.post("/editeurs/:id/update", async (req, res) => {
  const { nom } = req.body;
  await prisma.editeur.update({
    where: { id: Number(req.params.id) },
    data: { nom }
  });
  res.redirect("/editeurs/" + req.params.id);
});

app.post("/editeurs/:id/delete", async (req, res) => {
  await prisma.editeur.delete({ where: { id: Number(req.params.id) } });
  res.redirect("/editeurs");
});

// -------------------- 404 --------------------
app.use((req, res) => {
  res.status(404).render("404");
});

// -------------------- DEMARRAGE --------------------
async function start() {
  await ensureGenres();
  app.listen(PORT, () => {
    console.log(`Serveur lancé : http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Erreur au démarrage", error);
  process.exit(1);
});

