# Phase 30A Integration Guide: Real-time GPU Metrics & MCP Task Routing

## 🔮 Introduction
This guide details the integration of real-time GPU metrics collection, dynamic workgroup scaling, and the Model Context Protocol (MCP) into the AGI-CAD system. It provides instructions for setting up, testing, and monitoring these advanced features, all presented within the mystical amber/black aesthetic of the AGI-CAD interface.

## 1. WebSocket Connection Setup

The AGI-CAD system leverages WebSockets for real-time communication, enabling live monitoring of GPU metrics and task routing decisions.

### Connecting and Disconnecting
Upon accessing the integration test page, the system attempts to establish a WebSocket connection to `ws://localhost:3001`. The connection status is typically indicated by a visual cue (e.g., a glowing amber dot for "Live" or a red dot for "Disconnected") in the UI.

-   **Automatic Connection:** The system automatically tries to connect when the page loads.
-   **Manual Disconnection/Reconnection:** While not explicitly exposed as a UI button, closing the browser tab or restarting the WebSocket server will trigger a disconnection. The system is designed to attempt reconnection automatically.

### Monitoring Channels
To observe real-time data streams, you can subscribe to specific channels:

-   **"Subscribe task:routing"**: Click this button to receive live updates on task routing decisions. Each message will detail which task was routed to which agent, its complexity score, and the reason for the decision. This data feeds directly into the `Task Routing Feed` component.
-   **"Subscribe agent:status"**: Use this to monitor the real-time availability and load of various agents in the multi-agent system. Updates will reflect in the `Agent Status Panel`, showing agents' current status (available, busy, offline) and their processing load.

**Visuals:** Expect to see a `Task Routing Feed` panel and an `Agent Status Panel` dynamically updating with amber-toned text and glowing borders as messages are received.

## 2. Dynamic Workgroup Scaling

The system intelligently adjusts WebGPU workgroup sizes to optimize performance based on real-time GPU metrics, ensuring efficient resource utilization.

### How it Works
-   **Metrics Collection:** GPU performance data, including Frames Per Second (FPS) and current resolution, is continuously collected from the WebGPU context.
-   **Adaptive Adjustment:** The system monitors the FPS against predefined thresholds:
    -   **Scaling Down (FPS < 30):** If the FPS drops below 30, indicating performance bottlenecks, the workgroup size will be automatically scaled down (e.g., from 16x16 to 8x8) to reduce computational load and improve frame rates.
    -   **Scaling Up (FPS > 120):** If the FPS consistently exceeds 120, suggesting ample GPU headroom, the workgroup size may be scaled up (e.g., from 8x8 to 16x16) to potentially increase processing throughput or visual quality.

### Scaling Strategy and Impact
The dynamic scaling strategy aims to maintain a balance between performance and computational intensity. By adjusting workgroup sizes, the system can:
-   **Improve Responsiveness:** Prevent the application from becoming sluggish under heavy load.
-   **Optimize Resource Usage:** Utilize available GPU power more effectively, scaling up when resources are abundant and scaling down when constrained.
-   **Maintain Stability:** Adapt to varying hardware capabilities and background processes without manual intervention.

**Visuals:** The `WebGPU Overlay` component (typically in the top-left corner) will display the current `WG Density` and `WG Gradient` values, reflecting these dynamic adjustments.

## 3. MCP Protocol Support

The Model Context Protocol (MCP) is integrated to facilitate seamless and intelligent communication within the multi-agent system, particularly for task routing.

### Integration and Protocol-Aware Agent Filtering
-   **Standardized Communication:** MCP provides a structured format for tasks and agent capabilities, allowing the `TaskRouter` to make more informed decisions.
-   **Protocol-Aware Routing:** The `TaskRouter` can now filter or prioritize agents based on the communication `protocol` they support (e.g., 'MCP-v1', 'REST', 'WebSocket'). This ensures that tasks are routed to agents that can effectively communicate and process them.

### Using the "Route Task" Feature
-   **Testing Routing:** Utilize the "Route Task" button (or equivalent API endpoint) to submit new tasks to the system.
-   **Multi-Agent Interaction:** Observe how the `Task Routing Feed` updates, showing which agent was selected for the task. The selection will consider the task's complexity, required output format, and the capabilities (including supported protocols) of the available agents.
-   **Contextual Routing:** Future enhancements will allow tasks to include a `context` field (as defined in `TaskRequest`), enabling even more nuanced routing decisions based on specific MCP directives.

**Visuals:** The `Task Routing Feed` will show the `agent name` and `reason` for selection, demonstrating the protocol-aware routing in action.

## 4. Memory Persistence

Workgroup settings are designed to persist across sessions, enhancing user experience and reducing repetitive configurations.

### LocalStorage Functionality
-   **Automatic Saving:** The `useWorkgroupSettings` hook automatically saves the selected workgroup `mode` ('auto' or 'manual') and `size` (4, 8, 16, 32) to the browser's `localStorage`.
-   **Persistence:** These settings will remain stored even if you close and reopen the browser tab or restart your browser.
-   **Loading on Startup:** Upon page reload or subsequent visits, the system will retrieve the last saved settings from `localStorage`, applying them automatically.

**Visuals:** Interact with the `Workgroup Controls` panel. Change the mode or size, then refresh the page. You will observe that your selections are retained.

## 5. System Health Monitoring

Comprehensive monitoring tools are integrated to provide real-time insights into the system's operational status and performance.

### Health Status Display
-   **WebSocket Connection:** A clear indicator (e.g., "Live" or "Disconnected" status with color-coded dots) shows the health of the WebSocket connection.
-   **GPU Stats:** The `WebGPU Overlay` provides a snapshot of current GPU performance, including:
    -   **FPS:** Frames Per Second.
    -   **Res:** Current rendering resolution.
    -   **WG Density/Gradient:** Current workgroup sizes.
    -   **Mode:** Compute mode ('16f' or '8bit').
-   **Last GPU Update:** The `Agent Status Panel` or a dedicated health panel might show the timestamp of the last received GPU metrics, helping to identify stale data.
-   **Routing Stats:** The `Task Routing Feed` provides a historical log of routing decisions, allowing you to track task flow and agent utilization.

### Test Log Panel
-   **Performance Data:** The `Test Log` panel (or browser console) will display detailed performance data, including WebSocket messages, Redis publications, and any relevant system events.
-   **Error States:** Any errors encountered during WebSocket communication, Redis operations, or task routing will be logged here, providing crucial information for debugging and troubleshooting.

**Visuals:** Look for dedicated panels or sections in the UI that present this information, often with amber-colored text and clear status indicators.

## 6. Testing and Validation

To fully test and validate the Phase 30A integration, follow these steps:

### Accessing the Integration Page
1.  Ensure your backend services (WebSocket server, Redis) are running. You can typically start them with `npm run dev` or `npm run start`.
2.  Open your web browser and navigate to: `http://localhost:3003/test-integration.html`

### Key Features to Test

-   **WebSocket Connectivity:**
    -   Verify the "Live" status indicator for the WebSocket connection.
    -   Click "Subscribe task:routing" and "Subscribe agent:status".
    -   Observe the `Task Routing Feed` and `Agent Status Panel` for real-time updates.
-   **GPU Metrics Display:**
    -   Locate the `WebGPU Overlay` (top-left).
    -   Confirm that FPS, resolution, and workgroup sizes are displayed and updating.
-   **Dynamic Workgroup Scaling:**
    -   If possible, simulate varying GPU loads (e.g., by running other demanding applications or adjusting browser window size).
    -   Observe if the `WG Density` and `WG Gradient` values in the `WebGPU Overlay` change in response to FPS fluctuations.
    -   Verify that the system scales down when FPS is low and scales up when FPS is high.
-   **MCP-aware Task Routing:**
    -   Click the "Route Task" button multiple times.
    -   Monitor the `Task Routing Feed` to see which agents are selected.
    -   (Advanced) If agent capabilities or task contexts are modified, observe if routing decisions reflect these changes.
-   **Memory Persistence:**
    -   In the `Workgroup Controls` panel, switch between "Auto" and "Manual" modes, and select different workgroup sizes.
    -   Refresh the page (`F5` or `Ctrl+R`). Verify that your chosen settings are retained.
-   **Health Monitoring:**
    -   Keep an eye on the `Test Log` panel (or browser console) for any error messages or warnings.
    -   Confirm that routing decisions and agent status updates are logged correctly.

### Emphasizing the Experience
The goal of this integration is a seamless, adaptive, and intelligent multi-agent system. Pay attention to the responsiveness of the UI, the accuracy of the real-time data, and the system's ability to adapt to changing conditions.

## 🎨 Theme Notes
The entire user interface for Phase 30A adheres to a mystical amber/black theme. This aesthetic is characterized by:
-   **Dark Backgrounds:** Deep, near-black backgrounds (`#0a0a0a`) provide a high-contrast canvas.
-   **Amber Accents:** Primary text, headings, and interactive elements glow with an amber hue (`#fbbf24`), often accompanied by subtle drop shadows or box shadows to create a luminous effect.
-   **Cyan Highlights:** Secondary information or interactive elements might use cyan (`#06b6d4`) for contrast and visual interest.
-   **Glowing Borders:** Panels and interactive components are often framed with borders that subtly glow, enhancing the mystical, high-tech feel.
-   **Monospace Fonts:** Code and data displays typically use monospace fonts for clarity and a terminal-like appearance.

This theme is not just visual; it's integral to the user experience, providing a consistent and immersive environment for interacting with the AGI-CAD system.

---

This concludes the Phase 30A Integration Guide.
