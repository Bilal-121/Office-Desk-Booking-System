import { useState, useRef, useEffect } from 'react';
import { Upload, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Desk {
  id: string;
  deskNumber: string;
  positionX?: number | null;
  positionY?: number | null;
}

interface FloorPlanEditorProps {
  floorId: string;
  currentMapUrl?: string | null;
  desks: Desk[];
  onSave: () => void;
  onDesksChange?: () => void;
}

export default function FloorPlanEditor({
  floorId,
  currentMapUrl,
  desks,
  onSave,
  onDesksChange,
}: FloorPlanEditorProps) {
  const [mapUrl, setMapUrl] = useState(currentMapUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingDesk, setAddingDesk] = useState(false);
  const [deskPositions, setDeskPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map(
      desks
        .filter(d => d.positionX !== null && d.positionX !== undefined && d.positionY !== null && d.positionY !== undefined)
        .map(d => [d.id, { x: d.positionX!, y: d.positionY! }])
    )
  );
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMapUrl(currentMapUrl || '');
  }, [currentMapUrl, floorId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('floorId', floorId);

    try {
      const response = await fetch('/api/admin/floors/upload-map', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMapUrl(result.data.mapUrl);
        localStorage.setItem(
          'floorPlanUpdated',
          JSON.stringify({ floorId, mapUrl: result.data.mapUrl, updatedAt: Date.now() })
        );
        toast.success('Floor plan uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload floor plan');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload floor plan');
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedDeskId || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDeskPositions(new Map(deskPositions.set(selectedDeskId, { x, y })));
    toast.success(`Desk positioned at (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
  };

  const handleSavePositions = async () => {
    setSaving(true);
    try {
      const updates = Array.from(deskPositions.entries()).map(([deskId, pos]) => ({
        deskId,
        positionX: pos.x,
        positionY: pos.y,
      }));

      const response = await fetch('/api/admin/desks/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: updates }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Desk positions saved successfully');
        onSave();
      } else {
        toast.error(result.error || 'Failed to save positions');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save positions');
    } finally {
      setSaving(false);
    }
  };

  const removeDeskPosition = (deskId: string) => {
    const newPositions = new Map(deskPositions);
    newPositions.delete(deskId);
    setDeskPositions(newPositions);
    toast.success('Desk position removed');
  };

  const handleAddDesk = async () => {
    setAddingDesk(true);
    try {
      const response = await fetch('/api/admin/desks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Desk added successfully');
        onDesksChange?.();
      } else {
        toast.error(result.error || 'Failed to add desk');
      }
    } catch (error) {
      console.error('Add desk error:', error);
      toast.error('Failed to add desk');
    } finally {
      setAddingDesk(false);
    }
  };

  const handleRemoveDesk = async (deskId: string, deskNumber: string) => {
    if (!confirm(`Are you sure you want to remove ${deskNumber}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/desks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deskId }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove position if it exists
        const newPositions = new Map(deskPositions);
        newPositions.delete(deskId);
        setDeskPositions(newPositions);
        
        toast.success('Desk removed successfully');
        onDesksChange?.();
      } else {
        toast.error(result.error || 'Failed to remove desk');
      }
    } catch (error) {
      console.error('Remove desk error:', error);
      toast.error('Failed to remove desk');
    }
  };

  const positionedDesksCount = deskPositions.size;
  const unpositionedDesks = desks.filter(d => !deskPositions.has(d.id));

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-950 tracking-tight mb-3">Floor Plan Image</h3>
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-secondary"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : mapUrl ? 'Change Floor Plan' : 'Upload Floor Plan'}
            </button>
            {mapUrl && (
              <p className="mt-2 text-sm text-gray-500">
                Current floor plan uploaded. Click to change.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Desk Management Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-950 tracking-tight">Manage Desks</h3>
            <p className="text-sm text-gray-500">
              Total desks: {desks.length}
            </p>
          </div>
          <button
            onClick={handleAddDesk}
            disabled={addingDesk}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            {addingDesk ? 'Adding...' : 'Add Desk'}
          </button>
        </div>

        {/* Desk List */}
        {desks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">All Desks</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {desks.map((desk) => (
                <div
                  key={desk.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-gray-900">{desk.deskNumber}</span>
                  <button
                    onClick={() => handleRemoveDesk(desk.id, desk.deskNumber)}
                    className="text-danger-600 hover:text-danger-700 p-1 rounded-lg hover:bg-danger-50 transition-colors"
                    title="Remove desk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mapUrl && (
        <>
          {/* Instructions */}
          <div className="bg-gray-50 ring-1 ring-inset ring-gray-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">How to Position Desks</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Select a desk from the list below</li>
              <li>Click on the floor plan image where you want to place it</li>
              <li>Repeat for all desks</li>
              <li>Click &quot;Save All Positions&quot; when done</li>
            </ol>
          </div>

          {/* Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-950 tracking-tight">Position Desks</h3>
                <p className="text-sm text-gray-500">
                  {positionedDesksCount} of {desks.length} desks positioned
                </p>
              </div>
              <button
                onClick={handleSavePositions}
                disabled={saving || positionedDesksCount === 0}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Positions'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-accent-500 h-2 rounded-full transition-all"
                style={{ width: `${desks.length > 0 ? (positionedDesksCount / desks.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Unpositioned Desks */}
          {unpositionedDesks.length > 0 && (
            <div className="card">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Desks to Position ({unpositionedDesks.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {unpositionedDesks.map((desk) => (
                  <button
                    key={desk.id}
                    onClick={() => setSelectedDeskId(desk.id)}
                    className={`badge cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
                      selectedDeskId === desk.id
                        ? 'badge-primary ring-2 ring-accent-500 ring-offset-2'
                        : 'badge-neutral hover:bg-accent-50 hover:text-accent-700'
                    }`}
                  >
                    {desk.deskNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Floor Plan with Positioned Desks */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {selectedDeskId
                ? `Click on the image to position desk ${desks.find(d => d.id === selectedDeskId)?.deskNumber}`
                : 'Select a desk to position'}
            </h4>

            {/* These colors are about positioning status, not booking status —
                worth spelling out since the live floor plan reuses this same
                green/dark palette to mean something else entirely. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-700 mb-3">
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-accent-500 border-2 border-white shadow" />
                Positioned
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-950 border-2 border-white shadow ring-2 ring-accent-400" />
                Selected — click the map to place
              </span>
            </div>

            <div
              className={`relative bg-gray-100 rounded-lg overflow-hidden ${
                selectedDeskId ? 'cursor-crosshair' : ''
              }`}
              onClick={handleImageClick}
            >
              <img
                ref={imageRef}
                src={mapUrl}
                alt="Floor Plan"
                className="w-full h-auto"
                onLoad={() => setImageLoaded(true)}
              />

              {imageLoaded &&
                Array.from(deskPositions.entries()).map(([deskId, pos]) => {
                  const desk = desks.find(d => d.id === deskId);
                  if (!desk) return null;

                  return (
                    <div
                      key={deskId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                      }}
                    >
                      {/* Desk Marker — positioning-status colors, not booking-status
                          (see legend above); mirrors FloorPlanViewer's shape/hover */}
                      <div
                        className={`w-7 h-7 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-110 ${
                          selectedDeskId === deskId
                            ? 'bg-gray-950 ring-2 ring-accent-400'
                            : 'bg-accent-500'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedDeskId === deskId ? 'bg-accent-400' : 'bg-white'
                            }`}
                          ></div>
                        </div>
                      </div>

                      {/* Label */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 bg-gray-950 text-white text-xs font-semibold px-2 py-1 rounded-xl shadow-card whitespace-nowrap">
                        {desk.deskNumber}
                      </div>

                      {/* Remove Button — always visible/tappable, not hover-only,
                          since this is realistically a tablet workflow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDeskPosition(deskId);
                        }}
                        className="absolute -top-2 -right-2 bg-danger-500 hover:bg-danger-600 text-white rounded-full p-1.5 shadow-card transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-1"
                        title="Remove position"
                        aria-label={`Remove position for ${desk.deskNumber}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
