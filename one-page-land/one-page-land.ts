import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {OnePageOptionsElement} from "#onepageland/one-page-options/one-page-options.js";
import {DEFAULT_TITLE, DEFAULT_EVERY} from "#onepageland/defaults/defaults.js";

type Events = CustomaryHooks<OnePageLandElement>['events'];

export class OnePageLandElement extends CustomaryElement {

	declare title: string;
	declare text: string;
	declare theme: string;
	declare random: string;
	declare every: string;
	declare divider: string;
	declare fgcolor: string;
	declare bgcolor: string;
	declare options_in_window_always: string;
	declare options_inlined_visible: string;
	declare options_placement: string;
	declare randomBg: string;
	declare classInfo: Record<string, boolean>;
	declare styleInfo: Record<string, string>;

	declare _interval: ReturnType<typeof setInterval> | undefined;
	declare _onKeydown: ((e: KeyboardEvent) => void) | undefined;

	static readonly customary: CustomaryDeclaration<OnePageLandElement> = {
		name: 'one-page-land',
		config: {
			attributes: ['title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor', 'options_in_window_always', 'options_inlined_visible'],
			state: ['randomBg', 'options_placement'],
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
					selector: '#moody',
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
					listener: (el) => {
						(el as OnePageLandElement).options_inlined_visible = 'false';
					},
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

		document.addEventListener('keydown', this._onKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') this.openOptions();
		});

		this.randomizeColors();

		const everyParam = new URLSearchParams(window.location.search).get("every");
		const everyMs = everyParam === "" ? DEFAULT_EVERY : (parseInt(everyParam!) || 0);
		if (everyMs > 0) {
			this._interval = setInterval(() => this.randomizeColors(), everyMs);
		}
	}

	syncFromUrl() {
		const params = new URLSearchParams(window.location.search);
		this.title = params.get("title") ?? '';
		this.text = params.get("text") ?? '';
		this.theme = params.get("theme") ?? '';
		this.random = params.get("random") ?? '';
		this.every = params.get("every") ?? '';
		this.divider = params.get("divider") ?? '';
		this.fgcolor = params.get("fgcolor") ?? '';
		this.bgcolor = params.get("bgcolor") ?? '';
	}

	on_disconnected() {
		if (this._interval) clearInterval(this._interval);
		if (this._onKeydown) document.removeEventListener('keydown', this._onKeydown);
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

		this.styleInfo = {
			"background-color": this.bgcolor || this.randomBg,
			...(this.fgcolor ? {"color": this.fgcolor} : {}),
		};
	}

	openOptions() {
		if (this.options_placement === 'window') {
			this.openOptionsWindow();
		} else {
			this.options_inlined_visible = 'true';
		}
	}

	moveInline() {
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
		return !['title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor'].some(key => params.has(key));
	}
}

function randomColor() {
	return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

Customary.declare(OnePageLandElement);
