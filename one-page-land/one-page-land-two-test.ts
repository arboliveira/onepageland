import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";

const suite = {
    title: 'Two One Page Land in one page',
    subject_html: 'one-page-land/one-page-land-two-test.html'
};

describe(suite.title, async function (){
    this.timeout(4000);
    this.slow(500);

    describe('happy day', async function () {
        let window: Window;

        before(() => window = CT.open(suite.subject_html));
        after(() => window.close());

        function line_of(id: string): HTMLElement {
            return CT.querySelector('.text-line', CT.querySelector(`#${id}`, window));
        }

        function color_of(line: HTMLElement): string {
            return (window as Window & typeof globalThis).getComputedStyle(line).color;
        }

        it('renders each from its own params', async function () {
            this.retries(64);
            chai.assert.equal(line_of('one').textContent, 'One');
            chai.assert.equal(line_of('two').textContent, 'Two');
        });
        it('keeps each `style` param to itself', async function () {
            this.retries(16);
            chai.assert.equal(color_of(line_of('one')), 'rgb(0, 128, 0)');
            chai.assert.equal(color_of(line_of('two')), 'rgb(0, 0, 255)');
        });
    });
});
