import React, { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button, Input, ButtonGroup, Card } from '@heroui/react';
import { ZoomIn, ZoomOut, MapPin, Upload, ChevronLeft, ChevronRight, Trash2, Plus, MousePointer2 } from 'lucide-react';
import type { Post } from '@/app/types';

interface VenueMapLayerProps {
    previewUrl: string | null;
    mapFileName: string;
    isAddMarkerMode: boolean;
    setIsAddMarkerMode: (mode: boolean) => void;
    scale: number;
    setScale: (scale: number | ((prev: number) => number)) => void;
    position: { x: number; y: number };
    setPosition: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
    isPanning: boolean;
    setIsPanning: (panning: boolean) => void;
    panStart: { x: number; y: number };
    setPanStart: (pos: { x: number; y: number }) => void;
    currentLayer: number;
    setCurrentLayer: (layer: number | ((prev: number) => number)) => void;
    layerName: string;
    updateLayerName: (name: string) => void;
    layerCount: number;
    onDeleteLayer: () => void;
    onAddLayerClick: () => void;
    onUploadClick: () => void;
    onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    handleImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    confirmMarkerName: () => void;
    cancelMarkerName: () => void;
    hoverId: number | null;
    setHoverId: (id: number | null | ((prev: number | null) => number | null)) => void;
    draggingIdx: number | null;
    onMarkerMouseDown: (idx: number) => (evt: React.MouseEvent<HTMLDivElement>) => void;
    renamePost: (layerIdx: number, postIdx: number) => void;
    posts: Post[];
    pendingMarker: { layerIdx: number; postIdx: number; x: number; y: number } | null;
    markerNameInput: string;
    setMarkerNameInput: (name: string) => void;
}

export default function VenueMapLayer({
    previewUrl,
    mapFileName,
    isAddMarkerMode,
    setIsAddMarkerMode,
    scale,
    setScale,
    position,
    setPosition,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    currentLayer,
    setCurrentLayer,
    layerName,
    updateLayerName,
    layerCount,
    onDeleteLayer,
    onAddLayerClick,
    onUploadClick,
    onImageLoad,
    handleImageClick,
    confirmMarkerName,
    cancelMarkerName,
    hoverId,
    setHoverId,
    draggingIdx,
    onMarkerMouseDown,
    renamePost,
    posts,
    pendingMarker,
    markerNameInput,
    setMarkerNameInput
}: VenueMapLayerProps) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const imgContainerRef = useRef<HTMLDivElement | null>(null);
    const markerInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (pendingMarker && markerInputRef.current) {
            markerInputRef.current.focus();
        }
    }, [pendingMarker]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isAddMarkerMode) return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        const img = imgRef.current;
        const container = imgContainerRef.current;
        if (!img || !container) {
            setPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const imgWidth = img.offsetWidth * scale;
        const imgHeight = img.offsetHeight * scale;
        const newX = e.clientX - panStart.x;
        const newY = e.clientY - panStart.y;
        const maxX = Math.max(0, (imgWidth - containerRect.width) / scale);
        const maxY = Math.max(0, (imgHeight - containerRect.height) / scale);

        setPosition({
            x: Math.min(0, Math.max(-maxX, newX)),
            y: Math.min(0, Math.max(-maxY, newY)),
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleMarkerMouseLeave = useCallback((idx: number) => {
        setHoverId((cur) => (cur === idx ? null : cur));
    }, [setHoverId]);

    type CoordinatedPost = {
        name: string;
        x: number;
        y: number;
    };

    const validPosts = posts.filter((post): post is CoordinatedPost =>
        typeof post === 'object' &&
        post !== null &&
        'name' in post &&
        typeof post.x === 'number' &&
        typeof post.y === 'number' &&
        post.x !== null &&
        post.y !== null
    );

    let cursorStyle = 'grab';
    if (isAddMarkerMode) {
        cursorStyle = 'crosshair';
    } else if (isPanning) {
        cursorStyle = 'grabbing';
    }

    return (
        <div className="flex flex-col h-full relative px-6 pt-6 pb-[72px] overflow-hidden">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-white">
                        Venue Map <span className="text-surface-light text-xs">(Optional)</span>
                    </label>
                    <Input
                        value={layerName}
                        onValueChange={updateLayerName}
                        variant="flat"
                        size="sm"
                        classNames={{
                            input: 'text-white text-sm outline-none focus:outline-none data-[focus=true]:outline-none',
                            inputWrapper: 'rounded-2xl px-4 pr-6 hover:bg-surface-deep',
                        }}
                        placeholder="Layer name"
                    />
                </div>
                {previewUrl && (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={isAddMarkerMode ? 'solid' : 'bordered'}
                            color={isAddMarkerMode ? 'primary' : 'default'}
                            onPress={() => setIsAddMarkerMode(!isAddMarkerMode)}
                            startContent={isAddMarkerMode ? <MousePointer2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            className={isAddMarkerMode ? 'bg-accent hover:bg-accent/90 text-white' : ''}
                        >
                            {isAddMarkerMode ? 'Click to Place' : 'Add Markers'}
                        </Button>
                    </div>
                )}
            </div>

            <div className={`rounded-xl relative flex flex-col items-center justify-start w-full ${previewUrl ? 'max-h-[calc(100vh-180px)]' : 'h-full'}`}>
                {!previewUrl && (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default-200 bg-surface-deep/30 p-8 text-center">
                        <div className="mb-4 rounded-full bg-surface-deep p-4 text-surface-faint">
                            <MapPin className="h-8 w-8" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-white">No Venue Map Uploaded</h3>
                        <p className="mb-6 max-w-sm text-sm text-surface-light">
                            Upload a high-quality map of your venue to help staff navigate and locate specific areas during the event.
                        </p>
                    </div>
                )}
                {/* 
                  Only render the map interactive area if valid preview URL
                */}
                {previewUrl && (
                    <div className="w-full flex flex-col gap-3 max-h-full">
                        <div className="relative w-full overflow-hidden rounded-2xl">
                            <div
                                ref={imgContainerRef}
                                className="relative overflow-auto scrollbar-hide"
                                onWheel={handleWheel}
                                style={{
                                    cursor: cursorStyle,
                                    maxHeight: 'calc(100vh - 200px)',
                                }}
                            >
                                <div
                                    className="relative inline-block"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onClick={(e) => {
                                        if (imgRef.current) {
                                            e.currentTarget.getBoundingClientRect = () => imgRef.current!.getBoundingClientRect();
                                        }
                                        handleImageClick(e);
                                    }}
                                    style={{
                                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                                        transformOrigin: 'left top',
                                        transition: isPanning ? 'none' : 'transform 0.1s',
                                    }}
                                >
                                    <Image
                                        ref={(node) => {
                                            if (node) {
                                                imgRef.current = node as unknown as HTMLImageElement;
                                            }
                                        }}
                                        src={previewUrl}
                                        alt="Venue map"
                                        width={1200}
                                        height={900}
                                        className="block"
                                        style={{
                                            display: 'block',
                                            width: 'auto',
                                            height: 'auto',
                                            maxWidth: '100%'
                                        }}
                                        unoptimized
                                        onLoad={onImageLoad}
                                        draggable={false}
                                    />
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="relative w-full h-full pointer-events-auto">
                                            {validPosts.map((post, idx) => {
                                                const left = `calc(${post.x}% - 12px)`;
                                                const top = `calc(${post.y}% - 12px)`;
                                                const isHover = hoverId === idx;
                                                const isPending = pendingMarker?.layerIdx === currentLayer && pendingMarker?.postIdx === idx;
                                                const isDragging = draggingIdx === idx;

                                                let markerClasses = 'border-2 transition-all cursor-grab ';
                                                if (isPending) {
                                                    markerClasses += 'border-status-blue bg-status-blue/20 scale-125';
                                                } else if (isHover || isDragging) {
                                                    markerClasses += 'border-accent bg-accent/30 scale-110';
                                                } else {
                                                    markerClasses += 'border-accent bg-accent/20 hover:scale-110';
                                                }

                                                if (isDragging) {
                                                    markerClasses = markerClasses.replace('cursor-grab', 'cursor-grabbing') + ' scale-110';
                                                }

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <div
                                                            style={{ left, top }}
                                                            className={`absolute z-10 flex h-6 w-6 items-center justify-center rounded-full ${markerClasses}`}
                                                            onMouseEnter={() => setHoverId(idx)}
                                                            onMouseLeave={() => handleMarkerMouseLeave(idx)}
                                                            onMouseDown={onMarkerMouseDown(idx)}
                                                            onClick={(e) => {
                                                                if (isPending) return;
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                renamePost(currentLayer, idx);
                                                            }}
                                                        >
                                                            <MapPin className="h-4 w-4 text-accent" strokeWidth={2.5} />
                                                        </div>
                                                        {isHover && !isPending && post.name && (
                                                            <div
                                                                style={{ left: `calc(${post.x}% - 50px)`, top: `calc(${post.y}% - 40px)` }}
                                                                className="pointer-events-none absolute z-20 rounded-md bg-surface-deepest/95 px-2 py-1 text-xs text-white shadow-lg border border-default whitespace-nowrap"
                                                            >
                                                                {post.name}
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Marker Form */}
                {pendingMarker && (
                    <div
                        className="fixed z-30 w-52 rounded-lg border border-status-blue bg-surface-deepest p-3 shadow-xl"
                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                        <p className="mb-2 text-xs font-medium text-white">Name this location:</p>
                        <Input
                            ref={markerInputRef}
                            value={markerNameInput}
                            onValueChange={setMarkerNameInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    confirmMarkerName();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelMarkerName();
                                }
                            }}
                            placeholder="Location name"
                            size="sm"
                            variant="bordered"
                            classNames={{
                                input: 'text-white text-sm outline-none focus:outline-none data-[focus=true]:outline-none',
                                inputWrapper: 'px-4 hover:bg-surface-deep mb-2',
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button size="sm" variant="flat" onPress={cancelMarkerName} className="flex-1">
                                Cancel
                            </Button>
                            <Button size="sm" onPress={confirmMarkerName} className="flex-1 bg-accent hover:bg-accent/90 text-white">
                                Confirm
                            </Button>
                        </div>
                    </div>
                )}

                {/* Zoom Controls */}
                <div className="absolute top-3 right-3 flex flex-row gap-1 z-20">
                    <ButtonGroup>
                        <Button isIconOnly size="sm" variant="flat" onPress={() => setScale(prev => Math.min(prev + 0.5, 5))} className="bg-surface-deepest/95">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="flat" onPress={() => setScale(prev => Math.max(prev - 0.5, 1))} className="bg-surface-deepest/95">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </ButtonGroup>
                    <Button size="sm" variant="flat" onPress={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="bg-surface-deepest/95 text-xs px-2">
                        Reset
                    </Button>
                </div>

                {/* Instructions overlay */}
                {isAddMarkerMode && !pendingMarker && (
                    <div className="absolute left-3 top-3 rounded-lg border border-status-blue/50 bg-surface-deepest/95 px-3 py-2 z-20 pointer-events-none">
                        <p className="text-xs text-status-blue">Click on the map to place a location marker</p>
                    </div>
                )}
            </div>

            {/* Bottom Info Bar */}
            {previewUrl && (
                <Card isBlurred className="border border-default-200 bg-surface-deep/40 w-full px-3 py-2 mt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 w-1/3 min-w-0">
                            <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                            <span className="text-xs text-surface-light truncate">{mapFileName}</span>
                            <Button
                                size="sm"
                                variant="flat"
                                onPress={onUploadClick}
                                startContent={<Upload className="h-3 w-3" />}
                                className="ml-2 flex-shrink-0"
                            >
                                Replace
                            </Button>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                isDisabled={currentLayer <= 0}
                                onPress={() => setCurrentLayer(Math.max(0, currentLayer - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-surface-light min-w-[80px] text-center truncate">
                                {layerName || 'Layer'}
                            </span>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                isDisabled={currentLayer >= layerCount - 1}
                                onPress={() => setCurrentLayer(currentLayer + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button isIconOnly size="sm" variant="flat" color="danger" onPress={onDeleteLayer}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button isIconOnly size="sm" variant="flat" onPress={onAddLayerClick}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {!previewUrl && (
                <Card isBlurred className="border-2 border-default-200 bg-transparent w-full h-full px-3 py-2">
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="flex h-full w-full flex-col items-center justify-center gap-3 text-surface-light/70 transition hover:border-status-blue/50 hover:text-status-blue rounded-xl"
                    >
                        <Upload className="h-12 w-12" />
                        <div className="text-center">
                            <p className="text-sm font-medium">Upload Venue Map</p>
                            <p className="mt-1 text-xs text-surface-light/50">Optional - Click to select an image</p>
                        </div>
                    </button>
                </Card>
            )}
        </div>
    );
}
