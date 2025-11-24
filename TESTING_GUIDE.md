# Testing Guide - Lesson Page Improvements

## Quick Test Checklist

### 1. **Progress Bar Updates on Sidebar** ✅
- [ ] Open lesson page
- [ ] Click "Mark Complete & Continue"
- [ ] **Verify**: Progress bar increments immediately (before navigation)
- [ ] **Expected**: Progress % increases by ~percentage per lesson

### 2. **Button State Management** ✅
- [ ] Mark a lesson complete
- [ ] **Verify**: Button text changes to "Continue to Next Lesson"
- [ ] **Verify**: Checkmark icon appears next to completed lesson
- [ ] Go to an incomplete lesson
- [ ] **Verify**: Button shows "Mark Complete & Continue"

### 3. **Smooth Navigation** ✅
- [ ] Click "Mark Complete & Continue"
- [ ] **Verify**: No page flicker/reload
- [ ] **Verify**: Loading spinner shows briefly
- [ ] **Verify**: Navigates smoothly to next lesson
- [ ] **Verify**: Previous lesson link works
- [ ] **Expected**: Content updates without full page refresh

### 4. **Previous Button Works** ✅
- [ ] Click "Previous" button
- [ ] **Verify**: Navigates to previous lesson
- [ ] **Verify**: No full page reload
- [ ] **Verify**: Button disabled when on first lesson

### 5. **Sidebar Navigation** ✅
- [ ] Click different lessons in sidebar
- [ ] **Verify**: Smooth navigation
- [ ] **Verify**: Current lesson highlighted
- [ ] **Verify**: Completed lessons show checkmarks
- [ ] **Verify**: Loading state visible while navigating

### 6. **Progress Syncs Across Components** ✅
- [ ] Mark lesson complete
- [ ] **Verify**: Sidebar progress bar updates
- [ ] **Verify**: Sidebar lesson shows checkmark
- [ ] **Verify**: Next lesson available in sidebar
- [ ] Open course page in another tab
- [ ] **Verify**: Progress syncs across tabs

### 7. **Note Autosave** ✅
- [ ] Type in notes textarea
- [ ] **Verify**: "Saving..." indicator appears after 1 second
- [ ] **Verify**: "Saved" indicator appears after save complete
- [ ] Refresh page
- [ ] **Verify**: Notes are still there

### 8. **Download Notes** ✅
- [ ] Add some text to notes
- [ ] Click download button
- [ ] **Verify**: Text file downloads with correct content
- [ ] **Filename**: `notes-lesson-[lessonId].txt`

### 9. **Theater Mode Toggle** ✅
- [ ] Click maximize icon on video
- [ ] **Verify**: Video expands to theater mode
- [ ] **Verify**: Smooth transition
- [ ] Click minimize to go back
- [ ] **Verify**: Returns to normal size

### 10. **Mobile Responsive** ✅
- [ ] Open on mobile/tablet
- [ ] **Verify**: Sidebar is collapsed
- [ ] Click menu icon
- [ ] **Verify**: Drawer sidebar appears
- [ ] Click lesson in sidebar
- [ ] **Verify**: Smooth navigation
- [ ] Close sidebar
- [ ] **Verify**: Can still see main content

### 11. **Error Handling** ✅
- [ ] Disconnect internet while navigating
- [ ] **Verify**: Proper error handling
- [ ] Reconnect
- [ ] **Verify**: Data syncs properly

### 12. **Course Completion** ✅
- [ ] Mark last lesson complete
- [ ] **Verify**: Button changes to "Finish Course"
- [ ] Click button
- [ ] **Verify**: Redirects to `/courses/[courseId]/test`
- [ ] **Verify**: No errors in console

### 13. **Double-Click Prevention** ✅
- [ ] Rapidly click "Mark Complete & Continue"
- [ ] **Verify**: Only processes once
- [ ] **Verify**: No duplicate records created

---

## Browser DevTools Testing

### Firestore Monitoring
1. Open Chrome DevTools
2. Go to Firebase > Firestore
3. Navigate lessons
4. **Verify**: `userProgress` document updates in real-time

### Network Tab
1. Open Network tab
2. Mark lesson complete
3. **Verify**: See Firestore write operation
4. **Verify**: Page doesn't do full reload (no document reload)

### Console
- Look for no errors
- Progress tracking logs should show success

---

## Performance Benchmarks

| Metric | Expected | Actual |
|--------|----------|--------|
| Page Navigation Time | <200ms | ? |
| Progress Update Visibility | <100ms | ? |
| Note Save Time | 1-2s | ? |
| Initial Load | <2s | ? |

---

## Edge Cases to Test

### 1. **First Lesson**
- [ ] Go to first lesson
- [ ] **Verify**: "Previous" button disabled
- [ ] Mark complete
- [ ] **Verify**: Navigates to second lesson

### 2. **Last Lesson**
- [ ] Go to last lesson
- [ ] **Verify**: Button shows "Finish Course"
- [ ] **Verify**: "Next" button disabled

### 3. **Already Completed Lesson**
- [ ] Go to previously completed lesson
- [ ] **Verify**: Checkmark shows
- [ ] **Verify**: Button shows "Continue to Next Lesson"
- [ ] Click button
- [ ] **Verify**: Navigates to next incomplete or first lesson after

### 4. **Multiple Tabs**
- [ ] Open lesson in Tab A
- [ ] Open same course in Tab B
- [ ] Mark lesson complete in Tab A
- [ ] Switch to Tab B
- [ ] **Verify**: Progress updates automatically
- [ ] **Verify**: Checkmark appears without refresh

### 5. **Paid vs Free Course**
- [ ] Test with free course ✓
- [ ] Test with paid course (purchased) ✓
- [ ] Test with paid course (not purchased)
- [ ] **Verify**: Redirects to course page

### 6. **No Notes**
- [ ] Open lesson with no notes
- [ ] **Verify**: Textarea is empty
- [ ] Type something
- [ ] **Verify**: Saves properly

---

## Expected Console Output

```
// When marking lesson complete (success case)
Mark complete result: {
  success: true,
  newPercentage: 30,
  nextLesson: true
}

// Navigation feedback
Navigating to next lesson: [lessonId]
```

---

## Troubleshooting

### Issue: Progress doesn't update on sidebar
**Solution**: Check if `useCollection` hook is properly listening to `userProgress` collection

### Issue: Page reloads on navigation
**Solution**: Verify `handleNavigateToLesson` is being called (not `router.push` directly)

### Issue: Button stays in loading state
**Solution**: Check if `markLessonComplete` promise is resolving

### Issue: Notes don't save
**Solution**: Check Firestore permissions and `setDocumentNonBlocking` function

---

## Regression Tests

After any changes, verify:
1. [ ] Progress tracking still works
2. [ ] Navigation is smooth (no reloads)
3. [ ] Sidebar updates in real-time
4. [ ] Notes autosave works
5. [ ] Mobile responsive
6. [ ] No console errors
7. [ ] All buttons functional

---

## Performance Profiling (Optional)

### React DevTools Profiler
1. Open React DevTools > Profiler
2. Click "Record"
3. Navigate through lessons
4. **Verify**: Minimal re-renders
5. **Target**: <100ms per navigation render

### Lighthouse
1. Open Lighthouse
2. Run audit
3. Check metrics:
   - Largest Contentful Paint: <2.5s
   - Cumulative Layout Shift: <0.1
   - First Input Delay: <100ms

---

**Last Updated**: November 24, 2025
