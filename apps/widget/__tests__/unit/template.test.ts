import { describe, it, expect } from 'vitest';
import { html, esc, raw, SafeHTML } from '../../src/template';

describe('esc()', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(esc('a & b')).toBe('a &amp; b');
  });

  it('returns plain text unchanged', () => {
    expect(esc('Hello World')).toBe('Hello World');
  });
});

describe('html`` tagged template', () => {
  it('auto-escapes interpolated strings', () => {
    const userInput = '<img onerror=alert(1)>';
    const result = html`<p>${userInput}</p>`;
    expect(result).toBeInstanceOf(SafeHTML);
    expect(result.value).toBe('<p>&lt;img onerror=alert(1)&gt;</p>');
  });

  it('passes SafeHTML through unescaped', () => {
    const trusted = new SafeHTML('<strong>bold</strong>');
    const result = html`<div>${trusted}</div>`;
    expect(result.value).toBe('<div><strong>bold</strong></div>');
  });

  it('joins arrays', () => {
    const items = ['one', 'two'];
    const result = html`<ul>${items}</ul>`;
    expect(result.value).toBe('<ul>onetwo</ul>');
  });

  it('handles SafeHTML items in arrays', () => {
    const items = [html`<li>a</li>`, html`<li>b</li>`];
    const result = html`<ul>${items}</ul>`;
    expect(result.value).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('skips null and undefined', () => {
    const result = html`<p>${null}${undefined}</p>`;
    expect(result.value).toBe('<p></p>');
  });

  it('skips false for conditional rendering', () => {
    const show = false;
    const result = html`<div>${show && html`<span>hidden</span>`}</div>`;
    expect(result.value).toBe('<div></div>');
  });

  it('renders truthy conditionals', () => {
    const show = true;
    const result = html`<div>${show && html`<span>visible</span>`}</div>`;
    expect(result.value).toBe('<div><span>visible</span></div>');
  });
});

describe('raw()', () => {
  it('wraps a string as SafeHTML', () => {
    const result = raw('<b>trusted</b>');
    expect(result).toBeInstanceOf(SafeHTML);
    expect(result.value).toBe('<b>trusted</b>');
  });
});
