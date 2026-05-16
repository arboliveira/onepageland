import {Customary, CustomaryDeclaration, CustomaryElement} from "#customary";
import {CustomaryHooks} from "#customary/CustomaryHooks.js";

type Events = CustomaryHooks<OnePageLineSizeElement>['events'];

export class OnePageLineSizeElement extends CustomaryElement {

	declare idx: string;
	declare line_number: string;
	declare line_size: string;
	declare placeholder: string;

	declare param_text: string;
	declare param_class: string;

	static readonly customary: CustomaryDeclaration<OnePageLineSizeElement> = {
		name: 'one-page-line-size',
		config: {
			attributes: ['idx', 'line_number', 'line_size', 'placeholder'],
			construct: {
				shadowRootDont: true,
			},
		},
		hooks: {
			externalLoader: {import_meta: import.meta},
			derive: {
				'param_text': (el: OnePageLineSizeElement) => {
					const {n, num, valid} = parseValues(el);
					return valid ? `&size_${n}=${encodeURIComponent(String(num))}` : `&size_${el.line_number || ''}=`;
				},
				'param_class': (el: OnePageLineSizeElement) => parseValues(el).valid ? 'opt-param active' : 'opt-param',
			},
			changes: {
				'line_number': (el: OnePageLineSizeElement) => emit_change(el),
				'line_size':   (el: OnePageLineSizeElement) => emit_change(el),
			},
			events: [
				{
					selector: '.remove-line-size-btn',
					type: 'click',
					listener: (el) => emit_remove(el as OnePageLineSizeElement),
				},
			] as Events,
		},
	};
}

function parseValues(el: OnePageLineSizeElement) {
	const n = parseInt(el.line_number ?? '', 10);
	const num = parseFloat(el.line_size ?? '');
	const valid = isFinite(n) && n > 0 && isFinite(num) && num > 0;
	return {n, num, valid};
}

function emit_change(el: OnePageLineSizeElement) {
	el.dispatchEvent(new CustomEvent('line_size_change', {
		detail: {idx: parseInt(el.idx, 10), n: el.line_number, value: el.line_size},
		bubbles: true,
		composed: true,
	}));
}

function emit_remove(el: OnePageLineSizeElement) {
	el.dispatchEvent(new CustomEvent('line_size_remove', {
		detail: {idx: parseInt(el.idx, 10)},
		bubbles: true,
		composed: true,
	}));
}

Customary.declare(OnePageLineSizeElement);
