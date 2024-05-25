import { DateNumber } from '$lib/components/form/release/releaseDate';
import {
	releasePublisherTypeArray,
	releaseTypeArray,
	seriesRelTypeArray,
	seriesStatusArray,
	staffRolesArray,
} from '$lib/db/dbConsts';
import { releaseFormatArray } from '$lib/db/dbConsts';
import { publisherRelTypeArray } from '$lib/db/dbConsts';
import { languagesArray } from '$lib/db/dbConsts';
import { z } from 'zod';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { defaultUserListLabelsArray } from '$lib/db/dbConsts';

dayjs.extend(customParseFormat);

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const zUsername = z
	.string({ required_error: 'Username is required' })
	.regex(
		USERNAME_REGEX,
		'Username must only contain alphanumeric characters, dash (-), and underscore (_)',
	)
	.min(3, { message: 'Username must be between 3 and 36 characters' })
	.max(36, { message: 'Username must be between 3 and 36 characters' });
const zPasswordEntry = z
	.string({ required_error: 'Password is required' })
	.max(255, { message: 'Password too long' });
const zPasswordNew = z
	.string({ required_error: 'Password is required' })
	.min(6, { message: 'Password must be between 6 and 255 characters' })
	.max(255, { message: 'Password must be between 6 and 255 characters' });
function isValidISO8601Date(dateString: string): boolean {
	const isoDateRegex = /^\d{4,5}-\d{2}-\d{2}$/;
	if (!isoDateRegex.test(dateString)) {
		return false;
	}

	const [year, month, day] = dateString.split('-').map((v) => Number(v));
	if (month < 1 || month > 12 || day < 1) {
		return false;
	}
	const daysInMonth = new Date(year, month, 0).getDate();
	return day <= daysInMonth;
}
export const zISODate = z
	.string()
	.refine((v) => isValidISO8601Date(v), { message: 'Date must be a valid ISO date' });

export const loginSchema = z.object({
	usernameemail: z
		.string({ required_error: 'Username or email is required' })
		.max(255, { message: 'Username or email too long' }),
	password: zPasswordEntry,
});

export const signupSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.email({ message: 'Invalid email address' })
		.max(255, { message: 'Email must be less or equal to 255 characters ' }),
	username: zUsername,
	password: zPasswordNew,
});

const userListFormTypes = ['add', 'update', 'delete'] as const;
export type UserListFormType = (typeof userListFormTypes)[number];
export const userListBookSchema = z.object({
	labels: z.array(
		z.object({
			id: z.number().max(2000000),
			label: z.string().max(2000),
		}),
	),
	readingStatus: z.enum(defaultUserListLabelsArray),
	score: z.number().min(1).max(10).nullish(),
	started: zISODate.or(z.literal('')).nullish(),
	finished: zISODate.or(z.literal('')).nullish(),
	notes: z.string().max(2000, { message: 'Note must between less than 2000 characters' }).nullish(),
	type: z.enum(userListFormTypes),
});

export const bookSchema = z.object({
	hidden: z.boolean(),
	locked: z.boolean(),
	description: z.string().max(2000).nullish(),
	description_ja: z.string().max(2000).nullish(),
	image_id: z.number().nullish(),

	titles: z
		.array(
			z.object({
				lang: z.enum(languagesArray),
				official: z.boolean(),
				title: z.string().min(1, { message: 'Title must be at least 1 character' }).max(2000),
				romaji: z.string().max(2000).nullish(),
			}),
		)
		.min(1)
		.max(50)
		.refine((titles) => {
			if (!titles.some((v) => v.lang === 'ja')) {
				return false;
			}
			return true;
		}),

	editions: z
		.array(
			z.object({
				eid: z.number().nullish(),
				title: z.string().min(1).max(2000),
				lang: z.enum(languagesArray),
				staff: z
					.array(
						z.object({
							name: z.string().max(2000).nullish(),
							romaji: z.string().max(2000).nullish(),
							staff_id: z.number().max(2000000),
							staff_alias_id: z.number().max(2000000),
							role_type: z.enum(staffRolesArray),
							note: z.string().max(2000),
						}),
					)
					.max(50),
			}),
		)
		.min(1)
		.max(10)
		.refine((editions) => {
			const originalEdition = editions.at(0);
			if (!originalEdition) {
				return false;
			}
			if (originalEdition.title !== 'Original edition') {
				return false;
			}
			if (originalEdition.lang !== 'ja') {
				return false;
			}
			return true;
		}),

	comment: z.string().min(1, { message: 'Summary must have at least 1 character' }).max(2000),
});

export const staffSchema = z.object({
	hidden: z.boolean(),
	locked: z.boolean(),
	description: z.string().max(2000).nullish(),
	bookwalker_id: z.number().nullish(),

	aliases: z
		.array(
			z.object({
				aid: z.number().max(2000000).nullish(),
				ref_book_id: z.number().max(2000000).nullish(),
				main_alias: z.boolean(),
				name: z.string().min(1, { message: 'Name must be at least 1 character' }).max(2000),
				romaji: z.string().max(2000).nullish(),
			}),
		)
		.min(1)
		.max(50)
		.refine((staffs) => {
			const countMainAlias = staffs.filter((item) => item.main_alias).length;
			if (countMainAlias !== 1) {
				return false;
			}
			return true;
		}),
	comment: z.string().min(1, { message: 'Summary must have at least 1 character' }).max(2000),
});

export const publisherSchema = z.object({
	hidden: z.boolean(),
	locked: z.boolean(),

	name: z.string().max(2000),
	romaji: z.string().max(2000).nullish(),
	description: z.string().max(2000).nullish(),
	bookwalker_id: z.number().nullish(),

	child_publishers: z
		.array(
			z.object({
				name: z.string(),
				romaji: z.string().nullish(),
				id: z.number().max(100000),
				relation_type: z.enum(publisherRelTypeArray),
			}),
		)
		.max(50),

	comment: z.string().min(1, { message: 'Summary must have at least 1 character' }).max(2000),
});

export const releaseSchema = z.object({
	hidden: z.boolean(),
	locked: z.boolean(),

	title: z.string().max(2000),
	romaji: z.string().max(2000).nullish(),
	description: z.string().max(2000).nullish(),

	format: z.enum(releaseFormatArray),
	lang: z.enum(languagesArray),
	release_date: z
		.number()
		.min(10000101)
		.max(99999999)
		.refine((val) => {
			const dateNumber = new DateNumber(val);
			if (dateNumber.isFullDate()) {
				return dayjs(dateNumber.getDateFormatted(), 'YYYY-MM-DD', true).isValid();
			}

			const { month, day } = dateNumber.extractYearMonthDay();
			if (month > 12 && month !== 99) {
				return false;
			}
			if (day > 31 && day !== 99) {
				return false;
			}

			return true;
		}, 'Release date must have correct format.'),
	pages: z.number().min(1).max(200000).nullish(),
	isbn13: z.string().min(13).max(13).nullish(),

	books: z
		.array(
			z.object({
				id: z.number().max(200000),
				title: z.string().nullish(),
				rtype: z.enum(releaseTypeArray),
			}),
		)
		.max(50),
	publishers: z
		.array(
			z.object({
				id: z.number().max(200000),
				name: z.string(),
				publisher_type: z.enum(releasePublisherTypeArray),
			}),
		)
		.max(50),

	comment: z.string().min(1, { message: 'Summary must have at least 1 character' }).max(2000),
});

export const seriesSchema = z.object({
	hidden: z.boolean(),
	locked: z.boolean(),

	description: z.string().max(2000).nullish(),
	bookwalker_id: z.number().max(20000000).nullish(),
	publication_status: z.enum(seriesStatusArray),

	books: z
		.array(
			z.object({
				title: z.string().nullish(),
				romaji: z.string().nullish(),
				id: z.number().max(100000),
				sort_order: z.number().max(2000),
			}),
		)
		.max(200),
	child_series: z
		.array(
			z.object({
				title: z.string().nullish(),
				romaji: z.string().nullish(),
				id: z.number().max(100000),
				relation_type: z.enum(seriesRelTypeArray),
			}),
		)
		.max(200),
	titles: z
		.array(
			z.object({
				lang: z.enum(languagesArray),
				official: z.boolean(),
				title: z.string().min(1, { message: 'Title must be at least 1 character' }).max(2000),
				romaji: z.string().max(2000).nullish(),
			}),
		)
		.min(1)
		.max(50)
		.refine((titles) => {
			if (!titles.some((v) => v.lang === 'ja')) {
				return false;
			}
			return true;
		}),

	comment: z.string().min(1, { message: 'Summary must have at least 1 character' }).max(2000),
});

export const searchNameSchema = z.object({ name: z.string() });
export const revisionSchema = z.object({ revision: z.number() });

const zLanguagePrio = z.object({
	lang: z.enum(languagesArray),
	romaji: z.boolean(),
});
export type LanguagePriority = z.infer<typeof zLanguagePrio>;

export const displayPrefsSchema = z.object({
	title_prefs: z.array(zLanguagePrio).min(1).max(4),
	names: z.enum(['romaji', 'native'] as const),
	descriptions: z.enum(['en', 'ja'] as const),
});
export type DisplayPrefs = z.infer<typeof displayPrefsSchema>;

export const usernameSchema = z.object({ username: zUsername, password: zPasswordEntry });
export const passwordSchema = z.object({
	currentPassword: zPasswordEntry,
	newPassword: zPasswordNew,
});

export type Nullish<T> = T | null | undefined;

/*
update   auth_user
set display_prefs = '{
  "title_prefs": [
    { "lang": "ja", "romaji": true, "official": true },
    { "lang": "en", "romaji": true, "official": true },
    { "lang": "en", "romaji": true, "official": true }
  ],
  "names": "romaji",
  "descriptions": "en"
}'::jsonb;

ALTER TABLE ONLY auth_user ALTER COLUMN 
display_prefs SET DEFAULT '{
  "title_prefs": [
    { "lang": "ja", "romaji": true, "official": true },
    { "lang": "en", "romaji": true, "official": true },
    { "lang": "en", "romaji": true, "official": true }
  ],
  "names": "romaji",
  "descriptions": "en"
}'::jsonb;
*/
