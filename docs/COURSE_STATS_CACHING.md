# Course Stats Caching with Zustand

## Overview

Course statistics (enrollment numbers, ratings, reviews, completion rates) are now cached in Zustand for improved performance and reduced Firestore reads.

## What's Cached

The `CourseStats` type includes:
- `totalEnrollments` - Number of students enrolled
- `averageRating` - Average course rating (1-5)
- `totalReviews` - Number of reviews
- `completionRate` - Percentage of students who completed the course
- `lastUpdated` - Timestamp of last update

## Implementation Details

### 1. Zustand Store (`/src/store/course-store.ts`)

The store now includes:
```typescript
courseStats: Record<string, CourseStats>; // courseId -> stats

// Actions
setCourseStats: (courseId: string, stats: CourseStats) => void;
getCourseStats: (courseId: string) => CourseStats | null;
```

**Cache Duration**: 5 minutes (configurable)

**Persistence**: Stats are persisted to localStorage along with other course data

### 2. Enhanced Hook (`/src/hooks/use-course-feedback.ts`)

The `getCourseStats()` function now:
1. Checks Zustand cache first
2. Returns cached data if fresh (< 5 minutes old)
3. Fetches from Firestore if cache miss or stale
4. Automatically updates cache after fetching

### 3. Convenience Hook (`/src/hooks/use-course-stats.ts`)

A new hook for easy access to course stats:

```typescript
const { stats, isLoading, error, refresh } = useCourseStats(courseId);
```

## Usage Examples

### Basic Usage

```tsx
import { useCourseStats } from '@/hooks/use-course-stats';

function CourseCard({ courseId }) {
  const { stats, isLoading } = useCourseStats(courseId);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <p>{stats?.totalEnrollments || 0} students enrolled</p>
      <p>{stats?.averageRating || 0} ⭐ ({stats?.totalReviews || 0} reviews)</p>
    </div>
  );
}
```

### Manual Cache Control

```tsx
import { useCourseStore } from '@/store/course-store';

function AdminPanel({ courseId }) {
  const { getCourseStats, setCourseStats } = useCourseStore();
  
  // Get cached stats
  const cachedStats = getCourseStats(courseId);
  
  // Manually update cache
  const updateCache = () => {
    setCourseStats(courseId, {
      id: 'stats-id',
      courseId,
      totalEnrollments: 150,
      averageRating: 4.5,
      totalReviews: 42,
      completionRate: 78,
      lastUpdated: new Date()
    });
  };
}
```

### Using the Feedback Hook Directly

```tsx
import { useCourseFeedback } from '@/hooks/use-course-feedback';

function CourseDetails({ courseId }) {
  const { getCourseStats, updateCourseStats } = useCourseFeedback();
  
  useEffect(() => {
    // Automatically uses cache
    getCourseStats(courseId).then(stats => {
      console.log('Stats:', stats);
    });
  }, [courseId]);
  
  const incrementEnrollment = async () => {
    const stats = await getCourseStats(courseId);
    if (stats) {
      // Updates both Firestore and cache
      await updateCourseStats(courseId, {
        totalEnrollments: stats.totalEnrollments + 1
      });
    }
  };
}
```

### Force Refresh

```tsx
function CourseStatsDisplay({ courseId }) {
  const { stats, refresh } = useCourseStats(courseId);
  
  return (
    <div>
      <p>Students: {stats?.totalEnrollments}</p>
      <button onClick={refresh}>Refresh Stats</button>
    </div>
  );
}
```

## Benefits

1. **Performance**: Reduces Firestore reads by caching frequently accessed data
2. **Offline Support**: Cached data persists in localStorage
3. **Consistency**: All components using the same courseId get the same cached data
4. **Automatic Updates**: Cache is automatically updated when stats are modified
5. **Fresh Data**: 5-minute cache ensures data doesn't get too stale

## Cache Management

### Clear All Cache

```typescript
import { useCourseStore } from '@/store/course-store';

const { clearCache } = useCourseStore();
clearCache(); // Clears all courses, lessons, stats, etc.
```

### Check Cache Freshness

```typescript
const { isDataFresh } = useCourseStore();
const isFresh = isDataFresh(`stats_${courseId}`, 5 * 60 * 1000); // 5 minutes
```

## Best Practices

1. **Use the convenience hook** (`useCourseStats`) for most cases
2. **Force refresh** after critical updates (new enrollment, review submission)
3. **Don't over-fetch** - let the cache do its job
4. **Monitor cache size** - clear old data periodically if needed

## Migration Guide

### Before
```tsx
const { getCourseStats } = useCourseFeedback();
const [stats, setStats] = useState(null);

useEffect(() => {
  getCourseStats(courseId).then(setStats);
}, [courseId]);
```

### After
```tsx
const { stats } = useCourseStats(courseId);
// That's it! Caching is automatic
```

## Future Enhancements

- [ ] Add cache invalidation on specific events (new review, enrollment)
- [ ] Implement background refresh for stale data
- [ ] Add cache size limits and LRU eviction
- [ ] Support for partial stats updates
