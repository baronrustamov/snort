import { RawReqFilter } from "@snort/nostr";
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
  sentToRelays: Array<string> = [];

  /**
   * Which relays we want to send this query on
   */
  shouldSendTo: Array<string> = [];

  #cancelTimeout?: number;

  constructor(id: string, request: QueryRequest) {
    this.id = id;
    this.request = request;
  }

  get closing() {
    return this.#cancelTimeout !== undefined;
  }

  cancel() {
    this.#cancelTimeout = unixNowMs() + 5_000;
  }

  unCancel() {
    this.#cancelTimeout = undefined;
  }
}
