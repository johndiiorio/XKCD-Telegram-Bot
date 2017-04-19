const sqlite = require('sqlite3');
const request = require('request-promise');
const fs = require('fs');
let db = new sqlite.Database('./database.db');

function readSQLFile(path) {
	return fs.readFileSync(path, "utf-8");
}

async function getRequest(index) {
	return await request(`https://xkcd.com/${index}/info.0.json`);
}

async function updateDatabase() {
	const numComicsResponse = await request('https://xkcd.com/info.0.json');
	const numComics = JSON.parse(numComicsResponse).num;

	db.serialize(async () => {
		db.run(readSQLFile("./src/sql/create_tables.sql"));
		db.all("SELECT max(id) FROM comics", async (err, rows) => {
			for (let i = rows[0]['max(id)'] ? rows[0]['max(id)'] : 1; i <= numComics; i++) {
				if (i === 404) i = 405; // skip 404 comic
				const currResponseRaw = await getRequest(i);
				const currResponse = JSON.parse(currResponseRaw);
				const stmt = db.prepare("INSERT OR IGNORE INTO comics (id, title, safe_title, url, transcript) VALUES (?,?,?,?,?)");
				stmt.run(currResponse.num, currResponse.title, currResponse.safe_title, currResponse.img, currResponse.transcript);
				stmt.finalize();
			}
			console.log('Database updated successfully');
			db.close();
		});
	});
}

updateDatabase();