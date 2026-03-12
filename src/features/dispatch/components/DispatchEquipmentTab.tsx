import React from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from '@heroui/react';
import { Plus, RotateCw, ArrowDownWideNarrow } from 'lucide-react';
import { Event, EquipmentItem } from '@/app/types';
import EquipmentCard from './equipmentcard';

export type TeamSortMode = 'availability' | 'asc' | 'desc';

interface DispatchEquipmentTabProps {
    event: Event;
    teamSortMode: TeamSortMode;
    setTeamSortMode: (mode: TeamSortMode) => void;
    handleAddVenueEquipment: (name: string) => void;
    getAvailableVenueEquipment: () => string[];
    handleResetEquipmentLocations: () => void;
    getEquipmentItems: () => EquipmentItem[];
    handleEquipmentStatusChange: (equipmentName: string, status: string) => void;
    handleEquipmentLocationChange: (equipmentName: string, location: string) => void;
    handleEquipmentMarkReady: (equipmentName: string) => void;
    handleEquipmentDelete: (equipmentName: string) => void;
    updateEvent: (updates: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
    showHeader?: boolean;
}

export function DispatchEquipmentTab({
    event,
    teamSortMode,
    setTeamSortMode,
    handleAddVenueEquipment,
    getAvailableVenueEquipment,
    handleResetEquipmentLocations,
    getEquipmentItems,
    handleEquipmentStatusChange,
    handleEquipmentLocationChange,
    handleEquipmentMarkReady,
    handleEquipmentDelete,
    updateEvent,
    showHeader = true,
}: DispatchEquipmentTabProps) {
    const equipmentExists = (event?.venue?.equipment?.length || 0) > 0 || (event?.eventEquipment?.length || 0) > 0;

    return (
        <div className="space-y-2">
            {showHeader && (
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-surface-light">Equipment</h2>
                    <div className="flex items-center gap-2">
                        <Tooltip content="Add Equipment from venue" placement="top">
                            <div>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button isIconOnly size="md" variant="flat" aria-label="Add Equipment">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Add Equipment"
                                        onAction={(key) => handleAddVenueEquipment(key as string)}
                                    >
                                        {getAvailableVenueEquipment().length > 0 ? (
                                            getAvailableVenueEquipment().map(equipName => (
                                                <DropdownItem key={equipName}>{equipName}</DropdownItem>
                                            ))
                                        ) : (
                                            <DropdownItem key="none" textValue="No equipment available" isReadOnly>
                                                No equipment left to add
                                            </DropdownItem>
                                        )}
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </Tooltip>
                        <Tooltip content="Reset all equipment locations to defaults" placement="top">
                            <div>
                                <Button
                                    isIconOnly
                                    size="md"
                                    variant="flat"
                                    onPress={handleResetEquipmentLocations}
                                    aria-label="Reset equipment locations"
                                >
                                    <RotateCw className="h-5 w-5" />
                                </Button>
                            </div>
                        </Tooltip>
                        <Tooltip content="Sort equipment" placement="top">
                            <div>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button isIconOnly size="md" variant="flat" aria-label="Sort equipment">
                                            <ArrowDownWideNarrow className="h-5 w-5" />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Sort options"
                                        selectedKeys={[teamSortMode]}
                                        selectionMode="single"
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0] as TeamSortMode;
                                            setTeamSortMode(selected);
                                        }}
                                    >
                                        <DropdownItem key="availability">Availability</DropdownItem>
                                        <DropdownItem key="asc">Ascending</DropdownItem>
                                        <DropdownItem key="desc">Descending</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            )}

            {equipmentExists ? (
                <div className="grid grid-cols-1 gap-3">
                    {getEquipmentItems()
                        .sort((a, b) => {
                            const aOnCall = a.status !== 'Available' ? 1 : 0;
                            const bOnCall = b.status !== 'Available' ? 1 : 0;
                            return aOnCall - bOnCall; // Available first, on-call at bottom
                        })
                        .map((equipmentItem) => (
                            <EquipmentCard
                                key={equipmentItem.name}
                                equipment={equipmentItem}
                                event={event}
                                onStatusChange={handleEquipmentStatusChange}
                                onLocationChange={handleEquipmentLocationChange}
                                onMarkReady={handleEquipmentMarkReady}
                                onDelete={handleEquipmentDelete}
                                updateEvent={updateEvent}
                            />
                        ))}
                </div>
            ) : (
                <div className="text-center text-surface-light/50 py-8">
                    No equipment configured
                </div>
            )}
        </div>
    );
}
