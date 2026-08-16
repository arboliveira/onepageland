import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";

const suite = {
    title: 'One Page Options',
    subject_html: 'one-page-options/index.html'
};

describe(suite.title, async function (){
    this.timeout(4000);
    this.slow(500);

    let window: Window;

    before(() => window = CT.open(suite.subject_html));
    after(() => window.close());

    describe('happy day', async function () {
        let element: HTMLElement;
        function assert_element() {
            element = CT.querySelector('one-page-options', window);
            const legends = Array.from(CT.querySelectorAll('fieldset.opt-fieldset legend', element))
                .map(legend => legend.textContent?.trim());
            chai.assert.deepEqual(legends, ['Title', 'Page', 'Lines']);
            const text = CT.allTextContent(element);
            chai.assert.include(text, '&style=');
            chai.assert.include(text, '&class=');
        }
        it('looks good', async function () {
            this.retries(128);
            assert_element();
        });
    });
});

const suite_per_line = {
    title: 'One Page Options per line',
    subject_html: 'one-page-options/index.html?text=A%0AB%0AC&size_2=10&fgcolor_2=blue&class_2=glow'
};

describe(suite_per_line.title, async function (){
    this.timeout(4000);
    this.slow(500);

    let window: Window;

    before(() => window = CT.open(suite_per_line.subject_html));
    after(() => window.close());

    describe('happy day', async function () {
        let element: HTMLElement;
        function assert_element() {
            const parent = CT.querySelector('one-page-options', window);
            element = CT.querySelector('one-page-line-options', parent);
            chai.assert.isOk(element.querySelector('fieldset.line-options-fieldset'));
            const text = CT.allTextContent(element);
            chai.assert.include(text, '&size_2=10');
            chai.assert.include(text, '&fgcolor_2=blue');
            chai.assert.include(text, '&class_2=glow');
        }
        it('looks good', async function () {
            this.retries(128);
            assert_element();
        });
    });
});

/*
 * The one param the fixture starts with. It does double duty: it makes `params_preview`
 * non-empty, which is what brings the Enter paths into existence at all, and it is what
 * an apply has to carry through to the far side to count as having worked.
 */
const THE_PARAM = 'title=Hello';

const suite_enter = {
    title: 'One Page Options Enter paths',
    /*
     * The fixture, not `index.html`, for two reasons that both bite.
     *
     * `index.html` closes its own window on `close_me_please`, and the Escape listener
     * the element registers on `document` fires exactly that — so a suite driving it can
     * lose the window it is asserting against. The fixture also disowns its opener,
     * which is what keeps an apply from navigating the Mocha runner. Comments there.
     *
     * `title` has to carry a value: the hidden submit button and the green button both
     * sit inside `<customary:if condition="{{params_preview}}">`, so the Enter paths do
     * not exist at all until some param is set.
     */
    subject_html: `one-page-options/one-page-options-test.html?${THE_PARAM}`
};

/*
 * How these tests know an apply happened.
 *
 * Not from the URL. Live editing already writes exactly `params_url` there, with
 * `replaceState`, on every keystroke — so the address reads the same before and after,
 * and is a false tell. What an apply adds is a *navigation*, and a navigation replaces
 * the document. So hold on to the document we started with, and watch for it to be
 * swapped out from under us.
 */
function assert_applied(window: Window, document_before: Document) {
    assert_captured(document_before);
    chai.assert.notStrictEqual(window.document, document_before,
        'expected an apply to navigate this window, replacing its document');
    /*
     * And that it went somewhere worth going. A navigation on its own is not enough to
     * conclude the path works, because the way this breaks also navigates.
     *
     * Take away the re-announcement in `on_firstUpdated` and nothing calls
     * `preventDefault` any more, so the browser performs its own GET submission of the
     * form. None of these fields carry a `name`, so that GET goes to the same page with
     * the query stripped to nothing — measured: `?title=Hello` becomes ``. It replaces
     * the document just as thoroughly as the real thing, and a test watching only for a
     * new document calls it green. Checking the params is what tells them apart.
     */
    chai.assert.include(window.location.search, THE_PARAM,
        'the apply navigated, but dropped the params on the way — a native form GET, not ours');
}

function assert_not_applied(window: Window, document_before: Document) {
    assert_captured(document_before);
    chai.assert.strictEqual(window.document, document_before,
        'expected no navigation: this should still be the document we started with');
}

/*
 * These suites carry state from one `it` to the next, so a run that skips the section
 * doing the capturing would compare against `undefined` and pass without meaning it.
 * `npm test -- --fgrep=…` does exactly that: it filters out the `interact` sections and
 * leaves the assertions standing on nothing. Say so rather than going quietly green.
 */
function assert_captured(document_before: Document) {
    chai.assert.isOk(document_before,
        'no starting document was captured — run the whole suite, not a --fgrep subset');
}

/*
 * `CT` offers no "let the page settle", and asserting that something did *not* happen
 * needs one: with nothing to wait for, `retries` would confirm "did not navigate" on the
 * first attempt, a microsecond after the key went in, and would say so just as happily
 * if the navigation were merely one tick away. Give it time to show up instead.
 */
function settle(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 250));
}

describe(suite_enter.title, async function () {
    this.timeout(8000);
    this.slow(1000);

    describe('the markup the Enter paths rest on', async function () {
        let window: Window;

        before(() => window = CT.open(suite_enter.subject_html));
        after(() => window.close());

        it('keeps the hidden submit button that makes Enter submit at all', async function () {
            this.retries(128);
            const element = CT.querySelector('one-page-options', window);
            /*
             * Behavior 1, as far as this suite can reach it. Plain Enter in a single-line
             * field submits through HTML's *implicit submission*, which nobody wrote —
             * and which does not fire on a multi-field form that has no default button.
             * This hidden button is that default button. It reads as dead markup, and it
             * is the only reason Enter works anywhere on this form; removing it was
             * measured to kill the behavior silently, with no error anywhere.
             *
             * That the key itself submits needs trusted input, which `CT.keydown` cannot
             * produce. The Playwright lane presses it for real, and also proves this
             * button is what carries it: `playwright/one-page-options-enter-test.ts`.
             */
            chai.assert.isOk(
                CT.querySelector('#options-form button[type="submit"][hidden]', element),
                'the hidden submit button is load-bearing for Enter-to-submit');
        });
        it('keeps the green button an anchor, which is what splits Enter from Space', async function () {
            this.retries(128);
            const element = CT.querySelector('one-page-options', window);
            /*
             * Behaviors 4-Enter and 4-Space both follow from this one fact. Enter
             * activates an `<a href>` natively, as a click, so the `click` listener gets
             * it for free; Space does not activate an anchor, which is the only reason an
             * explicit Space handler exists. Make this a `<button>` and the pair inverts:
             * Space would start working on its own, and the handler would fire twice.
             */
            const preview_btn = CT.querySelector('#preview-btn', element);
            chai.assert.strictEqual(preview_btn.tagName, 'A');
            chai.assert.isOk(preview_btn.getAttribute('href'));
        });
        it('is the inline branch, so an apply lands here and not on the runner', async function () {
            this.retries(128);
            const element = CT.querySelector('one-page-options', window);
            chai.assert.isNull(window.opener,
                'the fixture disowns its opener; without that, an apply navigates the Mocha runner');
            /*
             * Placement is an attribute, not a probe of `window.opener`: the fixture
             * leaves `is_in_window` off, and absent is what inline means. Both buttons
             * are asserted, the one that must be there and the one that must not — a
             * `<customary:if>` pointed at the raw string instead of `is_in_window_bool`
             * renders the popped-out button here too, and nothing throws when it does.
             */
            chai.assert.isNotOk(element.getAttribute('is_in_window'),
                'the fixture is the inline case: no `is_in_window` attribute at all');
            /*
             * The whole placement zone, not just the button that should be there:
             * `CT.querySelectorAll` throws on an empty match, so absence is asserted by
             * listing what IS rendered — which also catches the extra button.
             */
            const controls = CT.querySelector('#placement-controls', element);
            const buttons = Array.from(CT.querySelectorAll('button', controls)).map(b => b.id);
            chai.assert.deepEqual(buttons, ['move-to-window-btn'],
                'inline: the screen offers to move out, and nothing offers to move back in');
        });
    });

    describe('Ctrl+Enter in the Text area', async function () {
        let window: Window;

        before(() => window = CT.open(suite_enter.subject_html));
        after(() => window.close());

        let element: HTMLElement;
        let document_before: Document;

        it('looks good', async function () {
            this.retries(128);
            element = CT.querySelector('one-page-options', window);
            CT.querySelector('#input-text', element);
            document_before = window.document;
        });
        it('interact', async function () {
            /*
             * Plain Enter first. In the Text area a newline is a line of the page, so
             * Enter is deliberately left meaning what it always means, and must not apply.
             */
            CT.keydown({key: 'Enter'}, CT.querySelector('#input-text', element));
            await settle();
        });
        it('leaves plain Enter alone, because a newline there is a line of the page', async function () {
            /* no retries: `settle` above already gave a navigation its chance to appear */
            assert_not_applied(window, document_before);
        });
        it('interact', async function () {
            CT.keydown({key: 'Enter', ctrlKey: true}, CT.querySelector('#input-text', element));
        });
        it('applies on Ctrl+Enter', async function () {
            this.retries(128);
            /*
             * The whole chain, and every hop is load-bearing: `on_input_text_keydown`
             * calls `requestSubmit()` on the form it finds through `shadowRoot` → a
             * non-composed `submit` that cannot leave the shadow root → heard inside it
             * by the listener `on_firstUpdated` attaches → re-announced on the form as a
             * composed `options_form_submit` → the `events` hook entry → the navigation.
             */
            assert_applied(window, document_before);
        });
    });

    describe('Space on the green button', async function () {
        let window: Window;

        before(() => window = CT.open(suite_enter.subject_html));
        after(() => window.close());

        let element: HTMLElement;
        let document_before: Document;

        it('looks good', async function () {
            this.retries(128);
            element = CT.querySelector('one-page-options', window);
            CT.querySelector('#preview-btn', element);
            document_before = window.document;
        });
        it('interact', async function () {
            CT.keydown({key: ' '}, CT.querySelector('#preview-btn', element));
        });
        it('applies on Space, which an anchor would otherwise ignore', async function () {
            this.retries(128);
            assert_applied(window, document_before);
        });
    });

    /*
     * What this suite cannot drive, written down so the gap is visible rather than absent.
     *
     * `CT.keydown` dispatches an untrusted `KeyboardEvent`, and untrusted key events run
     * no default action — measured in Firefox, the browser the Mocha runner drives:
     *
     *   synthetic Enter on `<input>`   nothing   |   trusted Enter on `<input>`   submits
     *   synthetic Enter on `<a href>`  nothing   |   trusted Enter on `<a href>`  clicks
     *
     * Ctrl+Enter and Space above are reachable only because the app's own listeners call
     * `requestSubmit()`, which fires `submit` whatever the trust of the key that led to
     * it. Enter has no such listener anywhere — both remaining paths ARE the default
     * action — so no amount of DOM-API driving reaches them from here.
     *
     * They are covered, for real, by `playwright/one-page-options-enter-test.ts`, which
     * presses the keys through the browser. Run it with `npm run test:trusted-keys`.
     */
    describe('what needs trusted input, and so lives in the Playwright lane', async function () {
        it.skip('applies on plain Enter in a single-line field (behavior 1)', async function () {
            /*
             * Would need: a trusted Enter, i.e. `page.keyboard.press('Enter')` with
             * `#input-title` focused. `CT.keydown({key: 'Enter'}, input)` does nothing —
             * implicit submission is a default action, and untrusted events have none.
             */
        });
        it.skip('applies on Enter on the green button (behavior 4-Enter)', async function () {
            /*
             * Would need: a trusted Enter with `#preview-btn` focused. Enter on an
             * `<a href>` is native activation, again a default action, so the `click`
             * listener never hears an untrusted one.
             */
        });
        it.skip('navigates the opener and closes itself when popped out (behavior 2, popped out)', async function () {
            /*
             * Would need: an opener that is not the Mocha runner. `CT.open` is
             * `window.open`, so under test this screen's opener IS the runner page, and
             * `on_options_form_submit` sets `opener.location.href` — the suite would
             * navigate itself out from under the assertion, mid-run. The fixture exists
             * precisely to make that opener absent, which is what puts every test above
             * on the inline branch instead.
             *
             * The Playwright lane can have both: it opens a host page, has that page
             * `window.open` the Options Screen, and gets a genuine opener to watch.
             */
        });
    });
});
