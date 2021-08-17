import { encode } from 'html-entities';
import ProfileInfo from '../bridge/ProfileInfo';

export interface Format {
  formatHtml(): string;
  formatPlain(): string;
}

export type Text = string | Format;

export function toFormat(text: Text): Format {
  if (typeof text === 'string') {
    return {
      formatHtml: () => encode(text),
      formatPlain: () => text,
    };
  }
  return text;
}

export function toHtml(text: Text): string {
  return toFormat(text).formatHtml();
}

export function toPlain(text: Text): string {
  return toFormat(text).formatPlain();
}

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

// HTML elements
// -------------
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

export function blockquote(inner: Text): Format {
  return {
    formatHtml(): string {
      return `<blockquote>${toHtml(inner)}</blockquote>`;
    },
    formatPlain(): string {
      return `\n> ${toPlain(inner)}`;
    },
  };
}

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

export function ol(entries: Text[]): Format {
  return {
    formatHtml(): string {
      const fEntries = entries.map((e) => `<li>${toHtml(e)}</li>\n`);
      return `<ol>\n${fEntries.join('')}</ol>`;
    },
    formatPlain(): string {
      const fEntries = entries.map((e, i) => `${i + 1}: ${toPlain(e)}`);
      return fEntries.join('\n');
    },
  };
}

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

export function table(head: Text[], rows: Text[][]): Format {
  return {
    formatHtml(): string {
      const fHead = head.map((h) => `<td>${toHtml(h)}</td>`).join('');
      const fBody = rows.map((r) => `<tr>${r.map((c) => `<td>${toHtml(c)}</td>`).join('')}</tr>`).join('\n');

      return `<table><thead><tr>${fHead}</tr></thead><tbody>${fBody}</tbody></table>`;
    },
    formatPlain(): string {
      // (ง •̀_•́)ง one day I'll be a real table (ง •̀_•́)ง
      return rows.map((r) => r.map(toPlain).join(' ')).join('\n');
    },
  };
}

export function ul(entries: Text[]): Format {
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

// Matrix shortcuts
// -------------
export function user(profileInfo: ProfileInfo): Format {
  return {
    formatHtml(): string {
      return `<a href="https://matrix.to/#/${encode(profileInfo.id)}">${encode(profileInfo.displayname)}</a>`;
    },
    formatPlain(): string {
      return `${profileInfo.id} (${profileInfo.displayname})`;
    },
  };
}

export function room(roomId: string): Format {
  return {
    formatHtml(): string {
      return `<a href="https://matrix.to/#/${encode(roomId)}"></a>`;
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
