
// src/lib/EventBus.ts

class EventBus {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => listener(data));
  }
}

const eventBus = new EventBus();
export default eventBus;
