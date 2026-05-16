import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {OnePageOptionsElement, OnePageOptionsOwnerCallback} from "#onepageland/one-page-options/one-page-options.js";
import {DEFAULT_TITLE, DEFAULT_EVERY} from "#onepageland/defaults/defaults.js";

type Events = CustomaryHooks<OnePageLandElement>['events'];

export class OnePageLandElement extends CustomaryElement implements OnePageOptionsOwnerCallback {

	/*
	attributes: from URL params
	(undefined to suppress attribute in browser inspector when param absent, for cleaner debugging)
	 */
	declare text?: string;
	declare theme?: string;
	declare random?: string;
	declare every?: string;
	declare divider?: string;
	declare fgcolor?: string;
	declare bgcolor?: string;
	declare size?: string;

	/*
	attributes: HTML only
	 */
	declare options_in_window_always: string;

	/*
	state
	 */
	declare options_placement: string;
	declare options_inlined_visible: string;
	declare randomBg: string;

	/**
	 * computed pre-rendering
	 */
	declare classInfo: Record<string, boolean>;
	declare styleInfo: Record<string, string>;
	declare text_lines: Array<{text: string, style: string}>;

	/**
	 * URL-only: per-line font size overrides, keyed by 1-based line number
	 */
	declare per_line_sizes: Record<number, string>;

	/**
	 * behavior
	 */
	declare _intervalTimeout: ReturnType<typeof setInterval> | undefined;
	declare _onKeydownEventListener: ((e: KeyboardEvent) => void) | undefined;

	static readonly customary: CustomaryDeclaration<OnePageLandElement> = {
		name: 'one-page-land',
		config: {
			attributes: ['title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor', 'size', 'options_in_window_always'],
			state: ['randomBg', 'options_placement', 'options_inlined_visible', 'per_line_sizes'],
			construct: {
				shadowRootDont: true,
			},
			define: {
				fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
			},
		},
		hooks: {
			requires: [OnePageOptionsElement],
			externalLoader: {import_meta: import.meta},
			lifecycle: {
				connected: el => el.on_connected(),
				disconnected: el => el.on_disconnected(),
				willUpdate: el => el.on_willUpdate(),
			},
			derive: {
				'options_inlined_visible_bool': (el: OnePageLandElement) => el.options_inlined_visible === 'true',
			},
			events: [
				{
					selector: '#hypostasis',
					listener: (el) => {
						const land = el as OnePageLandElement;
						if (land.options_inlined_visible === 'true') {
							land.options_inlined_visible = 'false';
						} else {
							land.openOptions();
						}
					},
				},
				{
					selector: 'one-page-options',
					type: 'close_me_please',
					listener: (el: OnePageLandElement) => el.options_inlined_visible = 'false',
				},
				{
					selector: 'one-page-options',
					type: 'move_to_window',
					listener: (el) => {
						const land = el as OnePageLandElement;
						land.options_placement = 'window';
						land.options_inlined_visible = 'false';
						land.openOptionsWindow();
					},
				},
			] as Events,
		}
	}

	on_connected() {
		this.syncFromUrl();
		this.options_placement = this.options_in_window_always === 'true' ? 'window' : 'inline';

		if (this.isVanillaUrl()) {
			this.openOptions();
		}

		document.addEventListener('keydown', this._onKeydownEventListener = (e: KeyboardEvent) => {
			if (e.key === 'Enter') this.openOptions();
		});

		this.randomizeColors();

		const everyParam = new URLSearchParams(window.location.search).get("every");
		const everyMs = everyParam === "" ? DEFAULT_EVERY : (parseInt(everyParam!) || 0);
		if (everyMs > 0) {
			this._intervalTimeout = setInterval(() => this.randomizeColors(), everyMs);
		}
	}

	syncFromUrl() {
		const params = new URLSearchParams(window.location.search);

		const title: string | null = params.get("title");
		if (title !== null) {
			this.title = title;
		} else {
			this.removeAttribute('title');
		}
		this.text = params.get("text") ?? undefined;
		this.theme = params.get("theme") ?? undefined;
		this.random = params.get("random") ?? undefined;
		this.every = params.get("every") ?? undefined;
		this.divider = params.get("divider") ?? undefined;
		this.fgcolor = params.get("fgcolor") ?? undefined;
		this.bgcolor = params.get("bgcolor") ?? undefined;
		this.size = params.get("size") ?? undefined;

		const perLine: Record<number, string> = {};
		for (const [key, value] of params) {
			const match = key.match(/^size_(\d+)$/);
			if (!match || !value) continue;
			const n = parseFloat(value);
			if (isFinite(n) && n > 0) perLine[parseInt(match[1], 10)] = `${n}dvw`;
		}
		this.per_line_sizes = perLine;
	}

	on_disconnected() {
		if (this._intervalTimeout) clearInterval(this._intervalTimeout);
		if (this._onKeydownEventListener) document.removeEventListener('keydown', this._onKeydownEventListener);
	}

	on_willUpdate() {
		const divider_requested = this.divider && this.divider !== '0';
		const divider_title =
			divider_requested
				? (this.title || '').padEnd(40, '-')
				: null;

		document.title = divider_title || this.title || DEFAULT_TITLE;

		this.classInfo = {
			"dark": this.theme === "dark",
			"light": this.theme === "light",
		};

		const sizeNum = parseFloat(this.size ?? '');
		const sizeCss = isFinite(sizeNum) && sizeNum > 0 ? `${sizeNum}dvw` : '';

		this.styleInfo = {
			"background-color": this.bgcolor || this.randomBg,
			...(this.fgcolor ? {"color": this.fgcolor} : {}),
			...(sizeCss ? {"--page-text-font-size": sizeCss} : {}),
		};

		const lines = (this.text ?? '').split('\n');
		const perLine = this.per_line_sizes ?? {};
		this.text_lines = lines.map((lineText, i) => {
			const override = perLine[i + 1];
			return {
				text: lineText,
				style: override ? `font-size: ${override}` : '',
			};
		});
	}

	openOptions() {
		if (this.options_placement === 'window') {
			this.openOptionsWindow();
		} else {
			this.options_inlined_visible = 'true';
		}
	}

	pullOptionsDialogBackInline() {
		this.options_placement = 'inline';
		this.options_inlined_visible = 'true';
	}

	openOptionsWindow() {
		window.open('one-page-options/index.html' + window.location.search, 'one-page-options', 'popup,width=640,height=540');
	}

	randomizeColors() {
		if (!this.isRandomEnabled()) return;
		this.randomBg = randomColor();
	}

	isRandomEnabled() {
		return this.random && (this.random !== '0');
	}

	isVanillaUrl() {
		const params = new URLSearchParams(window.location.search);
		const known = ['title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor', 'size'];
		if (known.some(key => params.has(key))) return false;
		for (const key of params.keys()) {
			if (/^size_\d+$/.test(key)) return false;
		}
		return true;
	}
}

function randomColor() {
	return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

Customary.declare(OnePageLandElement);
