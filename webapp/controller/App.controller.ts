import Controller from "sap/ui/core/mvc/Controller";
import Drawflow from "drawflow";

export default class AppController extends Controller {

    private editor: any;
    private initialized: boolean = false;
    private selectedNodeId: string | null = null;
    private nextY: number = 50;

    onInit(): void {
        const htmlControl = this.byId("drawflowHtml") as any;

        htmlControl.setContent(
            "<div id='drawflowContainer' style='width:100%; height:650px; border:1px solid #ccc; position:relative;'></div>"
        );
    }

    onAfterRendering(): void {

        if (this.initialized) return;

        const container = document.getElementById("drawflowContainer") as HTMLElement;
        if (!container) return;

        this.editor = new Drawflow(container);

        // Stability fixes
        this.editor.useuuid = true;
        this.editor.reroute = false;
        this.editor.editor_mode = "edit";

        this.editor.curvature = 0;
        this.editor.reroute_curvature_start_end = 0;
        this.editor.reroute_curvature = 0;
        this.editor.createCurvature = function(start_x:any, start_y:any, end_x:any, end_y:any) {

            const mid_y = (start_y + end_y) / 2;

            return `
                M ${start_x} ${start_y}
                L ${start_x} ${mid_y}
                L ${end_x} ${mid_y}
                L ${end_x} ${end_y}
            `;
        }


        this.editor.start();

        this.registerEvents();

        this.initialized = true;
    }

    // ===============================
    // Node Template (Top + Bottom)
    // ===============================
    private createNodeHtml(): string {
        return `
            <div style="padding:15px; text-align:center;">
                <b>Node</b><br/>
                <input type="text" df-name placeholder="Edit..." style="width:100%;" />
            </div>
        `;
    }
    onAddCustomNode(): void {
        if (!this.editor) return;

        const nodeHtml = this.createFiveBoxNode();

        this.editor.addNode(
            "fivebox",
            1,
            1,
            200,
            200,
            "node-class",
            {
                white: (Math.floor(Math.random() * 9) + 1) * 10,
                blue: (Math.floor(Math.random() * 9) + 1) * 10,
                green: (Math.floor(Math.random() * 9) + 1) * 10,
                yellow: (Math.floor(Math.random() * 9) + 1) * 10,
                red: (Math.floor(Math.random() * 9) + 1) * 10
            },
            nodeHtml
        );
    }

private createFiveBoxNode(): string {
    return `
        <div class="fivebox-row">
            <div class="box white">
                <input type="number" df-white />
            </div>
            <div class="box blue">
                <input type="number" df-blue />
            </div>
            <div class="box green">
                <input type="number" df-green />
            </div>
            <div class="box yellow">
                <input type="number" df-yellow />
            </div>
            <div class="box red">
                <input type="number" df-red />
            </div>
        </div>
    `;
}
    // ===============================
    // Add Node
    // ===============================
    onAddNode(): void {

        const posX = 400;
        const posY = this.nextY;

        const id = this.editor.addNode(
            "node",
            1,
            1,
            posX,
            posY,
            "node-class",
            {},
            this.createNodeHtml()
        );

        this.nextY += 180; // waterfall spacing

        // auto connect to previous node
        const nodes = Object.keys(this.editor.drawflow.drawflow.Home.data);
        if (nodes.length > 1) {
            const prev = nodes[nodes.length - 2];
            this.editor.addConnection(prev, id, "output_1", "input_1");
        }
    }

    // ===============================
    // Delete Node
    // ===============================
    onDeleteNode(): void {
        if (this.selectedNodeId) {
            this.editor.removeNodeId(this.selectedNodeId);
            this.selectedNodeId = null;
        }
    }

    // ===============================
    // Zoom Controls
    // ===============================
    onZoomIn(): void {
        this.editor.zoom_in();
    }

    onZoomOut(): void {
        this.editor.zoom_out();
    }

    onZoomReset(): void {
        this.editor.zoom_reset();
    }

    // ===============================
    // Export
    // ===============================
    onExport(): void {
        const data = this.editor.export();
        console.log("DRAWFLOW EXPORT:", data);
    }

    // ===============================
    // Events
    // ===============================
    private registerEvents(): void {

        this.editor.on("nodeSelected", (id: string) => {
            this.selectedNodeId = id;
        });

        this.editor.on("nodeUnselected", () => {
            this.selectedNodeId = null;
        });

        this.editor.on("nodeCreated", (id: string) => {
            console.log("Node created:", id);
        });

        this.editor.on("nodeRemoved", (id: string) => {
            console.log("Node removed:", id);
        });

        this.editor.on("connectionCreated", (connection: any) => {
            console.log("Connection created:", connection);
        });

        this.editor.on("connectionRemoved", (connection: any) => {
            console.log("Connection removed:", connection);
        });

        this.editor.on("zoom", (zoom: number) => {
            console.log("Zoom level:", zoom);
        });
    }
}