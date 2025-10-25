// Simple pub/sub for inter-agent comms
const topics = new Map();

export function subscribe(topic, fn) {
  if (!topics.has(topic)) topics.set(topic, new Set());
  topics.get(topic).add(fn);
  return () => topics.get(topic)?.delete(fn);
}

export function publish(topic, data) {
  if (!topics.has(topic)) return;
  for (const fn of topics.get(topic)) fn(data);
}

export function clear(topic) {
  topics.delete(topic);
}

