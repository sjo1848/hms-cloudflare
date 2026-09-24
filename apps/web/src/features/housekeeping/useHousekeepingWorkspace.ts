import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadHousekeepingBoard, runHousekeepingAction } from "./housekeeping-api";
import {
  buildHousekeepingQueue,
  filterHousekeepingQueue,
  newHousekeepingDraft,
  type HousekeepingBoard,
  type HousekeepingDraft,
  type HousekeepingQueueItem,
} from "./model";

function actionableTasks(items: HousekeepingQueueItem[]) {
  return items.filter(item => item.priorityRank < 8);
}

export function useHousekeepingWorkspace() {
  const [board, setBoard] = useState<HousekeepingBoard>({ date: "", rooms: [], departures_today: [] });
  const [boardDate, setBoardDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("shift");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, HousekeepingDraft>>({});
  const [mobileFocus, setMobileFocus] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [lastUpdated, setLastUpdated] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const taskHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const boardRequestRef = useRef(0);

  async function load(date?: string): Promise<HousekeepingBoard | null> {
    const requestedDate = date || boardDate || undefined;
    const requestId = ++boardRequestRef.current;
    setLoading(true);
    setError("");
    try {
      const nextBoard = await loadHousekeepingBoard(requestedDate);
      if (requestId !== boardRequestRef.current) return null;
      setBoard(nextBoard);
      setBoardDate(nextBoard.date);
      setLastUpdated(new Date().toISOString());
      return nextBoard;
    } catch (e) {
      if (requestId === boardRequestRef.current) setError((e as Error).message);
      return null;
    } finally {
      if (requestId === boardRequestRef.current) setLoading(false);
    }
  }

  useEffect(() => { void load(new URLSearchParams(location.search).get("date") ?? undefined); }, []);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const queue = buildHousekeepingQueue(board.rooms, board.departures_today);
  const visible = filterHousekeepingQueue(queue, filter, search);
  const actionableVisible = actionableTasks(visible);
  useEffect(() => {
    if (visible.length && !visible.some(room => room.room_id === selectedId)) setSelectedId(visible[0].room_id);
  }, [visible, selectedId]);

  const selected = visible.find(room => room.room_id === selectedId) ?? visible[0];
  const draftFor = (roomId: string) => drafts[roomId] ?? newHousekeepingDraft();
  const draft = selected ? draftFor(selected.room_id) : newHousekeepingDraft();
  const updateDraft = (roomId: string, patch: Partial<HousekeepingDraft>) => setDrafts(current => ({ ...current, [roomId]: { ...draftFor(roomId), ...patch } }));

  async function action(path: string, roomId: string, body?: Record<string, unknown>, options?: { advance?: boolean }) {
    if (actionBusy) return;
    const actionDate = boardDate;
    setActionBusy(true);
    setError("");
    try {
      await runHousekeepingAction(path, body);
      setDrafts(current => ({ ...current, [roomId]: newHousekeepingDraft() }));
      const nextBoard = await load(actionDate);
      if (options?.advance && nextBoard) {
        const nextVisible = filterHousekeepingQueue(buildHousekeepingQueue(nextBoard.rooms, nextBoard.departures_today), filter, search);
        const nextTasks = actionableTasks(nextVisible).filter(item => item.room_id !== roomId);
        const fallback = nextVisible.find(item => item.room_id !== roomId);
        const next = nextTasks[0] ?? fallback;
        if (next) {
          setSelectedId(next.room_id);
          setMobileFocus(false);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionBusy(false);
    }
  }

  function focusRoom(roomId: string, opener?: HTMLButtonElement) {
    if (opener) openerRef.current = opener;
    const mobile = window.innerWidth < 768;
    setSelectedId(roomId);
    setIsMobile(mobile);
    if (mobile) {
      setMobileFocus(true);
      setTimeout(() => (taskHeadingRef.current ?? document.querySelector<HTMLElement>('[role="dialog"] h3'))?.focus(), 50);
    }
  }

  function nextTask(event: { currentTarget: HTMLButtonElement }) {
    const tasks = actionableVisible.length ? actionableVisible : visible;
    if (!tasks.length) return;
    const currentIndex = tasks.findIndex(item => item.room_id === selectedId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % tasks.length : 0;
    focusRoom(tasks[nextIndex].room_id, event.currentTarget);
  }

  function closeFocusedTask() { setMobileFocus(false); }

  useLayoutEffect(() => {
    if (mobileFocus && isMobile) taskHeadingRef.current?.focus();
    if (!mobileFocus && openerRef.current) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [mobileFocus, isMobile, selectedId]);

  const blocked = Boolean(selected?.isOrphanDeparture || (selected?.isBlocked && selected.room_status !== "Maintenance"));

  return {
    boardDate, loading, actionBusy, error, filter, search, queue, visible, actionableVisible, selected, draft, mobileFocus, isMobile, lastUpdated,
    taskHeadingRef,
    setFilter, setSearch, setDrafts,
    load, updateDraft, action, focusRoom, nextTask, closeFocusedTask,
    blocked,
  };
}
