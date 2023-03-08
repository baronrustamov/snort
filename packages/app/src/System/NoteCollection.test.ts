import { TaggedRawEvent } from "@snort/nostr";
import { FlatNoteStore, ReplaceableNoteStore } from "./NoteCollection";

describe("NoteStore", () => {
  describe("flat", () => {
    test("one event", () => {
      const ev = { id: "one" } as TaggedRawEvent;
      const c = new FlatNoteStore();
      c.addNote(ev);
      expect(c.getSnapshot()).toEqual([ev]);
    });
    test("still one event", () => {
      const ev = { id: "one" } as TaggedRawEvent;
      const c = new FlatNoteStore();
      c.addNote(ev);
      c.addNote(ev);
      expect(c.getSnapshot()).toEqual([ev]);
    });
    test("clears", () => {
      const ev = { id: "one" } as TaggedRawEvent;
      const c = new FlatNoteStore();
      c.addNote(ev);
      expect(c.getSnapshot()).toEqual([ev]);
      c.clear();
      expect(c.getSnapshot()).toEqual([]);
    });
  });
  describe("replacable", () => {
    test("one event", () => {
      const ev = { id: "test", created_at: 69 } as TaggedRawEvent;
      const c = new ReplaceableNoteStore();
      c.addNote(ev);
      expect(c.getSnapshot()).toEqual(ev);
    });
    test("dont replace with older", () => {
      const ev = { id: "test", created_at: 69 } as TaggedRawEvent;
      const evOlder = { id: "test2", created_at: 68 } as TaggedRawEvent;
      const c = new ReplaceableNoteStore();
      c.addNote(ev);
      c.addNote(evOlder);
      expect(c.getSnapshot()).toEqual(ev);
    });
    test("replace with newer", () => {
      const ev = { id: "test", created_at: 69 } as TaggedRawEvent;
      const evNewer = { id: "test2", created_at: 70 } as TaggedRawEvent;
      const c = new ReplaceableNoteStore();
      c.addNote(ev);
      c.addNote(evNewer);
      expect(c.getSnapshot()).toEqual(evNewer);
    });
  });
});
