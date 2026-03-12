// app/venues/management/page.client.tsx

'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { venueService } from '@/features/venues/services/venue.service';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type StorageReference,
} from 'firebase/storage';
import type { Post, Equipment, Layer } from '@/app/types';
import { DiagonalStreaksFixed } from "@/components/ui/diagonal-streaks-fixed";
import NewLayerModal from '@/features/venues/components/modals/newlayer';
import LocationEditModal from '@/features/venues/components/modals/locationedit';
import {
  Button,
  Input,
  Tabs,
  Tab,
} from '@heroui/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import VenueEquipmentTab from '@/features/venues/components/VenueEquipmentTab';
import VenueLocationsTab from '@/features/venues/components/VenueLocationsTab';
import VenueMapLayer from '@/features/venues/components/VenueMapLayer';


// Props: none required for this page

interface EquipmentWithLocation extends Equipment {
  locationId?: string;
}

export default function VenueManagementPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId');
  // Firebase
  const auth = useMemo(() => getAuth(), []);
  const storage = useMemo(() => getStorage(), []);
  const userId = auth.currentUser?.uid;

  // Local state
  const [venueData, setVenueData] = useState<{
    name: string;
    equipment: EquipmentWithLocation[];
    layers: Layer[];
  }>({
    name: '',
    equipment: [],
    layers: [{ id: crypto.randomUUID(), name: 'Floor 1', posts: [], mapUrl: undefined }],
  });

  const [currentLayer, setCurrentLayer] = useState(0);

  const [isUploading, setIsUploading] = useState(false);

  // Marker placement mode
  const [isAddMarkerMode, setIsAddMarkerMode] = useState(false);

  // Active marker being named
  const [pendingMarker, setPendingMarker] = useState<{
    x: number;
    y: number;
    layerIdx: number;
    postIdx: number;
  } | null>(null);
  const [markerNameInput, setMarkerNameInput] = useState('');

  // Inputs
  const [locationInput, setLocationInput] = useState('');

  // File upload (optional map)
  const [mapFile, setMapFile] = useState<File | null>(null);

  // Image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Refs for image geometry
  const imgRef = useRef<HTMLImageElement | null>(null);
  const markerInputRef = useRef<HTMLInputElement | null>(null);

  // Hidden file input for map upload/replace
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Drag/hover
  const [pendingLayer, setPendingLayer] = useState<number | null>(null);

  // Drag/hover
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);

  // Dragging state ref to avoid stale closure issues in global listeners
  const dragStateRef = useRef<{ idx: number | null; rect: DOMRect | null }>({ idx: null, rect: null });

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const { idx, rect } = dragStateRef.current;
    if (idx === null || !rect) return;

    const nx = ((e.clientX - rect.left) / rect.width) * 100;
    const ny = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.max(0, Math.min(100, nx));
    const y = Math.max(0, Math.min(100, ny));

    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      const posts = [...newLayers[currentLayer].posts];
      const post = posts[idx];
      if (typeof post === 'string') return prev;
      posts[idx] = { ...post, x, y };
      newLayers[currentLayer] = { ...newLayers[currentLayer], posts };
      return { ...prev, layers: newLayers };
    });
  }, [currentLayer]);

  const handleGlobalMouseUp = useCallback(() => {
    if (dragStateRef.current.idx !== null) {
      dragStateRef.current = { idx: null, rect: null };
      setDraggingIdx(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleMarkerMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imgRef.current) return;
    setDraggingIdx(idx);
    dragStateRef.current = { idx, rect: imgRef.current.getBoundingClientRect() };
  }, []);

  // New layer modal
  const [isNewLayerModalOpen, setIsNewLayerModalOpen] = useState(false);

  // Location edit modal
  const [isLocationEditModalOpen, setIsLocationEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{ layerIdx: number; postIdx: number } | null>(null);

  // Equipment editing state
  const [selectedLeftTab, setSelectedLeftTab] = useState<string>('locations');


  // Update preview when a new map file is selected
  useEffect(() => {
    if (mapFile && pendingLayer === currentLayer) {
      const url = URL.createObjectURL(mapFile);
      setPreviewUrl(url);
      // Reset zoom/pan when new image loads
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(venueData.layers[currentLayer]?.mapUrl || null);
    }
  }, [mapFile, pendingLayer, currentLayer, venueData.layers]);

  // Auto-focus marker name input when pending marker is set
  useEffect(() => {
    if (pendingMarker && markerInputRef.current) {
      markerInputRef.current.focus();
    }
  }, [pendingMarker]);

  // Load venue data if editing
  useEffect(() => {
    if (venueId && userId) {
      const loadVenue = async () => {
        try {
          const venue = await venueService.getById(venueId);
          if (venue) {
            let layers: Layer[];
            if (venue.layers && venue.layers.length > 0) {
              layers = venue.layers;
            } else {
              // Backward compatibility: create single layer from old format
              layers = [{
                id: crypto.randomUUID(),
                name: 'Main',
                posts: venue.posts || [],
                mapUrl: venue.mapUrl,
              }];
            }
            setVenueData({
              name: venue.name,
              equipment: venue.equipment || [],
              layers,
            });
            setCurrentLayer(0);
          }
        } catch (error) {
          console.error('Error loading venue:', error);
          alert('Failed to load venue data');
        }
      };
      loadVenue();
    }
  }, [venueId, userId]);

  // File name from mapFile or mapUrl
  const mapFileName = useMemo(() => {
    if (mapFile?.name && pendingLayer === currentLayer) return mapFile.name;
    const currentMapUrl = venueData.layers[currentLayer]?.mapUrl;
    if (currentMapUrl) {
      try {
        const u = new URL(currentMapUrl);
        const filename = u.pathname.split('/').pop() || '';
        const parts = filename.split('_');
        if (parts.length > 1) {
          return decodeURIComponent(parts.slice(1).join('_'));
        } else {
          return decodeURIComponent(filename);
        }
      } catch {
        const s = currentMapUrl.split('?')[0];
        const filename = s.substring(s.lastIndexOf('/') + 1);
        const parts = filename.split('_');
        if (parts.length > 1) {
          return decodeURIComponent(parts.slice(1).join('_'));
        } else {
          return decodeURIComponent(filename);
        }
      }
    }
    return '';
  }, [mapFile, pendingLayer, currentLayer, venueData.layers]);

  // Controlled input change
  const handleChange = (value: string) => {
    setVenueData((prev) => ({ ...prev, name: value }));
  };

  // All posts from all layers
  const allPosts = venueData.layers.flatMap((layer, layerIdx) =>
    layer.posts.map((post, postIdx) => ({ post, layerIdx, postIdx, layerName: layer.name }))
  );

  const addTextLocation = () => {
    const val = locationInput.trim();
    if (!val) return;
    const newPost: Post = {
      name: val,
      x: null,
      y: null,
    };
    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      newLayers[currentLayer] = {
        ...newLayers[currentLayer],
        posts: [...newLayers[currentLayer].posts, newPost],
      };
      return { ...prev, layers: newLayers };
    });
    setLocationInput('');
  };

  const removePost = (layerIdx: number, postIdx: number) => {
    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      newLayers[layerIdx] = {
        ...newLayers[layerIdx],
        posts: newLayers[layerIdx].posts.filter((_, i) => i !== postIdx),
      };
      return { ...prev, layers: newLayers };
    });
  };

  const renamePost = (layerIdx: number, postIdx: number) => {
    setEditingLocation({ layerIdx, postIdx });
    setIsLocationEditModalOpen(true);
  };

  const handleEditLocation = (name: string, newLayerIdx: number) => {
    if (!editingLocation) return;
    const { layerIdx, postIdx } = editingLocation;
    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      const post = newLayers[layerIdx].posts[postIdx];
      if (typeof post === 'string') return prev;
      if (newLayerIdx !== layerIdx) {
        // Move to new layer
        const newPost = { ...post, name };
        newLayers[layerIdx].posts.splice(postIdx, 1);
        newLayers[newLayerIdx].posts.push(newPost);
      } else {
        // Same layer, just rename
        newLayers[layerIdx].posts[postIdx] = { ...post, name };
      }
      return { ...prev, layers: newLayers };
    });
    setEditingLocation(null);
  };

  const updateLayerName = (name: string) => {
    setVenueData(prev => {
      const newLayers = [...prev.layers];
      newLayers[currentLayer] = { ...newLayers[currentLayer], name };
      return { ...prev, layers: newLayers };
    });
  };

  // Handle map click for marker placement
  const handleImageClick = (evt: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddMarkerMode || isPanning || !imgRef.current) return;

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    if (
      evt.clientX < rect.left ||
      evt.clientX > rect.right ||
      evt.clientY < rect.top ||
      evt.clientY > rect.bottom
    ) {
      return;
    }

    const xPercent = ((evt.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((evt.clientY - rect.top) / rect.height) * 100;
    const x = Math.max(0, Math.min(100, xPercent));
    const y = Math.max(0, Math.min(100, yPercent));

    const newPost: Post = { name: '', x, y };

    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      newLayers[currentLayer] = {
        ...newLayers[currentLayer],
        posts: [...newLayers[currentLayer].posts, newPost],
      };
      return { ...prev, layers: newLayers };
    });
    setPendingMarker({ x, y, layerIdx: currentLayer, postIdx: venueData.layers[currentLayer].posts.length });
    setMarkerNameInput('');
  };

  // Confirm marker name
  const confirmMarkerName = () => {
    if (!pendingMarker) return;

    const name = markerNameInput.trim();
    if (!name) {
      removePost(pendingMarker.layerIdx, pendingMarker.postIdx);
      setPendingMarker(null);
      setMarkerNameInput('');
      return;
    }

    setVenueData((prev) => {
      const newLayers = [...prev.layers];
      const copy = [...newLayers[pendingMarker.layerIdx].posts];
      const currentPost = copy[pendingMarker.postIdx];
      if (typeof currentPost !== 'string') {
        copy[pendingMarker.postIdx] = { ...currentPost, name };
      }
      newLayers[pendingMarker.layerIdx] = { ...newLayers[pendingMarker.layerIdx], posts: copy };
      return { ...prev, layers: newLayers };
    });

    setPendingMarker(null);
    setMarkerNameInput('');
  };

  // Cancel marker placement
  const cancelMarkerName = () => {
    if (pendingMarker) {
      removePost(pendingMarker.layerIdx, pendingMarker.postIdx);
    }
    setPendingMarker(null);
    setMarkerNameInput('');
  };

  // Upload w/ retry
  const uploadWithRetry = async (
    storageRef: StorageReference,
    file: File,
    maxRetries = 3,
    baseDelay = 1200
  ): Promise<string> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? (err as { code?: unknown }).code
            : undefined;

        const isRetryable =
          code === 'storage/retry-limit-exceeded' ||
          code === 'storage/unknown' ||
          code === 'storage/canceled' ||
          code === 'storage/quota-exceeded' ||
          code === 'storage/unauthenticated';

        if (attempt < maxRetries - 1 && isRetryable) {
          const wait = baseDelay * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, wait));
          continue;
        }

        throw new Error('Upload failed');
      }
    }
    throw new Error('Max retries exceeded');
  };

  // Create venue
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId) {
      alert('You must be logged in to save the venue');
      return;
    }

    if (!venueData.name.trim()) {
      alert('Please enter a venue name');
      return;
    }

    if (pendingMarker) {
      alert('Please finish naming the marker or cancel it before saving');
      return;
    }

    setIsUploading(true);
    try {
      let newMapUrl: string | undefined;

      if (mapFile && mapFile.size > 0) {
        const storageRef = ref(storage, `venue_maps/${Date.now()}_${mapFile.name}`);
        newMapUrl = await uploadWithRetry(storageRef, mapFile);
      }

      const equipmentToSave = venueData.equipment.map(({ ...rest }) => rest);

      // Update current layer's mapUrl if new map uploaded
      const updatedLayers = venueData.layers.map((layer, idx) => {
        const layerData = idx === (pendingLayer ?? currentLayer) && newMapUrl ? { ...layer, mapUrl: newMapUrl } : layer;
        // Remove undefined properties from each layer
        const filteredLayer: Record<string, unknown> = {};
        Object.entries(layerData).forEach(([key, value]) => {
          if (value !== undefined) {
            filteredLayer[key] = value;
          }
        });
        return filteredLayer;
      });

      const dataToSave: Record<string, unknown> = {
        name: venueData.name.trim(),
        equipment: equipmentToSave,
        layers: updatedLayers,
        posts: allPosts.map(item => item.post),
        userId,
      };

      // Only add mapUrl if it exists
      if (venueData.layers?.[0]?.mapUrl) {
        dataToSave.mapUrl = venueData.layers[0].mapUrl;
      }

      if (venueId) {
        // Update existing venue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await venueService.update(venueId, dataToSave as any);
      } else {
        // Create new venue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await venueService.create(crypto.randomUUID(), dataToSave as any);
      }
      router.push('/venues/selection')
    } catch (error: unknown) {
      console.error('Error saving venue:', error);
      const message =
        typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unknown error';
      alert(
        message.includes('storage/unauthorized')
          ? 'Save failed: Check storage permissions'
          : `Save failed: ${message}`
      );
    } finally {
      setIsUploading(false);
      setMapFile(null);
      setPendingLayer(null);
    }
  };

  // Handle adding new layer
  const handleAddLayer = async (name: string, file: File) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `venue_maps/${Date.now()}_${file.name}`);
      const mapUrl = await uploadWithRetry(storageRef, file);
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name,
        mapUrl,
        posts: [],
      };
      const newLayers = [...venueData.layers, newLayer];
      setVenueData(prev => ({
        ...prev,
        layers: newLayers,
      }));
      setCurrentLayer(newLayers.length - 1);
    } catch (error) {
      console.error('Error adding layer:', error);
      alert('Failed to add layer');
    } finally {
      setIsUploading(false);
    }
    setIsNewLayerModalOpen(false);
  };

  // Handle deleting layer
  const deleteLayer = () => {
    if (venueData.layers.length <= 1) {
      alert('Cannot delete the last layer');
      return;
    }
    const confirmDelete = window.confirm('Are you sure you want to delete this layer?');
    if (!confirmDelete) return;
    setVenueData(prev => {
      const newLayers = prev.layers.filter((_, i) => i !== currentLayer);
      return { ...prev, layers: newLayers };
    });
    setCurrentLayer(Math.max(0, currentLayer - 1));
  };

  let initialLocationName = '';
  if (editingLocation) {
    const p = venueData.layers[editingLocation.layerIdx].posts[editingLocation.postIdx];
    if (typeof p === 'string') {
      initialLocationName = p;
    } else if (p && 'name' in p) {
      initialLocationName = p.name;
    }
  }

  return (
    <main className="relative bg-surface-deepest text-white h-[calc(10-0vh-3rem)]">
      <DiagonalStreaksFixed />

      <div className="relative z-10 pt-4 max-w-[1200px] mx-auto">
        <div>

          <div className="flex h-[calc(100vh-80px)]">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setMapFile(e.target.files?.[0] ?? null);
                setPendingLayer(currentLayer);
              }}
            />

            <PanelGroup direction="horizontal">
              {/* Left Panel - Resizable */}
              <Panel defaultSize={30} minSize={25} maxSize={50}>
                <div className="flex flex-col h-full relative">
                  <div className="flex-1 p-6 pb-12">
                    <div className="space-y-6">

                      {/* Venue Name */}
                      <div>
                        <Input
                          label="Venue Name"
                          placeholder="e.g., Convention Center Hall A"
                          value={venueData.name}
                          onValueChange={handleChange}
                          isRequired
                          labelPlacement={"outside"}
                          variant="flat"
                          classNames={{
                            label: 'text-white font-medium',
                            inputWrapper: 'rounded-2xl px-4 hover:bg-surface-deep',
                            input: 'text-white outline-none focus:outline-none data-[focus=true]:outline-none',
                          }}
                        />
                      </div>

                      {/* Locations & Equipment Section with Tabs */}
                      <Tabs className="flex-1 w-full" fullWidth radius="lg" selectedKey={selectedLeftTab} onSelectionChange={(key) => setSelectedLeftTab(key as string)}>
                        <Tab key="locations" title="Locations">
                          <VenueLocationsTab
                            allPosts={allPosts}
                            onAddLocation={addTextLocation}
                            onRemoveLocation={removePost}
                            onRenameLocation={renamePost}
                            pendingMarker={pendingMarker}
                          />
                        </Tab>
                        <Tab key="equipment" title="Equipment">
                          <VenueEquipmentTab
                            equipment={venueData.equipment}
                            onChange={(newEquip) => setVenueData((prev) => ({ ...prev, equipment: newEquip }))}
                          />
                        </Tab>
                      </Tabs>
                    </div>
                  </div>

                  {/* Action Buttons - Fixed to Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex gap-3">
                      <Button
                        variant="bordered"
                        onPress={() => router.push('/venues/selection')}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onPress={() => handleSubmit()}
                        isLoading={isUploading}
                        isDisabled={!venueData.name.trim()}
                        className="flex-1 bg-accent hover:bg-accent/90 text-white px-10"
                      >
                        {(() => {
                          if (isUploading) return venueId ? 'Updating...' : 'Creating...';
                          return venueId ? 'Update Venue' : 'Create Venue';
                        })()}
                      </Button>
                    </div>
                  </div>
                </div>
              </Panel>
              {/* Resize Handle */}
              <PanelResizeHandle className="w-1 bg-surface-liner transition-colors cursor-col-resize flex items-center justify-center group">
                <div className="w-0.5 h-8 bg-surface-light/30 rounded-full transition-colors" />
              </PanelResizeHandle>
              {/* Right Panel - Resizable */}
              <Panel defaultSize={70} minSize={45}>
                <div className="flex flex-col h-full relative px-6 pt-6 pb-[72px] overflow-hidden">
                  <VenueMapLayer
                    previewUrl={previewUrl}
                    mapFileName={mapFileName}
                    isAddMarkerMode={isAddMarkerMode}
                    setIsAddMarkerMode={setIsAddMarkerMode}
                    scale={scale}
                    setScale={setScale}
                    position={position}
                    setPosition={setPosition}
                    isPanning={isPanning}
                    setIsPanning={setIsPanning}
                    panStart={panStart}
                    setPanStart={setPanStart}
                    currentLayer={currentLayer}
                    setCurrentLayer={setCurrentLayer}
                    layerName={venueData.layers[currentLayer].name}
                    updateLayerName={updateLayerName}
                    layerCount={venueData.layers.length}
                    onDeleteLayer={deleteLayer}
                    onAddLayerClick={() => setIsNewLayerModalOpen(true)}
                    onUploadClick={() => fileInputRef.current?.click()}
                    onImageLoad={(e) => {
                      const img = e.currentTarget;
                      imgRef.current = img;
                    }}
                    handleImageClick={handleImageClick}
                    pendingMarker={pendingMarker}
                    markerNameInput={markerNameInput}
                    setMarkerNameInput={setMarkerNameInput}
                    confirmMarkerName={confirmMarkerName}
                    cancelMarkerName={cancelMarkerName}
                    hoverId={hoverId}
                    setHoverId={setHoverId}
                    draggingIdx={draggingIdx}
                    onMarkerMouseDown={handleMarkerMouseDown}
                    renamePost={renamePost}
                    posts={venueData.layers[currentLayer]?.posts || []}
                  />
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>

      <NewLayerModal
        isOpen={isNewLayerModalOpen}
        onClose={() => setIsNewLayerModalOpen(false)}
        onSubmit={handleAddLayer}
      />

      <LocationEditModal
        isOpen={isLocationEditModalOpen}
        onClose={() => setIsLocationEditModalOpen(false)}
        onSubmit={handleEditLocation}
        initialName={initialLocationName}
        initialLayerIdx={editingLocation?.layerIdx || 0}
        layers={venueData.layers}
      />
    </main>
  );
}
