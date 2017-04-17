CREATE TABLE IF NOT EXISTS comics (
		id integer PRIMARY KEY,
		title text NOT NULL,
		safe_title text NOT NULL,
		url text NOT NULL UNIQUE,
		transcript text
);