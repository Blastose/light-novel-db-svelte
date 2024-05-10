import type { DB } from '$lib/db/dbTypes';
import { sql, Kysely, PostgresDialect } from 'kysely';
import type { User } from 'lucia';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env.testing' });

export async function clearDatabase(db: Kysely<DB>) {
	await sql<unknown>`TRUNCATE change, book_hist, book, book_title, book_title_hist, staff_hist, staff, staff_alias, staff_alias_hist, publisher, book_staff_alias, publisher_relation, book_staff_alias_hist, publisher_hist, publisher_relation_hist, release, release_hist, release_publisher, release_publisher_hist, release_book, release_book_hist, series_hist, series, series_relation, series_relation_hist, series_book, series_book_hist, series_title, series_title_hist, user_list_label, user_list_book, user_list_book_label;`.execute(
		db,
	);
}

export async function initDatabase(db: Kysely<DB>) {
	const book = await db
		.insertInto('book')
		.values({
			description: '',
			hidden: false,
			locked: false,
		})
		.returning('book.id')
		.executeTakeFirstOrThrow();
	const changeBook = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: book.id,
			item_name: 'book',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('book_hist')
		.values({
			change_id: changeBook.id,
			description: '',
		})
		.execute();
	await db
		.insertInto('book_title')
		.values({
			book_id: book.id,
			lang: 'ja',
			official: true,
			title: 'Book Title',
		})
		.execute();
	await db
		.insertInto('book_title_hist')
		.values({
			change_id: changeBook.id,
			lang: 'ja',
			official: true,
			title: 'Book Title',
		})
		.execute();
	const publisher = await db
		.insertInto('publisher')
		.values({ description: '', hidden: false, locked: false, name: 'BestBooks' })
		.returning('id')
		.executeTakeFirstOrThrow();
	const changePublisher = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: publisher.id,
			item_name: 'publisher',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('publisher_hist')
		.values({ change_id: changePublisher.id, description: '', name: 'BestBooks' })
		.execute();
	const publisher2 = await db
		.insertInto('publisher')
		.values({ description: '', hidden: false, locked: false, name: 'GoodBooks' })
		.returning('id')
		.executeTakeFirstOrThrow();
	const changePublisher2 = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: publisher2.id,
			item_name: 'publisher',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('publisher_hist')
		.values({ change_id: changePublisher2.id, description: '', name: 'GoodBooks' })
		.execute();
	const release = await db
		.insertInto('release')
		.values({
			description: '',
			format: 'print',
			hidden: false,
			lang: 'ja',
			locked: false,
			release_date: 20001212,
			title: 'Book Title',
		})
		.returning('id')
		.executeTakeFirstOrThrow();
	const changeRelease = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: release.id,
			item_name: 'release',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('release_hist')
		.values({
			change_id: changeRelease.id,
			description: '',
			format: 'print',
			lang: 'ja',
			release_date: 20001212,
			title: 'Book Title',
		})
		.execute();
	const series = await db
		.insertInto('series')
		.values({ hidden: false, locked: false, publication_status: 'unknown' })
		.returning('id')
		.executeTakeFirstOrThrow();
	const changeSeries = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: series.id,
			item_name: 'series',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('series_hist')
		.values({ change_id: changeSeries.id, publication_status: 'unknown' })
		.execute();
	await db
		.insertInto('series_title')
		.values({ lang: 'ja', official: true, series_id: series.id, title: 'Series Title' })
		.execute();
	await db
		.insertInto('series_title_hist')
		.values({ lang: 'ja', official: true, change_id: changeSeries.id, title: 'Series Title' })
		.execute();
	const staff = await db
		.insertInto('staff')
		.values({ description: '', hidden: false, locked: false })
		.returning('id')
		.executeTakeFirstOrThrow();
	const changeStaff = await db
		.insertInto('change')
		.values({
			comments: 'Automated',
			ihid: false,
			ilock: false,
			item_id: staff.id,
			item_name: 'staff',
			revision: 1,
			user_id: ranobeBot.id,
		})
		.returning('change.id')
		.executeTakeFirstOrThrow();
	await db
		.insertInto('staff_hist')
		.values({ change_id: changeStaff.id, description: '' })
		.execute();
	await db
		.insertInto('staff_alias')
		.values({ main_alias: true, name: 'Staff', staff_id: staff.id })
		.execute();
	await db
		.insertInto('staff_alias_hist')
		.values({ main_alias: true, name: 'Staff', change_id: changeStaff.id, aid: 1 })
		.execute();
}

export const ranobeBot = {
	id: 'RanobeBot',
	id_numeric: 1,
	role: 'admin',
	title_prefs: undefined,
	username: 'RanobeBot',
} satisfies User;

dotenv.config({ path: '.env.testing' });

const pool = new Pool({
	connectionString: process.env.DATABASE_URL_UNIT_TESTS,
});

export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool,
	}),
});
