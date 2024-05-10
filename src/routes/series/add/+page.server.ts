import { seriesSchema } from '$lib/zod/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { redirect as flashRedirect } from 'sveltekit-flash-message/server';
import { zod } from 'sveltekit-superforms/adapters';
import pkg from 'pg';
import { hasAddPerms } from '$lib/db/permissions';
import { DBSeriesActions } from '$lib/server/db/series/actions.js';
import { ChangePermissionError, HasRelationsError } from '$lib/server/db/errors/errors.js';
import { db } from '$lib/server/db/db.js';
const { DatabaseError } = pkg;

export const load = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	if (!hasAddPerms(locals.user)) {
		error(403);
	}

	const form = await superValidate(
		{
			titles: [
				{
					lang: 'ja',
					official: true,
					title: '',
					romaji: '',
				},
			],
		},
		zod(seriesSchema),
		{
			errors: false,
		},
	);

	return { form };
};

export const actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401);

		const form = await superValidate(request, zod(seriesSchema));
		if (!hasAddPerms(locals.user)) {
			return fail(403, { form });
		}

		if (!form.valid) {
			console.log(form.errors);
			return fail(400, { form });
		}

		let newSeriesId: number | undefined = undefined;
		const dbSeriesActions = DBSeriesActions.fromDB(db);
		try {
			newSeriesId = await dbSeriesActions.addSeries({ series: form.data }, locals.user);
		} catch (e) {
			console.log(e);
			if (e instanceof DatabaseError) {
				if (
					e.code === '23505' &&
					e.table === 'series_book' &&
					e.constraint === 'series_book_pkey'
				) {
					return setError(
						form,
						'books._errors',
						'Duplicate books in form. Remove duplicates and try again',
					);
				} else if (
					e.code === '23505' &&
					e.table === 'series_title' &&
					e.constraint === 'series_title_pkey'
				) {
					return setError(
						form,
						'titles._errors',
						'Duplicate titles in form. Remove duplicates and try again',
					);
				} else if (
					e.code === '23505' &&
					e.table === 'series_relation' &&
					e.constraint === 'series_relation_pkey'
				) {
					return setError(
						form,
						'child_series._errors',
						'Duplicate series relations in form. Remove duplicates and try again',
					);
				}
			} else if (e instanceof ChangePermissionError) {
				return fail(403, { form });
			} else if (e instanceof HasRelationsError) {
				return setError(
					form,
					'hidden',
					'Cannot hide series. Remove any relations to the series and try again.',
				);
			}
			console.log(e);
		}

		if (newSeriesId) {
			flashRedirect(
				303,
				`/series/${newSeriesId}`,
				{ type: 'success', message: 'Successfully added series!' },
				cookies,
			);
		}
		return fail(400, { form });
	},
};
