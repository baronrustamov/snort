import "./Thread.css";
import { useMemo, useState, useEffect, ReactNode } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { TaggedRawEvent, u256, HexKey, EventKind } from "@snort/nostr";
import { EventExt, Thread as ThreadInfo } from "System/EventExt";

import { eventLink, unwrap, parseId } from "Util";
import BackButton from "Element/BackButton";
import Note from "Element/Note";
import NoteGhost from "Element/NoteGhost";
import Collapsed from "Element/Collapsed";

import messages from "./messages";

function getParent(ev: HexKey, chains: Map<HexKey, Array<TaggedRawEvent>>): HexKey | undefined {
  for (const [k, vs] of chains.entries()) {
    const fs = vs.map(a => a.id);
    if (fs.includes(ev)) {
      return k;
    }
  }
}

interface DividerProps {
  variant?: "regular" | "small";
}

const Divider = ({ variant = "regular" }: DividerProps) => {
  const className = variant === "small" ? "divider divider-small" : "divider";
  return (
    <div className="divider-container">
      <div className={className}></div>
    </div>
  );
};

interface SubthreadProps {
  isLastSubthread?: boolean;
  from: u256;
  active: u256;
  path: u256[];
  notes: readonly TaggedRawEvent[];
  related: readonly TaggedRawEvent[];
  chains: Map<u256, Array<TaggedRawEvent>>;
  onNavigate: (e: u256) => void;
}

const Subthread = ({ active, path, notes, related, chains, onNavigate }: SubthreadProps) => {
  const renderSubthread = (a: TaggedRawEvent, idx: number) => {
    const isLastSubthread = idx === notes.length - 1;
    const replies = getReplies(a.id, chains);
    return (
      <>
        <div className={`subthread-container ${replies.length > 0 ? "subthread-multi" : ""}`}>
          <Divider />
          <Note
            highlight={active === a.id}
            className={`thread-note ${isLastSubthread && replies.length === 0 ? "is-last-note" : ""}`}
            data={a}
            key={a.id}
            related={related}
          />
          <div className="line-container"></div>
        </div>
        {replies.length > 0 && (
          <TierTwo
            active={active}
            isLastSubthread={isLastSubthread}
            path={path}
            from={a.id}
            notes={replies}
            related={related}
            chains={chains}
            onNavigate={onNavigate}
          />
        )}
      </>
    );
  };

  return <div className="subthread">{notes.map(renderSubthread)}</div>;
};

interface ThreadNoteProps extends Omit<SubthreadProps, "notes"> {
  note: TaggedRawEvent;
  isLast: boolean;
}

const ThreadNote = ({
  active,
  note,
  isLast,
  path,
  isLastSubthread,
  from,
  related,
  chains,
  onNavigate,
}: ThreadNoteProps) => {
  const { formatMessage } = useIntl();
  const replies = getReplies(note.id, chains);
  const activeInReplies = replies.map(r => r.id).includes(active);
  const [collapsed, setCollapsed] = useState(!activeInReplies);
  const hasMultipleNotes = replies.length > 0;
  const isLastVisibleNote = isLastSubthread && isLast && !hasMultipleNotes;
  const className = `subthread-container ${isLast && collapsed ? "subthread-last" : "subthread-multi subthread-mid"}`;
  return (
    <>
      <div className={className}>
        <Divider variant="small" />
        <Note
          highlight={active === note.id}
          className={`thread-note ${isLastVisibleNote ? "is-last-note" : ""}`}
          data={note}
          key={note.id}
          related={related}
        />
        <div className="line-container"></div>
      </div>
      {replies.length > 0 &&
        (activeInReplies ? (
          <TierThree
            active={active}
            path={path}
            isLastSubthread={isLastSubthread}
            from={from}
            notes={replies}
            related={related}
            chains={chains}
            onNavigate={onNavigate}
          />
        ) : (
          <Collapsed text={formatMessage(messages.ShowReplies)} collapsed={collapsed} setCollapsed={setCollapsed}>
            <TierThree
              active={active}
              path={path}
              isLastSubthread={isLastSubthread}
              from={from}
              notes={replies}
              related={related}
              chains={chains}
              onNavigate={onNavigate}
            />
          </Collapsed>
        ))}
    </>
  );
};

const TierTwo = ({ active, isLastSubthread, path, from, notes, related, chains, onNavigate }: SubthreadProps) => {
  const [first, ...rest] = notes;

  return (
    <>
      <ThreadNote
        active={active}
        path={path}
        from={from}
        onNavigate={onNavigate}
        note={first}
        chains={chains}
        related={related}
        isLastSubthread={isLastSubthread}
        isLast={rest.length === 0}
      />

      {rest.map((r: TaggedRawEvent, idx: number) => {
        const lastReply = idx === rest.length - 1;
        return (
          <ThreadNote
            active={active}
            path={path}
            from={from}
            onNavigate={onNavigate}
            note={r}
            chains={chains}
            related={related}
            isLastSubthread={isLastSubthread}
            isLast={lastReply}
          />
        );
      })}
    </>
  );
};

const TierThree = ({ active, path, isLastSubthread, from, notes, related, chains, onNavigate }: SubthreadProps) => {
  const [first, ...rest] = notes;
  const replies = getReplies(first.id, chains);
  const activeInReplies = notes.map(r => r.id).includes(active) || replies.map(r => r.id).includes(active);
  const hasMultipleNotes = rest.length > 0 || replies.length > 0;
  const isLast = replies.length === 0 && rest.length === 0;
  return (
    <>
      <div
        className={`subthread-container ${hasMultipleNotes ? "subthread-multi" : ""} ${
          isLast ? "subthread-last" : "subthread-mid"
        }`}>
        <Divider variant="small" />
        <Note
          highlight={active === first.id}
          className={`thread-note ${isLastSubthread && isLast ? "is-last-note" : ""}`}
          data={first}
          key={first.id}
          related={related}
        />
        <div className="line-container"></div>
      </div>

      {path.length <= 1 || !activeInReplies
        ? replies.length > 0 && (
            <div className="show-more-container">
              <button className="show-more" type="button" onClick={() => onNavigate(from)}>
                <FormattedMessage {...messages.ShowReplies} />
              </button>
            </div>
          )
        : replies.length > 0 && (
            <TierThree
              active={active}
              path={path.slice(1)}
              isLastSubthread={isLastSubthread}
              from={from}
              notes={replies}
              related={related}
              chains={chains}
              onNavigate={onNavigate}
            />
          )}

      {rest.map((r: TaggedRawEvent, idx: number) => {
        const lastReply = idx === rest.length - 1;
        const lastNote = isLastSubthread && lastReply;
        return (
          <div
            key={r.id}
            className={`subthread-container ${lastReply ? "" : "subthread-multi"} ${
              lastReply ? "subthread-last" : "subthread-mid"
            }`}>
            <Divider variant="small" />
            <Note
              className={`thread-note ${lastNote ? "is-last-note" : ""}`}
              highlight={active === r.id}
              data={r}
              key={r.id}
              related={related}
            />
            <div className="line-container"></div>
          </div>
        );
      })}
    </>
  );
};

export interface ThreadProps {
  notes?: readonly TaggedRawEvent[];
}

export default function Thread(props: ThreadProps) {
  const notes = useMemo(() => props.notes ?? [], [props.notes]);
  const [path, setPath] = useState<HexKey[]>([]);
  const currentId = path.length > 0 && path[path.length - 1];
  const currentRoot = useMemo(() => notes.find(a => a.id === currentId), [notes, currentId]);
  const [navigated, setNavigated] = useState(false);
  const navigate = useNavigate();
  const isSingleNote = notes.filter(a => a.kind === EventKind.TextNote).length === 1;
  const location = useLocation();
  const { formatMessage } = useIntl();
  const urlNoteId = location?.pathname.slice(3);
  const urlNoteHex = urlNoteId && parseId(urlNoteId);

  const chains = useMemo(() => {
    const chains = new Map<u256, Array<TaggedRawEvent>>();
    notes
      ?.filter(a => a.kind === EventKind.TextNote)
      .sort((a, b) => b.created_at - a.created_at)
      .forEach(v => {
        const thread = EventExt.extractThread(v);
        const replyTo = thread?.replyTo?.Event ?? thread?.root?.Event;
        if (replyTo) {
          if (!chains.has(replyTo)) {
            chains.set(replyTo, [v]);
          } else {
            unwrap(chains.get(replyTo)).push(v);
          }
        } else if (v.tags.length > 0) {
          //console.log("Not replying to anything: ", v);
        }
      });

    return chains;
  }, [notes]);

  const root = useMemo(() => {
    const currentNote = notes.find(ne => ne.id === urlNoteHex);
    if (currentNote) {
      const currentThread = EventExt.extractThread(currentNote);
      const isRoot = (ne?: ThreadInfo) => ne?.root === undefined;

      if (isRoot(currentThread)) {
        return currentNote;
      }

      const rootEventId = currentThread?.root?.Event;

      // sometimes the root event ID is missing, and we can only take the happy path if the root event ID exists
      if (rootEventId) {
        return notes.find(ne => ne.id === rootEventId);
      }

      const possibleRoots = notes.filter(a => {
        const thread = EventExt.extractThread(a);
        return isRoot(thread);
      });

      // worst case we need to check every possible root to see which one contains the current note as a child
      for (const ne of possibleRoots) {
        const children = chains.get(ne.id) ?? [];

        if (children.find(ne => ne.id === urlNoteHex)) {
          return ne;
        }
      }
    }
  }, [notes, chains, urlNoteHex]);

  useEffect(() => {
    if (!root) {
      return;
    }

    if (navigated) {
      return;
    }

    if (root.id === urlNoteHex) {
      setPath([root.id]);
      setNavigated(true);
      return;
    }

    const subthreadPath = [];
    let parent = getParent(urlNoteHex, chains);
    while (parent) {
      subthreadPath.unshift(parent);
      parent = getParent(parent, chains);
    }
    setPath(subthreadPath);
    setNavigated(true);
  }, [root, navigated, urlNoteHex, chains]);

  const brokenChains = useMemo(() => {
    return Array.from(chains?.keys()).filter(a => !notes?.some(b => b.id === a));
  }, [chains, notes]);

  function renderRoot(note: TaggedRawEvent) {
    const className = `thread-root ${isSingleNote ? "thread-root-single" : ""}`;
    if (note) {
      return (
        <Note className={className} key={note.id} data={note} related={notes} options={{ showReactionsLink: true }} />
      );
    } else {
      return <NoteGhost className={className}>Loading thread root.. ({notes?.length} notes loaded)</NoteGhost>;
    }
  }

  function onNavigate(to: u256) {
    setPath([...path, to]);
  }

  function renderChain(from: u256): ReactNode {
    if (!from || !chains) {
      return;
    }
    const replies = chains.get(from);
    if (replies) {
      return (
        <Subthread
          active={urlNoteHex}
          path={path}
          from={from}
          notes={replies}
          related={notes}
          chains={chains}
          onNavigate={onNavigate}
        />
      );
    }
  }

  function goBack() {
    if (path.length > 1) {
      const newPath = path.slice(0, path.length - 1);
      setPath(newPath);
    } else {
      navigate(location.state?.from ?? "/");
    }
  }

  const parentText = formatMessage({
    defaultMessage: "Parent",
    description: "Link to parent note in thread",
  });
  const backText = formatMessage({
    defaultMessage: "Back",
    description: "Navigate back button on threads view",
  });
  return (
    <div className="main-content mt10">
      <BackButton onClick={goBack} text={path?.length > 1 ? parentText : backText} />
      <div className="thread-container">
        {currentRoot && renderRoot(currentRoot)}
        {currentRoot && renderChain(currentRoot.id)}
        {currentRoot === root && (
          <>
            {brokenChains.length > 0 && <h3>Other replies</h3>}
            {brokenChains.map(a => {
              return (
                <div className="mb10">
                  <NoteGhost className={`thread-note thread-root ghost-root`} key={a}>
                    Missing event <Link to={eventLink(a)}>{a.substring(0, 8)}</Link>
                  </NoteGhost>
                  {renderChain(a)}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function getReplies(from: u256, chains?: Map<u256, Array<TaggedRawEvent>>): Array<TaggedRawEvent> {
  if (!from || !chains) {
    return [];
  }
  const replies = chains.get(from);
  return replies ? replies : [];
}
