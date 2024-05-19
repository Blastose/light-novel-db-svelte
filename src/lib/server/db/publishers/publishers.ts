import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { RanobeDB } from '$lib/server/db/db';
import type { InferResult, Kysely } from 'kysely';
import { DBBooks, withBookTitleCte } from '../books/books';
import type { DB } from '$lib/db/dbTypes';
import type { User } from 'lucia';

export class DBPublishers {
	ranobeDB: RanobeDB;

	constructor(ranobeDB: RanobeDB) {
		this.ranobeDB = ranobeDB;
	}

	static fromDB(db: Kysely<DB>, user?: User | null) {
		const ranobeDB = new RanobeDB(db, user);
		return new this(ranobeDB);
	}

	getPublishers() {
		return this.ranobeDB.db.selectFrom('publisher').selectAll('publisher');
	}

	getPublisher(id: number) {
		return this.ranobeDB.db
			.with('cte_book', withBookTitleCte(this.ranobeDB.user?.title_prefs))
			.selectFrom('publisher')
			.selectAll('publisher')
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom('release')
						.innerJoin('release_publisher', 'release_publisher.release_id', 'release.id')
						.whereRef('release_publisher.publisher_id', '=', 'publisher.id')
						.select([
							'release.title',
							'release_publisher.publisher_type',
							'release.id',
							'release.release_date',
						])
						// Removed because nested `jsonArrayFrom`s are really slow
						// .select((eb) => [
						// 	jsonArrayFrom(
						// 		eb
						// 			.selectFrom('cte_book')
						// 			.innerJoin('release_book', 'release_book.book_id', 'cte_book.id')
						// 			.whereRef('release_book.release_id', '=', 'release.id')
						// 			.select(['cte_book.id', 'cte_book.title'])
						// 			.limit(10),
						// 	).as('book_releases'),
						// ])
						.orderBy('release.release_date desc')
						.orderBy('release.title')
						.limit(100),
				).as('releases'),
				jsonArrayFrom(
					eb
						.selectFrom('publisher_relation')
						.innerJoin(
							'publisher as child_publisher',
							'child_publisher.id',
							'publisher_relation.id_child',
						)
						.select([
							'child_publisher.name',
							'child_publisher.romaji',
							'child_publisher.id',
							'publisher_relation.relation_type',
						])
						.where('publisher_relation.id_parent', '=', id),
				).as('child_publishers'),
			])
			.where('publisher.id', '=', id);
	}

	getPublisherHist(options: { id: number; revision?: number }) {
		let query = this.ranobeDB.db
			.with('cte_book', withBookTitleCte(this.ranobeDB.user?.title_prefs))
			.selectFrom('publisher_hist')
			.innerJoin('change', 'change.id', 'publisher_hist.change_id')
			.select([
				'publisher_hist.change_id as id',
				'publisher_hist.description',
				'publisher_hist.name',
				'publisher_hist.romaji',
				'publisher_hist.bookwalker_id',
			])
			.select(['change.ihid as hidden', 'change.ilock as locked'])
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom('release')
						.innerJoin('release_publisher', 'release_publisher.release_id', 'release.id')
						.where('release_publisher.publisher_id', '=', options.id)
						.select([
							'release.title',
							'release_publisher.publisher_type',
							'release.id',
							'release.release_date',
						])
						// .select((eb) => [
						// 	jsonArrayFrom(
						// 		eb
						// 			.selectFrom('cte_book')
						// 			.innerJoin('release_book', 'release_book.book_id', 'cte_book.id')
						// 			.whereRef('release_book.release_id', '=', 'release.id')
						// 			.select(['cte_book.id', 'cte_book.title']),
						// 	).as('book_releases'),
						// ])
						.orderBy('release.release_date desc')
						.orderBy('release.title')
						.limit(100),
				).as('releases'),
				jsonArrayFrom(
					eb
						.selectFrom('publisher_relation_hist')
						.innerJoin(
							'publisher as child_publisher',
							'child_publisher.id',
							'publisher_relation_hist.id_child',
						)
						.select([
							'child_publisher.name',
							'child_publisher.romaji',
							'child_publisher.id',
							'publisher_relation_hist.relation_type',
						])
						.whereRef('publisher_relation_hist.change_id', '=', 'change.id'),
				).as('child_publishers'),
			])
			.where('change.item_id', '=', options.id)
			.where('change.item_name', '=', 'publisher');

		if (options.revision) {
			query = query.where('change.revision', '=', options.revision);
		} else {
			query = query.orderBy('change.revision desc');
		}

		return query;
	}

	getPublisherEdit(id: number) {
		return this.ranobeDB.db
			.selectFrom('publisher')
			.select([
				'publisher.id',
				'publisher.description',
				'publisher.name',
				'publisher.romaji',
				'publisher.locked',
				'publisher.hidden',
				'publisher.bookwalker_id',
			])
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom('publisher_relation')
						.innerJoin('publisher as child_pub', 'child_pub.id', 'publisher_relation.id_child')
						.select(['child_pub.name', 'child_pub.romaji', 'child_pub.id'])
						.select('publisher_relation.relation_type')
						.whereRef('publisher_relation.id_parent', '=', 'publisher.id'),
				).as('child_publishers'),
			)
			.where('publisher.id', '=', id);
	}

	getPublisherHistEdit(params: { id: number; revision: number }) {
		return this.ranobeDB.db
			.selectFrom('publisher_hist')
			.innerJoin('change', 'change.id', 'publisher_hist.change_id')
			.select([
				'publisher_hist.change_id as id',
				'publisher_hist.description',
				'publisher_hist.name',
				'publisher_hist.romaji',
				'publisher_hist.bookwalker_id',
			])
			.select(['change.ihid as hidden', 'change.ilock as locked'])
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom('publisher_relation_hist')
						.innerJoin('publisher as child_pub', 'child_pub.id', 'publisher_relation_hist.id_child')
						.select(['child_pub.name', 'child_pub.romaji', 'child_pub.id'])
						.select('publisher_relation_hist.relation_type')
						.whereRef('publisher_relation_hist.change_id', '=', 'publisher_hist.change_id'),
				).as('child_publishers'),
			)
			.where('change.item_id', '=', params.id)
			.where('change.item_name', '=', 'publisher')
			.where('change.revision', '=', params.revision);
	}

	getBooksBelongingToPublisher(publisherId: number) {
		return DBBooks.fromDB(this.ranobeDB.db, this.ranobeDB.user)
			.getBooks()
			.innerJoin('release_book', 'release_book.book_id', 'cte_book.id')
			.innerJoin('release_publisher', 'release_book.release_id', 'release_publisher.release_id')
			.where('release_publisher.publisher_id', '=', publisherId);
	}
}

export type Publisher = InferResult<ReturnType<DBPublishers['getPublisher']>>[number];
export type PublisherEdit = InferResult<ReturnType<DBPublishers['getPublisherEdit']>>[number];
export type PublisherBook = InferResult<
	ReturnType<DBPublishers['getBooksBelongingToPublisher']>
>[number];
