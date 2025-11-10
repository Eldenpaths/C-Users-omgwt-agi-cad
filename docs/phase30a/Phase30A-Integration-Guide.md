# Phase 30A Integration Guide

This document outlines the integration process for Phase 30A, providing clear instructions for usage and setup of the new features, including WebSocket connections for monitoring, dynamic workgroup scaling, MCP protocol support, memory persistence, and system health monitoring.

## 1. WebSocket Connection Setup

The system leverages WebSockets for real-time monitoring of GPU metrics and task routing decisions.

### How to Connect and Disconnect:

The UI components automatically manage WebSocket connections using the `useWebSocket` hook. When the application loads, it attempts to establish a connection. The connection status is typically displayed within the relevant UI panels.

-   **Connection Status:**
    -   **RoutingVisualizer:** Displays "Live" (green pulsing dot) or "Disconnected" (red dot) indicating the WebSocket connection status for task routing.
    -   **AgentStatusPanel:** The overall connection status is implicitly managed by the `useWebSocket` hook. Individual agent statuses are updated in real-time when connected.

### Testing the System:

To test the WebSocket functionality, interact with the UI elements that trigger subscriptions:

-   **"Subscribe task:routing"**: This action (often triggered automatically by the `RoutingVisualizer` component on connection) subscribes to real-time task routing decisions. You will see new routing decisions appear in the "Task Routing Feed" as they occur.
-   **"Subscribe agent:status"**: This action (triggered by the `AgentStatusPanel` component on connection) subscribes to real-time updates on agent availability, load, and status. The "Agent Status" panel will update dynamically.

## 2. Dynamic Workgroup Scaling

The system dynamically adjusts WebGPU workgroup sizes based on real-time GPU metrics to optimize performance.

### How Workgroup Sizes are Adjusted:

The `WebGPUOverlay` component displays current GPU metrics, including FPS, resolution, and workgroup configuration. The `WorkgroupControls` component allows users to switch between 'Auto' and 'Manual' workgroup scaling modes.

-   **Auto Mode:** In this mode, the system automatically adjusts workgroup sizes based on GPU performance.
    -   **Scaling Down:** If the Frames Per Second (FPS) drops below a threshold (e.g., < 30 FPS), the system will scale down the workgroup size to reduce computational load and improve frame rates.
    -   **Scaling Up:** If the FPS is consistently high (e.g., > 120 FPS), the system may scale up the workgroup size to utilize more GPU resources and potentially increase processing throughput.
-   **Manual Mode:** Users can manually select a fixed workgroup size (e.g., 4x4, 8x8, 16x16, 32x32) using the `WorkgroupControls`. This overrides the automatic scaling.

### Scaling Strategy and Impact:

The dynamic scaling strategy aims to maintain optimal performance by balancing GPU utilization and responsiveness. By adjusting workgroup sizes, the system can adapt to varying computational demands and hardware capabilities, preventing bottlenecks and ensuring a smooth user experience.

## 3. MCP Protocol Support

The task routing system integrates the Model Context Protocol (MCP) for protocol-aware agent filtering, enabling intelligent task allocation in multi-agent systems.

### Integration of MCP:

The `RoutingVisualizer` component displays routing decisions, which include the assigned agent and a `reason` for the assignment. This reason can reflect MCP-driven filtering, where tasks are routed to agents best suited for their specific protocol requirements or capabilities.

### Using "Route Task" for Protocol-Aware Routing:

The "Route Task" feature (not directly visible in the provided components but part of the overall system) allows testing how tasks are allocated based on agent capabilities and MCP. When a task is routed, the system evaluates agent protocols and filters agents accordingly, ensuring that tasks are only assigned to compatible agents. The `Task Routing Feed` will then show the decision, including the chosen agent and the rationale.

## 4. Memory Persistence

Workgroup settings are persisted to ensure a consistent user experience across sessions.

### Functionality of Memory Persistence:

The `useWorkgroupSettings` hook handles the persistence of workgroup mode ('auto' or 'manual') and size. These settings are stored in the browser's `localStorage`.

-   **Keys Used:**
    -   `webgpu:workgroup-mode`: Stores the selected mode.
    -   `webgpu:workgroup-size`: Stores the selected workgroup size (if in manual mode).

### Persistence Across Sessions:

-   **Page Reloads:** Workgroup settings (mode and size) will be retained if the page is reloaded.
-   **Browser Restarts:** Settings will persist even after closing and reopening the browser, as `localStorage` data is typically maintained across browser sessions.

## 5. System Health Monitoring

The system provides various indicators for monitoring its health and performance.

### Display of Health Status:

-   **WebSocket Connection Status:** The `RoutingVisualizer` explicitly shows the WebSocket connection status (Live/Disconnected).
-   **GPU Stats:** The `WebGPUOverlay` provides real-time GPU metrics such as FPS, resolution, and workgroup configuration, offering insights into the GPU's current workload and performance.
-   **Agent Status:** The `AgentStatusPanel` displays the health and availability of individual agents, including their current load and last update time. Stale agent statuses are highlighted.

### Logs and Performance Data:

-   **Test Log Panel:** While not explicitly detailed in the provided components, the system is designed to output performance data, error states, and other relevant logs to a "Test Log" panel (or similar logging mechanism). This panel is crucial for debugging and monitoring the system's behavior.
-   **Routing Stats:** The `RoutingVisualizer` provides a feed of routing decisions, which can be analyzed to understand task distribution and agent utilization.

## 6. Testing and Validation

To ensure the proper functioning of the integrated features, follow these testing steps.

### Accessing the Integration Test Page:

1.  Open your web browser and navigate to: `http://localhost:3003/test-integration.html` (or the appropriate URL for your local setup).

### Key Features to Test:

-   **WebSocket Connectivity:**
    -   Observe the connection status in the `RoutingVisualizer` and `AgentStatusPanel`. Ensure they indicate a "Live" connection.
    -   Verify that agent statuses and task routing decisions are updating in real-time.
-   **GPU Metrics Display:**
    -   Check the `WebGPUOverlay` to confirm that FPS, resolution, and workgroup settings are displayed and updating.
    -   If applicable, simulate different GPU loads to observe changes in FPS and workgroup adjustments (in 'Auto' mode).
-   **Dynamic Scaling:**
    -   Switch between 'Auto' and 'Manual' modes in `WorkgroupControls`.
    -   In 'Auto' mode, if possible, observe how workgroup sizes change in response to varying GPU loads (e.g., by running a demanding process or simulating low FPS).
    -   In 'Manual' mode, verify that the selected workgroup size is applied and persists.
-   **MCP-aware Task Routing:**
    -   Use the "Route Task" feature (if available in the test environment) to send tasks with specific protocol requirements.
    -   Observe the `Task Routing Feed` in the `RoutingVisualizer` to confirm that tasks are routed to appropriate agents based on their capabilities and the MCP.
-   **Health Monitoring:**
    -   Monitor the `AgentStatusPanel` for agent availability and load.
    -   Check the "Test Log" panel for any error messages or performance warnings.
    -   Verify that stale agent statuses are correctly identified.

By following these steps, you can thoroughly validate the Phase 30A integration and ensure all features are functioning as expected.
