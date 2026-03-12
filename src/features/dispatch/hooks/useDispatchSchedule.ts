import { useState, useCallback, useEffect, useRef } from 'react';
import { Event, PostAssignment, Staff } from '@/app/types';
import { toast } from 'react-toastify';

const AUTO_POST_SYNC = false;

export function useDispatchSchedule({
    event,
    updateEvent,
}: {
    event: Event | undefined;
    updateEvent: (updateInput: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
}) {
    const [postAssignments, setPostAssignments] = useState<PostAssignment>({});
    const [nextPostingTime, setNextPostingTime] = useState<string | null>(null);

    // Sync state from event
    useEffect(() => {
        if (event) {
            setPostAssignments(event.postAssignments || {});
        }
    }, [event, event?.postAssignments]);

    const isTimeSlotActive = useCallback((timeSlot: string, allTimes: string[]) => {
        const now = new Date();
        const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const sortedTimes = [...allTimes].sort();
        const index = sortedTimes.indexOf(timeSlot);
        if (index === -1) return false;

        const nextTime = sortedTimes[index + 1];
        return currentHHMM >= timeSlot && (!nextTime || currentHHMM < nextTime);
    }, []);

    const parseTimeToMinutes = useCallback((timeStr: string): number | null => {
        if (timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) return hours * 60 + minutes;
        }

        const cleanTime = timeStr.padStart(4, '0');
        const hours = parseInt(cleanTime.substring(0, 2));
        const minutes = parseInt(cleanTime.substring(2, 4));

        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59)
            return hours * 60 + minutes;

        return null;
    }, []);

    const computeNextPostingTime = useCallback((current: string, times: string[]): string | null => {
        if (!times.length) return null;

        if (current.length !== 4 || isNaN(parseInt(current))) return null;

        const currentMins = parseInt(current.substring(0, 2)) * 60 + parseInt(current.substring(2));

        const validTimes = times
            .map(t => {
                let hours: string, minutes: string;

                if (t.includes(':')) {
                    const parts = t.split(':');
                    hours = parts[0];
                    minutes = parts[1];
                } else if (t.length === 3 || t.length === 4) {
                    const padded = t.padStart(4, '0');
                    hours = padded.substring(0, 2);
                    minutes = padded.substring(2, 4);
                } else {
                    return null;
                }

                const hoursNum = parseInt(hours);
                const minutesNum = parseInt(minutes);

                if (isNaN(hoursNum) || isNaN(minutesNum) || hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) {
                    return null;
                }

                return { time: t, minutes: hoursNum * 60 + minutesNum };
            })
            .filter(t => t !== null)
            .sort((a, b) => a.minutes - b.minutes);

        if (validTimes.length === 0) return null;

        for (const { minutes, time } of validTimes) {
            if (minutes > currentMins) return time;
        }

        return validTimes.length > 0 ? validTimes[0].time : null;
    }, []);

    const getCurrentActiveTime = useCallback(() => {
        if (!event?.postingTimes?.length) return null;

        const now = new Date();
        const currentHHMM = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
        const nextTime = computeNextPostingTime(currentHHMM, event.postingTimes);

        if (nextTime) {
            const currentMins = parseTimeToMinutes(currentHHMM);
            const allValidTimes = event.postingTimes
                .map(t => ({ time: t, minutes: parseTimeToMinutes(t) }))
                .filter(t => t.minutes !== null)
                .sort((a, b) => a.minutes! - b.minutes!);

            const activeTimeCandidates = allValidTimes.filter(
                t => currentMins !== null && t.minutes !== null && currentMins >= t.minutes
            );

            const activeTime = activeTimeCandidates.length > 0
                ? activeTimeCandidates[activeTimeCandidates.length - 1].time
                : allValidTimes[0]?.time;

            const nextTimeMins = parseTimeToMinutes(nextTime);
            const lastValidTime = allValidTimes[allValidTimes.length - 1];

            if (currentMins !== null && nextTimeMins !== null && lastValidTime?.minutes !== null && currentMins > lastValidTime.minutes) {
                return nextTime;
            }
            return activeTime;
        }

        return null;
    }, [event?.postingTimes, computeNextPostingTime, parseTimeToMinutes]);

    // _status parameter kept for future use, but explicitly ignored for now using typescript-eslint standard
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const createStaffUpdaterSingle = (team: string, post: string, _status: string) => {
        return (s: Staff) => {
            if (s.team !== team) return s;

            const newHomeBase = post || 'Roaming';
            const shouldMoveLocation = s.status === 'Available';

            return {
                ...s,
                originalPost: newHomeBase,
                location: shouldMoveLocation ? newHomeBase : s.location
            };
        };
    };

    const handlePostAssignment = useCallback(async (time: string, post: string, team: string) => {
        await updateEvent((currentEvent) => {
            const assignments = { ...(currentEvent.postAssignments || {}) };
            if (!assignments[time]) assignments[time] = {};

            const timeAssignments = assignments[time];
            if (timeAssignments) {
                Object.keys(timeAssignments).forEach(p => {
                    if (timeAssignments[p] === team) {
                        delete timeAssignments[p];
                    }
                });

                if (team) {
                    timeAssignments[post] = team;
                } else {
                    delete timeAssignments[post];
                }
            }

            let updatedStaff = currentEvent.staff;
            const isActive = isTimeSlotActive(time, currentEvent.postingTimes || []);

            if (isActive && updatedStaff) {
                updatedStaff = updatedStaff.map(createStaffUpdaterSingle(team, post, 'Available'));
            }

            return {
                postAssignments: assignments,
                staff: updatedStaff
            };
        });
    }, [updateEvent, isTimeSlotActive]);

    const createStaffUpdaterBulk = (activeAssignments: Record<string, string>) => {
        return (s: Staff) => {
            const assignedPost = Object.keys(activeAssignments).find(
                key => activeAssignments[key] === s.team
            );

            const newHomeBase = assignedPost || 'Roaming';
            const shouldMoveLocation = s.status === 'Available';
            if (s.originalPost === newHomeBase) return s;

            return {
                ...s,
                originalPost: newHomeBase,
                location: shouldMoveLocation ? newHomeBase : s.location
            };
        };
    };

    const handleBulkPostAssignment = useCallback(async (newAssignments: PostAssignment) => {
        await updateEvent((currentEvent) => {
            const finalAssignments = { ...(currentEvent.postAssignments || {}), ...newAssignments };

            let updatedStaff = currentEvent.staff || [];
            const times = currentEvent.postingTimes || [];

            const activeTimeSlot = times.find(t => isTimeSlotActive(t, times));

            if (activeTimeSlot && newAssignments[activeTimeSlot]) {
                const activeAssignments = finalAssignments[activeTimeSlot];
                updatedStaff = updatedStaff.map(createStaffUpdaterBulk(activeAssignments));
            }

            return {
                postAssignments: finalAssignments,
                staff: updatedStaff
            };
        });
    }, [updateEvent, isTimeSlotActive]);

    const handleClearAllPostAssignments = useCallback(async () => {
        if (!confirm('Are you sure you want to clear all assignments?')) return;

        await updateEvent((currentEvent) => {
            const emptyAssignments: PostAssignment = {};

            const updatedStaff = (currentEvent.staff || []).map(s => ({
                ...s,
                originalPost: 'Roaming',
                location: s.status === 'Available' ? 'Roaming' : s.location
            }));

            return {
                postAssignments: emptyAssignments,
                staff: updatedStaff
            };
        });
    }, [updateEvent]);

    const handleUpdatePostingTime = useCallback(async (originalTime: string, newTime: string) => {
        if (originalTime === newTime) return;

        await updateEvent((currentEvent) => {
            const times = currentEvent.postingTimes || [];
            if (times.includes(newTime)) {
                throw new Error("Time slot already exists");
            }
            const newTimes = times.map(t => t === originalTime ? newTime : t);

            const assignments = { ...(currentEvent.postAssignments || {}) };
            if (assignments[originalTime]) {
                assignments[newTime] = assignments[originalTime];
                delete assignments[originalTime];
            }

            return {
                postingTimes: newTimes,
                postAssignments: assignments
            };
        });
    }, [updateEvent]);

    const refreshAllPostsFromSchedule = useCallback(async () => {
        if (!event) return;

        const active = getCurrentActiveTime();
        if (!active) {
            toast.info('No active posting time to refresh.');
            return;
        }

        const assignments = postAssignments[active] || {};
        if (!Object.keys(assignments).length) {
            toast.info(`No assignments found for ${active}.`);
            return;
        }

        const busy = new Set(['En Route', 'On Scene', 'Transporting']);
        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        let changed = 0;
        const updatedStaff = (event.staff || []).map(t => {
            const postForTeam = Object.entries(assignments).find(([, team]) => team === t.team)?.[0];
            if (!postForTeam) return t;

            if (busy.has(t.status)) {
                return t;
            }

            if (t.location === postForTeam) return t;

            changed++;
            return {
                ...t,
                location: postForTeam,
                log: [
                    ...(t.log || []),
                    { timestamp: now.getTime(), message: `${hhmm} - Post changed to ${postForTeam} (manual refresh)` }
                ],
            };
        });

        if (changed > 0) {
            await updateEvent({ staff: updatedStaff });
            toast.success(`Refreshed ${changed} team${changed === 1 ? '' : 's'} to scheduled posts.`);
        } else {
            toast.info('No teams updated (either busy or already at scheduled posts).');
        }
    }, [event, postAssignments, getCurrentActiveTime, updateEvent]);


    const refreshTeamFromSchedule = useCallback(async (teamName: string) => {
        if (!event) return;

        const active = getCurrentActiveTime();
        if (!active) {
            toast.info('No active posting time to refresh.');
            return;
        }
        const assignments = postAssignments[active] || {};
        const postForTeam = Object.entries(assignments).find(([, team]) => team === teamName)?.[0];

        if (!postForTeam) {
            toast.info(`No scheduled post for ${teamName} at ${active}.`);
            return;
        }

        const team = (event.staff || []).find(s => s.team === teamName);
        if (!team) return;

        if (['En Route', 'On Scene', 'Transporting'].includes(team.status)) {
            toast.info(`${teamName} is busy; not moved.`);
            return;
        }

        if (team.location === postForTeam) {
            toast.info(`${teamName} is already at ${postForTeam}.`);
            return;
        }

        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const updatedStaff = (event.staff || []).map(s =>
            s.team === teamName
                ? {
                    ...s,
                    location: postForTeam,
                    log: [
                        ...(s.log || []),
                        { timestamp: now.getTime(), message: `${hhmm} - Post changed to ${postForTeam} (manual refresh)` }
                    ],
                }
                : s
        );

        await updateEvent({ staff: updatedStaff });
        toast.success(`${teamName} → ${postForTeam}`);
    }, [event, postAssignments, getCurrentActiveTime, updateEvent]);

    const addTeamLog = useCallback((staff: Staff, message: string): Staff => {
        const now = new Date();
        const hhmm =
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        const newEntry = { timestamp: now.getTime(), message: `${hhmm} - ${message}` };
        return {
            ...staff,
            log: [...(staff.log || []), newEntry],
        };
    }, []);

    const handleScheduledPostAssignment = useCallback(
        async (time: string, assignments: { [post: string]: string }) => {
            if (!event) return;

            let updatedStaff = [...event.staff];
            const pendingAssignments = event.pendingAssignments ? { ...event.pendingAssignments } : {};

            Object.entries(assignments).forEach(([post, teamName]) => {
                if (!teamName) return;
                updatedStaff = updatedStaff.map(staff => {
                    if (staff.team === teamName) {
                        const isBusy = ['En Route', 'On Scene', 'Transporting'].includes(staff.status);
                        if (isBusy) {
                            pendingAssignments[teamName] = { post, time };
                            return staff;
                        } else {
                            return addTeamLog({ ...staff, location: post }, `Available to ${post} at scheduled time ${time}`);
                        }
                    }
                    return staff;
                });
            });

            await updateEvent({
                staff: updatedStaff,
                postAssignments: {
                    ...postAssignments,
                    [time]: assignments,
                },
                pendingAssignments,
            });

        },
        [event, postAssignments, updateEvent, addTeamLog]
    );

    const triggeredToday = useRef(new Set());
    const [lastTriggerDate, setLastTriggerDate] = useState(new Date().toDateString());

    // Auto post sync interval effect
    useEffect(() => {
        if (!AUTO_POST_SYNC) return;

        if (!event || !nextPostingTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const today = now.toDateString();
            const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

            if (today !== lastTriggerDate) {
                triggeredToday.current = new Set();
                setLastTriggerDate(today);
            }

            const nextTotalMins = parseTimeToMinutes(nextPostingTime);
            const currentTotalMins = parseTimeToMinutes(hhmm);

            if (nextTotalMins === null || currentTotalMins === null) return;

            if (currentTotalMins >= nextTotalMins && !triggeredToday.current.has(nextPostingTime)) {
                const assignments = postAssignments[nextPostingTime] || {};
                handleScheduledPostAssignment(nextPostingTime, assignments);
                triggeredToday.current.add(nextPostingTime);

                const newNextTime = computeNextPostingTime(hhmm, event.postingTimes || []);
                setNextPostingTime(newNextTime);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [event, nextPostingTime, postAssignments, lastTriggerDate, handleScheduledPostAssignment, computeNextPostingTime, parseTimeToMinutes]);

    // Initial compute of next posting time
    useEffect(() => {
        if (event?.postingTimes?.length) {
            const now = new Date();
            const hhmm = now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0');
            const nextTime = computeNextPostingTime(hhmm, event.postingTimes);
            setNextPostingTime(nextTime);
        }
    }, [event?.postingTimes, computeNextPostingTime]);

    return {
        postAssignments,
        nextPostingTime,
        isTimeSlotActive,
        getCurrentActiveTime,
        handlePostAssignment,
        handleBulkPostAssignment,
        handleClearAllPostAssignments,
        handleUpdatePostingTime,
        refreshAllPostsFromSchedule,
        refreshTeamFromSchedule,
        handleScheduledPostAssignment // Exposed just in case
    };
}
