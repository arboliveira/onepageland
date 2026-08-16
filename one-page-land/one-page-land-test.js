import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";
const suite = {
    title: 'One Page Land',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello'
};
describe(suite.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite.subject_html));
        after(() => window.close());
        let element;
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('one-page-land', window);
            CT.spot('Hello', element);
        });
        it('interact', async function () {
            /* the two ways the Home Page reaches the Options Screen */
            CT.querySelector('#hypostasis', element).click();
            CT.keydown({ key: 'Enter' }, window.document);
        });
        it('offers no Options Screen', async function () {
            this.retries(16);
            chai.assert.isNull(window.document.querySelector('one-page-options'));
            chai.assert.isNull(element.shadowRoot.querySelector('one-page-options'));
        });
    });
});
const suite_title_changed = {
    title: 'One Page Land announcing the derived title',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello&title=Greetings'
};
describe(suite_title_changed.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_title_changed.subject_html));
        after(() => window.close());
        let element;
        const announced = [];
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('one-page-land', window);
            CT.spot('Hello', element);
        });
        it('interact', async function () {
            element.addEventListener('title_changed', event => announced.push(event.detail.title));
            /* `divider` pads the title, and that is a change worth announcing */
            element.setAttribute('params_string', '?text=Hello&title=Greetings&divider=1');
        });
        it('announces the padded title', async function () {
            this.retries(16);
            chai.assert.deepEqual(announced, ['Greetings'.padEnd(40, '-')]);
        });
        it('interact', async function () {
            /* the title stands still: nothing to announce */
            element.setAttribute('params_string', '?text=Goodbye&title=Greetings&divider=1');
        });
        it('stays quiet while the title stands still', async function () {
            this.retries(16);
            CT.spot('Goodbye', element);
            chai.assert.deepEqual(announced, ['Greetings'.padEnd(40, '-')]);
        });
    });
});
const suite_params_string = {
    title: 'One Page Land when `params_string` is set',
    subject_html: 'one-page-land/one-page-land-test.html?text=Hello'
};
describe(suite_params_string.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_params_string.subject_html));
        after(() => window.close());
        let element;
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('one-page-land', window);
            CT.spot('Hello', element);
        });
        it('interact', async function () {
            /* the URL is left alone: the attribute alone drives the page */
            element.setAttribute('params_string', '?text=Goodbye');
        });
        it('re-reads the params', async function () {
            this.retries(16);
            CT.spot('Goodbye', element);
        });
    });
});
//# sourceMappingURL=one-page-land-test.js.map