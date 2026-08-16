import { Customary, CustomaryElement } from "#customary";
import { DEFAULT_EVERY, DEFAULT_SIZE, DEFAULT_TITLE } from "#onepageland/defaults/defaults.js";
import { OnePageLineOptionsElement } from "#onepageland/one-page-line-options/one-page-line-options.js";
import { resolveOptions } from "#onepageland/one-page-options/one-page-options-resolve.js";
/**
 * The Options Screen's form, as its own element — one with no shadow root, which is the
 * whole mechanism. `submit` is not composed, so it dies at the first shadow boundary it
 * meets; with no boundary between the form and this element, the element hears it
 * natively, keeps the browser from navigating away, and re-announces it as a composed
 * `options_form_submit` that can cross the parent's shadow root. The Cookbook recipe:
 * `customary-cookbook/src/05-events/06` — *Events ~ form, self-announcing*.
 */
export class OnePageOptionsFormElement extends CustomaryElement {
    static customary = {
        name: 'one-page-options-form',
        config: {
            attributes: ['window_location_search_at_time_of_connected', 'opt_title', 'opt_text', 'opt_theme', 'opt_fgcolor', 'opt_bgcolor', 'opt_random', 'opt_every', 'opt_divider', 'opt_size', 'opt_style', 'opt_class', 'params_preview', 'params_url'],
            state: ['options_changed_resolved', 'param_title', 'param_text', 'param_theme', 'param_fgcolor', 'param_fgcolor_classes', 'param_bgcolor', 'param_bgcolor_classes', 'param_random', 'param_every', 'param_divider', 'param_size', 'param_title_classes', 'param_text_classes', 'param_theme_classes', 'param_random_classes', 'param_every_classes', 'param_divider_classes', 'param_size_classes', 'param_style', 'param_style_classes', 'param_class', 'param_class_classes', 'per_line_entries', 'default_title', 'default_every', 'default_size'],
            construct: {
                shadowRootDont: true,
            },
        },
        hooks: {
            requires: [OnePageLineOptionsElement],
            externalLoader: { import_meta: import.meta, css_dont: true },
            lifecycle: {
                connected: el => el.on_connected(),
                willUpdate: el => el.on_willUpdate(),
            },
            changes: {
                /*
                 * The one announcement this form makes about its values: whenever the
                 * resolved options change, they travel up whole. The raw `opt_*` stay
                 * here; whoever listens gets the one shape the URL is built from.
                 */
                'options_changed_resolved': (el, value) => el.dispatchEvent(new CustomEvent('options_updated', {
                    detail: { options_resolved: value },
                    bubbles: true,
                    composed: true,
                })),
            },
            events: [
                {
                    selector: 'form',
                    type: 'submit',
                    /*
                     * No shadow root stands between the form and this element, so this
                     * listener always sees the submit event: it keeps the browser from
                     * navigating away, then announces itself with an event that can
                     * cross a shadow root.
                     */
                    listener: (el, event) => {
                        event.preventDefault();
                        el.dispatchEvent(new CustomEvent('options_form_submit', { bubbles: true, composed: true }));
                    },
                },
                {
                    selector: '#preview-btn',
                    type: 'keydown',
                    listener: (el, event) => el.on_preview_btn_keydown(event),
                },
                {
                    selector: '#input-text',
                    type: 'keydown',
                    listener: (el, event) => el.on_input_text_keydown(event),
                },
                {
                    selector: '#input-title',
                    type: 'dblclick',
                    listener: el => el.defaultize_opt_title(),
                },
                {
                    selector: '#input-title',
                    type: 'keydown',
                    listener: (el, event) => { if (is_Alt_Insert(event))
                        el.defaultize_opt_title(); },
                },
                {
                    selector: '#input-every',
                    type: 'dblclick',
                    listener: el => el.defaultize_opt_every(),
                },
                {
                    selector: '#input-every',
                    type: 'keydown',
                    listener: (el, event) => { if (is_Alt_Insert(event))
                        el.defaultize_opt_every(); },
                },
                {
                    selector: '#input-size',
                    type: 'dblclick',
                    listener: el => el.defaultize_opt_size(),
                },
                {
                    selector: '#input-size',
                    type: 'keydown',
                    listener: (el, event) => { if (is_Alt_Insert(event))
                        el.defaultize_opt_size(); },
                },
            ],
        }
    };
    on_connected() {
        this.default_title = DEFAULT_TITLE;
        this.default_every = String(DEFAULT_EVERY);
        this.default_size = String(DEFAULT_SIZE);
        const params = new URLSearchParams(this.window_location_search_at_time_of_connected);
        this.opt_title = params.get("title") ?? '';
        this.opt_text = params.get("text") ?? '';
        this.opt_theme = params.get("theme") ?? '';
        this.opt_fgcolor = params.get("fgcolor") ?? '';
        this.opt_bgcolor = params.get("bgcolor") ?? '';
        this.opt_random = params.get("random") ? 'true' : 'false';
        this.opt_every = params.get("every") ?? '';
        this.opt_divider = params.get("divider") ? 'true' : 'false';
        this.opt_size = params.get("size") ?? '';
        this.opt_style = params.get("style") ?? '';
        this.opt_class = params.get("class") ?? '';
    }
    on_preview_btn_keydown(event) {
        if (event.key !== ' ')
            return;
        event.preventDefault();
        this.requestSubmit();
    }
    on_input_text_keydown(event) {
        if (!event.ctrlKey || event.key !== 'Enter')
            return;
        event.preventDefault();
        this.requestSubmit();
    }
    requestSubmit() {
        /* no shadow root: our form is right here in the light DOM */
        this.querySelector('#options-form').requestSubmit();
    }
    defaultize_opt_title() {
        if (!this.opt_title)
            this.opt_title = DEFAULT_TITLE;
    }
    defaultize_opt_every() {
        if (!this.opt_every)
            this.opt_every = String(DEFAULT_EVERY);
    }
    defaultize_opt_size() {
        if (!this.opt_size)
            this.opt_size = String(DEFAULT_SIZE);
    }
    on_willUpdate() {
        const resolved = resolveOptions(this);
        this.options_changed_resolved = resolved;
        const paramStr = (key, v) => `&${key}=${encodeURIComponent(v ?? '')}`;
        const paramCls = (v) => ({ active: v !== null });
        this.param_title = paramStr('title', resolved.title);
        this.param_title_classes = paramCls(resolved.title);
        this.param_text = paramStr('text', resolved.text);
        this.param_text_classes = paramCls(resolved.text);
        this.param_theme = paramStr('theme', resolved.theme);
        this.param_theme_classes = paramCls(resolved.theme);
        this.param_fgcolor = paramStr('fgcolor', resolved.fgcolor);
        this.param_fgcolor_classes = paramCls(resolved.fgcolor);
        this.param_bgcolor = paramStr('bgcolor', resolved.bgcolor);
        this.param_bgcolor_classes = paramCls(resolved.bgcolor);
        this.param_random = paramStr('random', resolved.random);
        this.param_random_classes = paramCls(resolved.random);
        this.param_every = paramStr('every', resolved.every);
        this.param_every_classes = paramCls(resolved.every);
        this.param_divider = paramStr('divider', resolved.divider);
        this.param_divider_classes = paramCls(resolved.divider);
        this.param_size = paramStr('size', resolved.size);
        this.param_size_classes = paramCls(resolved.size);
        this.param_style = paramStr('style', resolved.style);
        this.param_style_classes = paramCls(resolved.style);
        this.param_class = paramStr('class', resolved.class);
        this.param_class_classes = paramCls(resolved.class);
        const lineCount = (this.opt_text ?? '').split('\n').length;
        this.per_line_section_visible = lineCount >= 2;
    }
}
function is_Alt_Insert(event) {
    return event.altKey && event.key === 'Insert';
}
Customary.declare(OnePageOptionsFormElement);
//# sourceMappingURL=one-page-options-form.js.map