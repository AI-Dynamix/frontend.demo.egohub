---
description: how to create a new kiosk page/screen
---

# Creating a New Kiosk Page

This workflow explains how to create new pages for the kiosk application.

## ⚠️ CRITICAL RULES

1. **NEVER wrap your page with `KioskLayout`** - RootLayout already provides it
2. **Choose the correct layout** based on page type (see below)
3. **Use CSS variables** for spacing (defined in index.css)
4. **Test at 1080x1920** resolution to verify no shrinking/overflow

---

## Layout Options

| Layout | Use For | Features |
|--------|---------|----------|
| `<></>` (Fragment) | Simple content pages | No wrapper needed |
| `DetailPageLayout` | VR, Services, Info | Nav header + back button + footer |
| `HomeLayout` | Main home screen | Background rotation + Header/Footer |
| Custom dark div | Engineering/Admin | Dark background, custom header |

---

## Template: Detail Page (VR, Services, etc.)

```tsx
import { useNavigate } from 'react-router-dom'
import DetailPageLayout from '../../layouts/DetailPageLayout'

export default function MyDetailPage() {
    const navigate = useNavigate()

    return (
        <DetailPageLayout
            title="Page Title"
            subtitle="Optional subtitle"
            onBack={() => navigate('/home')}
            background="gradient"
        >
            {/* Your content here */}
            <div className="p-6">
                {/* Page content */}
            </div>
        </DetailPageLayout>
    )
}
```

---

## Template: Simple Page

```tsx
export default function SimplePage() {
    return (
        <>
            {/* Content fills the 1080x1920 container */}
            <div className="h-full flex flex-col">
                {/* Header area */}
                <header className="px-8 py-4">
                    <h1>Title</h1>
                </header>
                
                {/* Main content - use flex-1 to fill */}
                <main className="flex-1 overflow-y-auto px-6">
                    {/* Your content */}
                </main>
                
                {/* Footer area */}
                <footer className="px-8 py-4">
                    {/* Footer content */}
                </footer>
            </div>
        </>
    )
}
```

---

## CSS Variables (from index.css)

```css
--k-unit: 30px;        /* Base unit (1/64 of 1920px) */
--gap-outer: 30px;     /* Outer spacing */
--h-header: 180px;     /* Header height (6 units) */
--h-footer: 120px;     /* Footer height (4 units) */
```

---

## Adding Route

In `src/AppRoutes.tsx`:

```tsx
import MyNewPage from "./pages/MyNew/MyNewPage"

// In router:
<Route path="/my-new" element={<MyNewPage />} />

// If protected:
<Route path="/my-new" element={
    <ProtectedRoute>
        <MyNewPage />
    </ProtectedRoute>
} />
```

---

## Checklist Before Committing

- [ ] Page does NOT include `<KioskLayout>` wrapper
- [ ] Correct layout component used
- [ ] Route added to AppRoutes.tsx
- [ ] Tested at 1080x1920 - no shrinking/overflow
- [ ] Navigation (back button) works correctly
