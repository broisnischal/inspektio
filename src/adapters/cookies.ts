export type BrowserCookieOptions = {
  url?: string; // Optional now
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expirationDate?: number;
  sameSite?: "no_restriction" | "lax" | "strict";
  storeId?: string;
};

export class BrowserCookieAdapter {
  // @ts-expect-error
  private api = chrome?.cookies ?? (browser as any)?.cookies;

  async set(
    name: string,
    value: string,
    options: BrowserCookieOptions & { domain: string }
  ): Promise<void> {
    const url = options.url ?? this.inferUrl(options);
    await this.api.set({
      name,
      value,
      url,
      path: options.path,
      domain: options.domain,
      secure: options.secure,
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
      expirationDate: options.expirationDate,
      storeId: options.storeId,
    });
  }

  async get(name: string, domain: string): Promise<string | undefined> {
    const cookies = await this.api.getAll({ domain });
    const found = cookies.find((c) => c.name === name);
    return found?.value;
  }

  async delete(name: string, domain: string, path = "/") {
    const url = this.inferUrl({ domain, path });
    await this.api.remove({ name, url });
  }

  async all(): Promise<Record<string, Record<string, string>>> {
    const cookies = await this.api.getAll({});
    const map: Record<string, Record<string, string>> = {};
    for (const cookie of cookies) {
      if (!map[cookie.domain]) map[cookie.domain] = {};
      map[cookie.domain][cookie.name] = cookie.value;
    }
    return map;
  }

  async entries(): Promise<[string, string][]> {
    const cookies = await this.api.getAll({});
    return cookies.map((c) => [`${c.domain}:${c.name}`, c.value]);
  }

  async keys(): Promise<string[]> {
    const cookies = await this.api.getAll({});
    return cookies.map((c) => c.name);
  }

  async has(name: string, domain: string): Promise<boolean> {
    return !!(await this.get(name, domain));
  }

  async find(
    predicate: (name: string, value: string, domain: string) => boolean
  ): Promise<[string, string, string] | undefined> {
    const cookies = await this.api.getAll({});
    const found = cookies.find((c) => predicate(c.name, c.value, c.domain));
    return found ? [found.name, found.value, found.domain] : undefined;
  }

  async filter(
    predicate: (name: string, value: string, domain: string) => boolean
  ): Promise<Record<string, Record<string, string>>> {
    const cookies = await this.api.getAll({});
    const result: Record<string, Record<string, string>> = {};
    for (const c of cookies) {
      if (predicate(c.name, c.value, c.domain)) {
        if (!result[c.domain]) result[c.domain] = {};
        result[c.domain][c.name] = c.value;
      }
    }
    return result;
  }

  async clear(): Promise<void> {
    const cookies = await this.api.getAll({});
    for (const c of cookies) {
      const url = this.inferUrl({
        domain: c.domain,
        path: c.path,
        secure: c.secure,
      });
      await this.api.remove({ name: c.name, url });
    }
  }

  private inferUrl(opts: {
    domain: string;
    path?: string;
    secure?: boolean;
  }): string {
    const protocol = opts.secure ? "https" : "http";
    const host = opts.domain.replace(/^\./, ""); // Strip leading dot
    const path = opts.path ?? "/";
    return `${protocol}://${host}${path}`;
  }
}
