import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {DEFAULT_EVERY, DEFAULT_SIZE, DEFAULT_TITLE} from "#onepageland/defaults/defaults.js";
import {OnePageLineSizeElement} from "#onepageland/one-page-line-size/one-page-line-size.js";

type Events = CustomaryHooks<OnePageOptionsElement>['events'];

export interface OnePageOptionsOwnerCallback {
	pullOptionsDialogBackInline(): void;
}

export class OnePageOptionsElement extends CustomaryElement {

	declare opt_title: string;
	declare opt_text: string;
	declare opt_theme: string;
	declare opt_fgcolor: string;
	declare opt_bgcolor: string;
	declare opt_random: string;
	declare opt_every: string;
	declare opt_divider: string;
	declare opt_size: string;
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
	declare param_size: string;
	declare param_size_classes: Record<string, boolean>;
	declare per_line_size_entries: Array<{n: number; value: string}>;
	declare per_line_section_visible: boolean;
	declare default_title: string;
	declare default_every: string;
	declare default_size: string;

	declare _onKeydown: ((e: KeyboardEvent) => void) | undefined;

	static readonly customary: CustomaryDeclaration<OnePageOptionsElement> = {
		name: 'one-page-options',
		config: {
			attributes: ['opt_title', 'opt_text', 'opt_theme', 'opt_fgcolor', 'opt_bgcolor', 'opt_random', 'opt_every', 'opt_divider', 'opt_size', 'live_editing_dont'],
			state: ['param_title', 'param_text', 'param_theme', 'param_fgcolor', 'param_fgcolor_classes', 'param_bgcolor', 'param_bgcolor_classes', 'param_random', 'param_every', 'param_divider', 'param_size', 'param_title_classes', 'param_text_classes', 'param_theme_classes', 'param_random_classes', 'param_every_classes', 'param_divider_classes', 'param_size_classes', 'per_line_size_entries', 'default_title', 'default_every', 'default_size'],
			construct: {
				shadowRootDont: true,
			},
			define: {
				fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
			},
		},
		hooks: {
			requires: [OnePageLineSizeElement],
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
					selector: '#input-size',
					type: 'dblclick',
					listener: (el) => (el as OnePageOptionsElement).defaultize_opt_size(),
				},
				{
					selector: '#input-size',
					type: 'keydown',
					listener: (el, event) => { if (is_Alt_Insert(event)) (el as OnePageOptionsElement).defaultize_opt_size(); },
				},
				{
					selector: '.add-line-size-btn',
					type: 'click',
					listener: (el) => {
						const opts = el as OnePageOptionsElement;
						const used = new Set(opts.per_line_size_entries.map(e => e.n));
						let next = 1;
						while (used.has(next)) next++;
						opts.per_line_size_entries = [...opts.per_line_size_entries, {n: next, value: ''}];
					},
				},
				{
					selector: 'one-page-line-size',
					type: 'line_size_change',
					listener: (el, event) => {
						const opts = el as OnePageOptionsElement;
						const {idx, n, value} = (event as CustomEvent).detail as {idx: number; n: string; value: string};
						if (!isFinite(idx)) return;
						const parsed = parseInt(n, 10);
						const clean_n = isFinite(parsed) && parsed > 0 ? parsed : 0;
						const entry = opts.per_line_size_entries[idx];
						if (!entry) return;
						if (entry.n === clean_n && entry.value === value) return;
						opts.per_line_size_entries = opts.per_line_size_entries.map((e, i) =>
							i === idx ? {n: clean_n, value} : e);
					},
				},
				{
					selector: 'one-page-line-size',
					type: 'line_size_remove',
					listener: (el, event) => {
						const opts = el as OnePageOptionsElement;
						const {idx} = (event as CustomEvent).detail as {idx: number};
						if (!isFinite(idx)) return;
						opts.per_line_size_entries = opts.per_line_size_entries.filter((_, i) => i !== idx);
					},
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
						const elOnePageLand =
							(window.opener as Window).document
								.querySelector('one-page-land') as unknown as OnePageOptionsOwnerCallback;
						elOnePageLand?.pullOptionsDialogBackInline();
						window.close();
					},
				},
			] as Events,
		}
	}

	on_connected() {
		this.default_title = DEFAULT_TITLE;
		this.default_every = String(DEFAULT_EVERY);
		this.default_size = String(DEFAULT_SIZE);

		const params = new URLSearchParams(window.location.search);
		this.opt_title = params.get("title") ?? '';
		this.opt_text = params.get("text") ?? '';
		this.opt_theme = params.get("theme") ?? '';
		this.opt_fgcolor = params.get("fgcolor") ?? '';
		this.opt_bgcolor = params.get("bgcolor") ?? '';
		this.opt_random = params.get("random") ? 'true' : 'false';
		this.opt_every = params.get("every") ?? '';
		this.opt_divider = params.get("divider") ? 'true' : 'false';
		this.opt_size = params.get("size") ?? '';

		const entries: Array<{n: number; value: string}> = [];
		for (const [key, value] of params) {
			const m = key.match(/^size_(\d+)$/);
			if (m && value) entries.push({n: parseInt(m[1], 10), value});
		}
		entries.sort((a, b) => a.n - b.n);
		this.per_line_size_entries = entries;

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
			size:    this.opt_size || null,
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
		this.param_size         = paramStr('size',     resolved.size);
		this.param_size_classes = paramCls(resolved.size);

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

		for (const key of Array.from(newParams.keys())) {
			if (/^size_\d+$/.test(key)) newParams.delete(key);
		}
		for (const entry of this.per_line_size_entries ?? []) {
			const num = parseFloat(entry.value);
			const valid = entry.n > 0 && isFinite(num) && num > 0;
			if (!valid) continue;
			const key = `size_${entry.n}`;
			const valStr = String(num);
			parts.push(`${key}=${encodeURIComponent(valStr)}`);
			newParams.set(key, valStr);
		}
		const lineCount = (this.opt_text ?? '').split('\n').length;
		this.per_line_section_visible = lineCount >= 2;

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

	defaultize_opt_size() {
		if (!this.opt_size) this.opt_size = String(DEFAULT_SIZE);
	}

	dismiss() {
		this.dispatchEvent(new CustomEvent('close_me_please', {bubbles: true, composed: true}));
	}
}

function is_Alt_Insert(event: Event) {
	return (event as KeyboardEvent).altKey && (event as KeyboardEvent).key === 'Insert';
}

Customary.declare(OnePageOptionsElement);
