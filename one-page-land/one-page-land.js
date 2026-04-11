import { Customary, CustomaryElement } from "#customary";
import { OnePageOptionsElement } from "#onepageland/one-page-options/one-page-options.js";
import { DEFAULT_TITLE, DEFAULT_EVERY } from "#onepageland/defaults/defaults.js";
export class OnePageLandElement extends CustomaryElement {
    static customary = {
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
            externalLoader: { import_meta: import.meta },
            lifecycle: {
                connected: el => el.on_connected(),
                disconnected: el => el.on_disconnected(),
                willUpdate: el => el.on_willUpdate(),
            },
            derive: {
                'options_inlined_visible_bool': (el) => el.options_inlined_visible === 'true',
            },
            events: [
                {
                    selector: '#moody',
                    listener: (el) => {
                        const land = el;
                        if (land.options_inlined_visible === 'true') {
                            land.options_inlined_visible = 'false';
                        }
                        else {
                            land.openOptions();
                        }
                    },
                },
                {
                    selector: 'one-page-options',
                    type: 'close_me_please',
                    listener: (el) => {
                        el.options_inlined_visible = 'false';
                    },
                },
                {
                    selector: 'one-page-options',
                    type: 'move_to_window',
                    listener: (el) => {
                        const land = el;
                        land.options_placement = 'window';
                        land.options_inlined_visible = 'false';
                        land.openOptionsWindow();
                    },
                },
            ],
        }
    };
    on_connected() {
        this.syncFromUrl();
        this.options_placement = this.options_in_window_always === 'true' ? 'window' : 'inline';
        if (this.isVanillaUrl()) {
            this.openOptions();
        }
        document.addEventListener('keydown', this._onKeydown = (e) => {
            if (e.key === 'Enter')
                this.openOptions();
        });
        this.randomizeColors();
        const everyParam = new URLSearchParams(window.location.search).get("every");
        const everyMs = everyParam === "" ? DEFAULT_EVERY : (parseInt(everyParam) || 0);
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
        if (this._interval)
            clearInterval(this._interval);
        if (this._onKeydown)
            document.removeEventListener('keydown', this._onKeydown);
    }
    on_willUpdate() {
        const baseTitle = this.title || DEFAULT_TITLE;
        document.title = (this.divider && this.divider !== '0')
            ? baseTitle.padEnd(40, '-')
            : baseTitle;
        this.classInfo = {
            "dark": this.theme === "dark",
            "light": this.theme === "light",
        };
        this.styleInfo = {
            "background-color": this.bgcolor || this.randomBg,
            ...(this.fgcolor ? { "color": this.fgcolor } : {}),
        };
    }
    openOptions() {
        if (this.options_placement === 'window') {
            this.openOptionsWindow();
        }
        else {
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
        if (!this.isRandomEnabled())
            return;
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
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
Customary.declare(OnePageLandElement);
//# sourceMappingURL=one-page-land.js.map