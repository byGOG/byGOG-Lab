/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('theme toggle', () => {
  let document;
  let window;

  beforeEach(() => {
    const filePath = path.join(__dirname, '..', 'byGOG-Lab.html');
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
    document = dom.window.document;
    window = dom.window;
  });

  test('body class and button text toggle', () => {
    const button = document.getElementById('theme-toggle');
    const body = document.body;

    expect(body.classList.contains('koyu')).toBe(false);
    expect(button.textContent).toBe('🌙');

    button.click();

    expect(body.classList.contains('koyu')).toBe(true);
    expect(button.textContent).toBe('☀️');

    button.click();

    expect(body.classList.contains('koyu')).toBe(false);
    expect(button.textContent).toBe('🌙');
  });
});
