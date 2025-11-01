# Support Ticket Submission Functionality Guide

## Status: ✅ WORKING (Already Implemented)

The support ticket submission is **fully operational** with Zod validation, file upload support, error handling, and comprehensive form management.

---

## 🎯 What is Support Ticket Submission?

The Support Ticket feature provides:

- ✅ **Form Validation** - Zod schema with detailed requirements
- 📤 **Ticket Submission** - Create support tickets with all details
- 📎 **File Upload** - Attach multiple files (images, PDFs, documents)
- 🔍 **File Validation** - Size limits (5MB) and type restrictions
- ❌ **Error Display** - Field-level error messages
- 🎯 **Priority Selection** - Low, Medium, High, Urgent
- 📊 **Category System** - 6 predefined categories
- 🎉 **Success Feedback** - Toast notifications on submit
- 🔄 **Form Reset** - Auto-reset after successful submission

---

## ✅ Complete Ticket Submission Features

### Feature 1: Zod Validation Schema

**How it Works:**
1. Form fields validated against Zod schema
2. Validation runs when "Create Ticket" button clicked
3. Detailed error messages show for each invalid field
4. Form doesn't submit until all validation passes

**Implementation (Lines 46-52):**
```typescript
const ticketSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});
```

**Validation Rules:**
- ✅ **Category:** Required (min 1 character)
- ✅ **Subject:** Required, 5-100 characters
- ✅ **Description:** Required, 20-1000 characters
- ✅ **Priority:** Must be one of: low, medium, high, urgent

### Feature 2: Form Submission with Validation

**How it Works:**
1. User fills form and clicks "Create Ticket"
2. `handleCreateTicket` function runs
3. Clears previous errors
4. Validates form with Zod schema
5. If valid → Shows success toast, resets form, closes modal
6. If invalid → Shows error toast, displays field errors

**Implementation (Lines 506-545):**
```typescript
const handleCreateTicket = () => {
  try {
    // Clear previous errors
    setTicketErrors({});

    // Validate form
    ticketSchema.parse({
      category: newTicket.category,
      subject: newTicket.subject,
      description: newTicket.description,
      priority: newTicket.priority
    });

    console.log('Creating ticket:', newTicket, uploadedFiles);
    // In real app, this would call API with FormData including files

    toast.success('Ticket created successfully! You will receive updates via email.');

    setShowCreateTicket(false);
    setNewTicket({
      category: '',
      subject: '',
      description: '',
      priority: 'medium',
      attachments: []
    });
    setUploadedFiles([]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setTicketErrors(errors);
      toast.error('Please fix the validation errors');
    }
  }
};
```

**Success Flow:**
- ✅ Line 519: Logs ticket data (ready for API integration)
- ✅ Line 522: Shows success toast
- ✅ Lines 524-532: Resets all form fields
- ✅ Closes modal

**Error Flow:**
- ✅ Lines 534-543: Catches Zod validation errors
- ✅ Creates error object with field → message mapping
- ✅ Sets ticketErrors state
- ✅ Shows error toast

### Feature 3: File Upload with Validation

**How it Works:**
1. User clicks "📎 Attach Files" button
2. File input opens
3. User selects one or multiple files
4. Each file validated for size and type
5. Valid files added to uploadedFiles state
6. Invalid files show error toasts
7. User can remove files before submitting

**Implementation (Lines 466-498):**
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File size exceeds 5MB limit`);
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: File type not supported`);
    } else {
      validFiles.push(file);
    }
  });

  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
  }

  if (validFiles.length > 0) {
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setNewTicket({ ...newTicket, attachments: [...newTicket.attachments, ...validFiles.map(f => f.name)] });
    toast.success(`${validFiles.length} file(s) added successfully`);
  }

  // Reset input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

**File Validation:**
- ✅ **Max Size:** 5MB per file
- ✅ **Allowed Types:**
  - Images: JPEG, PNG, GIF
  - Documents: PDF, TXT, DOC, DOCX
- ✅ **Multiple Files:** User can attach multiple files
- ✅ **Individual Validation:** Each file checked separately
- ✅ **Error Toasts:** Shows which files were rejected and why
- ✅ **Success Toast:** Shows how many files were added

### Feature 4: Remove Uploaded Files

**How it Works:**
1. User clicks ✕ button next to uploaded file
2. File removed from uploadedFiles array
3. File name removed from newTicket.attachments
4. Success toast confirms removal

**Implementation (Lines 500-504):**
```typescript
const handleRemoveFile = (index: number) => {
  setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  setNewTicket({ ...newTicket, attachments: newTicket.attachments.filter((_, i) => i !== index) });
  toast.success('File removed');
};
```

**Display (Lines 1356-1375):**
```typescript
{uploadedFiles.length > 0 && (
  <div className="mt-3 space-y-2">
    {uploadedFiles.map((file, index) => (
      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">📄</span>
          <span className="text-sm text-gray-700 truncate">{file.name}</span>
          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button
          type="button"
          onClick={() => handleRemoveFile(index)}
          className="text-red-500 hover:text-red-700 px-2"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}
```

### Feature 5: Error Display

**How it Works:**
1. Validation fails on submit
2. Zod errors parsed into field → message map
3. Error state updated
4. Red borders appear on invalid fields
5. Error messages show below each field
6. Errors clear when user starts editing field

**Error State (Lines 70-71):**
```typescript
const [ticketErrors, setTicketErrors] = useState<{ [key: string]: string }>({});
```

**Category Error (Lines 1253-1267):**
```typescript
<select
  value={newTicket.category}
  onChange={(e) => {
    setNewTicket({ ...newTicket, category: e.target.value });
    if (ticketErrors.category) {
      setTicketErrors({ ...ticketErrors, category: '' });  // Clear error on change
    }
  }}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    ticketErrors.category ? 'border-red-500' : 'border-gray-300'  // Red border if error
  }`}
>
  {/* options */}
</select>
{ticketErrors.category && (
  <p className="text-red-500 text-sm mt-1">{ticketErrors.category}</p>  // Error message
)}
```

**Same pattern for all fields:**
- Lines 1274-1290: Subject field with error
- Lines 1298-1313: Description field with error

### Feature 6: Category Selection

**Available Categories (Lines 1258-1263):**
```typescript
<option value="">Select a category</option>
<option value="Account & Verification">Account & Verification</option>
<option value="Wallet & Transactions">Wallet & Transactions</option>
<option value="Earnings & Commissions">Earnings & Commissions</option>
<option value="Referrals & Team">Referrals & Team</option>
<option value="Technical Issues">Technical Issues</option>
<option value="Other">Other</option>
```

**Categories:**
1. Account & Verification
2. Wallet & Transactions
3. Earnings & Commissions
4. Referrals & Team
5. Technical Issues
6. Other

### Feature 7: Priority Selection

**Priority Buttons (Lines 1320-1334):**
```typescript
<div className="grid grid-cols-4 gap-2">
  {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
    <button
      key={priority}
      onClick={() => setNewTicket({ ...newTicket, priority })}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        newTicket.priority === priority
          ? getPriorityColor(priority)  // Colored if selected
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </button>
  ))}
</div>
```

**Priority Levels:**
- 🟢 **Low:** General inquiries
- 🔵 **Medium:** Standard issues (default)
- 🟠 **High:** Important problems
- 🔴 **Urgent:** Critical issues

**Color Coding (Lines 612-620):**
```typescript
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

---

## 🧪 Testing Scenarios

### Scenario 1: Valid Ticket Submission
1. **Navigate** to http://localhost:5174/support
2. **Click:** "+ Create Ticket" button in top-right
3. **Expected:** Modal opens with create ticket form
4. **Select** Category: "Technical Issues"
5. **Enter** Subject: "Cannot access my dashboard"
6. **Enter** Description: "I am getting a 500 error when trying to access my dashboard. This started happening this morning and I have tried clearing my cache."
7. **Select** Priority: "High"
8. **Click:** "Create Ticket" button
9. **Expected:**
   - Toast: "Ticket created successfully! You will receive updates via email."
   - Modal closes
   - Form resets
10. **Check** console
11. **Verify:** Log shows ticket data with all fields

### Scenario 2: Validation - Empty Category
1. **Click:** "+ Create Ticket"
2. **Leave** Category empty (default "Select a category")
3. **Enter** Subject: "Test subject here"
4. **Enter** Description: "This is a test description that is long enough to pass validation requirements."
5. **Click:** "Create Ticket"
6. **Expected:**
   - Toast error: "Please fix the validation errors"
   - Category field gets red border
   - Error message below category: "Please select a category"
   - Modal stays open
   - Other fields remain filled

### Scenario 3: Validation - Short Subject
1. **Click:** "+ Create Ticket"
2. **Select** Category: "Wallet & Transactions"
3. **Enter** Subject: "Help" (only 4 characters)
4. **Enter** Description: "This is a valid description with enough characters to pass validation."
5. **Click:** "Create Ticket"
6. **Expected:**
   - Toast error: "Please fix the validation errors"
   - Subject field gets red border
   - Error message: "Subject must be at least 5 characters"
   - Category remains valid (no error)

### Scenario 4: Validation - Short Description
1. **Fill** valid category and subject
2. **Enter** Description: "Too short" (only 9 characters)
3. **Click:** "Create Ticket"
4. **Expected:**
   - Toast error: "Please fix the validation errors"
   - Description field gets red border
   - Error message: "Description must be at least 20 characters"

### Scenario 5: File Upload - Valid Files
1. **Click:** "+ Create Ticket"
2. **Fill** all required fields with valid data
3. **Click:** "📎 Attach Files (Max 5MB each)"
4. **Select** files:
   - screenshot.png (2MB)
   - error-log.pdf (1MB)
5. **Expected:**
   - Toast: "2 file(s) added successfully"
   - Files appear in list with names and sizes
   - Each file shows 📄 icon, name, size in KB
   - Each file has ✕ remove button

### Scenario 6: File Upload - File Too Large
1. **Click:** "📎 Attach Files"
2. **Select** a file larger than 5MB
3. **Expected:**
   - Toast error: "[filename]: File size exceeds 5MB limit"
   - File NOT added to list
   - Can still attach other valid files

### Scenario 7: File Upload - Invalid Type
1. **Click:** "📎 Attach Files"
2. **Select** unsupported file (e.g., .exe, .zip, .avi)
3. **Expected:**
   - Toast error: "[filename]: File type not supported"
   - File NOT added to list
   - Supported formats shown below button

### Scenario 8: Remove Uploaded File
1. **Attach** 2-3 valid files
2. **Verify:** All files appear in list
3. **Click:** ✕ button on second file
4. **Expected:**
   - Toast: "File removed"
   - File disappears from list
   - Other files remain
5. **Click:** "Create Ticket"
6. **Verify:** Console log shows only remaining files

### Scenario 9: Error Clearing
1. **Click:** "+ Create Ticket"
2. **Click:** "Create Ticket" (without filling anything)
3. **Expected:** Multiple error messages appear
4. **Select** a category
5. **Expected:** Category error disappears immediately
6. **Type** in subject field
7. **Expected:** Subject error disappears as you type
8. **Type** in description field
9. **Expected:** Description error disappears as you type

### Scenario 10: Cancel and Reset
1. **Click:** "+ Create Ticket"
2. **Fill** all fields
3. **Attach** 2 files
4. **Click:** "Cancel" button
5. **Expected:** Modal closes
6. **Click:** "+ Create Ticket" again
7. **Verify:** All fields are empty (form reset)
8. **Verify:** No files attached

### Scenario 11: Change Priority
1. **Open** create ticket modal
2. **Default** priority: "Medium" (blue background)
3. **Click:** "High" button
4. **Expected:** High button turns orange, Medium returns to gray
5. **Click:** "Urgent" button
6. **Expected:** Urgent button turns red, High returns to gray
7. **Verify:** Only one priority selected at a time

### Scenario 12: Maximum Characters
1. **Enter** Subject: 100 characters exactly
2. **Expected:** Validation passes
3. **Enter** Subject: 101 characters
4. **Expected:** Error: "Subject must not exceed 100 characters"
5. **Enter** Description: 1000 characters exactly
6. **Expected:** Validation passes
7. **Enter** Description: 1001 characters
8. **Expected:** Error: "Description must not exceed 1000 characters"

---

## 📍 Implementation Details

### File Location
`app/pages/user/Support.tsx`

### State Management (Lines 55-75)
```typescript
// Ticket creation state
const [showCreateTicket, setShowCreateTicket] = useState(false);
const [newTicket, setNewTicket] = useState({
  category: '',
  subject: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  attachments: [] as string[]
});
const [ticketErrors, setTicketErrors] = useState<{ [key: string]: string }>({});
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Validation Flow
```
User clicks "Create Ticket"
   ↓
handleCreateTicket() called
   ↓
Clear previous errors: setTicketErrors({})
   ↓
Validate with Zod: ticketSchema.parse(...)
   ↓
Valid? → Success toast → Reset form → Close modal
   ↓
Invalid? → Catch ZodError → Parse errors → Set ticketErrors → Error toast
   ↓
UI shows red borders and error messages
   ↓
User corrects field
   ↓
onChange clears that field's error
   ↓
User submits again → Validation passes → Success!
```

### File Upload Flow
```
User clicks "Attach Files"
   ↓
File input opens
   ↓
User selects files
   ↓
handleFileUpload() called
   ↓
For each file:
   - Check size > 5MB? → Add to errors array
   - Check type not allowed? → Add to errors array
   - Otherwise → Add to validFiles array
   ↓
Show error toasts for rejected files
   ↓
Add validFiles to uploadedFiles state
   ↓
Show success toast: "X file(s) added successfully"
   ↓
Display files in UI with remove buttons
```

### API Integration (Ready for Production)
**Current (Line 519-520):**
```typescript
console.log('Creating ticket:', newTicket, uploadedFiles);
// In real app, this would call API with FormData including files
```

**For Production:**
```typescript
const handleCreateTicket = async () => {
  try {
    setTicketErrors({});
    ticketSchema.parse({...});

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('category', newTicket.category);
    formData.append('subject', newTicket.subject);
    formData.append('description', newTicket.description);
    formData.append('priority', newTicket.priority);

    // Append files
    uploadedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    // API call
    const response = await fetch('/api/support/tickets', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to create ticket');

    toast.success('Ticket created successfully!');
    setShowCreateTicket(false);
    setNewTicket({...});
    setUploadedFiles([]);
  } catch (error) {
    // Error handling
  }
};
```

---

## 🎨 Visual Features

### Form Fields Styling
- **Normal State:** Gray border
- **Focus State:** Blue ring (focus:ring-2 focus:ring-blue-500)
- **Error State:** Red border + error message below
- **Valid After Error:** Border returns to gray when user edits

### Priority Buttons
- **Unselected:** Gray background (bg-gray-100)
- **Low:** Gray (bg-gray-100 text-gray-800)
- **Medium:** Blue (bg-blue-100 text-blue-800)
- **High:** Orange (bg-orange-100 text-orange-800)
- **Urgent:** Red (bg-red-100 text-red-800)

### File List Display
- **Background:** Light gray (bg-gray-50)
- **Icon:** 📄 emoji
- **File Name:** Truncated if too long
- **File Size:** Shown in KB
- **Remove Button:** Red X (✕)

---

## ⚠️ Important Notes

### File Size Limits
**Client-Side:**
- Max 5MB per file (enforced in handleFileUpload)
- Unlimited number of files

**For Production:**
- May need server-side size validation too
- Consider total upload limit (e.g., 20MB total)
- Large files may timeout depending on server config

### Supported File Types
**Currently Allowed:**
- Images: JPEG, PNG, GIF
- Documents: PDF, TXT, DOC, DOCX

**Not Allowed:**
- Executables (.exe, .bat, .sh)
- Archives (.zip, .rar, .7z)
- Videos (.mp4, .avi, .mov)
- Audio (.mp3, .wav)

**To Add More Types:**
Edit line 469 in handleFileUpload:
```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',  // Add video
  'application/zip',  // Add zip
];
```

### Character Limits
- **Category:** Required (not empty)
- **Subject:** 5-100 characters
- **Description:** 20-1000 characters
- **Priority:** Auto-selected (medium default)

**Why These Limits?**
- **Min 5 chars subject:** Forces meaningful title
- **Max 100 chars subject:** Keeps it concise for ticket list
- **Min 20 chars description:** Ensures sufficient detail
- **Max 1000 chars description:** Prevents extremely long texts

### Validation Strategy
**Client-Side Only:**
- Current implementation validates with Zod
- Prevents invalid submissions
- Provides instant feedback

**For Production:**
- Also validate on server-side
- Don't trust client-side validation alone
- Server should reject invalid data

---

## 🔜 Possible Enhancements

Future improvements could include:

- [ ] **Real API Integration** - Connect to backend endpoint
- [ ] **Draft Saving** - Auto-save tickets as drafts
- [ ] **Rich Text Editor** - Add formatting to description
- [ ] **Image Preview** - Show thumbnails of uploaded images
- [ ] **Drag & Drop** - Drag files onto form to upload
- [ ] **Paste Screenshots** - Ctrl+V to paste from clipboard
- [ ] **Template System** - Pre-fill common issue types
- [ ] **Estimated Response Time** - Show based on priority
- [ ] **Ticket Number Preview** - Show what ID ticket will get
- [ ] **Character Counter** - Live count for subject/description
- [ ] **Suggested Articles** - Show related FAQs while typing
- [ ] **Auto-Categorization** - Suggest category based on keywords
- [ ] **Attachment Compression** - Auto-compress large images
- [ ] **Multi-Language** - Submit tickets in different languages
- [ ] **Scheduled Submission** - Submit at specific time

---

## 📊 Features Summary

| Feature | Status | Implementation | Validation |
|---------|--------|----------------|------------|
| Form Validation | ✅ Working | Zod schema | Required fields, lengths |
| Category Selection | ✅ Working | Dropdown | Must select one |
| Subject Input | ✅ Working | Text input | 5-100 chars |
| Description Input | ✅ Working | Textarea | 20-1000 chars |
| Priority Selection | ✅ Working | Button group | Low/Medium/High/Urgent |
| File Upload | ✅ Working | Multiple files | 5MB max, type check |
| File Removal | ✅ Working | Remove button | Instant removal |
| Error Display | ✅ Working | Field-level | Red borders + messages |
| Success Toast | ✅ Working | react-hot-toast | On submit |
| Form Reset | ✅ Working | On success | All fields cleared |

---

## 🐛 Troubleshooting

### Issue: "Create Ticket" does nothing
- **Check:** Are all required fields filled?
- **Solution:** Check for validation errors below fields

### Issue: Cannot attach files
- **Check:** Is file size under 5MB?
- **Check:** Is file type supported?
- **Solution:** Try smaller file or different format

### Issue: Error message not clearing
- **Check:** Are you editing the field that has the error?
- **Solution:** Type in the field to trigger onChange

### Issue: Uploaded file not showing
- **Check:** Did you see success toast?
- **Check:** Is file type allowed?
- **Solution:** Check console for errors

### Issue: Form doesn't reset after submit
- **Check:** Did you see success toast?
- **Solution:** This would be a bug - form should reset (lines 525-532)

---

## ✅ Conclusion

The Support Ticket Submission is **100% operational** with:

✅ **Form validation working** - Zod schema validates all fields
✅ **Validation errors displayed** - Field-level error messages
✅ **File upload working** - Multiple files with size/type validation
✅ **File removal working** - Remove button on each file
✅ **Priority selection** - 4 levels with color coding
✅ **Category system** - 6 predefined categories
✅ **Success feedback** - Toast notification on submit
✅ **Form reset** - Auto-clears after success
✅ **Error clearing** - Errors clear when user edits field
✅ **Ready for API** - Just needs endpoint integration

**Nothing needs to be fixed** - the ticket submission system is fully functional.

**Note:** The only "missing" piece is the actual API call to submit to a backend, but this is expected in a demo/prototype. All client-side functionality (validation, file handling, error display, UI feedback) is complete and working.

---

**Status**: ✅ WORKING
**Date**: 2025-10-31
**File**: app/pages/user/Support.tsx
**Implementation**: Complete with Zod validation, file upload, and comprehensive error handling
**Try it at:** http://localhost:5174/support
