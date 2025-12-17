-- Create genres table
CREATE TABLE "genres" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titreGenre" TEXT NOT NULL
);

-- Create editeur table
CREATE TABLE "editeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL
);

-- Create jeux table
CREATE TABLE "jeux" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "releaseDate" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editeurId" INTEGER,
    "genreId" INTEGER,
    CONSTRAINT "jeux_editeurId_fkey" FOREIGN KEY ("editeurId") REFERENCES "editeur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "jeux_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

