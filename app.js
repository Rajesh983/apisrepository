const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
module.exports = app;
app.use(express.json());

let db = null;
const filePath = path.join(__dirname, "moviesData.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToMovieName = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

// 1.Get movie names

app.get("/movies/", async (request, response) => {
  const moviesListQuery = `
      SELECT * FROM movie
    `;

  const moviesList = await db.all(moviesListQuery);
  response.send(
    moviesList.map((eachMovie) => {
      return convertToMovieName(eachMovie);
    })
  );
});

// 2. Creates a new movie

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { movieName, directorId, leadActor } = movieDetails;
  const insertMovieQuery = `
       INSERT INTO movie(movie_name, director_id, lead_actor)
       VALUES('${movieName}',${directorId},'${leadActor}');
    `;

  const dbResponse = await db.run(insertMovieQuery);
  response.send("Movie Successfully Added");
});

// 3. Get movie based on movieId

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
       SELECT 
          * 
       FROM 
         movie 
       WHERE 
         movie_id = ${movieId}
    `;

  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

// 4. Update movie details based on movieId

app.put("/movies/:movieId/", async (request, response) => {
  const movieDetails = request.body;
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `
          UPDATE movie 
          SET 
             director_id = ${directorId},
             movie_name = '${movieName}',
             lead_actor = '${leadActor}'
          WHERE movie_id = ${movieId};
      `;

  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

// 5. Delete movie based on movieId

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieQuery = `
     DELETE FROM movie WHERE movie_id = ${movieId};
    `;

  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// 6. Get all directors list

convertDirectorsDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorsListQuery = `
       SELECT * FROM director
     `;

  const directorsList = await db.all(getDirectorsListQuery);
  response.send(
    directorsList.map((eachDirector) =>
      convertDirectorsDbObjectToResponseObject(eachDirector)
    )
  );
});

// 7. Get a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getMovieListQuery = `
       SELECT * FROM movie WHERE director_id = ${directorId};
    `;

  const movieList = await db.all(getMovieListQuery);

  response.send(movieList.map((eachMovie) => convertToMovieName(eachMovie)));
});
