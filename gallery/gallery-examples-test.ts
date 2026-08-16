import 'mocha';
import * as chai from 'chai';
import {GalleryExamples} from "#onepageland/gallery/gallery-examples.js";

describe('Gallery examples file', async function (){
    this.timeout(4000);
    this.slow(500);

    describe('reading the lines', async function () {

        it('drops the blank lines the file is spaced out with', async function () {
            const text = '\n&text=one\n\n   \n&text=two\n\n';
            chai.assert.deepEqual(GalleryExamples.parse(text),
                ['&text=one', '&text=two']);
        });

        it('drops a line whose first non-blank character is `#`', async function () {
            const text = '# a heading\n&text=one\n\t# indented, still a comment\n&text=two';
            chai.assert.deepEqual(GalleryExamples.parse(text),
                ['&text=one', '&text=two']);
        });

        it('keeps a `#` that is part of the query string', async function () {
            /*
            Stripping from a `#` onwards would truncate this example down to a
            colour that is no colour, and it would do it without a word.
             */
            const text = '# Hash Land\n&text=hello&style=.a%7Bcolor%3A#ff0000%7D\n';
            chai.assert.deepEqual(GalleryExamples.parse(text),
                ['&text=hello&style=.a%7Bcolor%3A#ff0000%7D']);
        });

        it('trims the whitespace around a line it keeps', async function () {
            chai.assert.deepEqual(GalleryExamples.parse('  &text=one  \r\n'),
                ['&text=one']);
        });
    });

    describe('the file the Gallery ships', async function () {

        it('is fetched relative to its module, and reads as examples', async function () {
            const examples = await GalleryExamples.load();
            chai.assert.isAbove(examples.length, 0);
            examples.forEach(example => chai.assert.match(example, /^&/,
                'every example is displayed leading `&` and all'));
        });
    });
});
