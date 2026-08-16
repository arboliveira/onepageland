import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";
import {OnePageLandElement} from "#onepageland/one-page-land/one-page-land.js";
import {GalleryExamples} from "#onepageland/gallery/gallery-examples.js";

type Events = CustomaryHooks<GalleryPageElement>['events'];

/**
 * The Gallery renders a curated set of One Page Land examples as live previews.
 *
 * The curation itself is not here: it is `gallery-examples.txt`, next door, read
 * at startup. Curating the Gallery is editing that file, not this one.
 *
 * These are not thumbnails or iframes: each preview is a real `one-page-land`
 * fed its own `params_string`, rendered by the very engine full pages use.
 * Being alone in its page, the gallery is the element that knows its `window`:
 * it measures the viewport so each full-viewport render can be scaled down to
 * fit its little framed screen.
 */
export class GalleryPageElement extends CustomaryElement {

	/*
	state
	 */
	declare previews: Array<{display: string; params: string; href: string; title: string}>;
	declare miniature: boolean;

	/*
	computed pre-rendering
	 */
	declare grid_mode_class: string;

	/*
	behavior
	 */
	declare _onResize: (() => void) | undefined;
	declare _headerResizes: ResizeObserver | undefined;

	static readonly customary: CustomaryDeclaration<GalleryPageElement> = {
		name: 'gallery-page',
		config: {
			state: ['previews', 'miniature'],
			construct: {
				shadowRootDont: false,
			},
			define: {
				fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
			},
		},
		hooks: {
			requires: [OnePageLandElement],
			externalLoader: {import_meta: import.meta},
			lifecycle: {
				connected: el => el.on_connected(),
				disconnected: el => el.on_disconnected(),
				firstUpdated: el => el.on_firstUpdated(),
				updated: el => el.on_updated(),
			},
			derive: {
				'grid_mode_class': (el: GalleryPageElement) => el.miniature ? 'miniature' : 'hi-def',
			},
			events: [
				{
					/* One Page Land derived the title; we show it in the mini-screen's title bar */
					selector: 'one-page-land',
					type: 'title_changed',
					listener: (el, event) => {
						const gallery = el as GalleryPageElement;
						/* the event is composed: reach past retargeting for the instance that fired */
						const land = event.composedPath().find(
							n => (n as HTMLElement).tagName === 'ONE-PAGE-LAND') as HTMLElement | undefined;
						const idx = parseInt(land?.dataset.idx ?? '', 10);
						if (!isFinite(idx)) return;
						const title = (event as CustomEvent).detail.title as string;
						const entry = gallery.previews[idx];
						if (!entry || entry.title === title) return;
						gallery.previews = gallery.previews.map(
							(p, i) => i === idx ? {...p, title} : p);
					},
				},
				{
					selector: '.view-mode-btn',
					type: 'click',
					listener: (el) => {
						const gallery = el as GalleryPageElement;
						gallery.miniature = !gallery.miniature;
					},
				},
			] as Events,
		}
	}

	on_connected() {
		this.miniature = false;
		/* the curation is still in flight: an empty grid renders, previews land later */
		this.previews = [];
		this.load_previews();

		/* a vertical-only resize changes the viewport aspect without resizing any screen */
		window.addEventListener('resize', this._onResize = () => this.rescale());
	}

	/**
	 * `connected` returns void, so this runs unawaited: the previews arrive after
	 * the first render, and assigning the state property renders the grid again.
	 * A failure to read the file is left to reject and reach the console — an
	 * empty Gallery is indistinguishable from a deliberately empty one.
	 */
	async load_previews() {
		const examples = await GalleryExamples.load();
		this.previews = examples.map(frag => {
			const query = frag.replace(/^&/, '');
			return {
				display: frag,           /* shown as written: every param carries its `&`, the first included */
				params: '?' + query,     /* what the live preview instance renders from */
				href: '../?' + query,    /* the full page, one directory up from us */
				title: '',               /* filled in by each instance's `title_changed` */
			};
		});
	}

	/**
	 * The header stands between the top of the page and the first preview, so its
	 * height decides how much room is left. It settles late — the web font lands
	 * after the first render — and a stale measurement leaves the preview too tall.
	 */
	on_firstUpdated() {
		const header = this.shadowRoot?.querySelector('#gallery-header');
		if (!header) return;
		this._headerResizes = new ResizeObserver(() => this.rescale());
		this._headerResizes.observe(header);
	}

	on_disconnected() {
		if (this._onResize) window.removeEventListener('resize', this._onResize);
		this._headerResizes?.disconnect();
	}

	/* the layout has settled: fit every full-viewport render into its little screen */
	on_updated() {
		requestAnimationFrame(() => this.rescale());
	}

	/**
	 * Each `one-page-land` paints at full viewport scale (`100dvh`, font in `dvw`),
	 * so a preview is that render shrunk to its framed screen. All screens share a
	 * width per view mode, so one measurement drives them all, as CSS custom
	 * properties inherited into every preview.
	 */
	rescale() {
		const root = this.shadowRoot;
		const grid = root?.querySelector('#grid');
		const preview = root?.querySelector('.preview');
		const screen = root?.querySelector('.viewport');
		if (!grid || !preview || !screen) return;

		const aspect = window.innerWidth / window.innerHeight;
		this.style.setProperty('--viewport-aspect', String(aspect));

		/*
		A screen as tall as the viewport leaves no room for the header above it,
		nor for its own title bar and green button: in Hi-Def the first preview
		would run past the fold. Cap the width so the whole preview fits instead.
		*/
		const screen_height = screen.getBoundingClientRect().height;
		/* title bar, button and borders: whatever the preview is besides its screen */
		const trimmings = preview.getBoundingClientRect().height - screen_height;
		const grid_top = grid.getBoundingClientRect().top + window.scrollY;
		const room = window.innerHeight - grid_top - trimmings - BREATHING_ROOM;
		this.style.setProperty('--preview-max-width',
			`${Math.max(room * aspect, MIN_PREVIEW_WIDTH)}px`);

		/* the cap just landed: measure the width the screen actually got */
		const width = screen.getBoundingClientRect().width;
		if (!width) return;
		this.style.setProperty('--preview-scale', String(width / window.innerWidth));
	}
}

/* a sliver of the next preview, hinting there is more to scroll to */
const BREATHING_ROOM = 12;

/* however cramped the window gets, a preview stays a preview */
const MIN_PREVIEW_WIDTH = 240;

Customary.declare(GalleryPageElement);
