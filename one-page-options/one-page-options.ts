import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {DEFAULT_TITLE, DEFAULT_EVERY} from "#onepageland/defaults/defaults.js";

type Events = CustomaryHooks<OnePageOptionsElement>['events'];

export class OnePageOptionsElement extends CustomaryElement {

	declare opt_title: string;
	declare opt_text: string;
	declare opt_theme: string;
	declare opt_fgcolor: string;
	declare opt_bgcolor: string;
	declare opt_random: string;
	declare opt_every: string;
	declare opt_divider: string;
	declare live_editing_dont: string;
	declare params_preview: string;
	declare params_url: string;
	declare param_title: string;
	declare param_text: string;
	declare param_theme: string;
	declare param_random: string;
	declare param_every: string;
	declare param_title_classes: Record<string, boolean>;
	declare param_text_classes: Record<string, boolean>;
	declare param_theme_classes: Record<string, boolean>;
	declare param_fgcolor: string;
	declare param_fgcolor_classes: Record<string, boolean>;
	declare param_bgcolor: string;
	declare param_bgcolor_classes: Record<string, boolean>;
	declare param_random_classes: Record<string, boolean>;
	declare param_every_classes: Record<string, boolean>;
	declare param_divider: string;
	declare param_divider_classes: Record<string, boolean>;
	declare default_title: string;
	declare default_every: string;

	declare _onKeydown: ((e: KeyboardEvent) => void) | undefined;

	static readonly customary: CustomaryDeclaration<OnePageOptionsElement> = {
		name: 'one-page-options',
		config: {
			attributes: ['opt_title', 'opt_text', 'opt_theme', 'opt_fgcolor', 'opt_bgcolor', 'opt_random', 'opt_every', 'opt_divider', 'live_editing_dont'],
			state: ['param_title', 'param_text', 'param_theme', 'param_fgcolor', 'param_fgcolor_classes', 'param_bgcolor', 'param_bgcolor_classes', 'param_random', 'param_every', 'param_divider', 'param_title_classes', 'param_text_classes', 'param_theme_classes', 'param_random_classes', 'param_every_classes', 'param_divider_classes', 'default_title', 'default_every'],
			construct: {
				shadowRootDont: true,
			},
			define: {
				fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
			},
		},
		hooks: {
			externalLoader: {import_meta: import.meta},
			derive: {
				'is_inline':    (_el: OnePageOptionsElement) => !window.opener,
				'is_in_window': (_el: OnePageOptionsElement) => !!window.opener,
			},
			lifecycle: {
				connected: el => el.on_connected(),
				disconnected: el => el.on_disconnected(),
				willUpdate: el => el.on_willUpdate(),
			},
			events: [
				{
					selector: '#options-backdrop',
					listener: (el, event) => {
						if ((event.target as HTMLElement).id === 'options-backdrop') {
							(el as OnePageOptionsElement).dismiss();
						}
					},
				},
				{
					selector: '#options-form',
					type: 'submit',
					listener: (el, event) => {
						event.preventDefault();
						const target = (window.opener as Window | null) ?? window;
						target.location.href = (el as OnePageOptionsElement).params_url;
						if (window.opener) window.close();
					},
				},
				{
					selector: '#preview-btn',
					type: 'click',
					listener: (el, event) => {
						if (!window.opener) return;
						event.preventDefault();
						(window.opener as Window).location.href = (el as OnePageOptionsElement).params_url;
						window.close();
					},
				},
				{
					selector: '#preview-btn',
					type: 'keydown',
					listener: (el, event) => {
						if ((event as KeyboardEvent).key === ' ') {
							event.preventDefault();
							(el.querySelector('#options-form') as HTMLFormElement).requestSubmit();
						}
					},
				},
				{
					selector: '#input-text',
					type: 'keydown',
					listener: (el, event) => {
						if ((event as KeyboardEvent).ctrlKey && (event as KeyboardEvent).key === 'Enter') {
							event.preventDefault();
							(el.querySelector('#options-form') as HTMLFormElement).requestSubmit();
						}
					},
				},
				{
					selector: '#input-title',
					type: 'dblclick',
					listener: (el) => (el as OnePageOptionsElement).defaultize_opt_title(),
				},
				{
					selector: '#input-title',
					type: 'keydown',
					listener: (el, event) => { if (is_Alt_Insert(event)) (el as OnePageOptionsElement).defaultize_opt_title(); },
				},
				{
					selector: '#input-every',
					type: 'dblclick',
					listener: (el) => (el as OnePageOptionsElement).defaultize_opt_every(),
				},
				{
					selector: '#input-every',
					type: 'keydown',
					listener: (el, event) => { if (is_Alt_Insert(event)) (el as OnePageOptionsElement).defaultize_opt_every(); },
				},
				{
					selector: '#move-to-window-btn',
					type: 'click',
					listener: (el) => {
						el.dispatchEvent(new CustomEvent('move_to_window', {bubbles: true, composed: true}));
					},
				},
				{
					selector: '#move-inline-btn',
					type: 'click',
					listener: () => {
						const land = (window.opener as Window).document.querySelector('one-page-land') as HTMLElement & {moveInline: () => void};
						land?.moveInline();
						window.close();
					},
				},
			] as Events,
		}
	}

	on_connected() {
		this.default_title = DEFAULT_TITLE;
		this.default_every = String(DEFAULT_EVERY);

		const params = new URLSearchParams(window.location.search);
		this.opt_title = params.get("title") ?? '';
		this.opt_text = params.get("text") ?? '';
		this.opt_theme = params.get("theme") ?? '';
		this.opt_fgcolor = params.get("fgcolor") ?? '';
		this.opt_bgcolor = params.get("bgcolor") ?? '';
		this.opt_random = params.get("random") ? 'true' : 'false';
		this.opt_every = params.get("every") ?? '';
		this.opt_divider = params.get("divider") ? 'true' : 'false';

		document.addEventListener('keydown', this._onKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') this.dismiss();
		});
	}

	on_disconnected() {
		if (this._onKeydown) {
			document.removeEventListener('keydown', this._onKeydown);
		}
	}

	on_willUpdate() {
		const resolved = {
			title:   this.opt_title || null,
			text:    this.opt_text  || null,
			theme:   this.opt_theme || null,
			fgcolor: this.opt_fgcolor || null,
			bgcolor: this.opt_bgcolor || null,
			random:  this.opt_random === 'true' ? '1' : null,
			every:   this.opt_random && this.opt_every ? this.opt_every : null,
			divider: this.opt_divider === 'true' ? '1' : null,
		};

		const paramStr = (key: string, v: string | null) => `&${key}=${encodeURIComponent(v ?? '')}`;
		const paramCls = (v: string | null) => ({active: v !== null});

		this.param_title        = paramStr('title',  resolved.title);
		this.param_title_classes  = paramCls(resolved.title);
		this.param_text         = paramStr('text',   resolved.text);
		this.param_text_classes   = paramCls(resolved.text);
		this.param_theme        = paramStr('theme',   resolved.theme);
		this.param_theme_classes  = paramCls(resolved.theme);
		this.param_fgcolor      = paramStr('fgcolor', resolved.fgcolor);
		this.param_fgcolor_classes = paramCls(resolved.fgcolor);
		this.param_bgcolor      = paramStr('bgcolor', resolved.bgcolor);
		this.param_bgcolor_classes = paramCls(resolved.bgcolor);
		this.param_random       = paramStr('random',   resolved.random);
		this.param_random_classes = paramCls(resolved.random);
		this.param_every        = paramStr('every',    resolved.every);
		this.param_every_classes  = paramCls(resolved.every);
		this.param_divider      = paramStr('divider',  resolved.divider);
		this.param_divider_classes = paramCls(resolved.divider);

		const parts: string[] = [];
		const newParams = new URLSearchParams(window.location.search);
		for (const [key, value] of Object.entries(resolved)) {
			if (value !== null) {
				parts.push(`${key}=${encodeURIComponent(value)}`);
				newParams.set(key, value);
			} else {
				newParams.delete(key);
			}
		}
		this.params_preview = parts.length ? '?' + parts.join('&') : '';
		const query = newParams.toString();
		const targetWindow = (window.opener as Window | null) ?? window;
		this.params_url = targetWindow.location.pathname + (query ? '?' + query : '');

		if (this.live_editing_dont !== 'true') {
			targetWindow.history.replaceState(null, '', this.params_url);
			const land = targetWindow.document.querySelector('one-page-land') as (HTMLElement & {syncFromUrl: () => void}) | null;
			land?.syncFromUrl();
		}
	}

	defaultize_opt_title() {
		if (!this.opt_title) this.opt_title = DEFAULT_TITLE;
	}

	defaultize_opt_every() {
		if (!this.opt_every) this.opt_every = String(DEFAULT_EVERY);
	}

	dismiss() {
		this.dispatchEvent(new CustomEvent('close_me_please', {bubbles: true, composed: true}));
	}
}

function is_Alt_Insert(event: Event) {
	return (event as KeyboardEvent).altKey && (event as KeyboardEvent).key === 'Insert';
}

Customary.declare(OnePageOptionsElement);
