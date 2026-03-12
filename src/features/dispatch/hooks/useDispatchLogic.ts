import { useState, useCallback, useEffect } from 'react';
import { runTransaction, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Event } from '@/app/types';

import isEqual from 'lodash.isequal';
import { useRouter } from 'next/navigation';

export interface UseDispatchLogicProps {
    eventId: string;
    user: Record<string, unknown> | null;
    isAdmin: boolean;
}

export function useDispatchLogic({ eventId, user, isAdmin }: UseDispatchLogicProps) {
    const router = useRouter();
    const [event, setEvent] = useState<Event | undefined>(undefined);
    const [postAssignments, setPostAssignments] = useState<Record<string, Record<string, string>>>({});

    const [teamSortMode, setTeamSortMode] = useState<'availability' | 'asc' | 'desc'>('availability');
    const [cardViewMode, setCardViewMode] = useState<'normal' | 'condensed'>('normal');

    const updateEvent = useCallback(async (
        updateInput: Partial<Event> | ((current: Event) => Partial<Event>)
    ) => {
        if (!eventId) return;
        try {
            await runTransaction(db, async (transaction) => {
                const eventRef = doc(db, "events", eventId);
                const eventDoc = await transaction.get(eventRef);
                if (!eventDoc.exists()) throw new Error("Event does not exist");

                const currentEvent = eventDoc.data() as Event;

                let updates: Partial<Event>;
                if (typeof updateInput === 'function') {
                    updates = updateInput(currentEvent);
                } else {
                    updates = updateInput;
                }

                transaction.update(eventRef, updates);
            });
        } catch (error) {
            console.error("Transaction failed: ", error);
            throw error;
        }
    }, [eventId]);

    useEffect(() => {
        if (!eventId || !user) return;
        const unsubscribe = onSnapshot(doc(db, 'events', eventId), (doc) => {
            if (doc.exists()) {
                const eventData = doc.data() as Event;
                const userEmail = typeof user?.email === 'string' ? user.email.toLowerCase() : '';
                const isSharedUser = eventData.sharedWith?.some(email => email.toLowerCase() === userEmail);

                if (eventData.userId && user?.uid && eventData.userId !== user.uid && !isAdmin && !isSharedUser) {
                    console.error('Unauthorized access to event');
                    sessionStorage.setItem('redirectPath', `/events/${eventId}/dispatch`);
                    router.push('/?login=true&error=unauthorized');
                    return;
                }
                setEvent(prev => {
                    if (!isEqual(prev, eventData)) {
                        setPostAssignments(eventData.postAssignments || {});
                        return eventData;
                    }
                    return prev;
                });
            } else {
                setEvent(undefined);
                router.push('/venues/selection');
            }
        }, (error) => {
            console.error('Error fetching event:', error);
            if (error.code === 'permission-denied') {
                sessionStorage.setItem('redirectPath', `/events/${eventId}/dispatch`);
                router.push('/?login=true&error=unauthorized');
            }
        });

        return () => unsubscribe();
    }, [eventId, user, router, isAdmin]);

    // Many more handlers will go here...

    return {
        event,
        postAssignments,
        updateEvent,
        teamSortMode,
        setTeamSortMode,
        cardViewMode,
        setCardViewMode
    };
}
