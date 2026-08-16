import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {OnePageOptionsFormElement} from "#onepageland/one-page-options/one-page-options-form.js";
import {OnePageOptionsResolved} from "#onepageland/one-page-options/one-page-options-resolve.js";

type Events = CustomaryHooks<OnePageOptionsElement>['events'];

export class OnePageOptionsElement extends CustomaryElement {

	/**
	 * attribute: `'true'` when we are the whole of a popped-out window, absent inline.
	 *
	 * Only the page that renders us knows which it is, so it tells us instead of us
	 * probing `window.opener` for the answer. Being an attribute, it is also visible in
	 * the Inspector, and a test can set it without a popup.
	 */
	declare is_in_window: string;

	/**
	 * attribute: the query string we were born under, frozen at connect time.
	 *
	 * We pass it down to the form, which parses its own `opt_*` out of it — the same
	 * courtesy `is_in_window` extends: hand the child a fact instead of letting it
	 * probe a global.
	 */
	declare window_location_search_at_time_of_connected: string;

	/**
	 * state: the form's values, already resolved into params — the one shape the URL
	 * is built from. Arrives whole with every `options_updated` the form announces;
	 * absent until the first announcement. The raw `opt_*` live in the form and never
	 * come up here.
	 */
	declare options_changed_resolved: OnePageOptionsResolved;

	declare live_editing_dont: string;
	declare params_preview: string;
	declare params_url: string;
	declare per_line_entries: Array<{n: number; size: string; fgcolor: string; classes: string}>;

	declare _onKeydown: ((e: KeyboardEvent) => void) | undefined;

	static readonly customary: CustomaryDeclaration<OnePageOptionsElement> = {
		name: 'one-page-options',
		config: {
			attributes: ['is_in_window', 'window_location_search_at_time_of_connected', 'live_editing_dont'],
			state: ['per_line_entries', 'options_changed_resolved'],
			construct: {
				shadowRootDont: false,
			},
			define: {
				fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
			},
		},
		hooks: {
			requires: [OnePageOptionsFormElement],
			externalLoader: {import_meta: import.meta},
			derive: {
				/*
				 * `is_in_window` is a string attribute, and a string is truthy for
				 * `"false"` exactly as much as for `"true"` — so a `<customary:if>` gets
				 * the `_bool` companion to test, never the raw attribute.
				 */
				'is_inline':         (el: OnePageOptionsElement) => el.is_in_window !== 'true',
				'is_in_window_bool': (el: OnePageOptionsElement) => el.is_in_window === 'true',
			},
			lifecycle: {
				connected: el => el.on_connected(),
				disconnected: el => el.on_disconnected(),
				willUpdate: el => el.on_willUpdate(),
			},
			events: [
				{
					selector: '#options-backdrop',
					/*
					 * Dismiss only when the backdrop itself was hit, never when the click
					 * landed on the panel it wraps.
					 *
					 * Ask the delegation `target`, not `event.target`: we now have a shadow
					 * root, and the delegated listener sits on the host, outside it, so
					 * `event.target` is retargeted to `<one-page-options>` and its id is ''.
					 * `target` is `composedPath()[0]`, which retargeting never touches.
					 */
					listener: (el, _event, target) => el.on_backdrop_click(target),
				},
				{
					/*
					 * Not the DOM `submit`: that one is non-composed, so it never crosses
					 * our shadow root. The form's own element hears it natively — nothing
					 * stands between them — and re-announces it as this composed event.
					 */
					selector: 'one-page-options-form',
					type: 'options_form_submit',
					listener: el => el.on_options_form_submit(),
				},
				{
					selector: 'one-page-options-form',
					type: 'options_updated',
					listener: (el, event) => el.on_options_updated(event),
				},
				{
					selector: '#preview-btn',
					type: 'click',
					listener: (el, event) => el.on_preview_btn_click(event),
				},
				{
					selector: '.add-line-options-btn',
					type: 'click',
					listener: el => el.on_add_line_options(),
				},
				{
					selector: 'one-page-line-options',
					type: 'line_options_change',
					listener: (el, event) => el.on_line_options_change(event),
				},
				{
					selector: 'one-page-line-options',
					type: 'line_options_remove',
					listener: (el, event) => el.on_line_options_remove(event),
				},
				{
					selector: '#move-to-window-btn',
					type: 'click',
					listener: el => el.on_move_to_window(),
				},
				{
					selector: '#move-inline-btn',
					type: 'click',
					listener: el => el.on_move_inline(),
				},
			] as Events,
		}
	}

	on_connected() {
		this.window_location_search_at_time_of_connected = window.location.search;
		/* the form parses its own `opt_*` out of that, and announces them back resolved */

		const params = new URLSearchParams(window.location.search);
		const byLine = new Map<number, {n: number; size: string; fgcolor: string; classes: string}>();
		for (const [key, value] of params) {
			const m = key.match(/^(size|fgcolor|class)_(\d+)$/);
			if (!m || !value) continue;
			const n = parseInt(m[2], 10);
			const entry = byLine.get(n) ?? {n, size: '', fgcolor: '', classes: ''};
			if (m[1] === 'size') entry.size = value;
			else if (m[1] === 'fgcolor') entry.fgcolor = value;
			else entry.classes = value;
			byLine.set(n, entry);
		}
		this.per_line_entries = [...byLine.values()].sort((a, b) => a.n - b.n);

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
		/* nothing to build a URL from until the form's first announcement */
		const resolved = this.options_changed_resolved;
		if (!resolved) return;

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
			if (/^(size|fgcolor|class)_\d+$/.test(key)) newParams.delete(key);
		}
		for (const entry of this.per_line_entries ?? []) {
			if (!(entry.n > 0)) continue;
			const num = parseFloat(entry.size);
			if (isFinite(num) && num > 0) {
				const key = `size_${entry.n}`;
				const valStr = String(num);
				parts.push(`${key}=${encodeURIComponent(valStr)}`);
				newParams.set(key, valStr);
			}
			const fgcolor = (entry.fgcolor ?? '').trim();
			if (fgcolor) {
				const key = `fgcolor_${entry.n}`;
				parts.push(`${key}=${encodeURIComponent(fgcolor)}`);
				newParams.set(key, fgcolor);
			}
			const classes = (entry.classes ?? '').trim();
			if (classes) {
				const key = `class_${entry.n}`;
				parts.push(`${key}=${encodeURIComponent(classes)}`);
				newParams.set(key, classes);
			}
		}
		this.params_preview = parts.length ? '?' + parts.join('&') : '';
		const query = newParams.toString();
		const targetWindow = (window.opener as Window | null) ?? window;
		this.params_url = targetWindow.location.pathname + (query ? '?' + query : '');

		if (this.live_editing_dont !== 'true') {
			targetWindow.history.replaceState(null, '', this.params_url);
			/* whoever renders from the URL over there gets to notice */
			const target = targetWindow as Window & typeof globalThis;
			target.dispatchEvent(new target.CustomEvent('url_changed'));
		}
	}

	on_backdrop_click(target: EventTarget) {
		if ((target as HTMLElement).id === 'options-backdrop') {
			this.dismiss();
		}
	}

	on_options_form_submit() {
		/* the native submission is already prevented, back where `submit` was heard */
		const target = (window.opener as Window | null) ?? window;
		target.location.href = this.params_url;
		if (window.opener) window.close();
	}

	on_options_updated(event: Event) {
		/*
		 * The form owns its fields; we own the URL they resolve to. Every edit arrives
		 * here already resolved, live editing recomputes the URL from it, and nothing
		 * flows back down — the round trip that used to echo no longer exists.
		 */
		const {options_resolved} = (event as CustomEvent).detail as {options_resolved: OnePageOptionsResolved};
		this.options_changed_resolved = options_resolved;
	}

	on_preview_btn_click(event: Event) {
		if (!window.opener) return;
		event.preventDefault();
		(window.opener as Window).location.href = this.params_url;
		window.close();
	}

	on_add_line_options() {
		const used = new Set(this.per_line_entries.map(e => e.n));
		let next = 1;
		while (used.has(next)) next++;
		this.per_line_entries = [...this.per_line_entries, {n: next, size: '', fgcolor: '', classes: ''}];
	}

	on_line_options_change(event: Event) {
		const {idx, n, size, fgcolor, classes} = (event as CustomEvent).detail as {idx: number; n: string; size: string; fgcolor: string; classes: string};
		if (!isFinite(idx)) return;
		const parsed = parseInt(n, 10);
		const clean_n = isFinite(parsed) && parsed > 0 ? parsed : 0;
		const entry = this.per_line_entries[idx];
		if (!entry) return;
		if (entry.n === clean_n && entry.size === size && entry.fgcolor === fgcolor && entry.classes === classes) return;
		this.per_line_entries = this.per_line_entries.map((e, i) =>
			i === idx ? {n: clean_n, size, fgcolor, classes} : e);
	}

	on_line_options_remove(event: Event) {
		const {idx} = (event as CustomEvent).detail as {idx: number};
		if (!isFinite(idx)) return;
		this.per_line_entries = this.per_line_entries.filter((_, i) => i !== idx);
	}

	on_move_to_window() {
		this.dispatchEvent(new CustomEvent('move_to_window', {bubbles: true, composed: true}));
	}

	on_move_inline() {
		/* the page that opened us decides what going back inline means */
		const opener = window.opener as Window & typeof globalThis;
		opener.dispatchEvent(new opener.CustomEvent('move_inline'));
		window.close();
	}

	dismiss() {
		this.dispatchEvent(new CustomEvent('close_me_please', {bubbles: true, composed: true}));
	}
}

Customary.declare(OnePageOptionsElement);
