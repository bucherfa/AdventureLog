import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { getRandomBackground, getRandomQuote } from '$lib';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	let is_disabled_fetch = await event.fetch(`${serverEndpoint}/auth/is-registration-disabled/`);
	let is_disabled_json = await is_disabled_fetch.json();
	let is_disabled = is_disabled_json.is_disabled;
	const quote = getRandomQuote();
	const background = getRandomBackground();

	return {
		props: {
			is_disabled: is_disabled,
			is_disabled_message: is_disabled_json.message,
			quote,
			background
		}
	};
};
export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const formUsername = formData.get('username');
		const password1 = formData.get('password1');
		const password2 = formData.get('password2');
		const email = formData.get('email');
		const first_name = formData.get('first_name');
		const last_name = formData.get('last_name');

		let username = formUsername?.toString().toLocaleLowerCase();

		const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';
		const csrfTokenFetch = await event.fetch(`${serverEndpoint}/csrf/`);

		if (!csrfTokenFetch.ok) {
			event.locals.user = null;
			return fail(500, { message: 'Failed to fetch CSRF token' });
		}

		if (password1 !== password2) {
			return fail(400, { message: 'Passwords do not match' });
		}

		const tokenPromise = await csrfTokenFetch.json();
		const csrfToken = tokenPromise.csrfToken;

		const loginFetch = await event.fetch(`${serverEndpoint}/_allauth/browser/v1/auth/signup`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': csrfToken,
				'Content-Type': 'application/json',
				Cookie: `csrftoken=${csrfToken}`
			},
			body: JSON.stringify({
				username: username,
				password: password1,
				email: email,
				first_name,
				last_name
			})
		});
		const loginResponse = await loginFetch.json();

		if (!loginFetch.ok) {
			return fail(loginFetch.status, loginResponse);
		} else {
			const setCookieHeader = loginFetch.headers.get('Set-Cookie');

			console.log('setCookieHeader:', setCookieHeader);

			if (setCookieHeader) {
				// Regular expression to match sessionid cookie and its expiry
				const sessionIdRegex = /sessionid=([^;]+).*?expires=([^;]+)/;
				const match = setCookieHeader.match(sessionIdRegex);

				if (match) {
					const sessionId = match[1];
					const expiryString = match[2];
					const expiryDate = new Date(expiryString);

					console.log('Session ID:', sessionId);
					console.log('Expiry Date:', expiryDate);

					// Set the sessionid cookie
					event.cookies.set('sessionid', sessionId, {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: true,
						expires: expiryDate
					});
				}
			}
			redirect(302, '/');
		}
	}
};
