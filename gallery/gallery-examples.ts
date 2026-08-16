/**
 * The Gallery's curation is data, not code: it lives in `gallery-examples.txt`,
 * one example per line, so putting a page on display means editing a text file.
 *
 * Each entry is a query string led by its `&` — displayed query strings start
 * with one so every param has one (see CONTRIBUTING) — and the file is written
 * to be read, with a comment naming each example.
 */
export class GalleryExamples {

	/**
	 * Resolved against this module, never against the page, so the same code
	 * finds the file from `src`, from `.dist` and under the test runner alike.
	 *
	 * A Gallery that cannot read its examples renders empty, and an empty
	 * Gallery looks deliberate: nothing here is caught, so a missing or
	 * unreadable file reaches the console instead of passing for curation.
	 */
	static async load(): Promise<string[]> {
		const location = './gallery-examples.txt';
		const response = await fetch(import.meta.resolve(location));
		if (!response.ok) throw new Error(
			`Gallery examples not loaded from ${response.url}`
			+ ` — ${response.status} ${response.statusText}`);
		return GalleryExamples.parse(await response.text());
	}

	/**
	 * Blank lines are dropped, so the file can be spaced out to be read.
	 * A line is a comment when its first non-blank character is `#`, and only
	 * then: a `#` further along belongs to the example. Stripping from a `#`
	 * onwards would silently truncate a query string that contains one, which
	 * is worse than any comment style is good.
	 */
	static parse(text: string): string[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(line => line.length > 0)
			.filter(line => !line.startsWith('#'));
	}
}
