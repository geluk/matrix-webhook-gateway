import { encode } from 'html-entities';
import { emojify } from 'node-emoji';
import ProfileInfo from '../bridge/ProfileInfo';

/**
 * The base type for any formattable text.
 * Formatting functions will generally accept this type when they need to
 * accept some opaque content, where anything is acceptable as long as it
 * can be formatted.
 *
 * Providing a string when a `Text` type is expected will result in that
 * string being HTML-escaped when its HTML representation is generated.
 * This ensures that the string cannot accidentally be interpreted as
 * valid HTML. If you do want to directly return raw HTML, use the `raw()`
 * function.
 */
export type Text = string | Format;

/**
 * Represents a type that can be formatted. It has two methods, one for
 * formatting its content as HTML, and one for formatting its content as
 * plain text.
 */
export interface Format {
  /**
   * Render the content of this object as HTML.
   */
  formatHtml(): string;
  /**
   * Render the content of this object as plain text.
   */
  formatPlain(): string;
}

/**
 * A utility function for converting a `Text` object to a `Format` object.
 * object.
 *
 * If the object is already `Format` object, it is passed through
 * unchanged.
 *
 * If it's a string, `Format` is implemented on it.
 * To generate plaintext output, the string is returned unchanged.
 * To generate HTML output, the string is HTML-escaped and returned.
 *
 * @param text The object to convert.
 * @returns An object that implements `Format`.
 */
export function toFormat(text: Text): Format {
  if (typeof text === 'string') {
    return {
      formatHtml: () => encode(text),
      formatPlain: () => text,
    };
  }
  return text;
}

/**
 * Format text as HTML.
 * @param text The text to format as HTML.
 * @returns The HTML representation of the provided text.
 */
export function toHtml(text: Text): string {
  return toFormat(text).formatHtml();
}

/**
 * Format text as plain text.
 * @param text The text to format as plain text.
 * @returns The plain text representation of the provided text.
 */
export function toPlain(text: Text): string {
  return toFormat(text).formatPlain();
}

/**
 * Combine one or more `Text` types into a single formattable object.
 * The resulting object's HTML output consists of the HTML output of all
 * the arguments concatenated. The same is done for its plaintext output.
 *
 * @param args The text objects to combine.
 * @returns The generated format object.
 */
export function fmt(...args: Text[]): Format {
  const formattableArgs = args.map(toFormat);
  return {
    formatHtml(): string {
      return formattableArgs.map(toHtml).join('');
    },
    formatPlain(): string {
      return formattableArgs.map(toPlain).join('');
    },
  };
}

/**
 * Create a raw text object. This lets you manually specify the plain text and
 * HTML content of the object. HTML passed into this function is not escaped.
 *
 * @param plain The plain text to produce when this object is rendered.
 * @param html The HTML to produce when this object is rendered.
 * @returns A raw text object that will produce the supplied HTML and plain
 * text content.
 */
export function raw(plain: string, html: string): Format {
  return {
    formatHtml: () => html,
    formatPlain: () => plain,
  };
}

// HTML elements
// -------------

/**
 * Create a link. When called as `a('http://target', 'content')`, renders as:
 *
 * Plain text:
 * ```text
 * content (http://target)
 * ```
 *
 * HTML:
 * ```html
 * <a href="http://target">content</a>
 * ```
 *
 * @param href The link target.
 * @param inner The link text.
 * @returns A text object representing the created link.
 */
export function a(href: string, inner: Text): Format {
  return {
    formatHtml(): string {
      return `<a href="${encode(href)}">${toHtml(inner)}</a>`;
    },
    formatPlain(): string {
      return `${toPlain(inner)} (${href})`;
    },
  };
}

/**
 * Create a line break. Renders as:
 *
 * Plain text:
 * ```text
 * \n
 * ```
 *
 * HTML:
 * ```html
 * <br />
 * ```
 *
 * @returns A text object representing a line break.
 */
export function br(): Format {
  return {
    formatHtml(): string {
      return '<br />';
    },
    formatPlain(): string {
      return '\n';
    },
  };
}

/**
 * Create a block quote. When called as `blockquote('content')`, renders as:
 *
 * Plain text:
 * ```text
 * > content
 * ```
 *
 * HTML:
 * ```html
 * <blockquote>
 * content
 * </blockquote>
 * ```
 *
 * *Note: Normally quotes are expected to start on a new line. To allow
 * for nesting, this is not done by default, so when you create a blockquote,
 * make sure to put a `br()` before it. In HTML, it will automatically work,
 * but in plain text, it won't look right unless you add a line break in
 * front.*
 *
 * @param inner The content of the quote.
 * @returns A text object representing a block quote.
 */
export function blockquote(inner: Text): Format {
  return {
    formatHtml(): string {
      return `<blockquote>${toHtml(inner)}</blockquote>`;
    },
    formatPlain(): string {
      return `> ${toPlain(inner)}`;
    },
  };
}

/**
 * Create an inline code block. In HTML, this will normally render the text
 * with a monospace font. When rendering as plain text, the content is passed
 * throuh unchanged. When called as `code('my code')`, renders as:
 *
 * Plain text:
 * ```text
 * my code
 * ```
 *
 * HTML:
 * ```html
 * <code>
 * my code
 * </code>
 * ```
 *
 * @param inner The content of the code block.
 * @returns A text object representing a code block.
 */
export function code(inner: Text): Format {
  return {
    formatHtml(): string {
      return `<code>${toHtml(inner)}</code>`;
    },
    formatPlain(): string {
      return toFormat(inner).formatPlain();
    },
  };
}

/**
 * Create emphasised (italic) text. When called as `em('text')`, renders as:
 *
 * Plain text:
 * ```text
 * _text_
 * ```
 *
 * HTML:
 * ```html
 * <em>
 * text
 * </em>
 * ```
 *
 * @param inner The text to emphasise.
 * @returns A text object representing the emphasised text.
 */
export function em(inner: Text): Format {
  return {
    formatHtml(): string {
      return `<em>${toHtml(inner)}</em>`;
    },
    formatPlain(): string {
      return `_${toPlain(inner)}_`;
    },
  };
}

/**
 * Create strongly emphasised (bold) text. When called as `strong('text')`,
 * renders as:
 *
 * Plain text:
 * ```text
 * **text**
 * ```
 *
 * HTML:
 * ```html
 * <strong>
 * text
 * </strong>
 * ```
 *
 * @param inner The text to emphasise.
 * @returns A text object representing the emphasised text.
 */
export function strong(inner: Text): Format {
  return {
    formatHtml(): string {
      return `<strong>${toHtml(inner)}</strong>`;
    },
    formatPlain(): string {
      return `**${toPlain(inner)}**`;
    },
  };
}

/**
 * Create an ordered list. When called as `ol('one', 'two', 'three'),
 * renders as:
 *
 * Plain text:
 * ```text
 * 1. one
 * 2. two
 * 3. three
 * ```
 *
 * HTML:
 * ```html
 * <ol>
 *   <li>one</li>
 *   <li>two</li>
 *   <li>three</li>
 * </ol>
 * ```
 *
 * @param entries One or more child items to add to the list.
 * @returns A text object representing the list.
 */
export function ol(...entries: Text[]): Format {
  return {
    formatHtml(): string {
      const fEntries = entries.map((e) => `<li>${toHtml(e)}</li>\n`);
      return `<ol>\n${fEntries.join('')}</ol>`;
    },
    formatPlain(): string {
      const fEntries = entries.map((e, i) => `${i + 1}. ${toPlain(e)}`);
      return fEntries.join('\n');
    },
  };
}

/**
 * Create an unordered list. When called as `ul('one', 'two', 'three'),
 * renders as:
 *
 * Plain text:
 * ```text
 *  * one
 *  * two
 *  * three
 * ```
 *
 * HTML:
 * ```html
 * <ul>
 *   <li>one</li>
 *   <li>two</li>
 *   <li>three</li>
 * </ul>
 * ```
 *
 * @param entries One or more child items to add to the list.
 * @returns A text object representing the list.
 */
export function ul(...entries: Text[]): Format {
  return {
    formatHtml(): string {
      const fEntries = entries.map((e) => `<li>${toHtml(e)}</li>\n`);
      return `<ul>\n${fEntries.join('')}</ul>`;
    },
    formatPlain(): string {
      const fEntries = entries.map((e) => ` * ${toPlain(e)}`);
      return fEntries.join('\n');
    },
  };
}

/**
 * Create a table. The plain text output of this function is not final and may
 * change in future updates.
 *
 * @param head The table headers.
 * @param rows A two-dimensional array representing the rows and columns of
 * the table, respectively.
 * @returns A text object representing the created table.
 */
export function table(head: Text[], rows: Text[][]): Format {
  return {
    formatHtml(): string {
      const fHead = head.map((h) => `<td>${toHtml(h)} </td>`).join('');
      const fBody = rows
        .map(
          (r) => `<tr>${r.map((c) => `<td>${toHtml(c)} </td>`).join('')}</tr>`,
        )
        .join('\n');

      return `<table><thead><tr>${fHead}</tr></thead><tbody>${fBody}</tbody></table>`;
    },
    formatPlain(): string {
      // (ง •̀_•́)ง one day I'll be a real table (ง •̀_•́)ง
      return rows.map((r) => r.map(toPlain).join(' ')).join('\n');
    },
  };
}

// Text processing
// ---------------

/**
 * Truncate a string to the maximum specified length, cutting off all content
 * exceeding this length.
 *
 * @param maxLength The maximum length of text to produce.
 * @param content The text to truncate.
 * @returns A text object producing either truncated or untruncated text,
 * depending on its length.
 */
export function truncate(maxLength: number, content: string): Format {
  const impl = () => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength);
  };
  return {
    formatHtml(): string {
      return encode(impl());
    },
    formatPlain(): string {
      return impl();
    },
  };
}

/**
 * Truncate a string to the maximum specified length, cutting off all content
 * exceeding this length, and replacing it with an ellipsis (`...`).
 * @param maxLength The maximum length of text to produce, excluding the
 * length of the ellipsis.
 * @param content The text to truncate.
 * @returns A text object producing either truncated or untruncated text,
 * depending on its length.
 */
export function preview(maxLength: number, content: string): Format {
  const impl = () => {
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.substring(0, maxLength)}...`;
  };
  return {
    formatHtml(): string {
      return encode(impl());
    },
    formatPlain(): string {
      return impl();
    },
  };
}

/**
 * Renders emoji tags in a string, converting `:smile:` into 😄, for instance.
 * @param content The text to search for emoji tags.
 * @returns A string in which all emoji tags have been replaced with Unicode
 * emoji.
 */
export function renderEmoji(content: string): Format {
  return {
    formatHtml(): string {
      return encode(emojify(content));
    },
    formatPlain(): string {
      return emojify(content);
    },
  };
}

// Control flow
// -------------

/**
 * Only outputs its content when rendering HTML.
 * When called as `ifHtml('content')`,
 * renders as:
 *
 * Plain text:
 * _no plain text is produced_
 *
 * HTML:
 * ```html
 * content
 * ```
 *
 * @param args One or more text objects to render. They will be concatenated
 * similarly to how the `fmt()` concatenates its input, but only when rendering
 * HTML.
 * @returns An object that outputs its content when rendering HTML, and outputs
 * nothing when rendering plain text.
 */
export function ifHtml(...args: Text[]): Format {
  return {
    formatHtml(): string {
      return args.map(toHtml).join('');
    },
    formatPlain(): string {
      return '';
    },
  };
}

/**
 * Only outputs its content when rendering plain text.
 * When called as `ifPlain('content')`,
 * renders as:
 *
 * Plain text:
 * ```plain
 * content
 * ```
 *
 * HTML:
 * _no HTML is produced_
 *
 * @param args One or more text objects to render. They will be concatenated
 * similarly to how the `fmt()` concatenates its input, but only when rendering
 * plain text.
 * @returns An object that outputs its content when rendering plain text, and
 * outputs nothing when rendering HTML.
 */
export function ifPlain(...args: Text[]): Format {
  return {
    formatHtml(): string {
      return '';
    },
    formatPlain(): string {
      return args.map(toPlain).join('');
    },
  };
}

/**
 * Only output content when the supplied string has a nonzero length and
 * isn't null or undefined.
 *
 * @param text The string to check.
 * @param args Text objects to render when the checked text is not empty.
 * @returns An object that outputs the supplied text objects if the checked
 * string is not empty.
 */
export function ifNotEmpty(
  text: string | null | undefined,
  ...args: Text[]
): Format {
  return {
    formatHtml(): string {
      return !text ? '' : args.map(toHtml).join('');
    },
    formatPlain(): string {
      return !text ? '' : args.map(toPlain).join('');
    },
  };
}

/**
 * Render text if a given condition evaluates to true.
 * @param condition The condition to evaluate.
 * @param args The text to render.
 * @returns An object that produces the supplied text if the condition
 * evaluates to true, or nothing otherwise.
 */
export function cond(condition: boolean, ...args: Text[]): Format {
  return {
    formatHtml(): string {
      return condition ? args.map(toHtml).join('') : '';
    },
    formatPlain(): string {
      return condition ? args.map(toPlain).join('') : '';
    },
  };
}

// General formatting
// ------------------

export function surroundWith(
  left: string,
  right: string,
  ...args: Text[]
): Format {
  return {
    formatHtml(): string {
      return left + args.map(toHtml).join('') + right;
    },
    formatPlain(): string {
      return left + args.map(toPlain).join('') + right;
    },
  };
}

export function quote(...args: Text[]): Format {
  return surroundWith('"', '"', ...args);
}

export function parens(...args: Text[]): Format {
  return surroundWith('(', ')', ...args);
}

export function braces(...args: Text[]): Format {
  return surroundWith('{', '}', ...args);
}

export function brackets(...args: Text[]): Format {
  return surroundWith('[', ']', ...args);
}

// Matrix shortcuts
// -------------
export function user(profileInfo: ProfileInfo): Format {
  return {
    formatHtml(): string {
      return `<a href="https://matrix.to/#/${encode(profileInfo.id)}">${encode(
        profileInfo.displayname,
      )}</a>`;
    },
    formatPlain(): string {
      return `${profileInfo.id} (${profileInfo.displayname})`;
    },
  };
}

export function room(roomId: string): Format {
  return {
    formatHtml(): string {
      return `<a href="https://matrix.to/#/${encode(roomId)}">${encode(
        roomId,
      )}</a>`;
    },
    formatPlain(): string {
      return roomId;
    },
  };
}

export function fg(color: string, inner: Text): Format {
  return {
    formatHtml(): string {
      return `<span data-mx-color="${color}">${toHtml(inner)}</span>`;
    },
    formatPlain(): string {
      return toFormat(inner).formatPlain();
    },
  };
}
