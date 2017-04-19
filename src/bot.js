const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const sqlite = require('sqlite3');
let db = new sqlite.Database('./database.db');
require('dotenv').config();

const bot = new TelegramBot(process.env.API_TOKEN, {polling: true});

bot.onText(/\/xkcd (.+)/, (msg, match) => {
	try {
		const chatId = msg.chat.id;
		const text = match[1];
		if (!isNaN(text)) {
			db.all("SELECT url FROM comics WHERE id = ?", [parseInt(text)], (err, rows) => {
				bot.sendMessage(chatId, rows[0].url);
			});
		}
	} catch (e) {
		console.log(`ERROR: failure in onText(): ${match[1]}`);
	}
});

bot.on('inline_query', (msg) => {
	try {
		if (!isNaN(msg.query)) { // incoming request is a number
			db.all("SELECT url FROM comics WHERE id = ?", [parseInt(msg.query)], (err, rows) => {
				if (rows.length > 0) {
					const inlineQueryResultsPhoto = {
						type: 'photo',
						id: Math.floor((Math.random() * 100000) + 1).toString(),
						photo_url: rows[0].url,
						thumb_url: rows[0].url
					};
					bot.answerInlineQuery(msg.id, [inlineQueryResultsPhoto]);
				}
			});
		} else { // incoming request is a string
			db.all(`SELECT url FROM comics WHERE lower(title) = lower(?)`, [msg.query], (err, rows) => {
				if (rows !== undefined && rows.length === 1) { // request is an exact title match
					const image = rows[0].url;
					const inlineQueryResults = [];
					inlineQueryResults.push({
						type: 'photo',
						id: Math.floor((Math.random() * 100000) + 1).toString(),
						photo_url: image,
						thumb_url: image,
					});
					bot.answerInlineQuery(msg.id, inlineQueryResults);
				} else { // request is not an exact title match
					let dbQuery = 'SELECT url FROM comics WHERE';
					const words = msg.query.split(" ");
					for (let [index, word] of words.entries()) {
						if (index === 0) dbQuery += ` lower(title) LIKE lower($text) OR lower(transcript) LIKE lower($text)`;
						else dbQuery += ` OR lower(title) LIKE lower($text) OR lower(transcript) LIKE lower($text)`;
					}
					db.all(dbQuery, { $text: `%${msg.query}%` }, (err, rows) => {
						if (rows !== undefined && rows.length > 0) {
							const images = rows.slice(0, 4).map(row => row.url); // only return 4 images
							const inlineQueryResults = [];
							for (const image of images) {
								inlineQueryResults.push({
									type: 'photo',
									id: Math.floor((Math.random() * 100000) + 1).toString(),
									photo_url: image,
									thumb_url: image,
								});
							}
							bot.answerInlineQuery(msg.id, inlineQueryResults);
						}
					});
				}
			});
		}
		console.log(msg);
	} catch (e) {
		console.log(`ERROR: failure in inline_query: ${msg.query}`);
	}
});

bot.on('polling_error', (error) => {

});