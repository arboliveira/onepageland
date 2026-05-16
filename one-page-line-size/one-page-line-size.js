import { Customary, CustomaryElement } from "#customary";
export class OnePageLineSizeElement extends CustomaryElement {
    static customary = {
        name: 'one-page-line-size',
        config: {
            attributes: ['idx', 'line_number', 'line_size', 'placeholder'],
            construct: {
                shadowRootDont: true,
            },
        },
        hooks: {
            externalLoader: { import_meta: import.meta },
            derive: {
                'param_text': (el) => {
                    const { n, num, valid } = parseValues(el);
                    return valid ? `&size_${n}=${encodeURIComponent(String(num))}` : `&size_${el.line_number || ''}=`;
                },
                'param_class': (el) => parseValues(el).valid ? 'opt-param active' : 'opt-param',
            },
            changes: {
                'line_number': (el) => emit_change(el),
                'line_size': (el) => emit_change(el),
            },
            events: [
                {
                    selector: '.remove-line-size-btn',
                    type: 'click',
                    listener: (el) => emit_remove(el),
                },
            ],
        },
    };
}
function parseValues(el) {
    const n = parseInt(el.line_number ?? '', 10);
    const num = parseFloat(el.line_size ?? '');
    const valid = isFinite(n) && n > 0 && isFinite(num) && num > 0;
    return { n, num, valid };
}
function emit_change(el) {
    el.dispatchEvent(new CustomEvent('line_size_change', {
        detail: { idx: parseInt(el.idx, 10), n: el.line_number, value: el.line_size },
        bubbles: true,
        composed: true,
    }));
}
function emit_remove(el) {
    el.dispatchEvent(new CustomEvent('line_size_remove', {
        detail: { idx: parseInt(el.idx, 10) },
        bubbles: true,
        composed: true,
    }));
}
Customary.declare(OnePageLineSizeElement);
//# sourceMappingURL=one-page-line-size.js.map