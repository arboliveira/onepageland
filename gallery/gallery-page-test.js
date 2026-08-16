import 'mocha';
import * as chai from 'chai';
import * as CT from "#customary-testing";
const suite = {
    title: 'Gallery',
    subject_html: 'gallery/index.html'
};
describe(suite.title, async function () {
    this.timeout(4000);
    this.slow(500);
    describe('happy day', async function () {
        let window;
        let gallery;
        before(() => window = CT.open(suite.subject_html));
        after(() => window.close());
        it('renders one live preview per example', async function () {
            this.retries(64);
            gallery = CT.querySelector('gallery-page', window);
            const previews = CT.querySelectorAll('.preview', gallery);
            chai.assert.equal(previews.length, 10);
        });
        it('feeds each preview its own params', async function () {
            this.retries(64);
            /* the fourth example renders as a real one-page-land, not a screenshot */
            const land = CT.querySelectorAll('one-page-land', gallery)[4];
            CT.spot('BE YOURSELF', land);
        });
        it('shows the derived title in the mini-screen title bar', async function () {
            this.retries(64);
            const titles = Array.from(CT.querySelectorAll('.title-bar .title', gallery))
                .map(el => (el.textContent ?? '').trim());
            chai.assert.include(titles, 'Information Collapse');
        });
        it('links each preview to its full page, from the params button', async function () {
            const button = CT.querySelector('.preview .params-btn', gallery);
            chai.assert.match(button.getAttribute('href') ?? '', /^\.\.\/\?title=/);
            chai.assert.equal(button.getAttribute('target'), '_blank');
            /* the button is the params string, shown leading `&` and all */
            chai.assert.match(button.textContent ?? '', /^&title=/);
        });
    });
    describe('the canvas each preview is painted on', async function () {
        let window;
        let gallery;
        before(() => window = CT.open(suite.subject_html));
        after(() => window.close());
        it('shrinks the render with `zoom`, never with a transform', async function () {
            this.retries(64);
            gallery = CT.querySelector('gallery-page', window);
            const canvas = CT.querySelector('.canvas', gallery);
            const style = window.getComputedStyle(canvas);
            /*
            A transform would hand the subtree to the compositor, and the raster
            it makes cuts colour emoji off flat at their line box.
             */
            chai.assert.equal(style.transform, 'none');
            chai.assert.isBelow(parseFloat(style.zoom), 1);
        });
        it('still measures its viewport units against the real viewport', async function () {
            this.retries(64);
            const screen = CT.querySelector('.viewport', gallery);
            const canvas = CT.querySelector('.canvas', gallery);
            /* `100vw` by `100vh`, shrunk: the canvas fills its little screen exactly */
            chai.assert.closeTo(canvas.getBoundingClientRect().width, screen.getBoundingClientRect().width, 2);
            chai.assert.closeTo(canvas.getBoundingClientRect().height, screen.getBoundingClientRect().height, 2);
        });
    });
    describe('the View Mode button', async function () {
        let window;
        let gallery;
        before(() => window = CT.open(suite.subject_html));
        after(() => window.close());
        it('starts in Hi-Def (one per row)', async function () {
            this.retries(64);
            gallery = CT.querySelector('gallery-page', window);
            CT.querySelector('#grid.hi-def', gallery);
        });
        it('keeps the whole first preview on screen, green button and all', async function () {
            this.retries(64);
            const preview = CT.querySelector('.preview', gallery);
            const bottom = preview.getBoundingClientRect().bottom;
            chai.assert.isAbove(bottom, 0, 'the preview has laid out');
            chai.assert.isAtMost(bottom, window.innerHeight);
        });
        it('interact', async function () {
            CT.querySelector('.view-mode-btn', gallery).click();
        });
        it('switches to Miniature (two per row)', async function () {
            this.retries(16);
            CT.querySelector('#grid.miniature', gallery);
        });
    });
});
//# sourceMappingURL=gallery-page-test.js.map