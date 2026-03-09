# 30 Day Shred - Component Library Documentation

## Overview

This app uses a modular, component-based architecture with reusable UI components organized in `/src/app/components/ui/`.

## Component Categories

### 1. Cards (`ui/cards.tsx`)

#### Card
Base container with optional animations and styling variants.
```tsx
<Card gradient delay={0.1} hoverable>
  {children}
</Card>
```
**Props:**
- `gradient?: boolean` - Apply gradient background
- `hoverable?: boolean` - Add hover effects
- `delay?: number` - Animation delay
- `className?: string` - Additional classes

#### StatCard
Display a metric with icon and label.
```tsx
<StatCard
  icon={Scale}
  label="Current"
  value="80 kg"
  variant="gradient"
  delay={0.2}
/>
```

#### QuoteCard
Motivational quote display with optional icon.
```tsx
<QuoteCard 
  quote="Your motivational quote"
  icon={Trophy}
  delay={0.3}
/>
```

#### SectionHeader
Page section header with icon and optional action.
```tsx
<SectionHeader
  title="Daily Checklist"
  subtitle="Complete your tasks"
  icon={Check}
  action={<Button>View All</Button>}
/>
```

#### InfoRow
Key-value pair display for forms and profiles.
```tsx
<InfoRow label="Weight" value="80 kg" border />
```

---

### 2. Buttons (`ui/buttons.tsx`)

#### Button
Primary action button with multiple variants.
```tsx
<Button
  variant="primary"
  size="lg"
  icon={Check}
  iconPosition="right"
  fullWidth
  onClick={handleClick}
>
  Click Me
</Button>
```
**Variants:** `primary` | `secondary` | `danger` | `ghost`
**Sizes:** `sm` | `md` | `lg`

#### IconButton
Icon-based navigation button (used in bottom nav).
```tsx
<IconButton
  icon={Home}
  label="Home"
  variant="active"
  onClick={() => navigate('/')}
/>
```

#### ActionButton
Settings-style action row with icon, title, and description.
```tsx
<ActionButton
  icon={Edit}
  label="Edit Profile"
  description="Update your information"
  onClick={handleEdit}
  variant="default"
/>
```

---

### 3. Progress (`ui/progress.tsx`)

#### ProgressRing
Circular progress indicator with canvas animation.
```tsx
<ProgressRing
  progress={75}
  size={200}
  strokeWidth={12}
  showPercentage
  label="Complete"
/>
```

#### ProgressBar
Linear progress bar with color variants.
```tsx
<ProgressBar
  progress={80}
  height="md"
  color="blue"
  showLabel
  animated
/>
```
**Colors:** `blue` | `green` | `yellow` | `red`

#### StatBadge
Floating badge for streak counters and metrics.
```tsx
<StatBadge
  icon={Flame}
  value={7}
  color="yellow"
/>
```

#### MiniStat
Compact stat display for dashboard grids.
```tsx
<MiniStat
  label="Days Complete"
  value={15}
  color="blue"
/>
```

---

### 4. Navigation (`ui/navigation.tsx`)

#### MobileNavigation
Bottom navigation bar with theme toggle.
```tsx
<MobileNavigation />
```
Automatically handles routing and active states.

#### PageHeader
Consistent page header with gradient variant.
```tsx
<PageHeader
  title="Dashboard"
  subtitle="Day 15 of 30"
  icon={Home}
  gradient
  action={<StatBadge icon={Flame} value={7} />}
/>
```

#### PageContainer
Content wrapper with max-width and padding.
```tsx
<PageContainer maxWidth="lg" padding>
  {children}
</PageContainer>
```
**Max widths:** `sm` | `md` | `lg` | `xl`

---

### 5. Forms (`ui/forms.tsx`)

#### InputField
Standard form input with icon support.
```tsx
<InputField
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  icon={Mail}
  placeholder="your@email.com"
  required
/>
```

#### GlassInputField
Glassmorphism input for gradient backgrounds.
```tsx
<GlassInputField
  label="Password"
  type="password"
  value={password}
  onChange={setPassword}
  icon={Lock}
  required
/>
```

#### SwitchField
Toggle switch with label and description.
```tsx
<SwitchField
  label="Notifications"
  description="Receive daily reminders"
  checked={enabled}
  onChange={setEnabled}
/>
```

#### Badge
Small label for statuses and categories.
```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```
**Variants:** `default` | `success` | `warning` | `danger`

#### EmptyState
Empty state placeholder with call-to-action.
```tsx
<EmptyState
  icon={Inbox}
  title="No records"
  description="Start by adding your first entry"
  action={<Button>Add Record</Button>}
/>
```

---

## Usage Patterns

### Importing Components

```tsx
// Import individual components
import { Card, Button, ProgressRing } from "./ui";

// Or import from specific files
import { Card } from "./ui/cards";
import { Button } from "./ui/buttons";
```

### Animation Delays

Use staggered delays for smooth page load animations:
```tsx
<Card delay={0.1}>First</Card>
<Card delay={0.2}>Second</Card>
<Card delay={0.3}>Third</Card>
```

### Responsive Design

All components are mobile-first and responsive by default. Use Tailwind breakpoints for customization:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Dark Mode

All components support dark mode via `next-themes`. Use dark: prefixes:
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

---

## Component Composition Examples

### Dashboard Layout
```tsx
<PageHeader title="Dashboard" gradient />
<PageContainer>
  <ProgressRing progress={75} />
  <div className="grid grid-cols-2 gap-4">
    <StatCard icon={Scale} label="Weight" value="75kg" />
    <StatCard icon={Target} label="Goal" value="70kg" />
  </div>
  <QuoteCard quote="Stay motivated!" icon={Trophy} />
</PageContainer>
<MobileNavigation />
```

### Settings Screen
```tsx
<PageContainer>
  <PageHeader title="Settings" icon={Settings} />
  <Card>
    <InfoRow label="Name" value="John" />
    <InfoRow label="Email" value="john@example.com" />
  </Card>
  <ActionButton
    icon={Edit}
    label="Edit Profile"
    description="Update information"
    onClick={handleEdit}
  />
</PageContainer>
```

### Form Layout
```tsx
<form onSubmit={handleSubmit}>
  <Card>
    <InputField
      label="Username"
      value={username}
      onChange={setUsername}
      icon={User}
    />
    <SwitchField
      label="Public profile"
      checked={isPublic}
      onChange={setIsPublic}
    />
  </Card>
  <Button type="submit" fullWidth>
    Save Changes
  </Button>
</form>
```

---

## Design Tokens

### Colors
- Primary: Blue (600-700)
- Success: Green (500-600)
- Warning: Yellow (400-500)
- Danger: Red (500-600)

### Spacing
- Cards: `p-6` padding, `rounded-2xl`
- Buttons: `px-6 py-3` for medium size
- Gaps: `gap-3` (cards), `gap-6` (sections)

### Typography
- Headings: `font-bold`
- Body: `font-medium`
- Labels: `text-sm font-medium`

---

## Best Practices

1. **Consistent Spacing**: Use the spacing tokens for uniform layouts
2. **Animation Timing**: Keep delays between 0.1-0.5s for smooth sequencing
3. **Icon Sizing**: Use `size-5` (20px) for inline icons, `size-6` (24px) for prominent icons
4. **Color Semantics**: Use color variants that match the action intent
5. **Accessibility**: Always include labels, even for icon-only buttons

---

## Adding New Components

When creating new reusable components:

1. Add to appropriate file in `ui/`
2. Export from `ui/index.ts`
3. Document props and usage
4. Add example to `ComponentShowcase.tsx`
5. Follow existing patterns for consistency

---

## Performance Notes

- Motion animations use GPU acceleration
- Canvas-based ProgressRing for smooth 60fps animation
- React.memo can be added to components receiving frequent prop updates
- LocalStorage operations are debounced in storage utility
