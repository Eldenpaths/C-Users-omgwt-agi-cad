# Phase 30A Integration Documentation

This comprehensive guide outlines the key features and functionalities of the Phase 30A Integration, providing clear instructions for setup, usage, and testing.

## 1. WebSocket Connection Setup

To monitor GPU metrics and task routing in real-time, establish a WebSocket connection.

-   **Connecting:** The UI provides a mechanism to connect to the WebSocket server. Look for a "Connect" button or similar control.
-   **Disconnecting:** A corresponding "Disconnect" button will terminate the WebSocket connection.
-   **Monitoring:**
    -   **"Subscribe task:routing"**: Click this button to subscribe to real-time updates regarding task routing events. This will display information about tasks being routed to various agents.
    -   **"Subscribe agent:status"**: Click this button to receive real-time status updates for all connected agents, including their availability and current workload.

## 2. Dynamic Workgroup Scaling

The system dynamically adjusts workgroup sizes based on real-time GPU performance metrics to optimize efficiency.

-   **GPU Metrics Monitored**: The system continuously monitors GPU metrics such as Frames Per Second (FPS), compute modes, and resolution.
-   **Scaling Logic**:
    -   **Scaling Down**: If the FPS drops below a predefined threshold (e.g., FPS < 30), the system will automatically scale down workgroup sizes to reduce GPU load and improve frame rates.
    -   **Scaling Up**: If the FPS consistently stays above a higher threshold (e.g., FPS > 120), the system will scale up workgroup sizes to utilize available GPU resources more effectively and potentially increase processing throughput.
-   **Impact on Performance**: Dynamic scaling ensures optimal resource utilization, preventing performance bottlenecks during high load and maximizing efficiency during periods of lower demand.

## 3. MCP Protocol Support

The task routing system integrates the Model Context Protocol (MCP) for intelligent, protocol-aware agent filtering and task allocation.

-   **Integration**: MCP allows the system to understand the capabilities and context of different agents.
-   **Protocol-Aware Agent Filtering**: When a task is initiated, the system uses MCP to filter and select agents that are best suited to handle that specific task based on their supported protocols and current context.
-   **"Route Task" Feature**: Use the "Route Task" button in the UI to test protocol-aware routing. This feature demonstrates how tasks are intelligently dispatched to multi-agent systems based on their MCP compatibility.

## 4. Memory Persistence

Workgroup settings are persisted locally to ensure a consistent user experience across sessions.

-   **Storage**: Workgroup settings are stored in the browser's `localStorage`.
-   **Persistence**: These settings will persist across page reloads and even browser restarts, ensuring that your preferred workgroup configurations are maintained.

## 5. System Health Monitoring

The UI provides comprehensive monitoring of the system's health and performance.

-   **WebSocket Connection Status**: Clearly indicates the current status of the WebSocket connection (connected, disconnected, connecting).
-   **GPU Stats**: Displays the last updated GPU metrics, including FPS, compute modes, and resolution.
-   **Routing Stats**: Provides statistics related to task routing, such as the number of tasks routed, successful routes, and failed routes.
-   **Test Log Panel**: A dedicated panel in the UI displays real-time logs, performance data, and any error states, allowing users to monitor the system's operation and troubleshoot issues.

## 6. Testing and Validation

To test and validate the Phase 30A Integration, follow these steps:

1.  **Access the Test Page**: Open your web browser and navigate to `http://localhost:3003/test-integration.html`.
2.  **WebSocket Connectivity**:
    -   Connect to the WebSocket server using the provided UI controls.
    -   Subscribe to "task:routing" and "agent:status" to observe real-time data flow.
3.  **GPU Metrics Display**: Verify that GPU metrics (FPS, resolution, etc.) are being displayed and updated correctly.
4.  **Dynamic Scaling**:
    -   Observe the workgroup sizes as GPU load changes. You should see adjustments based on the FPS thresholds (scaling down below 30 FPS, scaling up above 120 FPS).
    -   Simulate varying GPU loads if possible to test the scaling mechanism.
5.  **MCP-aware Task Routing**:
    -   Use the "Route Task" feature to initiate tasks.
    -   Verify that tasks are routed to appropriate agents based on their MCP compatibility.
6.  **Health Monitoring**:
    -   Monitor the WebSocket connection status and routing statistics.
    -   Check the Test Log panel for any performance data or error messages.

## Additional Notes:

-   **Theme**: The UI for this integration adheres to an **amber/black mystical theme**, providing a visually distinct and engaging experience.
-   **Screenshots**: For a more user-friendly guide, consider adding screenshots of the UI at various stages of operation. (Note: Screenshots cannot be generated by this agent.)
