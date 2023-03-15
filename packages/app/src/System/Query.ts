import { Connection, RawReqFilter } from "@snort/nostr";
import { unixNowMs } from "Util";

export interface QueryRequest {
  filters: Array<RawReqFilter>;
  started: number;
  finished?: number;
}

/**
 * Active or queued query on the system
 */
export class Query {
  /**
   * Uniquie ID of this query
   */
  id: string;

  /**
   * The query payload (REQ filters)
   */
  request: QueryRequest;

  /**
   * Sub-Queries which are connected to this subscription
   */
  subQueries: Array<Query> = [];

  /**
   * Which relays this query has already been executed on
   */
  #sentToRelays: Array<Readonly<Connection>> = [];

  /**
   * Leave the query open until its removed
   */
  leaveOpen = false;

  /**
   * Time when this query can be removed
   */
  #cancelTimeout?: number;

  constructor(id: string, request: QueryRequest) {
    this.id = id;
    this.request = request;
  }

  get closing() {
    return this.#cancelTimeout !== undefined;
  }

  get closingAt() {
    return this.#cancelTimeout;
  }

  cancel() {
    this.#cancelTimeout = unixNowMs() + 5_000;
  }

  unCancel() {
    this.#cancelTimeout = undefined;
  }

  sendToRelay(c: Connection) {
    c._SendJson(["REQ", this.id, ...this.request.filters]);
    this.#sentToRelays.push(c);
  }

  sendClose() {
    for (const c of this.#sentToRelays) {
      c._SendJson(["CLOSE", this.id]);
    }
  }
}
