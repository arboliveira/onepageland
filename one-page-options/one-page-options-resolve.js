/*
 * The one mapping from field values to param values — a param is its value, or `null`
 * for "not in play". Only `one-page-options-form` invokes it; the one resolved object
 * per update serves both consumers: the form renders its per-field `&param=` displays
 * from it, then announces it whole as `options_updated`, and `one-page-options` builds
 * the URL and the preview from that same object. One call, so the URL and the displays
 * cannot quietly drift apart.
 */
export function resolveOptions(values) {
    return {
        title: values.opt_title || null,
        text: values.opt_text || null,
        theme: values.opt_theme || null,
        fgcolor: values.opt_fgcolor || null,
        bgcolor: values.opt_bgcolor || null,
        random: values.opt_random === 'true' ? '1' : null,
        every: values.opt_random && values.opt_every ? values.opt_every : null,
        divider: values.opt_divider === 'true' ? '1' : null,
        size: values.opt_size || null,
        style: values.opt_style || null,
        class: values.opt_class || null,
    };
}
//# sourceMappingURL=one-page-options-resolve.js.map