import React, { useState } from 'react';
import { Button, Input, Card, ScrollShadow, Select, SelectItem } from '@heroui/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { Equipment, EquipmentStatus } from '@/app/types';

interface EquipmentWithLocation extends Equipment {
    locationId?: string;
}

interface VenueEquipmentTabProps {
    equipment: EquipmentWithLocation[];
    onChange: (equipment: EquipmentWithLocation[]) => void;
}

const EQUIPMENT_STATUSES: EquipmentStatus[] = ['Available', 'In Use', 'Maintenance', 'Call 2'];

export default function VenueEquipmentTab({ equipment, onChange }: VenueEquipmentTabProps) {
    const [equipmentInput, setEquipmentInput] = useState('');
    const [editingEquipmentIndex, setEditingEquipmentIndex] = useState<number | null>(null);
    const [equipmentEditInput, setEquipmentEditInput] = useState('');

    const addEquipment = () => {
        const name = equipmentInput.trim();
        if (!name) return;
        const newItem: EquipmentWithLocation = {
            id: crypto.randomUUID(),
            name,
            status: 'Available' as EquipmentStatus,
        };
        onChange([...equipment, newItem]);
        setEquipmentInput('');
    };

    const removeEquipment = (index: number) => {
        onChange(equipment.filter((_, i) => i !== index));
    };

    const startEditingEquipment = (index: number, name: string) => {
        setEditingEquipmentIndex(index);
        setEquipmentEditInput(name);
    };

    const saveEquipmentEdit = (index: number) => {
        const newName = equipmentEditInput.trim();
        if (newName) {
            const copy = [...equipment];
            copy[index] = { ...copy[index], name: newName };
            onChange(copy);
        }
        setEditingEquipmentIndex(null);
    };

    const updateEquipmentStatus = (index: number, newStatus: EquipmentStatus) => {
        const copy = [...equipment];
        copy[index] = { ...copy[index], status: newStatus };
        onChange(copy);
    };

    return (
        <div className="flex flex-col h-full">
            <label className="mb-2 block text-sm font-medium text-white">
                Equipment <span className="text-surface-light text-xs">(Optional)</span>
            </label>
            <div className="flex gap-2 mb-3">
                <Input
                    placeholder="e.g., Gurney 1"
                    value={equipmentInput}
                    onValueChange={setEquipmentInput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addEquipment();
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
                    onPress={addEquipment}
                    className="flex-shrink-0 bg-accent hover:bg-accent/90 text-white"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {equipment.length > 0 && (
                <ScrollShadow className="flex-1 space-y-2 pr-2 max-h-[calc(100vh-430px)] scrollbar-hide">
                    {equipment.map((item, idx) => (
                        <Card
                            key={idx}
                            isBlurred
                            className="border border-default-200 bg-surface-deep/40 rounded-xl"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                                <div className="flex-1 min-w-0 w-full">
                                    {editingEquipmentIndex === idx ? (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                saveEquipmentEdit(idx);
                                            }}
                                            className="flex gap-2 w-full"
                                        >
                                            <Input
                                                size="sm"
                                                value={equipmentEditInput}
                                                onValueChange={setEquipmentEditInput}
                                                autoFocus
                                                onBlur={() => saveEquipmentEdit(idx)}
                                                classNames={{
                                                    input: "text-white text-sm",
                                                    inputWrapper: "bg-surface-deepest border-none"
                                                }}
                                            />
                                        </form>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white truncate">{item.name}</span>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-surface-light hover:text-white"
                                                onPress={() => startEditingEquipment(idx, item.name)}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Select
                                        size="sm"
                                        className="w-32"
                                        selectedKeys={[item.status]}
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0] as string;
                                            if (selected) updateEquipmentStatus(idx, selected);
                                        }}
                                        classNames={{
                                            trigger: "bg-surface-deep/50 border-none rounded-lg h-8 min-h-8",
                                            value: "text-xs text-white",
                                        }}
                                        listboxProps={{
                                            itemClasses: {
                                                base: "data-[hover=true]:bg-surface-deep data-[hover=true]:text-white",
                                                title: "text-xs"
                                            }
                                        }}
                                    >
                                        {EQUIPMENT_STATUSES.map(status => (
                                            <SelectItem key={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        className="h-8 w-8 min-w-8"
                                        onPress={() => removeEquipment(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </ScrollShadow>
            )}
        </div>
    );
}
