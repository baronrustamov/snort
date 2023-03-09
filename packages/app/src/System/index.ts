import { AuthHandler, TaggedRawEvent, Event as NEvent, RelaySettings, Connection, RawReqFilter } from "@snort/nostr";

import { sanitizeRelayUrl, unixNowMs, unwrap } from "Util";
import { RequestBuilder } from "./RequestBuilder";
import {
  FlatNoteStore,
  NoteStore,
  PubkeyReplaceableNoteStore,
  ParameterizedReplaceableNoteStore,
} from "./NoteCollection";
import { diffFilters } from "./RequestSplitter";
import { Query } from "./Query";

export {
  NoteStore,
  RequestBuilder,
  FlatNoteStore,
  PubkeyReplaceableNoteStore,
  ParameterizedReplaceableNoteStore,
  Query,
};

/**
 * Manages nostr content retrieval system
 */
export class NostrSystem {
  /**
   * All currently connected websockets
   */
  Sockets: Map<string, Connection>;

  /**
   * All active queries
   */
  Queries: Map<string, Query> = new Map();

  /**
   * Collection of all feeds which are keyed by subscription id
   */
  Feeds: Map<string, NoteStore> = new Map();

  /**
   * Handler function for NIP-42
   */
  HandleAuth?: AuthHandler;

  constructor() {
    this.Sockets = new Map();
  }

  /**
   * Connect to a NOSTR relay if not already connected
   */
  async ConnectToRelay(address: string, options: RelaySettings) {
    try {
      const addr = unwrap(sanitizeRelayUrl(address));
      if (!this.Sockets.has(addr)) {
        const c = new Connection(addr, options, this.HandleAuth);
        this.Sockets.set(addr, c);
        c.OnEvent = (s, e) => this.OnEvent(s, e);
        c.OnEose = s => this.OnEndOfStoredEvents(c, s);
        c.OnConnected = () => {
          for (const [, q] of this.Queries) {
            if (!q.closing) {
              c._SendJson(["REQ", q.id, ...q.request.filters]);
            }
          }
        };
        await c.Connect();
      } else {
        // update settings if already connected
        unwrap(this.Sockets.get(addr)).Settings = options;
      }
    } catch (e) {
      console.error(e);
    }
  }

  OnEndOfStoredEvents(c: Connection, sub: string) {
    const q = this.GetQuery(sub);
    if (q) {
      q.request.finished = unixNowMs();
      const f = this.Feeds.get(sub);
      if (f) {
        f.eose(true);
      }
    }
    c._SendJson(["CLOSE", sub]);
  }

  OnEvent(sub: string, ev: TaggedRawEvent) {
    const feed = this.GetFeed(sub);
    if (feed) {
      feed.add(ev);
    }
  }

  GetFeed(sub: string) {
    const subFilterId = /-\d+$/i;
    if (sub.match(subFilterId)) {
      // feed events back into parent query
      sub = sub.split(subFilterId)[0];
    }
    return this.Feeds.get(sub);
  }

  GetQuery(sub: string) {
    const subFilterId = /-\d+$/i;
    if (sub.match(subFilterId)) {
      // feed events back into parent query
      sub = sub.split(subFilterId)[0];
    }
    return this.Queries.get(sub);
  }

  /**
   *
   * @param address Relay address URL
   */
  async ConnectEphemeralRelay(address: string): Promise<Connection | undefined> {
    try {
      const addr = unwrap(sanitizeRelayUrl(address));
      if (!this.Sockets.has(addr)) {
        const c = new Connection(addr, { read: true, write: false }, this.HandleAuth, true);
        this.Sockets.set(addr, c);
        c.OnEvent = (s, e) => this.OnEvent(s, e);
        c.OnEose = s => this.OnEndOfStoredEvents(c, s);
        c.OnConnected = () => {
          for (const [, q] of this.Queries) {
            if (q) {
              c._SendJson(["REQ", q.id, ...q.request.filters]);
            }
          }
        };
        await c.Connect();
        return c;
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Disconnect from a relay
   */
  DisconnectRelay(address: string) {
    const c = this.Sockets.get(address);
    if (c) {
      this.Sockets.delete(address);
      c.Close();
    }
  }

  Query<T extends NoteStore>(type: { new (): T }, req: RequestBuilder | null): Readonly<T> {
    /**
     * ## Notes
     *
     * Given a set of existing filters:
     * ["REQ", "1", { kinds: [0, 7], authors: [...], since: now()-1hr, until: now() }]
     * ["REQ", "2", { kinds: [0, 7], authors: [...], since: now(), limit: 0 }]
     *
     * ## Problem 1:
     * Assume we now want to update sub "1" with a new set of authors,
     * what should we do, should we close sub "1" and send the new set or create another
     * subscription with the new pubkeys (diff)
     *
     * Creating a new subscription sounds great but also is a problem when relays limit
     * active subscriptions, maybe we should instead queue the new
     * subscription (assuming that we expect to close at EOSE)
     *
     * ## Problem 2:
     * When multiple filters a specifid in a single filter but only 1 filter changes,
     * ~~same as above~~
     *
     * Seems reasonable to do "Queue Diff", should also be possible to collapse multiple
     * pending filters for the same subscription
     */

    if (!req) return new type();

    const filters = req.build();
    if (this.Queries.has(req.id)) {
      const q = unwrap(this.Queries.get(req.id));
      q.unCancel();

      const diff = diffFilters(q.request.filters, filters);
      if (!diff.changed) {
        return unwrap(this.Feeds.get(req.id)) as Readonly<T>;
      } else {
        const subQ = new Query(`${q.id}-${q.subQueries.length + 1}`, {
          filters: diff.filters,
          started: unixNowMs(),
        });
        q.subQueries.push(subQ);
        q.request.filters = filters;
        const f = unwrap(this.Feeds.get(req.id));
        f.eose(false);
        this.SendQuery(subQ.id, subQ.request.filters);
        return f as Readonly<T>;
      }
    } else {
      return this.AddQuery<T>(type, req.id, filters);
    }
  }

  AddQuery<T extends NoteStore>(type: { new (): T }, id: string, filters: Array<RawReqFilter>): T {
    const q = new Query(id, {
      filters: filters,
      started: unixNowMs(),
      finished: 0,
    });

    this.Queries.set(id, q);
    const store = new type();
    this.Feeds.set(id, store);

    this.SendQuery(q.id, q.request.filters);
    return store;
  }

  CancelQuery(sub: string) {
    const q = this.Queries.get(sub);
    if (q) {
      q.cancel();
      console.debug("Cancel", q);
    }
  }

  SendQuery(id: string, filters: Array<RawReqFilter>) {
    for (const [, s] of this.Sockets) {
      s._SendJson(["REQ", id, ...filters]);
    }
  }

  /**
   * Send events to writable relays
   */
  BroadcastEvent(ev: NEvent) {
    for (const [, s] of this.Sockets) {
      s.SendEvent(ev);
    }
  }

  /**
   * Write an event to a relay then disconnect
   */
  async WriteOnceToRelay(address: string, ev: NEvent) {
    const c = new Connection(address, { write: true, read: false }, this.HandleAuth, true);
    await c.Connect();
    await c.SendAsync(ev);
    c.Close();
  }
}

export const System = new NostrSystem();
