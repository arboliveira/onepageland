import { Customary, CustomaryElement } from "#customary";
import { OnePageLandElement } from "#onepageland/one-page-land/one-page-land.js";
import { OnePageOptionsElement } from "#onepageland/one-page-options/one-page-options.js";
/**
 * The Home Page is where access to the Options Screen lives.
 * Other pages can render `one-page-land` without offering the Options Screen.
 *
 * Being alone in a web page, this is the element that knows what its `window` is:
 * it reads the URL, it hands the params to the `one-page-land` it renders,
 * and it puts on `document.title` whatever title that one announces.
 */
export class HomePageElement extends CustomaryElement {
    static customary = {
        name: 'home-page',
        config: {
            attributes: ['options_in_window_always'],
            state: ['params_string', 'options_placement', 'options_inlined_visible'],
            construct: {
                shadowRootDont: true,
            },
        },
        hooks: {
            requires: [OnePageLandElement, OnePageOptionsElement],
            externalLoader: { import_meta: import.meta, css_dont: true },
            lifecycle: {
                connected: el => el.on_connected(),
                disconnected: el => el.on_disconnected(),
            },
            derive: {
                'options_inlined_visible_bool': (el) => el.options_inlined_visible === 'true',
            },
            events: [
                {
                    /* One Page Land derived the title; being the page, we put it on the window */
                    selector: 'one-page-land',
                    type: 'title_changed',
                    listener: (el, event) => document.title = event.detail.title,
                },
                {
                    selector: 'one-page-land',
                    type: 'page_clicked',
                    listener: (el) => {
                        const page = el;
                        if (page.options_inlined_visible === 'true') {
                            page.options_inlined_visible = 'false';
                        }
                        else {
                            page.openOptions();
                        }
                    },
                },
                {
                    selector: 'one-page-options',
                    type: 'close_me_please',
                    listener: (el) => el.options_inlined_visible = 'false',
                },
                {
                    selector: 'one-page-options',
                    type: 'move_to_window',
                    listener: (el) => {
                        const page = el;
                        page.options_placement = 'window';
                        page.options_inlined_visible = 'false';
                        page.openOptionsWindow();
                    },
                },
            ],
        }
    };
    on_connected() {
        this.params_string = window.location.search;
        /* the URL is the source of truth: re-read it whenever someone rewrites it */
        window.addEventListener('url_changed', this._onUrlChangedEventListener = () => this.params_string = window.location.search);
        this.options_placement = this.options_in_window_always === 'true' ? 'window' : 'inline';
        if (this.isVanillaUrl()) {
            this.openOptions();
        }
        document.addEventListener('keydown', this._onKeydownEventListener = (e) => {
            if (e.key === 'Enter')
                this.openOptions();
        });
        /* the Options Screen, from its own window, asking to come back inline */
        window.addEventListener('move_inline', this._onMoveInlineEventListener = () => this.pullOptionsDialogBackInline());
    }
    isVanillaUrl() {
        const params = new URLSearchParams(this.params_string);
        const known = ['title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor', 'size'];
        if (known.some(key => params.has(key)))
            return false;
        for (const key of params.keys()) {
            if (/^size_\d+$/.test(key))
                return false;
        }
        return true;
    }
    on_disconnected() {
        if (this._onKeydownEventListener)
            document.removeEventListener('keydown', this._onKeydownEventListener);
        if (this._onMoveInlineEventListener)
            window.removeEventListener('move_inline', this._onMoveInlineEventListener);
        if (this._onUrlChangedEventListener)
            window.removeEventListener('url_changed', this._onUrlChangedEventListener);
    }
    openOptions() {
        if (this.options_placement === 'window') {
            this.openOptionsWindow();
        }
        else {
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
}
Customary.declare(HomePageElement);
//# sourceMappingURL=home-page.js.map