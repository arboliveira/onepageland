import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";
const suite = {
    title: 'Home Page',
    subject_html: 'index.html?text=Hello'
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
            element = CT.querySelector('home-page', window);
            CT.spot('Hello', CT.querySelector('one-page-land', element));
            chai.assert.isNull(element.querySelector('one-page-options'));
        });
        it('interact', async function () {
            CT.querySelector('#hypostasis', CT.querySelector('one-page-land', element)).click();
        });
        it('offers the Options Screen', async function () {
            this.retries(16);
            const options = CT.querySelector('one-page-options', element);
            CT.querySelector('#options-form', options);
        });
    });
});
const suite_title = {
    title: 'Home Page reacting to the derived title',
    subject_html: 'index.html?text=Hello&title=Greetings&divider=1'
};
describe(suite_title.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_title.subject_html));
        after(() => window.close());
        it('puts it on the window', async function () {
            this.retries(128);
            chai.assert.equal(window.document.title, 'Greetings'.padEnd(40, '-'));
        });
    });
});
const suite_url_changed = {
    title: 'Home Page when the URL changes',
    subject_html: 'index.html?text=Hello'
};
describe(suite_url_changed.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_url_changed.subject_html));
        after(() => window.close());
        let land;
        it('looks good', async function () {
            this.retries(64);
            land = CT.querySelector('one-page-land', CT.querySelector('home-page', window));
            CT.spot('Hello', land);
        });
        it('interact', async function () {
            /* what the Options Screen does while live editing */
            const subject = window;
            subject.history.replaceState(null, '', '?text=Goodbye');
            subject.dispatchEvent(new subject.CustomEvent('url_changed'));
        });
        it('hands the new params down to One Page Land', async function () {
            this.retries(16);
            CT.spot('Goodbye', land);
        });
    });
});
const suite_vanilla = {
    title: 'Home Page on a vanilla URL',
    subject_html: 'index.html'
};
describe(suite_vanilla.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_vanilla.subject_html));
        after(() => window.close());
        it('opens the Options Screen unprompted', async function () {
            this.retries(64);
            const element = CT.querySelector('home-page', window);
            const options = CT.querySelector('one-page-options', element);
            CT.querySelector('#options-form', options);
        });
    });
});
const suite_enter = {
    title: 'Home Page with the Enter key',
    subject_html: 'index.html?text=Hello'
};
describe(suite_enter.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_enter.subject_html));
        after(() => window.close());
        let element;
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('home-page', window);
            CT.spot('Hello', CT.querySelector('one-page-land', element));
            chai.assert.isNull(element.querySelector('one-page-options'));
        });
        it('interact', async function () {
            CT.keydown({ key: 'Enter' }, window.document);
        });
        it('opens the Options Screen', async function () {
            this.retries(16);
            const options = CT.querySelector('one-page-options', element);
            CT.querySelector('#options-form', options);
        });
    });
});
const suite_backdrop = {
    title: 'Home Page with a click on the Options Screen backdrop',
    subject_html: 'index.html'
};
describe(suite_backdrop.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_backdrop.subject_html));
        after(() => window.close());
        let element;
        let options;
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('home-page', window);
            options = CT.querySelector('one-page-options', element);
            CT.querySelector('#options-panel', options);
        });
        it('interact: click inside the panel', async function () {
            CT.querySelector('#options-title', options).click();
        });
        it('keeps the Options Screen', async function () {
            chai.assert.isNotNull(element.querySelector('one-page-options'));
        });
        it('interact: click on the backdrop', async function () {
            CT.querySelector('#options-backdrop', options).click();
        });
        it('dismisses the Options Screen', async function () {
            this.retries(16);
            chai.assert.isNull(element.querySelector('one-page-options'));
        });
    });
});
const suite_escape = {
    title: 'Home Page with the Escape key',
    subject_html: 'index.html'
};
describe(suite_escape.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        before(() => window = CT.open(suite_escape.subject_html));
        after(() => window.close());
        let element;
        it('looks good', async function () {
            this.retries(64);
            element = CT.querySelector('home-page', window);
            CT.querySelector('one-page-options', element);
        });
        it('interact', async function () {
            CT.keydown({ key: 'Escape' }, window.document);
        });
        it('dismisses the Options Screen', async function () {
            this.retries(16);
            chai.assert.isNull(element.querySelector('one-page-options'));
        });
    });
});
//# sourceMappingURL=home-page-test.js.map