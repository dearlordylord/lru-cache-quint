// -*- mode: Bluespec; -*-
// LRU Cache with Map + Doubly Linked List
module lru_cache {
  const CAPACITY: int
  const NIL: int // null sentinel (-1)
  const KEYS: Set[int]
  const VALS: Set[int]

  // --- Map/Set utility spells ---

  pure def has(m: a -> b, key: a): bool = key.in(m.keys())

  pure def getOrElse(m: a -> b, key: a, default: b): b =
    if (m.has(key)) m.get(key) else default

  pure def mapRemove(m: a -> b, key: a): a -> b =
    m.keys().exclude(Set(key)).mapBy(k => m.get(k))

  // --- Doubly linked list state (MRU at hd, LRU at tl) ---

  type DLL = {
    nxt: int -> int, // next pointer (toward LRU)
    prv: int -> int, // prev pointer (toward MRU)
    hd: int,
    tl: int,
  }

  // Remove node k from the list
  pure def removeNode(dll: DLL, k: int): DLL = {
    val p = dll.prv.getOrElse(k, NIL)
    val n = dll.nxt.getOrElse(k, NIL)
    {
      nxt: if (p != NIL) dll.nxt.put(p, n) else dll.nxt,
      prv: if (n != NIL) dll.prv.put(n, p) else dll.prv,
      hd: if (dll.hd == k) n else dll.hd,
      tl: if (dll.tl == k) p else dll.tl,
    }
  }

  // Remove node and clean up its own nxt/prv entries
  pure def evictNode(dll: DLL, k: int): DLL = {
    val dll1 = dll.removeNode(k)
    { ...dll1, nxt: dll1.nxt.mapRemove(k), prv: dll1.prv.mapRemove(k) }
  }

  // Insert node k at the front (MRU position)
  pure def addToFront(dll: DLL, k: int): DLL = {
    val prv1 = if (dll.hd != NIL) dll.prv.put(dll.hd, k) else dll.prv
    {
      nxt: dll.nxt.put(k, dll.hd),
      prv: prv1.put(k, NIL),
      hd: k,
      tl: if (dll.tl == NIL) k else dll.tl,
    }
  }

  // Move existing node to front (no-op if already hd)
  pure def moveToFront(dll: DLL, k: int): DLL =
    if (dll.hd == k) dll
    else dll.removeNode(k).addToFront(k)

  // --- Cache state ---

  var data: int -> int    // key -> value (keys = cache membership)
  var nxt: int -> int
  var prv: int -> int
  var hd: int
  var tl: int

  def currentDLL: DLL = { nxt: nxt, prv: prv, hd: hd, tl: tl }

  action applyDLL(dll: DLL): bool = all {
    nxt' = dll.nxt,
    prv' = dll.prv,
    hd' = dll.hd,
    tl' = dll.tl,
  }

  // --- Actions ---

  action init = all {
    data' = Map(),
    nxt' = Map(),
    prv' = Map(),
    hd' = NIL,
    tl' = NIL,
  }

  // Access a key: moves it to MRU position. Enabled only if key present.
  action access(k: int): bool = all {
    data.has(k),
    val dll1 = currentDLL.moveToFront(k)
    all {
      applyDLL(dll1),
      data' = data,
    }
  }

  // Insert or update a key-value pair.
  // Evicts LRU entry when at capacity.
  action insert(k: int, v: int): bool = {
    val dll = currentDLL
    if (data.has(k)) {
      // key exists: update value, move to front
      val dll1 = dll.moveToFront(k)
      all {
        data' = data.put(k, v),
        applyDLL(dll1),
      }
    } else if (data.keys().size() >= CAPACITY) {
      // full: evict LRU (tl), insert new at front
      val evictKey = tl
      val dll1 = dll.evictNode(evictKey).addToFront(k)
      all {
        data' = data.mapRemove(evictKey).put(k, v),
        applyDLL(dll1),
      }
    } else {
      // space available: insert at front
      val dll1 = dll.addToFront(k)
      all {
        data' = data.put(k, v),
        applyDLL(dll1),
      }
    }
  }

  action step = {
    nondet k = KEYS.oneOf()
    nondet v = VALS.oneOf()
    any {
      access(k),
      insert(k, v),
    }
  }

  // --- Invariants ---

  val capacityInv = data.keys().size() <= CAPACITY

  val headTailConsistency = and {
    (data.keys().size() == 0) == (hd == NIL),
    (data.keys().size() == 0) == (tl == NIL),
  }

  val headPrvIsNil =
    (hd != NIL) implies (prv.getOrElse(hd, NIL) == NIL)

  val tailNxtIsNil =
    (tl != NIL) implies (nxt.getOrElse(tl, NIL) == NIL)

  // Every cached key's neighbors point back to it
  val pointerSymmetry = data.keys().forall(k =>
    val n = nxt.getOrElse(k, NIL)
    val p = prv.getOrElse(k, NIL)
    and {
      (n != NIL) implies (prv.getOrElse(n, NIL) == k),
      (p != NIL) implies (nxt.getOrElse(p, NIL) == k),
    }
  )

  // Every cached key is reachable from hd (bounded traversal)
  val allReachable = {
    val visited = range(0, CAPACITY).foldl(
      { cur: hd, seen: Set() },
      (acc, _) =>
        if (acc.cur == NIL) acc
        else { cur: nxt.getOrElse(acc.cur, NIL),
               seen: acc.seen.union(Set(acc.cur)) }
    ).seen
    data.keys().forall(k => k.in(visited))
  }

  val inv = and {
    capacityInv,
    headTailConsistency,
    headPrvIsNil,
    tailNxtIsNil,
    pointerSymmetry,
    allReachable,
  }
}

// --- Test instance ---
module lru_cache_test {
  import lru_cache(
    CAPACITY = 3,
    NIL = -1,
    KEYS = Set(1, 2, 3, 4, 5),
    VALS = Set(10, 20, 30)
  ).*

  // put three items, access first to make it MRU,
  // then insert a fourth — should evict the LRU (key 2)
  run evictionTest = {
    init
      .then(insert(1, 10))
      .then(insert(2, 20))
      .then(insert(3, 30))
      // order: 3(MRU) -> 2 -> 1(LRU)
      .then(access(1))
      // order: 1(MRU) -> 3 -> 2(LRU)
      .then(insert(4, 40))
      // evicts 2; order: 4(MRU) -> 1 -> 3(LRU)
      .then(all {
        assert(hd == 4),
        assert(tl == 3),
        assert(data.has(2) == false),
        assert(data.get(1) == 10),
        assert(data.get(4) == 40),
        data' = data,
        nxt' = nxt, prv' = prv,
        hd' = hd, tl' = tl,
      })
  }

  // update existing key moves it to front without eviction
  run updateTest = {
    init
      .then(insert(1, 10))
      .then(insert(2, 20))
      // order: 2(MRU) -> 1(LRU)
      .then(insert(1, 99))
      // order: 1(MRU) -> 2(LRU), value updated
      .then(all {
        assert(hd == 1),
        assert(tl == 2),
        assert(data.get(1) == 99),
        assert(data.keys().size() == 2),
        data' = data,
        nxt' = nxt, prv' = prv,
        hd' = hd, tl' = tl,
      })
  }
}
