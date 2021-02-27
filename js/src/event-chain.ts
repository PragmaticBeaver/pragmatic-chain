export interface IChain {
  add(placeInOrder: number, cb: ChainCallback): ChainToken;
  remove(token: ChainToken): void;
  call(...args: unknown[]): Promise<unknown>;
  isEmpty(): boolean;
}

export interface ChainToken {
  id: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChainCallback = (...args: any[]) => Promise<any>;

class ChainLink {
  private callback: ChainCallback;

  constructor(cb: ChainCallback) {
    this.callback = cb;
  }

  public async call(...args: unknown[]): Promise<unknown> {
    return await this.callback(...args);
  }
}

class EventChain implements IChain {
  private chainLinks: Map<number, ChainLink> = new Map();

  public add(chainIndex: number, cb: ChainCallback): ChainToken {
    const indexUsed = this.chainLinks.has(chainIndex);
    if (indexUsed) {
      chainIndex = this.getNextIndex(chainIndex);
    }

    this.chainLinks.set(chainIndex, new ChainLink(cb));

    const token: ChainToken = { id: chainIndex };
    return token;
  }

  public remove(token: ChainToken): void {
    const hasId = this.chainLinks.has(token.id);
    if (!hasId) {
      return;
    }

    this.chainLinks.delete(token.id);
  }

  public async call(...args: unknown[]): Promise<unknown> {
    let intermediateResult: unknown;

    let keys = Array.from(this.chainLinks.keys());
    keys = keys.sort();
    for (const key of keys) {
      const chainLink = this.chainLinks.get(key);
      if (!chainLink) {
        continue;
      }
      intermediateResult = intermediateResult
        ? await chainLink.call(intermediateResult)
        : await chainLink.call(...args);
    }
    return intermediateResult;
  }

  public isEmpty(): boolean {
    return this.chainLinks.size <= 0;
  }

  private getNextIndex(chainIndex: number): number {
    const hasKey = this.chainLinks.has(chainIndex);
    if (hasKey) {
      return this.getNextIndex(chainIndex + 1);
    }
    return chainIndex;
  }
}

export interface IEventChain {
  subscribe(topic: string, cb: ChainCallback, placeInOrder: number): ChainToken;
  unsubscribe(token: ChainToken): void;
  publish(topic: string, ...args: unknown[]): Promise<unknown>;
}

export class PragmaticEventChain implements IEventChain {
  private subs: Map<string, IChain> = new Map();

  public subscribe(
    topic: string,
    cb: ChainCallback,
    placeInChain = 500
  ): ChainToken {
    const topicUnknown = !this.subs.has(topic);
    if (topicUnknown) {
      this.subs.set(topic, new EventChain());
    }
    const chain = this.subs.get(topic) as IChain;
    return chain.add(placeInChain, cb);
  }

  public unsubscribe(token: ChainToken): void {
    for (const topic of this.subs.keys()) {
      const chain = this.subs.get(topic);
      if (!chain) {
        return;
      }

      chain.remove(token);

      const noSubsLeft = chain.isEmpty();
      if (noSubsLeft) {
        this.subs.delete(topic);
      }
    }
  }

  public async publish(topic: string, ...args: unknown[]): Promise<unknown> {
    const chainUnknown = !this.subs.has(topic);
    if (chainUnknown) {
      return;
    }

    const chain = this.subs.get(topic);
    if (!chain) {
      return;
    }

    return await chain.call(...args);
  }
}
