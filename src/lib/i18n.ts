import { browser } from '$app/environment';
import { baseLocale, getLocale, locales, setLocale, type Locale } from '$lib/paraglide/runtime.js';
import { writable } from 'svelte/store';

const localeStore = writable<Locale>(baseLocale);

let initialized = false;

const syncDocumentLanguage = (locale: Locale) => {
	if (!browser) {
		return;
	}

	document.documentElement.lang = locale;
};

export const currentLocale = {
	subscribe: localeStore.subscribe
};

export const availableLocales = locales;

export const initI18n = () => {
	if (!browser || initialized) {
		return;
	}

	initialized = true;
	const locale = getLocale();
	localeStore.set(locale);
	syncDocumentLanguage(locale);
};

export const setAppLocale = (locale: Locale) => {
	setLocale(locale);
	localeStore.set(locale);
	syncDocumentLanguage(locale);
};
