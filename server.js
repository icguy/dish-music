let express = require("express");
let parser = require("iptv-playlist-parser");
let fs = require("fs");
let path = require('path');

let contentRoot = `E:\\dokumentumok\\Zene`;

function* getFiles(dir) {
	const dirents = fs.readdirSync(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = path.resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield* getFiles(res);
		} else {
			yield res;
		}
	}
}

function isPlaylist(p) { return p.toUpperCase().endsWith(".M3U"); }

function readPlaylist(p) {
	const playlist = fs.readFileSync(p, { encoding: 'utf-8' });
	const result = parser.parse(playlist);

	return result.items.map(a => a.url);
}

function* getPlaylists() {
	for (let file of getFiles(contentRoot)) {
		if (isPlaylist(file))
			yield file;
	}
}

function shuffle(array, seed) {
	let rand = require("random-seed").create(seed.toString());
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
  
	  // Pick a remaining element...
	  let randomIndex = Math.floor(rand.random() * currentIndex);
	  currentIndex--;
  
	  // And swap it with the current element.
	  [array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}
  
	return array;
}

let playlists = [...getPlaylists()];

const port = 3000;
let app = express();

app.get("/playlists", (_req, res) => {
	res.status(200).send(playlists);
});

app.get("/playlists/:pid/file/:fileOrdinal", (req, res) => {
	let playlist = playlists[req.params.pid];
	if (playlist) {
		let files = readPlaylist(playlist);
		let seed = req.query["rand"];
		if(seed) {
			files = shuffle(files, seed);
		}
		let file = files[req.params.fileOrdinal];
		if (file) {
			if (!path.isAbsolute(file)) {
				let basePath = path.dirname(playlist);
				file = path.join(basePath, file);
			}
			file = decodeURI(file);

			res.sendFile(file);
		}
	}
	res.status(404);
});

app.get("/", (_req, res) => res.sendFile(__dirname + "/index.html"));

app.listen(port, "192.168.0.52", () => {
	console.log(`server started on port ${port}`);
});

