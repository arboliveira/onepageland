import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";

type Events = CustomaryHooks<OnePageLineOptionsElement>['events'];

export class OnePageLineOptionsElement extends CustomaryElement {

	declare idx: string;
	declare line_number: string;
	declare line_size: string;
	declare line_fgcolor: string;
	declare line_class: string;
	declare size_placeholder: string;
	declare fgcolor_placeholder: string;
	declare class_placeholder: string;

	declare param_size_text: string;
	declare param_size_class: string;
	declare param_fgcolor_text: string;
	declare param_fgcolor_class: string;
	declare param_class_text: string;
	declare param_class_class: string;

	static readonly customary: CustomaryDeclaration<OnePageLineOptionsElement> = {
		name: 'one-page-line-options',
		config: {
			attributes: ['idx', 'line_number', 'line_size', 'line_fgcolor', 'line_class', 'size_placeholder', 'fgcolor_placeholder', 'class_placeholder'],
			construct: {
				shadowRootDont: true,
			},
		},
		hooks: {
			externalLoader: {import_meta: import.meta, css_dont: true},
			derive: {
				'param_size_text': (el: OnePageLineOptionsElement) => {
					const {n, size_num, size_valid} = parseValues(el);
					return size_valid ? `&size_${n}=${encodeURIComponent(String(size_num))}` : `&size_${el.line_number || ''}=`;
				},
				'param_size_class': (el: OnePageLineOptionsElement) => parseValues(el).size_valid ? 'opt-param active' : 'opt-param',
				'param_fgcolor_text': (el: OnePageLineOptionsElement) => {
					const {n, fgcolor, fgcolor_valid} = parseValues(el);
					return fgcolor_valid ? `&fgcolor_${n}=${encodeURIComponent(fgcolor)}` : `&fgcolor_${el.line_number || ''}=`;
				},
				'param_fgcolor_class': (el: OnePageLineOptionsElement) => parseValues(el).fgcolor_valid ? 'opt-param active' : 'opt-param',
				'param_class_text': (el: OnePageLineOptionsElement) => {
					const {n, classes, class_valid} = parseValues(el);
					return class_valid ? `&class_${n}=${encodeURIComponent(classes)}` : `&class_${el.line_number || ''}=`;
				},
				'param_class_class': (el: OnePageLineOptionsElement) => parseValues(el).class_valid ? 'opt-param active' : 'opt-param',
			},
			changes: {
				'line_number':  (el: OnePageLineOptionsElement) => emit_change(el),
				'line_size':    (el: OnePageLineOptionsElement) => emit_change(el),
				'line_fgcolor': (el: OnePageLineOptionsElement) => emit_change(el),
				'line_class':   (el: OnePageLineOptionsElement) => emit_change(el),
			},
			events: [
				{
					selector: '.remove-line-options-btn',
					type: 'click',
					listener: (el) => emit_remove(el as OnePageLineOptionsElement),
				},
			] as Events,
		},
	};
}

function parseValues(el: OnePageLineOptionsElement) {
	const n = parseInt(el.line_number ?? '', 10);
	const n_valid = isFinite(n) && n > 0;
	const size_num = parseFloat(el.line_size ?? '');
	const size_valid = n_valid && isFinite(size_num) && size_num > 0;
	const fgcolor = (el.line_fgcolor ?? '').trim();
	const fgcolor_valid = n_valid && fgcolor.length > 0;
	const classes = (el.line_class ?? '').trim();
	const class_valid = n_valid && classes.length > 0;
	return {n, size_num, size_valid, fgcolor, fgcolor_valid, classes, class_valid};
}

function emit_change(el: OnePageLineOptionsElement) {
	el.dispatchEvent(new CustomEvent('line_options_change', {
		detail: {idx: parseInt(el.idx, 10), n: el.line_number, size: el.line_size, fgcolor: el.line_fgcolor, classes: el.line_class},
		bubbles: true,
		composed: true,
	}));
}

function emit_remove(el: OnePageLineOptionsElement) {
	el.dispatchEvent(new CustomEvent('line_options_remove', {
		detail: {idx: parseInt(el.idx, 10)},
		bubbles: true,
		composed: true,
	}));
}

Customary.declare(OnePageLineOptionsElement);
