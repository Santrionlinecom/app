import type { D1Database } from '@cloudflare/workers-types';

const addColumn = async (db: D1Database, name: string, type: string) => {
	try {
		await db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${type}`).run();
	} catch (err: any) {
		if (!`${err?.message ?? ''}`.includes('duplicate column name')) {
			throw err;
		}
	}
};

export const ensureUserOptionalColumns = async (db: D1Database) => {
	await addColumn(db, 'gender', 'TEXT');
	await addColumn(db, 'whatsapp', 'TEXT');
	await addColumn(
		db,
		'work_status',
		"TEXT CHECK (work_status IN ('freelance', 'owner', 'employee'))"
	);
	await addColumn(db, 'expertise', 'TEXT');
	await addColumn(db, 'org_id', 'TEXT');
	await addColumn(db, 'org_status', "TEXT NOT NULL DEFAULT 'active'");
};
