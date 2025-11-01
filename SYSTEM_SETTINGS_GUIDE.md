# System Settings Implementation Guide

## Overview

The System Settings feature allows administrators to configure and manage platform-wide settings that persist across sessions and apply immediately throughout the application.

## Features Implemented (#25)

### ✅ 1. Settings Persistence
All settings are automatically saved to `localStorage` and persist across browser sessions:
- Platform Name
- Logo URL
- Favicon URL
- Currency (USD, EUR, GBP, INR)
- Timezone (UTC, EST, PST, GMT, IST)
- Date Format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Language (English, Spanish, French, German, Hindi)

### ✅ 2. Real-time Application
Changes apply immediately throughout the platform without requiring a page reload:
- Settings are managed through React Context
- All components can access current settings via `useSettings()` hook
- Settings update triggers automatic re-renders where needed
- Document title and favicon update automatically

### ✅ 3. Logo Upload Functionality
Comprehensive image upload system with validation:
- **File Upload**: Drag-and-drop or click to upload
- **URL Input**: Alternative option to paste image URLs
- **Live Preview**: See uploaded images immediately
- **Validation**:
  - File types: PNG, JPG, SVG, ICO
  - Maximum size: 2MB
  - Automatic error handling
- **Dual Support**: Upload logo and favicon separately

## File Structure

```
app/
├── context/
│   └── SettingsContext.tsx        # Global settings state management
├── pages/
│   └── admin/
│       └── SettingsAdmin.tsx       # Admin settings interface
├── components/
│   └── SettingsExample.tsx        # Usage example component
└── main.tsx                       # SettingsProvider integration
```

## Usage

### Accessing Settings in Components

```tsx
import { useSettings } from '../context/SettingsContext';

function MyComponent() {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <h1>{settings.platformName}</h1>
      <p>Currency: {settings.currency}</p>
      <img src={settings.logoUrl} alt="Logo" />
    </div>
  );
}
```

### Updating Settings

Settings can be updated from any component:

```tsx
import { useSettings } from '../context/SettingsContext';

function SettingsForm() {
  const { settings, updateSettings } = useSettings();

  const handleSave = () => {
    updateSettings({
      currency: 'EUR',
      timezone: 'Europe/London',
    });
  };

  return <button onClick={handleSave}>Save Settings</button>;
}
```

### Resetting to Defaults

```tsx
import { useSettings } from '../context/SettingsContext';

function ResetButton() {
  const { resetSettings } = useSettings();

  return (
    <button onClick={resetSettings}>
      Reset to Default Settings
    </button>
  );
}
```

## Admin Interface

Navigate to **Admin Panel → System Settings** to configure:

### General Settings Tab
- **Platform Information**:
  - Platform Name
  - Currency
  - Timezone
  - Date Format
  - Language

- **Branding**:
  - Logo Upload (with preview)
  - Favicon Upload (with preview)
  - Alternative URL input for both

### Other Tabs
- Commission Settings
- Limits & Fees
- Email Settings
- SMS Settings
- Notification Settings
- Security Settings
- Referral Settings
- Tax Settings
- Maintenance Mode

## Technical Details

### Settings Context API

```typescript
interface SystemSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}
```

### Persistence Mechanism

- **Storage**: `localStorage.getItem('systemSettings')`
- **Auto-save**: Settings save automatically on every change
- **Initialization**: Loads from localStorage on app start
- **Fallback**: Uses default values if no saved settings exist

### Logo Upload Validation

```typescript
// Accepted file types
const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon'];

// Maximum file size
const maxSize = 2 * 1024 * 1024; // 2MB
```

## Features

### Automatic Updates

When settings change:
1. Settings context updates immediately
2. LocalStorage syncs automatically
3. All consuming components re-render
4. Document title updates
5. Favicon updates

### Error Handling

- Invalid file types show error toast
- Files exceeding 2MB are rejected
- Broken image URLs handled gracefully
- Failed localStorage operations logged

## Example Implementations

### Display Currency Symbol

```tsx
const { settings } = useSettings();

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

const symbol = currencySymbols[settings.currency] || '$';
```

### Format Date Based on Settings

```tsx
import { format } from 'date-fns';

const { settings } = useSettings();

const formatMap = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

const formattedDate = format(
  new Date(),
  formatMap[settings.dateFormat]
);
```

### Use Timezone

```tsx
import { formatInTimeZone } from 'date-fns-tz';

const { settings } = useSettings();

const localTime = formatInTimeZone(
  new Date(),
  settings.timezone,
  'yyyy-MM-dd HH:mm:ss'
);
```

## Best Practices

1. **Always use the hook**: Don't hardcode settings values
2. **Handle loading states**: Settings load asynchronously
3. **Validate inputs**: Always validate before updating settings
4. **Provide fallbacks**: Use default values when settings unavailable
5. **Test persistence**: Verify settings survive page reloads

## Testing

To test the settings feature:

1. Navigate to `/admin/settings`
2. Change platform name → Check if it updates in navbar
3. Upload logo → Verify preview and application
4. Change currency → Verify it appears throughout platform
5. Refresh page → Confirm all settings persist
6. Reset to defaults → Verify restoration

## Future Enhancements

Potential improvements for future versions:

- [ ] Backend API integration for settings storage
- [ ] Multi-language support with i18n integration
- [ ] Theme customization (colors, fonts)
- [ ] Settings export/import functionality
- [ ] Settings versioning and rollback
- [ ] Admin audit trail for setting changes
- [ ] Server-side image upload and CDN integration
- [ ] Advanced validation and constraints
- [ ] Settings categories and search
- [ ] Bulk settings management

## Troubleshooting

### Settings Not Persisting
- Check browser localStorage is enabled
- Verify no browser extensions blocking storage
- Check browser console for errors

### Logo Not Displaying
- Verify file is valid image format
- Check file size is under 2MB
- Ensure URL is accessible
- Check browser console for CORS errors

### Changes Not Applying
- Verify component is using `useSettings()` hook
- Check SettingsProvider wraps the app
- Verify React Context is properly configured

## Support

For issues or questions about System Settings:
1. Check this documentation
2. Review the code in `app/context/SettingsContext.tsx`
3. See example usage in `app/components/SettingsExample.tsx`
4. Test the feature at `/admin/settings`
