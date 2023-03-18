import { EventKind, RawEvent, Unsigned } from "."

export interface TextNote extends RawEvent {
  kind: EventKind.TextNote
}

export function createTextNote(content: string): Unsigned<TextNote> {
  return {
    kind: EventKind.TextNote,
    tags: [],
    content,
  }
}
