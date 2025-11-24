# Lesson Page Architecture - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LESSON PAGE COMPONENT                    │
│                                                                   │
│  ┌───────────────────┐         ┌───────────────────────────┐    │
│  │   UI State        │         │  Navigation & Progress    │    │
│  ├───────────────────┤         ├───────────────────────────┤    │
│  │ • isSidebarOpen   │         │ • navigatingToLesson      │    │
│  │ • theaterMode     │         │ • isMarkingComplete       │    │
│  │ • noteContent     │         │ • optimisticProgress      │    │
│  │ • isSavingNote    │         │ • optimisticCompletedLes..│    │
│  └─────────┬─────────┘         └───────────────┬───────────┘    │
│            │                                    │                │
│            └────────────────┬───────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │  Render Logic   │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│  ┌──────────────────────────┼──────────────────────────┐         │
│  │                          │                          │         │
│  ▼                          ▼                          ▼         │
│ ┌────────────┐         ┌──────────┐         ┌───────────────┐  │
│ │  Header   │         │ Content  │         │   Sidebar     │  │
│ ├────────────┤         ├──────────┤         ├───────────────┤  │
│ │ Title     │         │ Video    │         │ Lessons Tree  │  │
│ │ Nav Links │         │ Notes    │         │ Progress Bar  │  │
│ └────────────┘         │ Markdown │         └───────────────┘  │
│                        └──────────┘                              │
│  ┌────────────────────────────────────────────────┐             │
│  │         Bottom Navigation Bar                   │             │
│  ├────────────────────────────────────────────────┤             │
│  │ [Previous] [Mark Complete & Continue] [Next]  │             │
│  └────────────────────────────────────────────────┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        │                                              │
        └──────────────────┬───────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Firestore Listeners   │
              ├────────────────────────┤
              │ • useCollection<      │
              │   UserProgress>       │
              │ • useDoc<Course>      │
              │ • useDoc<Lesson>      │
              │ • useCollection<Note> │
              └────────────┬───────────┘
                           │
              ┌────────────▼────────────┐
              │   useProgressTracking   │
              │   (custom hook)         │
              └────────────┬───────────┘
                           │
                    ┌──────▼──────┐
                    │  Firestore  │
                    │  Database   │
                    └─────────────┘
```

---

## Data Flow During "Mark Complete"

```
                    USER INTERACTION
                          │
                          │ Click "Mark Complete"
                          ▼
    ┌────────────────────────────────────────────┐
    │  handleMarkComplete() Executes             │
    └──────────────────┬─────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌─────────────┐            ┌──────────────┐
    │ OPTIMISTIC  │            │  ASYNC CALL  │
    │ UPDATE      │            │              │
    │             │            │ markLesson   │
    │ setOptimistic─────┐      │ Complete()   │
    │ Progress()  │     │      │              │
    │             │     │      │ (Firestore)  │
    │ setOptimistic     │      └──────┬───────┘
    │ Completed    │     │            │
    │ Lessons()    │     │      ┌─────▼────────┐
    │             │     │      │ Response:    │
    │ ✓ UI        │     │      │ • success    │
    │   updates   │     │      │ • percentage │
    │   instantly │     │      └─────┬────────┘
    │             │     │            │
    └─────────────┘     │      ┌─────┴─────┐
                        │      │           │
                        │   YES│           │NO
                        │      ▼           ▼
                        │   Navigate   Rollback
                        │      │      Optimistic
                        │      │      State
                        │      ▼
                        │  ┌───────────┐
                        │  │Navigate   │
                        │  │to Next    │
                        │  │Lesson     │
                        │  └─────┬─────┘
                        │        │
                        │        ▼
                        │  ┌──────────────────┐
                        │  │Firestore        │
                        │  │Listener Fires   │
                        │  │(useCollection)  │
                        │  └─────┬────────────┘
                        │        │
                        │        ▼
                        │  ┌──────────────────┐
                        │  │ progressData     │
                        │  │ updates          │
                        │  │                  │
                        │  │ useEffect syncs: │
                        │  │ • Clear optimism │
                        │  │ • Use real data  │
                        │  └──────────────────┘
                        │
                        ▼
                    ┌────────────────┐
                    │ Page Loaded    │
                    │ Ready Next     │
                    │ Interaction    │
                    └────────────────┘
```

---

## Real-Time Sync Flow

```
TAB A (Lesson Page)         FIRESTORE              TAB B (Dashboard)
    │                           │                         │
    ├─ Click "Mark Complete"    │                         │
    │                           │                         │
    ├─ Update optimistic state  │                         │
    │                           │                         │
    ├─ UI updates immediately ◄─┤─ watching              │
    │  (before server responds)  │                         │
    │                           │                         │
    ├─ Call markLessonComplete()│                         │
    │      │                    │                         │
    │      └──────────────────► │ Write to              │
    │           (Firestore)    │ userProgress          │
    │                           │                         │
    │                           │ Update Document        │
    │                           │                         │
    │◄─── Real-time Listener ◄──┤──────► Real-time Listener ──┐
    │     (useCollection)       │       (if listening)        │
    │                           │                         │
    ├─ useEffect triggers:      │                         │
    │  • Clear optimistic       │                         │ ├─ Update progress
    │  • Use real data          │                         │ │ display
    │                           │                         │ │
    │ ✓ UI synced with server   │                         │ ✓ Auto-sync
    │   & other tabs            │                         │   without refresh
    │                           │                         │
    └───────────────────────────┴─────────────────────────┘
```

---

## Component Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│               Component Mount & Initial Load                  │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─ Check auth (isUserLoading)
       │  └─ If not logged in → Redirect to /login
       │
       ├─ Create Firestore refs (memoized)
       │  ├─ courseRef
       │  ├─ lessonsQuery
       │  ├─ lessonRef
       │  ├─ progressRef (COLLECTION, not doc!)
       │  ├─ notesQuery
       │  └─ purchaseQuery
       │
       ├─ Subscribe to real-time listeners
       │  ├─ useDoc<Course>
       │  ├─ useCollection<Lesson>
       │  ├─ useDoc<Lesson>
       │  ├─ useCollection<UserProgress>  ◄── KEY
       │  ├─ useCollection<Note>
       │  └─ useCollection<Purchase>
       │
       ├─ Check purchase if paid course
       │  └─ If not purchased → Redirect to course page
       │
       └─ Render UI with loading skeletons

┌──────────────────────────────────────────────────────────────┐
│              Component During Navigation                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─ User interacts (click Next/Previous/Sidebar)
       │
       ├─ handleNavigateToLesson() called
       │  ├─ setNavigatingToLesson(id)
       │  ├─ Buttons disabled
       │  └─ router.push() queued
       │
       ├─ URL changes (Next.js routing)
       │
       ├─ params changes: lessonId updates
       │
       ├─ useEffect: lessonRef changes
       │  ├─ useDoc listener unsubscribes (old lesson)
       │  └─ useDoc listener subscribes (new lesson)
       │
       ├─ Firestore fetches new lesson data
       │  ├─ New lesson content streams in
       │  ├─ New notes query filters by lessonId
       │  └─ Progress data already in state (from listener)
       │
       ├─ Notes auto-load for new lesson
       │  └─ useEffect: notes change → load into textarea
       │
       └─ Navigation clears when component stable

┌──────────────────────────────────────────────────────────────┐
│           Component Cleanup & Unmount                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─ All useEffect cleanup functions execute
       │  ├─ Firestore listeners unsubscribe
       │  ├─ Timers cleared (autosave ref)
       │  └─ Memory cleanup
       │
       └─ Component unmounted
```

---

## State Machine

```
                    ┌──────────────┐
                    │    IDLE      │
                    │              │
                    │ Ready for    │
                    │ interaction  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         User clicks            User clicks
         Mark Complete          Navigation btn
                │                     │
                ▼                     ▼
         ┌──────────────┐      ┌──────────────┐
         │ PROCESSING   │      │ NAVIGATING   │
         │              │      │              │
         │ • Optimistic │      │ • Local nav  │
         │   updates    │      │   state set  │
         │ • Firestore  │      │ • Buttons    │
         │   call       │      │   disabled   │
         └──────┬───────┘      └──────┬───────┘
                │                     │
            ┌───┴──────┐              │
            │           │             │
        SUCCESS    FAILURE            │
            │           │             │
            ▼           ▼             ▼
      ┌─────────┐ ┌──────────┐ ┌──────────────┐
      │ NAVIGATE│ │ ROLLBACK │ │ LOAD_NEXT    │
      │         │ │ OPTIMISM │ │ LESSON_DATA  │
      │ Next    │ │          │ │              │
      │ lesson/ │ │ Clear    │ │ Firestore    │
      │ test    │ │ local    │ │ listeners    │
      │         │ │ state    │ │ subscribe    │
      └────┬────┘ └────┬─────┘ └──────┬───────┘
           │           │             │
           │           │             │
           └───────────┴─────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ FIRESTORE_SYNC   │
              │                  │
              │ Real-time        │
              │ listener fires   │
              │ with new data    │
              │                  │
              │ Clear optimism   │
              │ Merge real data  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ UI_SYNCED        │
              │                  │
              │ Component stable │
              │ Data consistent  │
              │                  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ IDLE             │
              │ (back to start)   │
              └──────────────────┘
```

---

## Real-Time Listener Subscription Graph

```
Component Lifetime:

┌─────────────────────────────────────────────────────────────┐
│ MOUNT                                                       │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useDoc<Course>                                         │ │
│ │ ├─ Subscribe: courses/{courseId}                       │ │
│ │ └─ Active while: courseRef !== null                   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useCollection<Lesson>                                  │ │
│ │ ├─ Subscribe: courses/{courseId}/lessons (ordered)    │ │
│ │ └─ Active while: lessonsQuery !== null                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useDoc<Lesson> ◄── CHANGES WITH lessonId               │ │
│ │ ├─ Subscribe: courses/{courseId}/lessons/{lessonId}   │ │
│ │ └─ Re-subscribe when lessonId changes                 │ │
│ │    (unsubscribe old, subscribe new)                   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useCollection<UserProgress> ◄── PERSISTENT             │ │
│ │ ├─ Subscribe: userProgress                            │ │
│ │ │  where userId == user.uid && courseId == courseId   │ │
│ │ └─ Active for entire component lifetime               │ │
│ │    (doesn't change on navigation)                     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useCollection<Note> ◄── CHANGES WITH lessonId          │ │
│ │ ├─ Subscribe: users/{uid}/notes                       │ │
│ │ │  where lessonId == lessonId                         │ │
│ │ └─ Re-filter when lessonId changes                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ useCollection<Purchase>                                │ │
│ │ ├─ Subscribe: purchases                               │ │
│ │ │  where userId == user.uid && courseId == courseId   │ │
│ │ └─ Used only for paid course validation               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ When lessonId changes
                          │ (User navigates)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ DURING NAVIGATION                                          │
│                                                              │
│ Unsubscribe                    Persist               Subscribe
│ ┌──────────────────────┐  ┌────────────────┐  ┌──────────────┐
│ │ useDoc<Lesson>       │  │UserProgress    │  │useDoc<Lesson>│
│ │ (old lesson)         │  │Listener        │  │(new lesson)  │
│ │                      │  │◄───────────────┤  │              │
│ │ Unsubscribe from:    │  │ Continues to   │  │Subscribe to: │
│ │ /lessons/{oldId}     │  │ listen for     │  │/lessons/{    │
│ │                      │  │ progress       │  │  newId}      │
│ │                      │  │ updates        │  │              │
│ └──────────────────────┘  └────────────────┘  └──────────────┘
│                                                              │
│ Unsubscribe              (same collection)    Re-filter
│ ┌──────────────────────┐  ┌────────────────┐  ┌──────────────┐
│ │ useCollection<Note>  │  │Purchase        │  │useCollection │
│ │ (old lesson notes)   │  │Listener        │  │<Note>        │
│ │                      │  │◄───────────────┤  │(new lesson   │
│ │ where lessonId ==    │  │ Already has    │  │notes)        │
│ │ oldId               │  │ all needed     │  │              │
│ │                      │  │ info           │  │where lessonId│
│ │                      │  │                │  │== newId      │
│ └──────────────────────┘  └────────────────┘  └──────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

```
Component Rendering Strategy:

┌──────────────────────────────────────┐
│ Expensive Operations                 │
├──────────────────────────────────────┤
│ ✓ Memoized with useMemo:            │
│   • groupedLessons                  │
│                                      │
│ ✓ Memoized with useCallback:        │
│   • handleMarkComplete              │
│   • handleNavigateToLesson          │
│   • handleNoteChange                │
│   • handleSaveNote                  │
│   • handleDownloadNotes             │
│                                      │
│ ✓ Memoized with useMemoFirebase:   │
│   • courseRef                       │
│   • lessonsQuery                    │
│   • lessonRef                       │
│   • progressRef                     │
│   • notesQuery                      │
│   • purchaseQuery                   │
│                                      │
│ ✓ Debounced:                        │
│   • Note autosave (1000ms)         │
└──────────────────────────────────────┘

Render Optimization:

┌──────────────────────────────────────┐
│ Re-render Triggers                   │
├──────────────────────────────────────┤
│ Full component re-renders on:        │
│ • isSidebarOpen change               │
│ • theaterMode change                 │
│ • noteContent change (debounced)    │
│ • Any lesson/progress/note data      │
│                                      │
│ Children optimized with:             │
│ • Conditional rendering              │
│ • Section memoization                │
│ • Lazy loading skeletons             │
└──────────────────────────────────────┘
```

---

**Last Updated**: November 24, 2025
