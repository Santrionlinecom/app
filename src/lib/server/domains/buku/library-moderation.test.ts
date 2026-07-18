import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { publishAdminBukuBook, updateBukuChapter } from './library.ts';

type CapturedStatement = { sql: string; bindings: unknown[] };

const makeDb = (batchChanges: number[] = []) => {
	const captured: CapturedStatement[] = [];
	const db = {
		prepare(sql: string) {
			const record = { sql, bindings: [] as unknown[] };
			captured.push(record);
			const statement = {
				bind(...bindings: unknown[]) {
					record.bindings = bindings;
					return statement;
				},
				async run() {
					return { meta: { changes: 1 } };
				}
			};
			return statement;
		},
		async batch() {
			return batchChanges.map((changes) => ({ meta: { changes } }));
		}
	};
	return { db: db as never, captured };
};

const makeSqliteD1 = () => {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec(`
		CREATE TABLE buku_books (
			id TEXT PRIMARY KEY,
			author_id TEXT NOT NULL,
			status TEXT NOT NULL,
			admin_note TEXT,
			updated_at TEXT
		);
		CREATE TABLE buku_chapters (
			id TEXT PRIMARY KEY,
			book_id TEXT NOT NULL,
			chapter_number INTEGER NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			status TEXT NOT NULL,
			updated_at TEXT,
			UNIQUE(book_id, chapter_number)
		);
	`);
	const db = {
		prepare(sql: string) {
			let bindings: unknown[] = [];
			const statement = {
				bind(...values: unknown[]) {
					bindings = values;
					return statement;
				},
				execute() {
					const result = sqlite.prepare(sql).run(...bindings as never[]);
					return { meta: { changes: Number(result.changes) } };
				},
				async run() {
					return statement.execute();
				}
			};
			return statement;
		},
		async batch(statements: Array<{ execute: () => { meta: { changes: number } } }>) {
			sqlite.exec('BEGIN');
			try {
				const results = statements.map((statement) => statement.execute());
				sqlite.exec('COMMIT');
				return results;
			} catch (error) {
				sqlite.exec('ROLLBACK');
				throw error;
			}
		}
	};
	return { sqlite, db: db as never };
};

test('admin publish guards the exact observed status and requires a matching chapter atomically', async () => {
	const { db, captured } = makeDb([1, 1]);
	assert.equal(
		await publishAdminBukuBook(db, {
			id: 'book-1',
			fromStatus: 'draft',
			publishedThrough: 10
		}),
		true
	);
	assert.match(captured[0].sql, /status = \?/);
	assert.match(captured[1].sql, /EXISTS[\s\S]+chapter_number <= \?/);
	assert.deepEqual(captured[0].bindings.slice(-2), ['book-1', 'draft']);
	assert.deepEqual(captured[1].bindings, ['book-1', 'draft', 'book-1', 10]);
});

test('admin publish reports success from the guarded book transition', async () => {
	const { db } = makeDb([0, 0]);
	assert.equal(
		await publishAdminBukuBook(db, {
			id: 'book-empty',
			fromStatus: 'draft',
			publishedThrough: 10
		}),
		false
	);
});

test('chapter update is atomically guarded by author ownership and current parent status', async () => {
	const { db, captured } = makeDb();
	assert.equal(
		await updateBukuChapter(db, {
			bookId: 'book-1',
			chapterId: 'chapter-1',
			authorId: 'author-1',
			allowedBookStatuses: ['draft', 'rejected', 'published'],
			values: {
				chapterNumber: 1,
				title: 'Bab 1',
				content: 'Isi',
				status: 'published'
			}
		}),
		true
	);
	assert.match(captured[0].sql, /author_id = \?/);
	assert.match(captured[0].sql, /status IN \(\?, \?, \?\)/);
	assert.deepEqual(captured[0].bindings.slice(-5), ['book-1', 'author-1', 'draft', 'rejected', 'published']);
});

test('real SQLite publishes sparse chapter numbers through the selected actual chapter', async () => {
	const { sqlite, db } = makeSqliteD1();
	sqlite.exec(`
		INSERT INTO buku_books (id, author_id, status) VALUES ('book-sparse', 'author-1', 'draft');
		INSERT INTO buku_chapters (id, book_id, chapter_number, title, content, status) VALUES
			('chapter-10', 'book-sparse', 10, 'Bab 10', 'Isi', 'draft'),
			('chapter-20', 'book-sparse', 20, 'Bab 20', 'Isi', 'draft');
	`);
	assert.equal(await publishAdminBukuBook(db, { id: 'book-sparse', fromStatus: 'draft', publishedThrough: 20 }), true);
	assert.equal(sqlite.prepare("SELECT status FROM buku_books WHERE id = 'book-sparse'").get()?.status, 'published');
	assert.deepEqual(
		sqlite
			.prepare("SELECT chapter_number, status FROM buku_chapters WHERE book_id = 'book-sparse' ORDER BY chapter_number")
			.all()
			.map((row) => ({ chapter_number: row.chapter_number, status: row.status })),
		[
			{ chapter_number: 10, status: 'published' },
			{ chapter_number: 20, status: 'published' }
		]
	);
});

test('real SQLite keeps the book draft when the cutoff matches no chapter', async () => {
	const { sqlite, db } = makeSqliteD1();
	sqlite.exec(`
		INSERT INTO buku_books (id, author_id, status) VALUES ('book-empty-cutoff', 'author-1', 'draft');
		INSERT INTO buku_chapters (id, book_id, chapter_number, title, content, status)
		VALUES ('chapter-10', 'book-empty-cutoff', 10, 'Bab 10', 'Isi', 'draft');
	`);
	assert.equal(await publishAdminBukuBook(db, { id: 'book-empty-cutoff', fromStatus: 'draft', publishedThrough: 5 }), false);
	assert.equal(sqlite.prepare("SELECT status FROM buku_books WHERE id = 'book-empty-cutoff'").get()?.status, 'draft');
});

test('real SQLite rejects a stale admin publish transition', async () => {
	const { sqlite, db } = makeSqliteD1();
	sqlite.exec(`
		INSERT INTO buku_books (id, author_id, status) VALUES ('book-stale', 'author-1', 'rejected');
		INSERT INTO buku_chapters (id, book_id, chapter_number, title, content, status)
		VALUES ('chapter-1', 'book-stale', 1, 'Bab 1', 'Isi', 'draft');
	`);
	assert.equal(await publishAdminBukuBook(db, { id: 'book-stale', fromStatus: 'draft', publishedThrough: 1 }), false);
	assert.equal(sqlite.prepare("SELECT status FROM buku_books WHERE id = 'book-stale'").get()?.status, 'rejected');
	assert.equal(sqlite.prepare("SELECT status FROM buku_chapters WHERE id = 'chapter-1'").get()?.status, 'draft');
});

test('real SQLite blocks chapter publication after the parent book is archived', async () => {
	const { sqlite, db } = makeSqliteD1();
	sqlite.exec(`
		INSERT INTO buku_books (id, author_id, status) VALUES ('book-archived', 'author-1', 'archived');
		INSERT INTO buku_chapters (id, book_id, chapter_number, title, content, status)
		VALUES ('chapter-1', 'book-archived', 1, 'Bab 1', 'Isi', 'draft');
	`);
	assert.equal(
		await updateBukuChapter(db, {
			bookId: 'book-archived',
			chapterId: 'chapter-1',
			authorId: 'author-1',
			allowedBookStatuses: ['draft', 'rejected', 'published'],
			values: { chapterNumber: 1, title: 'Bab 1', content: 'Isi baru', status: 'published' }
		}),
		false
	);
	assert.equal(sqlite.prepare("SELECT status FROM buku_chapters WHERE id = 'chapter-1'").get()?.status, 'draft');
});
