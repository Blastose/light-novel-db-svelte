import { defaultDisplayPrefs } from '$lib/db/dbConsts';
import type { Language } from '$lib/server/db/dbTypes';
import type { DisplayPrefs, Nullish } from '$lib/server/zod/schema';
import type { User } from '$lib/server/lucia/lucia';
import { getContext } from 'svelte';
import type { Writable } from 'svelte/store';

export function getDisplayPrefsContext() {
	return getContext<Writable<DisplayPrefs>>('displayPrefs');
}
export function getDisplayPrefsUser(user: User | null) {
	return user?.display_prefs ?? defaultDisplayPrefs;
}

type ReleaseTitle = {
	title: string;
	romaji?: Nullish<string>;
};
type Name = {
	name: string;
	romaji?: Nullish<string>;
};
export type NameDisplay = ReleaseTitle | Name;
export function getNameDisplay(params: { obj: NameDisplay; prefs: DisplayPrefs['names'] }): string {
	let name;
	if ('name' in params.obj) {
		name = params.obj.name;
	} else {
		name = params.obj.title;
	}
	if (params.prefs === 'romaji') {
		return params.obj.romaji || name;
	} else if (params.prefs === 'native') {
		return name;
	}
	return '';
}
export function getNameDisplaySub(params: {
	obj: NameDisplay;
	prefs: DisplayPrefs['names'];
}): string {
	let name;
	if ('name' in params.obj) {
		name = params.obj.name;
	} else {
		name = params.obj.title;
	}
	if (getNameDisplay(params) === name) {
		return '';
	}
	if (params.prefs === 'romaji') {
		return name;
	} else if (params.prefs === 'native') {
		return params.obj.romaji ?? '';
	}
	return '';
}

export type TitleDisplay = {
	title: string;
	title_orig?: string | null;
	romaji: string | null;
	romaji_orig?: string | null;
	lang: Language;
};
export type TitleDisplayFull = {
	title: string;
	title_orig: string | null;
	romaji: string | null;
	romaji_orig: string | null;
	lang: Language;
};
export function getTitleDisplay(params: {
	obj: TitleDisplay;
	prefs: DisplayPrefs['title_prefs'];
}): string {
	const langPref = params.prefs.find((v) => v.lang === params.obj.lang);
	if (!langPref) {
		return params.obj.title;
	}
	if (langPref.romaji) {
		return params.obj.romaji || params.obj.title;
	} else {
		return params.obj.title;
	}
}
export function getTitleDisplaySub(params: {
	obj: TitleDisplayFull;
	prefs: DisplayPrefs['title_prefs'];
}): string {
	const mainTitle = getTitleDisplay(params);
	if (params.obj.title_orig === mainTitle) {
		return params.obj.romaji_orig || '';
	}
	return params.obj.title_orig || '';
}
