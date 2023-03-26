import SpotifyWebApi from "spotify-web-api-node";
import { LastFmNode } from "lastfm";
import dotenv from "dotenv";
dotenv.config();

const lastfm = new LastFmNode({
  api_key: process.env.LASTFM_API_KEY,
});
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const isUrl = (s) => {
  var regexp =
    /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
};

const authSpotify = () => {
  return spotifyApi.clientCredentialsGrant().then(
    (data) => {
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    (err) => {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
};

export const searchQuery = async (query) => {
  await authSpotify();
  const {
    artists,
    track: { name: title },
    pendingGenres,
  } = await getSpotifyData(query);

  const spotifyGenres = [...new Set((await Promise.all(pendingGenres)).flat())];
  const lastfmGenres = await getLastfmData(artists);

  return {
    spotifyGenres: spotifyGenres.join(", "),
    lastfmGenres: lastfmGenres.join(", "),
    artists: artists.join(", "),
    title: title,
  };
};

const getLastfmData = async (artists) => {
  let genreArray = [];
  const genres = new Promise((resolve, reject) => {
    lastfm.request("artist.getTopTags", {
      artist: artists,
      handlers: {
        success: (data) => {
          if (data.toptags.tag) {
            resolve(
              data.toptags.tag
                .map(({ name }) => name.toLowerCase())
                .slice(0, 10)
            );
          }
        },
        error: (error) => {
          reject(error);
        },
      },
    });
  });

  for (let i = 0; i < artists.length; i++) {
    await genres
      .then((data) => {
        genreArray = genreArray.concat(data);
      })
      .catch((err) => console.log(err));
  }

  return [...new Set(genreArray)];
};

const getSpotifyData = async (query) => {
  let dataRoot;
  if (isUrl(query)) {
    await spotifyApi.getTrack(query.split("/")[4].split("?")[0]).then(
      (data) => {
        dataRoot = data.body;
      },
      (err) => {
        if (err.statusCode == 400)
          throw "Could not find a track based on the URL. The URL must be from Spotify.";
      }
    );
  } else {
    await spotifyApi.searchTracks(query).then(
      (data) => {
        if (data.body.tracks.items.length) {
          dataRoot = data.body.tracks.items[0];
        } else {
          throw `Could not find '${query}'. Try spell checking.`;
        }
      },
      (err) => {
        throw err;
      }
    );
  }

  return {
    artists: dataRoot.artists.map((artist) => artist.name),
    track: {
      name: dataRoot.name,
      id: dataRoot.id,
    },
    pendingGenres: dataRoot.artists.map(({ id }) =>
      spotifyApi.getArtist(id).then(
        (data) => data.body.genres,
        (err) => {
          throw err;
        }
      )
    ),
  };
};
