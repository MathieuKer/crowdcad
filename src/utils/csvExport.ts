import { Event, CallLogEntry, TeamLogEntry, InteractionSession } from '@/app/types';

export const formatCsvTimestamp = (timestamp: number) => {
    return timestamp.toFixed(2);
};

export const generateEventCSVData = (event: Event): string => {
    if (!event) return '';

    const csvRows: string[] = [];
    csvRows.push('Log Type,Team/Call ID,Timestamp,Message');

    event.staff?.forEach((team) => {
        (team.log || []).forEach((entry: TeamLogEntry) => {
            csvRows.push(`Staff,${team.team},${formatCsvTimestamp(entry.timestamp)},"${entry.message}"`);
        });
    });

    event.calls?.forEach((call) => {
        (call.log || []).forEach((entry: CallLogEntry) => {
            csvRows.push(`Call,${call.id},${formatCsvTimestamp(entry.timestamp)},"${entry.message}"`);
        });
    });

    return csvRows.join('\n');
};

export const downloadEventCSV = (event: Event) => {
    const csvContent = generateEventCSVData(event);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', `${event?.name || event.id}_Summary.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};

export const generateDataCollectionCSVData = (event: Event, sessions: InteractionSession[]): string => {
    if (!event || !sessions.length) return '';

    const csvRows: string[] = [];
    const sessionStartTimestamp = Math.min(...sessions.map(s => s.startTime));

    const convertTimestamp = (timestamp: number) => {
        const elapsedMs = timestamp - sessionStartTimestamp;
        return (elapsedMs / 1000).toFixed(2);
    };

    csvRows.push('Session ID,Event ID,Session Start,Session End,Duration (ms),Mouse Clicks,Key Strokes,Clicks Per Minute,Keys Per Minute');

    sessions.forEach(session => {
        const duration = (session.endTime || Date.now()) - session.startTime;
        const durationMinutes = duration / (1000 * 60);
        const clicksPerMinute = durationMinutes > 0 ? (session.mouseClicks.length / durationMinutes).toFixed(2) : '0';
        const keysPerMinute = durationMinutes > 0 ? (session.keyStrokes.length / durationMinutes).toFixed(2) : '0';

        csvRows.push([
            session.sessionId,
            session.eventId,
            convertTimestamp(session.startTime),
            session.endTime ? convertTimestamp(session.endTime) : 'Ongoing',
            duration.toString(),
            session.mouseClicks.length.toString(),
            session.keyStrokes.length.toString(),
            clicksPerMinute,
            keysPerMinute
        ].map(field => `"${field}"`).join(','));
    });

    csvRows.push('');
    csvRows.push('Detailed Mouse Clicks:');
    csvRows.push('Session ID,Timestamp');

    sessions.forEach(session => {
        session.mouseClicks.forEach(click => {
            csvRows.push([
                session.sessionId,
                convertTimestamp(click.timestamp)
            ].map(field => `"${field}"`).join(','));
        });
    });

    csvRows.push('');
    csvRows.push('Detailed Key Strokes:');
    csvRows.push('Session ID,Timestamp');

    sessions.forEach(session => {
        session.keyStrokes.forEach(stroke => {
            csvRows.push([
                session.sessionId,
                convertTimestamp(stroke.timestamp)
            ].map(field => `"${field}"`).join(','));
        });
    });

    return csvRows.join('\n');
};

export const downloadDataCollectionCSV = (event: Event, sessions: InteractionSession[]) => {
    const csvContent = generateDataCollectionCSVData(event, sessions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', `${event?.name || event.id}_TestingData.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};
