import Controller from "sap/ui/core/mvc/Controller";
import { CDraw } from "./CDraw";

export default class AppController extends Controller {

    private cdraw!: CDraw;
    private selectedNodeId: string | null = null;
    private nextY = 50;

    // =====================================================
    // Lifecycle
    // =====================================================

    onInit(): void {

        const htmlControl = this.byId("drawflowHtml") as any;
        htmlControl?.setContent(this.getHTMLControl());
    }

    onAfterRendering(): void {

        const container = document.getElementById("drawflowContainer");
        if (!container) {
            console.error("Drawflow container not found");
            return;
        }

        this.cdraw = new CDraw(container);
        this.registerEvents();

        setTimeout(() => {
            this.initDrawUI();
            this.initCoordinateTracker()
            this.enableDropOnCanvas(container);
        }, 300);
    }

    // =====================================================
    // UI INIT
    // =====================================================

    private initDrawUI(): void {
        this.initSidePanel();
    }

    // =====================================================
    // SIDE PANEL
    // =====================================================

    private initSidePanel(): void {

        // Header
        new sap.m.Title({
            text: "Tools"
        }).placeAt("panel-header");

        new sap.m.Button({
            icon: "sap-icon://decline",
            type: "Transparent",
            press: () => this.toggleLeftPanel()
        }).placeAt("panel-header");

        // =====================================================
        // DRAG ITEM – NORMAL NODE
        // =====================================================

        const normalDrag = new sap.m.Text({
            text: "Basic Node"
        }).addStyleClass("draggable-node");

        normalDrag.placeAt("panel-body");

        normalDrag.addEventDelegate({
            onAfterRendering: () => {

                const dom = normalDrag.getDomRef();
                if (!dom) return;

                dom.setAttribute("draggable", "true");

                dom.addEventListener("dragstart", (e: DragEvent) => {
                    e.dataTransfer?.setData("node-type", "basic");
                });
            }
        });

        // =====================================================
        // DRAG ITEM – CUSTOM NODE
        // =====================================================

        const customDrag = new sap.m.Text({
            text: "Custom Node"
        }).addStyleClass("draggable-node custom-node");

        customDrag.placeAt("panel-body");

        customDrag.addEventDelegate({
            onAfterRendering: () => {

                const dom = customDrag.getDomRef();
                if (!dom) return;

                dom.setAttribute("draggable", "true");

                dom.addEventListener("dragstart", (e: DragEvent) => {
                    e.dataTransfer?.setData("node-type", "custom");
                });
            }
        });

        // =====================================================
        // ACTION BUTTONS
        // =====================================================

        new sap.m.Button({
            text: "Delete Selected",
            width: "100%",
            press: () => this.onDeleteNode()
        }).placeAt("panel-body");

        new sap.m.Button({
            text: "Export",
            width: "100%",
            press: () => this.onExport()
        }).placeAt("panel-body");

        new sap.m.Button({
            text: "Import",
            width: "100%",
            press: (e) => this.onImport(e)
        }).placeAt("panel-footer");

        // =====================================================
        // PANEL TOGGLE
        // =====================================================

        const handle = document.getElementById("panel-handle");
        const arrow = document.getElementById("panel-handle-arrow");

        handle?.addEventListener("click", () => this.toggleLeftPanel());
        arrow?.addEventListener("click", () => this.toggleLeftPanel());


        const coordBox = new sap.m.VBox({
            items: [
                new sap.m.HBox({
                    alignItems: "Center",
                    items: [
                        new sap.m.Text({ text: "CX: 0 | CY: 0" })
                    ]
                })
            ]
        })
        .addStyleClass("coord-capsule");

        coordBox.placeAt("anchor-bottom-left");


    }

    private initCoordinateTracker(): void {

        const container = document.getElementById("drawflowContainer");
        if (!container) return;

        container.addEventListener("mousemove", (e: MouseEvent) => {

            const rect = container.getBoundingClientRect();

            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);

            const mouseText = document.querySelector(
                ".coord-capsule .sapMText"
            ) as HTMLElement;

            if (mouseText) {
                mouseText.innerText = `X: ${x} | Y: ${y}`;
            }

            // Camera coordinates (if using zoom/pan later)
            const cameraText = document.querySelectorAll(
                ".coord-capsule .sapMText"
            )[1] as HTMLElement;

            if (cameraText) {
                cameraText.innerText = `CX: ${x} | CY: ${y}`;
            }
        });
    }

    // =====================================================
    // DROP INTO CANVAS
    // =====================================================

    private enableDropOnCanvas(container: HTMLElement): void {

        container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        container.addEventListener("drop", (e: DragEvent) => {

            e.preventDefault();

            const type = e.dataTransfer?.getData("node-type");
            if (!type) return;

            const rect = container.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const pos = this.cdraw.getMousePosition(e)
            if (type === "custom") {
                this.cdraw.addNode(
                    "fivebox",
                    pos.x,
                    pos.y,
                    this.createFiveBoxNode(),
                    {
                        white: this.randomValue(),
                        blue: this.randomValue(),
                        green: this.randomValue(),
                        yellow: this.randomValue(),
                        red: this.randomValue()
                    }
                );

            } else {
                this.cdraw.addNode(
                    "node",
                    pos.x,
                    pos.y,
                    this.createNodeHtml(),
                    {}
                );
            }
        });
    }

    // =====================================================
    // PANEL TOGGLE
    // =====================================================

    private toggleLeftPanel(): void {

        const panel = document.getElementById("left-panel");
        const arrow = document.getElementById("panel-handle-arrow");

        if (!panel || !arrow) return;

        panel.classList.toggle("open");
        arrow.classList.toggle("rotated");
    }

    // =====================================================
    // NODE ACTIONS
    // =====================================================

    onDeleteNode(): void {

        if (!this.cdraw || !this.selectedNodeId) return;

        this.cdraw.removeNode(this.selectedNodeId);
        this.selectedNodeId = null;
    }

    onExport(): void {
        this.cdraw.exportToFile("my-flow.json");
    }

    onImport(): void {

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";

        input.onchange = (e: any) => {

            const file = e.target.files[0];
            if (!file) return;

            this.cdraw.importFromFile(file)
                .then(() => console.log("Imported"))
                .catch(err => console.error(err));
        };

        input.click();
    }

    
    // =====================================================
    // EVENTS
    // =====================================================

    private registerEvents(): void {

        const editor = this.cdraw.getEditor();

        editor.on("nodeSelected", (id: string) => {
            this.selectedNodeId = id;
        });

        editor.on("nodeUnselected", () => {
            this.selectedNodeId = null;
        });
    }

    // =====================================================
    // TEMPLATES
    // =====================================================

    //todo put this inside CDRAW
    private createNodeHtml(): string {

        return `
        <div style="padding:15px;text-align:center;">
            <b>Node</b><br/>
            <input type="text"
                   df-name
                   placeholder="Edit..."
                   style="width:100%;" />
        </div>
        `;
    }

    private createFiveBoxNode(): string {

        return `
        <div class="fivebox-row">
            <div class="box white"><input type="number" df-white /></div>
            <div class="box blue"><input type="number" df-blue /></div>
            <div class="box green"><input type="number" df-green /></div>
            <div class="box yellow"><input type="number" df-yellow /></div>
            <div class="box red"><input type="number" df-red /></div>
        </div>
        `;
    }

    private randomValue(): number {
        return (Math.floor(Math.random() * 9) + 1) * 10;
    }

    // =====================================================
    // DRAW CONTAINER+ INNER GUI
    // =====================================================

    private getHTMLControl(): string {

        return `
<div id="drawflowContainer"
     style="width:calc(100% - 5px); height:100%; border:1px solid #ccc; position:relative;">

    <div id="left-panel" class="side-panel">
        <div id="panel-header"></div>
        <div id="panel-divider-1"></div>
        <div id="panel-body"></div>
        <div id="panel-divider-2"></div>
        <div id="panel-footer"></div>

        <div id="panel-handle" class="panel-handle">
            <span id="panel-handle-arrow">›</span>
        </div>
    </div>

    <div id="anchor-top-left" class="anchor"></div>
    <div id="anchor-top-right" class="anchor"></div>
    <div id="anchor-bottom-left" class="anchor"></div>
    <div id="anchor-bottom-right" class="anchor"></div>
    <div id="anchor-center-left" class="anchor"></div>
    <div id="anchor-center-right" class="anchor"></div>

</div>
`;
    }
}