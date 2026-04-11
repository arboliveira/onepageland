import 'mocha';
import * as CT from "#customary-testing";
const suite = {
    title: 'One Page Land',
    subject_html: 'index.html'
};
describe(suite.title, async function () {
    this.timeout(4000);
    this.slow(500);
    let window;
    before(() => window = CT.open(suite.subject_html));
    after(() => window.close());
    describe('happy day', async function () {
        let element;
        function assert_element() {
            element = CT.querySelector('one-page-land', window);
        }
        it('looks good', async function () {
            this.retries(64);
            assert_element();
        });
    });
});
//# sourceMappingURL=one-page-land-test.js.map