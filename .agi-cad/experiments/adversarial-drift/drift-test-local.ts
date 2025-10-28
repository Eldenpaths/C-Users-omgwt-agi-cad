import { DriftMonitor } from "../../../src/lib/safety/drift-monitor";


const monitor = new DriftMonitor();
(async () => {
  console.log("Running local drift test...");
  const states = [{ a: 1 }, { a: 2 }, { a: 3 }];
  for (const s of states) {
    const res = await monitor.measure(s);
    console.log(res);
  }
})();
