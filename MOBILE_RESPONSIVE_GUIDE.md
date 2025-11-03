# 📱 Mobile-First Responsive Components Guide

## ✅ All Implementation Complete!

This guide shows you how to use the newly created mobile-responsive components in your Asterdex application.

---

## 🎯 Table of Contents

1. [Responsive Table Component](#responsive-table-component)
2. [Responsive Card Components](#responsive-card-components)
3. [Responsive Form Components](#responsive-form-components)
4. [Responsive Modal Components](#responsive-modal-components)
5. [Global CSS Utilities](#global-css-utilities)
6. [Mobile Bottom Navigation](#mobile-bottom-navigation)
7. [Testing Guidelines](#testing-guidelines)

---

## 📊 Responsive Table Component

**File:** `app/components/ResponsiveTable.tsx`

Automatically converts tables to cards on mobile devices.

### Basic Usage

```tsx
import { ResponsiveTable } from '../components/ResponsiveTable';

const columns = [
  { key: 'date', label: 'Date', mobileLabel: 'Date' },
  { key: 'type', label: 'Transaction Type', mobileLabel: 'Type' },
  { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <span className={`px-2 py-1 rounded text-xs ${
        value === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
      }`}>
        {value}
      </span>
    )
  },
];

const data = [
  { id: 1, date: '2025-01-01', type: 'Deposit', amount: 1000, status: 'completed' },
  { id: 2, date: '2025-01-02', type: 'Withdraw', amount: 500, status: 'pending' },
];

<ResponsiveTable
  columns={columns}
  data={data}
  keyField="id"
  emptyMessage="No transactions found"
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

### Features

- ✅ Desktop: Full table layout
- ✅ Mobile: Card layout with labels
- ✅ Custom render functions
- ✅ Click handlers
- ✅ Empty state handling

---

## 🎴 Responsive Card Components

**File:** `app/components/ResponsiveCard.tsx`

Three types of cards: `ResponsiveCard`, `StatCard`, and `InfoCard`.

### 1. Basic ResponsiveCard

```tsx
import { ResponsiveCard } from '../components/ResponsiveCard';

<ResponsiveCard
  variant="hover"
  padding="md"
  onClick={() => navigate('/details')}
>
  <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
  <p className="text-sm text-[#8b949e]">Card content goes here</p>
</ResponsiveCard>
```

**Variants:** `default` | `hover` | `gradient`
**Padding:** `sm` | `md` | `lg`

### 2. StatCard (For Metrics)

```tsx
import { StatCard } from '../components/ResponsiveCard';
import { Wallet } from 'lucide-react';

<StatCard
  icon={<Wallet className="w-6 h-6 text-[#00C7D1]" />}
  label="Wallet Balance"
  value="$12,450.00"
  change={{
    value: '+12.5%',
    label: 'vs last month',
    isPositive: true
  }}
  onClick={() => navigate('/wallet')}
  actions={
    <div className="flex gap-2">
      <button className="flex-1 btn-primary">Deposit</button>
      <button className="flex-1 btn-secondary">Withdraw</button>
    </div>
  }
/>
```

### 3. InfoCard (For Key-Value Pairs)

```tsx
import { InfoCard } from '../components/ResponsiveCard';

<InfoCard
  title="Account Information"
  items={[
    { label: 'User ID', value: 'USR123456' },
    { label: 'Email', value: 'user@example.com' },
    { label: 'Member Since', value: 'Jan 2024' },
    { label: 'Current Rank', value: 'Gold', icon: '🏆' },
  ]}
  actions={
    <button className="w-full btn-primary">Edit Profile</button>
  }
/>
```

---

## 📝 Responsive Form Components

**File:** `app/components/ResponsiveForm.tsx`

Mobile-optimized form inputs with proper touch targets and font sizes.

### Form Input

```tsx
import { FormInput } from '../components/ResponsiveForm';
import { Mail } from 'lucide-react';

<FormInput
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  icon={<Mail className="w-5 h-5" />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText="We'll never share your email"
  required
/>
```

### Form Textarea

```tsx
import { FormTextarea } from '../components/ResponsiveForm';

<FormTextarea
  label="Description"
  placeholder="Enter description..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
  error={descError}
  required
/>
```

### Form Select

```tsx
import { FormSelect } from '../components/ResponsiveForm';

<FormSelect
  label="Select Package"
  options={[
    { value: '', label: 'Choose a package' },
    { value: 'basic', label: 'Basic - $100' },
    { value: 'pro', label: 'Pro - $500' },
    { value: 'premium', label: 'Premium - $1000' },
  ]}
  value={selectedPackage}
  onChange={(e) => setSelectedPackage(e.target.value)}
  required
/>
```

### Form Button

```tsx
import { FormButton } from '../components/ResponsiveForm';
import { Send } from 'lucide-react';

<FormButton
  variant="primary"
  size="md"
  fullWidth
  isLoading={isSubmitting}
  icon={<Send className="w-4 h-4" />}
  onClick={handleSubmit}
>
  Submit Form
</FormButton>
```

**Variants:** `primary` | `secondary` | `success` | `danger` | `outline`
**Sizes:** `sm` | `md` | `lg`

### Form Checkbox

```tsx
import { FormCheckbox } from '../components/ResponsiveForm';

<FormCheckbox
  label="I agree to the terms and conditions"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
  error={agreeError}
  required
/>
```

### Complete Form Example

```tsx
import { FormGroup, FormInput, FormSelect, FormButton, FormCheckbox } from '../components/ResponsiveForm';

<form onSubmit={handleSubmit}>
  <FormGroup>
    <FormInput
      label="Full Name"
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      required
    />

    <FormInput
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />

    <FormSelect
      label="Package"
      options={packageOptions}
      value={package}
      onChange={(e) => setPackage(e.target.value)}
      required
    />

    <FormCheckbox
      label="I agree to terms"
      checked={agreed}
      onChange={(e) => setAgreed(e.target.checked)}
      required
    />

    <FormButton
      variant="primary"
      fullWidth
      isLoading={isSubmitting}
    >
      Submit
    </FormButton>
  </FormGroup>
</form>
```

---

## 🎭 Responsive Modal Components

**File:** `app/components/ResponsiveModal.tsx`

Modals that slide up from bottom on mobile, center on desktop.

### Basic Modal

```tsx
import { ResponsiveModal } from '../components/ResponsiveModal';

const [isOpen, setIsOpen] = useState(false);

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  footer={
    <div className="flex gap-3">
      <button onClick={() => setIsOpen(false)} className="flex-1 btn-secondary">
        Cancel
      </button>
      <button onClick={handleSave} className="flex-1 btn-primary">
        Save
      </button>
    </div>
  }
>
  <p className="text-white">Modal content goes here...</p>
</ResponsiveModal>
```

**Sizes:** `sm` (400px) | `md` (500px) | `lg` (600px) | `xl` (800px)

### Confirmation Modal

```tsx
import { ConfirmModal } from '../components/ResponsiveModal';

<ConfirmModal
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Confirm Deletion"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  isLoading={isDeleting}
/>
```

**Variants:** `danger` | `warning` | `info`

### Alert Modal

```tsx
import { AlertModal } from '../components/ResponsiveModal';

<AlertModal
  isOpen={isAlertOpen}
  onClose={() => setIsAlertOpen(false)}
  title="Success"
  message="Your changes have been saved successfully!"
  type="success"
  buttonText="Great!"
/>
```

**Types:** `success` | `error` | `warning` | `info`

---

## 🎨 Global CSS Utilities

**File:** `app/styles/index.css`

### Responsive Cards

```tsx
<div className="responsive-card">Basic card</div>
<div className="responsive-card-hover">Card with hover effect</div>
```

### Touch Targets

```tsx
<button className="touch-target">Minimum 44x44px</button>
<button className="icon-button">Icon button with proper touch target</button>
```

### Typography

```tsx
<h1 className="heading-1">Main Heading</h1>
<h2 className="heading-2">Sub Heading</h2>
<h3 className="heading-3">Section Heading</h3>
<p className="body-text">Body text</p>
<span className="small-text">Small text</span>
```

### Spacing

```tsx
<div className="container-padding">Responsive padding</div>
<div className="section-spacing">Vertical spacing between sections</div>
<div className="card-spacing">Internal card spacing</div>
```

### Animations

```tsx
<div className="animate-fadeInUp">Fade in from bottom</div>
<div className="animate-slideUp">Slide up (mobile modals)</div>
<div className="animate-slideInLeft">Slide in from left (drawer)</div>
```

### Skeleton Loaders

```tsx
<div className="skeleton h-8 w-full rounded"></div>
<div className="skeleton h-32 w-full rounded-lg"></div>
```

### Button Hover Effects

```tsx
<button className="btn-hover">Button with micro-interactions</button>
```

### Mobile/Desktop Visibility

```tsx
<div className="mobile-card">Only visible on mobile</div>
<div className="desktop-table">Only visible on desktop</div>
```

### Safe Area Padding

```tsx
<div className="pb-safe">Padding bottom with safe area</div>
<div className="has-bottom-nav">Padding for bottom navigation</div>
```

---

## 📱 Mobile Bottom Navigation

**File:** `app/components/MobileBottomNav.tsx`

Automatically integrated globally in `App.tsx`.

### Features

- ✅ 5 main navigation items (Home, Trading, Team, Wallet, Profile)
- ✅ Active state indicators
- ✅ Safe area padding for notched devices
- ✅ Auto-hides on login/register pages
- ✅ Only visible on mobile (<768px)

### Customization

To customize navigation items, edit `MobileBottomNav.tsx`:

```tsx
const navItems: NavItem[] = [
  { name: 'Home', icon: <Home />, path: '/dashboard', label: 'Home' },
  { name: 'Trading', icon: <TrendingUp />, path: '/perp', label: 'Trade' },
  // Add more items...
];
```

---

## 🧪 Testing Guidelines

### Breakpoints to Test

- **Mobile:** < 640px (iPhone SE: 375px, iPhone 14: 393px)
- **Tablet:** 640px - 1024px (iPad: 768px)
- **Desktop:** > 1024px (Standard: 1440px, Wide: 1920px)

### Testing Checklist

#### Mobile (< 768px)
- [ ] Bottom navigation visible and functional
- [ ] Sidebar opens as drawer from left
- [ ] Tables display as cards
- [ ] Form inputs are 16px font size (no zoom on iOS)
- [ ] Buttons are minimum 44x44px
- [ ] Modals slide up from bottom
- [ ] Cards stack in single column
- [ ] No horizontal scroll

#### Tablet (768px - 1024px)
- [ ] Bottom nav hidden
- [ ] Top navigation visible
- [ ] Cards display in 2 columns
- [ ] Sidebar visible or toggleable
- [ ] Modals centered

#### Desktop (> 1024px)
- [ ] Full layout with sidebars
- [ ] Cards in 4 columns
- [ ] Hover states working
- [ ] Modals centered with proper width

### Browser Testing

Test on:
- ✅ Chrome (Desktop + Mobile DevTools)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge

### PWA Testing

1. Open Chrome DevTools
2. Go to Application tab
3. Check Manifest
4. Check Service Worker
5. Test "Add to Home Screen"
6. Test offline functionality

---

## 🚀 Quick Start Examples

### Example 1: Responsive Transaction Table

```tsx
import { ResponsiveTable } from '../components/ResponsiveTable';

export const TransactionsPage = () => {
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', render: (v) => `$${v}` },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="container-padding section-spacing">
      <h1 className="heading-1 mb-6">Transactions</h1>
      <ResponsiveTable
        columns={columns}
        data={transactions}
        onRowClick={(row) => navigate(`/transaction/${row.id}`)}
      />
    </div>
  );
};
```

### Example 2: Responsive Dashboard with Cards

```tsx
import { StatCard } from '../components/ResponsiveCard';
import { Wallet, Users, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="container-padding section-spacing">
      <h1 className="heading-1 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="w-6 h-6 text-[#00C7D1]" />}
          label="Balance"
          value="$12,450"
          change={{ value: '+12%', label: 'vs last month', isPositive: true }}
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-[#00C7D1]" />}
          label="Team Size"
          value="150"
          change={{ value: '+5', label: 'new this week', isPositive: true }}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-[#00C7D1]" />}
          label="Earnings"
          value="$1,500"
          change={{ value: '+8%', label: 'vs last month', isPositive: true }}
        />
      </div>
    </div>
  );
};
```

### Example 3: Responsive Form with Modal

```tsx
import { useState } from 'react';
import { FormGroup, FormInput, FormButton } from '../components/ResponsiveForm';
import { ResponsiveModal, AlertModal } from '../components/ResponsiveModal';

export const ProfileEditPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Save logic...
    setIsModalOpen(false);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="container-padding section-spacing">
        <FormGroup>
          <FormInput label="Full Name" value={name} onChange={setName} />
          <FormInput label="Email" type="email" value={email} onChange={setEmail} />
          <FormButton variant="primary" fullWidth onClick={() => setIsModalOpen(true)}>
            Save Changes
          </FormButton>
        </FormGroup>
      </div>

      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Changes"
        footer={
          <div className="flex gap-3">
            <FormButton variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </FormButton>
            <FormButton variant="primary" fullWidth onClick={handleSubmit}>
              Confirm
            </FormButton>
          </div>
        }
      >
        <p className="text-white">Are you sure you want to save these changes?</p>
      </ResponsiveModal>

      <AlertModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Success"
        message="Your profile has been updated successfully!"
        type="success"
      />
    </>
  );
};
```

---

## 🎯 Best Practices

### 1. Always Use Mobile-First Approach

```tsx
// ✅ Good - Mobile first
<div className="px-4 sm:px-6 lg:px-8">

// ❌ Bad - Desktop first
<div className="px-8 md:px-6 sm:px-4">
```

### 2. Proper Touch Targets

```tsx
// ✅ Good - Minimum 44x44px
<button className="p-3 min-h-[44px] min-w-[44px]">

// ❌ Bad - Too small
<button className="p-1">
```

### 3. Prevent iOS Zoom

```tsx
// ✅ Good - 16px on mobile
<input className="text-base sm:text-sm" />

// ❌ Bad - 14px causes zoom
<input className="text-sm" />
```

### 4. Use Responsive Components

```tsx
// ✅ Good - Uses responsive components
<ResponsiveTable columns={columns} data={data} />

// ❌ Bad - Manual responsive logic
<div className="hidden md:block">...</div>
<div className="block md:hidden">...</div>
```

---

## 📊 Performance Tips

1. **Use CSS Containment**
   ```tsx
   <div className="card-container">...</div>
   ```

2. **GPU Acceleration for Animations**
   ```tsx
   <div className="gpu-accelerated">...</div>
   ```

3. **Lazy Load Images**
   ```tsx
   <img loading="lazy" src="..." alt="..." />
   ```

4. **Code Splitting**
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

---

## 🎉 You're All Set!

Your Asterdex application now has:

✅ Full mobile-responsive design
✅ PWA capabilities
✅ Reusable components
✅ Smooth animations
✅ Touch-friendly UI
✅ Bottom sheet modals
✅ Mobile bottom navigation
✅ Responsive tables & cards
✅ Mobile-optimized forms

**Happy coding! 🚀**
