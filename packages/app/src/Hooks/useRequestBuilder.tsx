import { useEffect } from "react";
import { RequestBuilder, System, NoteStore } from "System";
import useNoteStore from "Hooks/useNoteStore";

function useRequestBuilder<T extends NoteStore>(type: { new (): T }, rb: RequestBuilder | null) {
  const q = System.Query<T>(type, rb);
  const data = useNoteStore(q);
  useEffect(() => {
    if (rb) {
      return () => System.CancelQuery(rb.id);
    }
  }, [rb]);
  return data;
}

export default useRequestBuilder;
