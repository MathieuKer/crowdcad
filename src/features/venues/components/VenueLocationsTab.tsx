import React, { useState } from 'react';
import { Button, Input, Card, ScrollShadow } from '@heroui/react';
import { Plus, Edit2, Trash2, MapPinned, MapPin } from 'lucide-react';
import type { Post } from '@/app/types';

interface VenueLocationsTabProps {
    allPosts: { post: Post; layerIdx: number; postIdx: number; layerName?: string }[];
    onAddLocation: (name: string) => void;
    onRemoveLocation: (layerIdx: number, postIdx: number) => void;
    onRenameLocation: (layerIdx: number, postIdx: number) => void;
    pendingMarker: { layerIdx: number; postIdx: number } | null;
}

export default function VenueLocationsTab({
    allPosts,
    onAddLocation,
    onRemoveLocation,
    onRenameLocation,
    pendingMarker
}: VenueLocationsTabProps) {
    const [locationInput, setLocationInput] = useState('');

    const handleAddTextLocation = () => {
        onAddLocation(locationInput);
        setLocationInput('');
    };

    return (
        <div className="flex flex-col h-full">
            <label className="mb-2 block text-sm font-medium text-white">
                Locations
            </label>
            <div className="flex gap-2">
                <Input
                    placeholder="e.g., Main Entrance"
                    value={locationInput}
                    onValueChange={setLocationInput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTextLocation();
                        }
                    }}
                    variant="flat"
                    classNames={{
                        input: 'text-white text-sm outline-none focus:outline-none data-[focus=true]:outline-none',
                        inputWrapper: 'rounded-2xl px-4 hover:bg-surface-deep',
                    }}
                />
                <Button
                    isIconOnly
                    onPress={handleAddTextLocation}
                    className="flex-shrink-0 bg-accent hover:bg-accent/90 text-white"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {allPosts.length > 0 && (
                <ScrollShadow className="flex-1 mt-3 space-y-2 pr-2 max-h-[calc(100vh-430px)] scrollbar-hide">
                    {allPosts.map((item, idx) => {
                        const post = item.post;
                        const label = typeof post === 'string' ? post : post.name;
                        const hasCoordinates = typeof post === 'object' && post.x !== null && post.y !== null;
                        const isPending = pendingMarker?.layerIdx === item.layerIdx && pendingMarker?.postIdx === item.postIdx;

                        return (
                            <Card
                                key={`${item.layerIdx}-${item.postIdx}-${idx}`}
                                isBlurred
                                className="border border-default-200 bg-surface-deep/40 rounded-xl"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {hasCoordinates ? (
                                            <MapPinned className="h-4 w-4 flex-shrink-0 text-accent" />
                                        ) : (
                                            <MapPin className="h-4 w-4 flex-shrink-0 text-surface-light" />
                                        )}
                                        <span className={`text-sm truncate ${isPending ? 'text-status-blue italic' : 'text-white'}`}>
                                            {label}
                                        </span>
                                        {item.layerName && (
                                            <span className="text-xs text-surface-light hidden sm:inline-block truncate max-w-[100px]">
                                                ({item.layerName})
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                        {typeof post !== 'string' && (
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-surface-light hover:text-white"
                                                onPress={() => onRenameLocation(item.layerIdx, item.postIdx)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => onRemoveLocation(item.layerIdx, item.postIdx)}
                                            className="text-status-red/70 hover:text-status-red"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </ScrollShadow>
            )}
        </div>
    );
}
