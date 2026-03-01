import Drawflow from "drawflow";

export class CDraw {

    private editor: Drawflow;
    private pendingReverse: any = null;

    constructor(container: HTMLElement) {

        this.editor = new Drawflow(container);

        // =============================
        // Basic Config
        // =============================
        this.editor.useuuid = true;
        this.editor.reroute = false;
        this.editor.editor_mode = "edit";
        this.editor.force_first_input = false;
        this.editor.draggable_inputs = true;

        // Remove curves
        this.editor.curvature = 0;
        this.editor.reroute_curvature_start_end = 0;
        this.editor.reroute_curvature = 0;

        // Straight connection
        this.editor.createCurvature = (
            sx: number,
            sy: number,
            ex: number,
            ey: number
        ) => {

            const mid = (sy + ey) / 2;

            return `
                M ${sx} ${sy}
                L ${sx} ${mid}
                L ${ex} ${mid}
                L ${ex} ${ey}
            `;
        };


        this.editor.start();
    }


    // ==========================================================
    // Public API
    // ==========================================================

    getEditor(): Drawflow {
        return this.editor;
    }

    
    setMode(mode:any){
        this.editor.editor_mode = mode
    }


getMousePosition(event: MouseEvent) {

    const editor = this.editor;
    const rect = editor.precanvas.getBoundingClientRect();

    const zoom = editor.zoom;

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    return { x:x, y:y };
}
    addNode(
        name: string,
        x: number,
        y: number,
        html: string,
        data: any = {}
    ) {

        
        return this.editor.addNode(
            name,
            1,
            1,
            x,
            y,
            "node-class",
            data,
            html
        );
    }

    exportToFile(filename: string = "drawflow.json") {

        const data = this.editor.export();

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    importFromFile(file: File): Promise<void> {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = (event: any) => {

                try {
                    const json = JSON.parse(event.target.result);

                    this.editor.import(json);
                    resolve();

                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = reject;

            reader.readAsText(file);
        });
    }


    removeNode(id: string) {
        this.editor.removeNodeId(id);
    }

    addConnection(from: string, to: string) {
        this.editor.addConnection(from, to, "output_1", "input_1");
    }

    zoomIn() {
        this.editor.zoom_in();
    }

    zoomOut() {
        this.editor.zoom_out();
    }

    zoomReset() {
        this.editor.zoom_reset();
    }

    export() {
        return this.editor.export();
    }
}