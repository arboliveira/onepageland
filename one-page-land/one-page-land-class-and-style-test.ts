import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";

function text_lines(window: Window): NodeListOf<HTMLElement> {
    return CT.querySelectorAll('.text-line', CT.querySelector('one-page-land', window));
}

function classes_of(line: HTMLElement): string[] {
    return Array.from(line.classList).filter(c => c !== 'text-line').sort();
}

function color_of(window: Window, line: HTMLElement): string {
    return (window as Window & typeof globalThis).getComputedStyle(line).color;
}

const suite_class = {
    title: 'One Page Land with the `class` URL param',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello%0AWorld&class=glow,%20serious'
};

describe(suite_class.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_class.subject_html));
        after(() => window.close());

        it('classes every line', async function () {
            this.retries(64);
            const lines = text_lines(window);
            chai.assert.equal(lines.length, 2);
            chai.assert.deepEqual(classes_of(lines[0]), ['glow', 'serious']);
            chai.assert.deepEqual(classes_of(lines[1]), ['glow', 'serious']);
        });
    });
});

const suite_class_junk = {
    title: 'One Page Land with junk in the `class` URL param',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello&class=glow,1nvalid,%3Cscript%3E,serious'
};

describe(suite_class_junk.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_class_junk.subject_html));
        after(() => window.close());

        it('keeps the class names, drops what is not one', async function () {
            this.retries(64);
            chai.assert.deepEqual(classes_of(text_lines(window)[0]), ['glow', 'serious']);
        });
    });
});

const suite_class_per_line = {
    title: 'One Page Land with the `class_N` URL param',
    subject_html: 'one-page-land/one-page-land-test.html?text=A%0AB%0AC&class=base&class_2=special'
};

describe(suite_class_per_line.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_class_per_line.subject_html));
        after(() => window.close());

        it('overrides the page classes on that line only', async function () {
            this.retries(64);
            const lines = text_lines(window);
            chai.assert.equal(lines.length, 3);
            chai.assert.deepEqual(classes_of(lines[0]), ['base']);
            chai.assert.deepEqual(classes_of(lines[1]), ['special']);
            chai.assert.deepEqual(classes_of(lines[2]), ['base']);
        });
    });
});

const suite_style = {
    title: 'One Page Land with the `style` URL param',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello%0AWorld&class=glow'
        + '&style=' + encodeURIComponent('.glow{color:rgb(0, 128, 0)}')
};

describe(suite_style.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_style.subject_html));
        after(() => window.close());

        it('styles every line carrying the class', async function () {
            this.retries(64);
            const lines = text_lines(window);
            chai.assert.equal(color_of(window, lines[0]), 'rgb(0, 128, 0)');
            chai.assert.equal(color_of(window, lines[1]), 'rgb(0, 128, 0)');
        });
    });
});

const suite_style_per_line = {
    title: 'One Page Land with the `style` URL param and a `class_N` line',
    subject_html: 'one-page-land/one-page-land-test.html?text=A%0AB&fgcolor=rgb(0,%200,%20255)&class_2=hot'
        + '&style=' + encodeURIComponent('.hot{color:rgb(255, 0, 0)}')
};

describe(suite_style_per_line.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_style_per_line.subject_html));
        after(() => window.close());

        it('styles that line only', async function () {
            this.retries(64);
            const lines = text_lines(window);
            chai.assert.equal(color_of(window, lines[0]), 'rgb(0, 0, 255)');
            chai.assert.equal(color_of(window, lines[1]), 'rgb(255, 0, 0)');
        });
    });
});

const suite_style_invalid = {
    title: 'One Page Land with invalid CSS in the `style` URL param',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello&class=glow'
        + '&style=' + encodeURIComponent('} .glow{color:rgb(255, 0, 0)} @nonsense')
};

describe(suite_style_invalid.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite_style_invalid.subject_html));
        after(() => window.close());

        it('renders the page anyway', async function () {
            this.retries(64);
            CT.spot('Hello', CT.querySelector('one-page-land', window));
        });
        it('leaks nothing out of the leading brace', async function () {
            const line = text_lines(window)[0];
            chai.assert.deepEqual(classes_of(line), ['glow']);
            chai.assert.notEqual(color_of(window, line), 'rgb(255, 0, 0)');
        });
    });
});
