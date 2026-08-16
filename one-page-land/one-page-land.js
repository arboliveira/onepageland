import { Customary, CustomaryElement } from "#customary";
import { DEFAULT_TITLE, DEFAULT_EVERY } from "#onepageland/defaults/defaults.js";
export class OnePageLandElement extends CustomaryElement {
    static customary = {
        name: 'one-page-land',
        config: {
            attributes: ['params_string', 'title', 'text', 'theme', 'random', 'every', 'divider', 'fgcolor', 'bgcolor', 'size', 'page_style', 'line_class'],
            state: ['randomBg', 'per_line_overrides'],
            construct: {
                shadowRootDont: false,
            },
            define: {
                fontLocation: 'https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap'
            },
        },
        hooks: {
            externalLoader: { import_meta: import.meta },
            lifecycle: {
                disconnected: el => el.on_disconnected(),
                updated: (el, changedProperties) => el.on_updated(changedProperties),
            },
            changes: {
                /* the one and only entry point into the URL params */
                'params_string': el => el.syncFromUrl(),
                /* both follow in this same update, reading what `syncFromUrl` just landed */
                'random': el => el.randomizeColors(),
                'every': el => el.restart_randomizing(),
            },
            /* derive runs after changes: these see the attributes the params just landed */
            derive: {
                'derived_title': el => el.derive_derived_title(),
                'classInfo': el => el.derive_classInfo(),
                'styleInfo': el => el.derive_styleInfo(),
                'text_lines': el => el.derive_text_lines(),
            },
            events: [
                {
                    /* announce the click, leaving to the host page what to make of it */
                    selector: '#hypostasis',
                    listener: (el) => el.dispatchEvent(new CustomEvent('page_clicked', { bubbles: true, composed: true })),
                },
            ],
        }
    };
    /**
     * Called only as an effect of a change to `params_string`.
     */
    syncFromUrl() {
        const params = new URLSearchParams(this.params_string ?? '');
        const title = params.get("title");
        if (title !== null) {
            this.title = title;
        }
        else {
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
        this.page_style = params.get("style") ?? undefined;
        this.line_class = params.get("class") ?? undefined;
        const perLine = {};
        for (const [key, value] of params) {
            const match = key.match(/^(size|fgcolor|class)_(\d+)$/);
            if (!match || !value)
                continue;
            const override = perLine[parseInt(match[2], 10)] ??= {};
            if (match[1] === 'size') {
                const n = parseFloat(value);
                if (isFinite(n) && n > 0)
                    override.size = `${n}dvw`;
            }
            else if (match[1] === 'fgcolor') {
                override.fgcolor = value;
            }
            else {
                override.classes = parse_class_tokens(value);
            }
        }
        this.per_line_overrides = perLine;
    }
    restart_randomizing() {
        if (this._intervalTimeout)
            clearInterval(this._intervalTimeout);
        this._intervalTimeout = undefined;
        const everyMs = this.every === "" ? DEFAULT_EVERY : (parseInt(this.every ?? '') || 0);
        if (everyMs > 0) {
            this._intervalTimeout = setInterval(() => this.randomizeColors(), everyMs);
        }
    }
    on_disconnected() {
        if (this._intervalTimeout)
            clearInterval(this._intervalTimeout);
    }
    /**
     * The final title, `divider` applied: what a window title bar or a gallery caption shows.
     */
    derive_derived_title() {
        const divider_title = this.divider && this.divider !== '0'
            ? (this.title || '').padEnd(40, '-')
            : null;
        return divider_title || this.title || DEFAULT_TITLE;
    }
    derive_classInfo() {
        return {
            "dark": this.theme === "dark",
            "light": this.theme === "light",
        };
    }
    derive_styleInfo() {
        const sizeNum = parseFloat(this.size ?? '');
        const sizeCss = isFinite(sizeNum) && sizeNum > 0 ? `${sizeNum}dvw` : '';
        return {
            "background-color": this.bgcolor || this.randomBg,
            ...(this.fgcolor ? { "color": this.fgcolor } : {}),
            ...(sizeCss ? { "--page-text-font-size": sizeCss } : {}),
        };
    }
    derive_text_lines() {
        const lines = (this.text ?? '').split('\n');
        const perLine = this.per_line_overrides ?? {};
        const base_classes = parse_class_tokens(this.line_class);
        return lines.map((lineText, i) => {
            const override = perLine[i + 1];
            return {
                text: lineText,
                styleInfo: {
                    ...(override?.size ? { "font-size": override.size } : {}),
                    ...(override?.fgcolor ? { "color": override.fgcolor } : {}),
                },
                classInfo: Object.fromEntries((override?.classes ?? base_classes).map(c => [c, true])),
            };
        });
    }
    /* side effects outside the rendered tree, once the render settled */
    on_updated(changedProperties) {
        this.apply_page_style();
        /* announce the title, leaving to the host page what to make of it */
        if (changedProperties.has('derived_title')) {
            this.dispatchEvent(new CustomEvent('title_changed', {
                detail: { title: this.derived_title },
                bubbles: true,
                composed: true,
            }));
        }
    }
    apply_page_style() {
        /* our own shadow root, never the document: the sheet is ours alone to adopt */
        const root = this.shadowRoot;
        if (!root)
            return;
        if (this._pageStyleSheet === undefined)
            this._pageStyleSheet = adopt_page_style_sheet(root);
        if (!this._pageStyleSheet)
            return;
        fill_scoped_rules(this._pageStyleSheet, this.page_style ?? '');
    }
    randomizeColors() {
        if (!this.isRandomEnabled())
            return;
        this.randomBg = randomColor();
    }
    isRandomEnabled() {
        return this.random && (this.random !== '0');
    }
}
function randomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
/*
The `style` URL param never touches HTML: it becomes rules inside a constructed
stylesheet, scoped so it can style the page text area only, never the Options Screen.
*/
function adopt_page_style_sheet(root) {
    if (typeof CSSStyleSheet.prototype.replaceSync !== 'function')
        return null;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('@scope (#hypostasis) {}');
    /* browser without @scope drops the rule: the `style` param stays quietly inert */
    if (sheet.cssRules.length === 0)
        return null;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return sheet;
}
function fill_scoped_rules(sheet, css) {
    const scope = sheet.cssRules[0];
    while (scope.cssRules.length)
        scope.deleteRule(0);
    if (!css)
        return;
    const scratch = new CSSStyleSheet();
    try {
        scratch.replaceSync(css);
    }
    catch {
        return; /* invalid CSS: quietly ignore */
    }
    /*
    Rule-by-rule CSSOM insertion, never `@scope { ${css} }` string-wrapping:
    a `}` in the param value would close the block early and escape the scope.
    insertRule parses exactly one canonically-serialized rule, so no breakout.
    */
    for (const rule of Array.from(scratch.cssRules)) {
        try {
            scope.insertRule(rule.cssText, scope.cssRules.length);
        }
        catch {
            /* rule not insertable under @scope: quietly skip */
        }
    }
}
function parse_class_tokens(value) {
    return (value ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(s => /^-?[A-Za-z_][A-Za-z0-9_-]*$/.test(s));
}
Customary.declare(OnePageLandElement);
//# sourceMappingURL=one-page-land.js.map