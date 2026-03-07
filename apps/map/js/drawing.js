
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    where,
    deleteDoc,
    updateDoc
  } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export class DrawingManager {
    constructor(map, db, getActiveSiteId, showStatusMessage, getAdvancedMarkerElement) {
        this.map = map;
        this.db = db;
        this.getActiveSiteId = getActiveSiteId;
        this.showStatusMessage = showStatusMessage;
        this.getAdvancedMarkerElement = getAdvancedMarkerElement;

        this.activeDrawingListeners = [];
        this._drawingMode = false;
        this.drawnShapes = [];
        this.pendingShape = null;
        this.editingShapeId = null;
        this.contextMenuTargetId = null;
        this.textPlacementListener = null;
        this.unsubscribeDrawings = null;
    }

    get drawingMode() {
        return this._drawingMode;
    }

    setupDrawingTools() {
        document.querySelectorAll('.draw-tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode === 'cursor') {
                    this.stopDrawingMode();
                } else if (mode === 'text') {
                    this.stopDrawingMode();
                    this.enableTextPlacementMode();
                } else {
                    this.startDrawingMode(mode);
                }
                this.setActiveToolButton(mode);
            });
        });

        const annotationsButton = document.getElementById('annotations-button');
        if (annotationsButton) {
            annotationsButton.addEventListener('click', () => {
                if (!this._drawingMode && !this.getActiveSiteId()) {
                    this.showStatusMessage('Select a site before creating annotations.');
                    return;
                }

                this._drawingMode = !this._drawingMode;
                document.getElementById('drawing-toolbar').classList.toggle('hidden', !this._drawingMode);
                annotationsButton.classList.toggle('active', this._drawingMode);
                annotationsButton.textContent = this._drawingMode ? 'Exit Annotations' : 'Annotations Mode';
                if (!this._drawingMode) {
                    this.stopDrawingMode();
                    this.setActiveToolButton('cursor');
                    this.disableTextPlacementMode();
                }
            });
        }

        document.getElementById('save-drawing-button').addEventListener('click', () => this.saveDrawingFromDialog());
        document.getElementById('cancel-drawing-button').addEventListener('click', () => {
            if (this.editingShapeId === null && this.pendingShape) {
                this.pendingShape.overlay.setMap(null);
            }
            this.pendingShape = null;
            this.editingShapeId = null;
            const drawingOverlay = document.getElementById('drawing-dialog-overlay');
            drawingOverlay.classList.add('hidden');
            drawingOverlay.setAttribute('aria-hidden', 'true');
        });

        document.getElementById('edit-shape-button').addEventListener('click', () => {
            document.getElementById('shape-context-menu').classList.add('hidden');
            if (this.contextMenuTargetId) this.openEditShapeDialog(this.contextMenuTargetId);
        });

        document.getElementById('delete-shape-button').addEventListener('click', () => {
            document.getElementById('shape-context-menu').classList.add('hidden');
            if (this.contextMenuTargetId) this.deleteDrawing(this.contextMenuTargetId);
        });

        this.map.addListener('click', () => {
            document.getElementById('shape-context-menu').classList.add('hidden');
        });

        document.getElementById('clear-drawings-button').addEventListener('click', async () => {
            if (!confirm('Delete all annotations? This cannot be undone.')) return;
            const deletionResults = await Promise.allSettled(
                [...this.drawnShapes].map((s) => this.deleteDrawing(s.firestoreId, { suppressStatus: true }))
            );

            const hasFailures = deletionResults.some((result) => {
                if (result.status !== 'fulfilled') return true;
                return result.value !== true;
            });

            if (hasFailures) {
                this.showStatusMessage('Some annotations could not be deleted');
            } else {
                this.showStatusMessage('All annotations deleted');
            }
        });
    }

    startDrawingMode(mode) {
        this.stopDrawingMode();
        this.map.setOptions({ draggable: false, gestureHandling: 'none' });
        switch (mode) {
            case 'polyline': this.startPolylineDraw(); break;
            case 'polygon': this.startPolygonDraw(); break;
            case 'rectangle': this.startRectangleDraw(); break;
            case 'circle': this.startCircleDraw(); break;
        }
    }

    stopDrawingMode() {
        this.activeDrawingListeners.forEach(l => google.maps.event.removeListener(l));
        this.activeDrawingListeners = [];
        this.map.setOptions({ draggable: true, gestureHandling: 'auto' });
    }

    onShapeComplete(type, overlay) {
        this.stopDrawingMode();
        this.setActiveToolButton('cursor');
        this.pendingShape = { type, overlay };
        this.openDrawingDialog(type);
    }

    startPolylineDraw() {
        const path = [];
        const preview = new google.maps.Polyline({
            path, map: this.map, strokeColor: '#ff0000', strokeWeight: 2
        });

        const clickL = this.map.addListener('click', (e) => {
            path.push(e.latLng);
            preview.setPath(path);
        });

        const dblClickL = this.map.addListener('dblclick', (e) => {
            if (path.length > 0) path.pop();
            if (path.length < 2) { preview.setMap(null); this.stopDrawingMode(); return; }
            preview.setPath(path);
            this.onShapeComplete('polyline', preview);
        });

        this.activeDrawingListeners.push(clickL, dblClickL);
    }

    startPolygonDraw() {
        const path = [];
        const preview = new google.maps.Polygon({
            paths: [path], map: this.map, strokeColor: '#ff0000', strokeWeight: 2, fillOpacity: 0.2
        });

        const clickL = this.map.addListener('click', (e) => {
            path.push(e.latLng);
            preview.setPaths([path]);
        });

        const dblClickL = this.map.addListener('dblclick', (e) => {
            if (path.length > 0) path.pop();
            if (path.length < 3) { preview.setMap(null); this.stopDrawingMode(); return; }
            preview.setPaths([path]);
            this.onShapeComplete('polygon', preview);
        });

        this.activeDrawingListeners.push(clickL, dblClickL);
    }

    startRectangleDraw() {
        let startLatLng = null;
        let preview = null;
        let isDrawing = false;

        const downL = this.map.addListener('mousedown', (e) => {
            startLatLng = e.latLng;
            isDrawing = true;
            preview = new google.maps.Rectangle({
                bounds: new google.maps.LatLngBounds(startLatLng, startLatLng),
                map: this.map, strokeColor: '#ff0000', strokeWeight: 2, fillOpacity: 0.2
            });
        });

        const moveL = this.map.addListener('mousemove', (e) => {
            if (!isDrawing || !preview) return;
            preview.setBounds(new google.maps.LatLngBounds(
                new google.maps.LatLng(
                    Math.min(startLatLng.lat(), e.latLng.lat()),
                    Math.min(startLatLng.lng(), e.latLng.lng())
                ),
                new google.maps.LatLng(
                    Math.max(startLatLng.lat(), e.latLng.lat()),
                    Math.max(startLatLng.lng(), e.latLng.lng())
                )
            ));
        });

        const upL = this.map.addListener('mouseup', (e) => {
            if (!isDrawing || !preview) return;
            isDrawing = false;
            this.onShapeComplete('rectangle', preview);
        });

        this.activeDrawingListeners.push(downL, moveL, upL);
    }

    startCircleDraw() {
        let centerLatLng = null;
        let preview = null;
        let isDrawing = false;

        const downL = this.map.addListener('mousedown', (e) => {
            centerLatLng = e.latLng;
            isDrawing = true;
            preview = new google.maps.Circle({
                center: centerLatLng, radius: 1, map: this.map,
                strokeColor: '#ff0000', strokeWeight: 2, fillOpacity: 0.2
            });
        });

        const moveL = this.map.addListener('mousemove', (e) => {
            if (!isDrawing || !preview) return;
            const dLat = (e.latLng.lat() - centerLatLng.lat()) * 111320;
            const dLng = (e.latLng.lng() - centerLatLng.lng()) * 111320 *
                Math.cos(centerLatLng.lat() * Math.PI / 180);
            preview.setRadius(Math.max(1, Math.sqrt(dLat * dLat + dLng * dLng)));
        });

        const upL = this.map.addListener('mouseup', (e) => {
            if (!isDrawing || !preview) return;
            isDrawing = false;
            this.onShapeComplete('circle', preview);
        });

        this.activeDrawingListeners.push(downL, moveL, upL);
    }

    setActiveToolButton(mode) {
        document.querySelectorAll('.draw-tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    enableTextPlacementMode() {
        this.disableTextPlacementMode();
        this.textPlacementListener = this.map.addListener('click', (event) => {
            this.disableTextPlacementMode();
            this.setActiveToolButton('cursor');
            this.pendingShape = { type: 'text', position: event.latLng, overlay: null };
            this.openDrawingDialog('text');
        });
    }

    disableTextPlacementMode() {
        if (this.textPlacementListener) {
            google.maps.event.removeListener(this.textPlacementListener);
            this.textPlacementListener = null;
        }
    }

    openDrawingDialog(shapeType) {
        const dialog = document.getElementById('drawing-dialog-overlay');
        const titleEl = document.getElementById('drawing-dialog-title');
        const strokeGroup = document.getElementById('stroke-weight-group');

        const titles = {
            polyline: 'Line Properties',
            polygon: 'Area Properties',
            rectangle: 'Rectangle Properties',
            circle: 'Circle Properties',
            text: 'Text Label Properties',
        };
        titleEl.textContent = titles[shapeType] || 'Annotation Properties';
        strokeGroup.style.display = shapeType === 'text' ? 'none' : '';

        if (this.editingShapeId === null) {
            document.getElementById('drawing-label-input').value = '';
            document.getElementById('drawing-category-input').value = 'existing';
            document.getElementById('drawing-color-input').value = '#ff0000';
            document.getElementById('drawing-stroke-input').value = '2';
        }

        dialog.classList.remove('hidden');
        dialog.setAttribute('aria-hidden', 'false');
        document.getElementById('drawing-label-input').focus();
    }

    openEditShapeDialog(firestoreId) {
        const entry = this.drawnShapes.find(s => s.firestoreId === firestoreId);
        if (!entry) return;
        this.editingShapeId = firestoreId;

        document.getElementById('drawing-label-input').value = entry.data.label || '';
        document.getElementById('drawing-category-input').value = entry.data.category || 'existing';
        document.getElementById('drawing-color-input').value = entry.data.color || '#ff0000';
        document.getElementById('drawing-stroke-input').value = entry.data.strokeWeight || 2;

        this.openDrawingDialog(entry.data.type);
    }

    async deleteDrawing(firestoreId, options = {}) {
        try {
            await deleteDoc(doc(this.db, 'drawings', firestoreId));
            const idx = this.drawnShapes.findIndex(s => s.firestoreId === firestoreId);
            if (idx !== -1) {
                const entry = this.drawnShapes[idx];
                if (entry.overlay) entry.overlay.setMap(null);
                if (entry.textMarker) entry.textMarker.map = null;
                this.drawnShapes.splice(idx, 1);
            }
            if (!options.suppressStatus) this.showStatusMessage('Annotation deleted');
            return true;
        } catch (error) {
            console.error('Error deleting drawing:', error);
            if (!options.suppressStatus) this.showStatusMessage('Error deleting annotation');
            return false;
        }
    }

    async saveDrawingFromDialog() {
        const activeSiteId = this.getActiveSiteId();
        if (!activeSiteId) {
            this.showStatusMessage('Select a site before saving annotations.');
            return;
        }

        const label = document.getElementById('drawing-label-input').value.trim();
        const category = document.getElementById('drawing-category-input').value;
        const color = document.getElementById('drawing-color-input').value;
        const strokeWeight = parseInt(document.getElementById('drawing-stroke-input').value) || 2;

        if (!label) { this.showStatusMessage('Please enter a label'); return; }

        let shapeData = { label, category, color, strokeWeight, fillOpacity: 0.2 };

        if (this.editingShapeId !== null) {
            const entry = this.drawnShapes.find(s => s.firestoreId === this.editingShapeId);
            try {
                await updateDoc(doc(this.db, 'drawings', this.editingShapeId), {
                    label, category, color, strokeWeight, updatedAt: serverTimestamp()
                });
                if (entry) {
                    this.applyShapeStyle(entry.overlay || entry.textMarker, entry.data.type, color, strokeWeight, category);
                    entry.data = { ...entry.data, label, category, color, strokeWeight };
                }
                this.showStatusMessage('Annotation updated');
            } catch (error) {
                console.error('Error updating drawing:', error);
                this.showStatusMessage('Failed to update annotation');
                return;
            }
        } else {
            const event = this.pendingShape;
            const type = event.type;

            if (type === 'polyline') {
                shapeData.type = 'polyline';
                shapeData.path = event.overlay.getPath().getArray().map(ll => ({ lat: ll.lat(), lng: ll.lng() }));
            } else if (type === 'polygon') {
                shapeData.type = 'polygon';
                shapeData.path = event.overlay.getPath().getArray().map(ll => ({ lat: ll.lat(), lng: ll.lng() }));
            } else if (type === 'rectangle') {
                shapeData.type = 'rectangle';
                const b = event.overlay.getBounds();
                shapeData.bounds = {
                    north: b.getNorthEast().lat(), south: b.getSouthWest().lat(),
                    east: b.getNorthEast().lng(), west: b.getSouthWest().lng()
                };
            } else if (type === 'circle') {
                shapeData.type = 'circle';
                const c = event.overlay.getCenter();
                shapeData.center = { lat: c.lat(), lng: c.lng() };
                shapeData.radius = event.overlay.getRadius();
            } else if (type === 'text') {
                shapeData.type = 'text';
                shapeData.position = { lat: event.position.lat(), lng: event.position.lng() };
            }

            shapeData.createdAt = serverTimestamp();
            shapeData.siteId = activeSiteId;
            this.applyShapeStyle(event.overlay, type, color, strokeWeight, category);

            const docRef = await addDoc(collection(this.db, 'drawings'), shapeData);
            const localEntry = { firestoreId: docRef.id, data: shapeData, overlay: event.overlay, textMarker: null };

            if (type === 'text') {
                localEntry.overlay = null;
                localEntry.textMarker = this.createTextMarker(shapeData, docRef.id);
            } else {
                this.attachShapeClickListener(event.overlay, docRef.id);
            }

            this.drawnShapes.push(localEntry);
            this.showStatusMessage('Annotation saved');
        }

        this.pendingShape = null;
        this.editingShapeId = null;
        const drawingOverlay = document.getElementById('drawing-dialog-overlay');
        drawingOverlay.classList.add('hidden');
        drawingOverlay.setAttribute('aria-hidden', 'true');
    }

    applyShapeStyle(overlay, type, color, strokeWeight, category) {
        if (!overlay) return;
        const isDashed = category === 'proposed';
        const icons = isDashed ? [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0', repeat: '16px'
        }] : null;

        if (type === 'polyline') {
            overlay.setOptions({
                strokeColor: color, strokeWeight,
                strokeOpacity: isDashed ? 0 : 1,
                icons: icons || undefined
            });
        } else {
            overlay.setOptions({
                strokeColor: color, strokeWeight,
                fillColor: color,
                fillOpacity: isDashed ? 0.08 : 0.15,
                // Rectangles/circles/polygons do not support polyline icons; keep proposed shapes visible.
                strokeOpacity: 1
            });
        }
    }

    attachShapeClickListener(overlay, firestoreId) {
        overlay.addListener('click', (event) => {
            this.contextMenuTargetId = firestoreId;
            const menu = document.getElementById('shape-context-menu');
            let menuLeft, menuTop;
            if (event.domEvent?.clientX != null) {
                menuLeft = event.domEvent.clientX;
                menuTop = event.domEvent.clientY;
            } else {
                const mapDiv = this.map.getDiv();
                const rect = mapDiv.getBoundingClientRect();
                menuLeft = rect.left + rect.width / 2;
                menuTop = rect.top + rect.height / 2;
            }
            menuLeft = Math.min(menuLeft, window.innerWidth - 100);
            menuTop = Math.min(menuTop, window.innerHeight - 60);
            menu.style.left = `${menuLeft}px`;
            menu.style.top = `${menuTop}px`;
            menu.classList.remove('hidden');
        });
    }

    createTextMarker(shapeData, firestoreId) {
        const AdvancedMarkerElement = this.getAdvancedMarkerElement();
        if (!AdvancedMarkerElement) return null;
        const div = document.createElement('div');
        div.className = 'map-text-label';
        div.textContent = shapeData.label || '';
        div.style.color = shapeData.color || '#FFFFFF';
        div.style.background = 'rgba(0,0,0,0.6)';
        div.style.padding = '2px 6px';
        div.style.borderRadius = '3px';
        div.style.fontSize = '12px';
        div.style.fontWeight = 'bold';
        div.style.cursor = 'pointer';
        const marker = new AdvancedMarkerElement({
            map: this.map,
            position: shapeData.position,
            content: div
        });
        div.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.contextMenuTargetId = firestoreId;
            const menu = document.getElementById('shape-context-menu');
            if (menu) {
                menu.style.left = `${event.clientX ?? 100}px`;
                menu.style.top = `${event.clientY ?? 100}px`;
                menu.classList.remove('hidden');
            }
        });
        return marker;
    }

    loadDrawingsFromFirestore() {
        try {
            if (this.unsubscribeDrawings) {
                this.unsubscribeDrawings();
                this.unsubscribeDrawings = null;
            }
            const activeSiteId = this.getActiveSiteId();
            if (!activeSiteId) {
                this.clearDrawnShapes();
                return;
            }

            const drawingsQuery = query(
                collection(this.db, 'drawings'),
                where('siteId', '==', activeSiteId),
                orderBy('createdAt', 'asc')
            );

            this.unsubscribeDrawings = onSnapshot(drawingsQuery, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const id = change.doc.id;
                    const data = change.doc.data();

                    if (change.type === 'added' || change.type === 'modified') {
                        // Remove existing shape first to prevent brief duplicate on screen
                        const existingShape = this.drawnShapes.find(s => s.firestoreId === id);
                        if (existingShape) {
                            if (existingShape.overlay) existingShape.overlay.setMap(null);
                            if (existingShape.textMarker) existingShape.textMarker.map = null;
                            this.drawnShapes.splice(this.drawnShapes.indexOf(existingShape), 1);
                        }

                        let overlay = null;
                        let textMarker = null;
                        const baseStyle = {
                            map: this.map,
                            strokeColor: data.color || '#FF0000',
                            strokeWeight: data.strokeWeight || 2,
                            fillColor: data.color || '#FF0000',
                            fillOpacity: 0.15,
                        };

                        if (data.type === 'polyline') {
                            overlay = new google.maps.Polyline({
                                path: data.path,
                                map: this.map,
                                strokeColor: data.color || '#FF0000',
                                strokeWeight: data.strokeWeight || 2,
                            });
                        } else if (data.type === 'polygon') {
                            overlay = new google.maps.Polygon({ paths: data.path, ...baseStyle });
                        } else if (data.type === 'rectangle') {
                            overlay = new google.maps.Rectangle({ bounds: data.bounds, ...baseStyle });
                        } else if (data.type === 'circle') {
                            overlay = new google.maps.Circle({ center: data.center, radius: data.radius, ...baseStyle });
                        } else if (data.type === 'text') {
                            textMarker = this.createTextMarker(data, id);
                        }

                        if (overlay) {
                            this.applyShapeStyle(overlay, data.type, data.color, data.strokeWeight, data.category);
                            this.attachShapeClickListener(overlay, id);
                        }

                        this.drawnShapes.push({ firestoreId: id, data, overlay, textMarker });

                    } else if (change.type === 'removed') {
                        const idx = this.drawnShapes.findIndex(s => s.firestoreId === id);
                        if (idx !== -1) {
                            const entry = this.drawnShapes[idx];
                            if (entry.overlay) entry.overlay.setMap(null);
                            if (entry.textMarker) entry.textMarker.map = null;
                            this.drawnShapes.splice(idx, 1);
                        }
                    }
                });
            }, (error) => {
                console.error("Error loading drawings from Firestore:", error);
            });
        } catch (error) {
            console.error("Error initializing drawings listener:", error);
        }
    }

    clearDrawnShapes() {
        this.drawnShapes.forEach(shape => {
            if (shape.overlay) shape.overlay.setMap(null);
            if (shape.textMarker) shape.textMarker.map = null;
        });
        this.drawnShapes = [];
    }

    cleanup() {
        if (this.unsubscribeDrawings) {
            this.unsubscribeDrawings();
            this.unsubscribeDrawings = null;
        }
        this.stopDrawingMode();
        this.disableTextPlacementMode();
        if (this.pendingShape?.overlay) {
            this.pendingShape.overlay.setMap(null);
        }
        this.clearDrawnShapes();
        this.pendingShape = null;
        this.editingShapeId = null;
        this.contextMenuTargetId = null;
        this._drawingMode = false;
        const menu = document.getElementById('shape-context-menu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }

    destroy() {
        this.cleanup();
    }
}
