/**
 * Format dates as YYYY-MM-DD in the user's local timezone.
 */
export function formatDateStr(dateVal) {
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime()))
        return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Parse a YYYY-MM-DD string into local midnight.
 */
export function parseLocalYYYYMMDD(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
}
/**
 * Persist and load manual daily check-ins.
 */
export function getLocalCheckins(userId) {
    try {
        const data = localStorage.getItem(`fitsync_checkins_${userId}`);
        return data ? JSON.parse(data) : [];
    }
    catch (err) {
        console.error('Error fetching wellness checkins:', err);
        return [];
    }
}
export function saveLocalCheckin(userId, dateStr) {
    try {
        const list = getLocalCheckins(userId);
        if (!list.includes(dateStr)) {
            list.push(dateStr);
            localStorage.setItem(`fitsync_checkins_${userId}`, JSON.stringify(list));
        }
        return list;
    }
    catch (err) {
        console.error('Error saving wellness checkin:', err);
        return [];
    }
}
/**
 * Calculate streak and consistency stats dynamically based on workouts, weights, and checkins.
 */
export function calculateStreakStats(user, workouts, weightLogs) {
    const checkins = getLocalCheckins(user.id);
    // Collect all unique active days ('YYYY-MM-DD')
    const dateSet = new Set();
    workouts.forEach(w => {
        if (w.date)
            dateSet.add(w.date);
    });
    weightLogs.forEach(wl => {
        if (wl.date)
            dateSet.add(wl.date);
    });
    checkins.forEach(c => {
        dateSet.add(c);
    });
    const activeDates = Array.from(dateSet).sort();
    // Calculate current & longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    const todayStr = formatDateStr(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);
    const isTodayActive = dateSet.has(todayStr);
    const isYesterdayActive = dateSet.has(yesterdayStr);
    if (activeDates.length > 0) {
        // Determine the consecutive streak starting backwards from the most recent active day
        // The streak can only be active if today or yesterday is completed.
        if (isTodayActive || isYesterdayActive) {
            let runDate = isTodayActive ? new Date() : yesterday;
            let runStr = formatDateStr(runDate);
            while (dateSet.has(runStr)) {
                currentStreak++;
                runDate.setDate(runDate.getDate() - 1);
                runStr = formatDateStr(runDate);
            }
        }
        // Longest streak calculation
        let tempStreak = 0;
        // Iterate day-by-day from the earliest record in activeDates to today
        const firstDate = parseLocalYYYYMMDD(activeDates[0]);
        const maxDate = new Date(); // through today
        maxDate.setHours(23, 59, 59, 999);
        const iter = new Date(firstDate);
        while (iter <= maxDate) {
            const iterStr = formatDateStr(iter);
            if (dateSet.has(iterStr)) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            }
            else {
                tempStreak = 0;
            }
            iter.setDate(iter.getDate() + 1);
        }
    }
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }
    // Calculate stats in the past 7 days (including today)
    let activeDaysInLast7 = 0;
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const checkpoint = new Date();
        checkpoint.setDate(checkpoint.getDate() - i);
        const dateStr = formatDateStr(checkpoint);
        last7Days.push(dateStr);
        if (dateSet.has(dateStr)) {
            activeDaysInLast7++;
        }
    }
    const weeklyConsistency = Math.round((activeDaysInLast7 / 7) * 100);
    // Filter workouts details for this week (last 7 days)
    const last7DaysCutoff = new Date();
    last7DaysCutoff.setHours(0, 0, 0, 0);
    last7DaysCutoff.setDate(last7DaysCutoff.getDate() - 7);
    const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= last7DaysCutoff);
    const totalWorkoutsThisWeek = workoutsThisWeek.length;
    const totalMinutesThisWeek = workoutsThisWeek.reduce((sum, w) => sum + w.durationTotal, 0);
    const totalCaloriesThisWeek = workoutsThisWeek.reduce((sum, w) => sum + w.caloriesTotal, 0);
    // Messages depending on current streak index
    let streakGrowthMessage = 'Every session helps. Complete a workout today to start a streak.';
    if (currentStreak === 1) {
        streakGrowthMessage = 'First step taken. Log tomorrow to start building momentum.';
    }
    else if (currentStreak >= 2 && currentStreak < 4) {
        streakGrowthMessage = 'You are building consistency. Stay on target and keep the streak going.';
    }
    else if (currentStreak >= 4 && currentStreak < 7) {
        streakGrowthMessage = 'Four or more days in a row. Consistency is becoming part of your routine.';
    }
    else if (currentStreak >= 7 && currentStreak < 14) {
        streakGrowthMessage = 'One week milestone reached. Your routine is getting stronger.';
    }
    else if (currentStreak >= 14) {
        streakGrowthMessage = 'Two weeks or more. Your habit is becoming reliable.';
    }
    return {
        currentStreak,
        longestStreak,
        activeDates,
        weeklyConsistency,
        totalWorkoutsThisWeek,
        totalMinutesThisWeek,
        totalCaloriesThisWeek,
        streakGrowthMessage
    };
}
export function getBadges(currentStreak) {
    return [
        {
            id: 'streak_3',
            name: 'Three Day Start',
            description: 'Maintained a consecutive 3-day workout or fitness check-in streak.',
            requirement: '3-Day Streak',
            value: 3,
            isUnlocked: currentStreak >= 3
        },
        {
            id: 'streak_7',
            name: 'One Week Streak',
            description: 'Maintained a consecutive 7-day milestone streak of active habits.',
            requirement: '7-Day Streak',
            value: 7,
            isUnlocked: currentStreak >= 7
        },
        {
            id: 'streak_14',
            name: 'Two Week Habit',
            description: 'Sustained a consecutive 14-day streak without missing a checkpoint.',
            requirement: '14-Day Streak',
            value: 14,
            isUnlocked: currentStreak >= 14
        },
        {
            id: 'streak_30',
            name: 'Thirty Day Streak',
            description: 'Achieved a 30-day consecutive streak.',
            requirement: '30-Day Streak',
            value: 30,
            isUnlocked: currentStreak >= 30
        }
    ];
}
