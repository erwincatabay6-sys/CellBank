import test from "node:test";
import assert from "node:assert/strict";
import {
  createToastStore,
  MAX_VISIBLE_TOASTS,
} from "../src/features/feedback/toastStore.js";

test("persistent errors queue in order and are promoted without loss", () => {
  const store = createToastStore();
  const ids = Array.from({ length: 6 }, (_, index) =>
    store.publish({ variant: "error", message: `Failure ${index}` }),
  );
  assert.equal(store.getSnapshot().length, 6);
  assert.deepEqual(
    store
      .getSnapshot()
      .slice(0, MAX_VISIBLE_TOASTS)
      .map((item) => item.id),
    ids.slice(0, 3),
  );
  store.dismiss(ids[1]);
  assert.deepEqual(
    store.getSnapshot().map((item) => item.id),
    [ids[0], ...ids.slice(2)],
  );
  assert.deepEqual(
    store
      .getSnapshot()
      .slice(0, 3)
      .map((item) => item.id),
    [ids[0], ids[2], ids[3]],
  );
});

test("identical new actions have distinct identities; reading a snapshot never republishes", () => {
  const store = createToastStore();
  const input = { variant: "success", title: "Saved", message: "Same result" };
  const first = store.publish(input);
  const snapshot = store.getSnapshot();
  assert.strictEqual(store.getSnapshot(), snapshot);
  const second = store.publish(input);
  assert.notEqual(first, second);
  assert.equal(snapshot.length, 1);
  assert.equal(store.getSnapshot().length, 2);
  assert.equal(input.id, undefined);
  store.dismiss(first);
  assert.equal(store.getSnapshot()[0].id, second);
});

test("subscriptions clean up and separate app roots do not share feedback", () => {
  const store = createToastStore();
  let changes = 0;
  const unsubscribe = store.subscribe(() => changes++);
  const id = store.publish({ variant: "error", message: "Failure" });
  assert.equal(changes, 1);
  unsubscribe();
  store.dismiss(id);
  assert.equal(changes, 1);
  assert.equal(createToastStore().getSnapshot().length, 0);
});
