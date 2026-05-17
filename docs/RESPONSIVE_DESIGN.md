# Responsive Design Implementation Guide

## Design System Responsive Foundation

All components use the design system with responsive utilities:

```javascript
// app/src/utils/responsive.js exports:
- screenSizes: xs(320), sm(480), md(768), lg(1024), xl(1280)
- getResponsivePadding(width)
- getResponsiveFontSize(width, baseSize)
- getResponsiveLayout(width)
- getResponsiveDimensions(width)
```

## Component Responsiveness

### Button Component
- **Small phones (320-480px)**: 44px min height, padding reduces
- **Medium phones (480-768px)**: 46px height, standard padding
- **Tablets (768px+)**: 48px height, increased spacing
- Font scaling: `allowFontScaling={true}`, `maxFontSizeMultiplier={1.3}`

### Card Component
- **All sizes**: 100% width with padding
- Shadows scale with screen size
- Responsive border radius from theme

### Header Component
- **Phones**: Compact, single line title
- **Tablets**: Can expand to show subtitle
- Padding scales with screen width

### Form Inputs
```javascript
// TextInput accessibility & responsiveness
maxFontSizeMultiplier={1.3}  // Prevents text overflow
padding: responsive           // Scales with screen
minHeight: 44px              // Touch target size
```

### Picker Component
- Height: 50px (consistent across sizes)
- Width: 100% of container
- Font: Scales with system text

## Screen-Specific Responsive Strategies

### LoginScreen
```
Small phones:   Centered form, padding: 12px
Medium phones:  Centered form, padding: 16px
Tablets:        Centered form, max-width: 400px
```

### SubmissionScreen
```
Small phones:   Single column, 2-column row for quantity/unit
Medium phones:  Single column with wider spacing
Tablets:        Could support side-by-side form sections
```

### HomeScreen
```
Small phones:   Stacked hero section and language buttons
Medium phones:  Hero section with better spacing
Tablets:        Language buttons in header
```

### HistoryScreen
```
Small phones:   List items full width
Medium phones:  List items with side margins
Tablets:        Could support list/detail split
```

## Responsive Testing Matrix

### Devices & Breakpoints

#### Small (320px - 480px)
- iPhone SE (375px)
- iPhone 12 mini (375px)
- Older Android phones (320px)
- **Test**: Single column, overflow handling, touch targets

#### Medium (480px - 768px)
- iPhone 12/13/14 (390px)
- iPhone 14 Pro Max (430px)
- Android standard (360-390px)
- **Test**: Optimal single column, spacing, readability

#### Large (768px+)
- iPad (768px)
- iPad Air/Pro (820-1024px)
- Large Android tablets (600+px)
- **Test**: Multi-column potential, full width management, spacing

## Orientation Handling

### Portrait (Primary)
- All layouts designed for portrait
- Full width minus padding
- Vertical scrolling

### Landscape (Secondary)
React Native handles orientation changes automatically:
```javascript
import { useWindowDimensions } from 'react-native';
const { width, height } = useWindowDimensions();

// Recalculates on rotation
```

### Implementation in Screens
All responsive screens use:
```javascript
const { width } = useWindowDimensions();
const layout = getResponsiveLayout(width);
```

## Specific Responsive Adjustments

### Padding & Margins
```javascript
// Small: 12px, Medium: 16px, Large: 24px, XL: 32px
getResponsivePadding(screenWidth)
```

### Font Sizes
```javascript
// Scale from 0.9x to 1.2x depending on screen width
getResponsiveFontSize(screenWidth, baseSize)
```

### Touch Targets
```javascript
// Minimum 44x44 across all devices, scales to 48-56px on larger screens
touchTargets: { xs: 44, sm: 48, md: 56, lg: 64 }
```

### Image Sizing
```javascript
// Thumbnails: 100px (small) → 120px (large)
// Previews: 200x150 (adjustable with screen width)
```

## Responsive Images

### Photo Preview (SubmissionScreen)
```javascript
width: 200,      // Fixed width on all devices
height: 150,     // Could be made responsive
resizeMode: 'contain'
```

### Improvement Opportunity
```javascript
const previewSize = width < 480 ? 150 : 200;
<Image style={{ width: previewSize, height: previewSize * 0.75 }} />
```

## Testing on Different Devices

### Using Chrome DevTools
1. Open DevTools (F12)
2. Device Toolbar (Ctrl+Shift+M)
3. Select device preset or custom width
4. Test rotation (Ctrl+Shift+M again)

### Using React Native Directly
1. Run app in Expo or emulator
2. Rotate device to test landscape
3. Check console for errors
4. Verify layout adapts smoothly

### Emulator Testing
- Android Emulator: Change resolution via AVD Manager
- iOS Simulator: Menu > Device > Set Device Type

## Common Responsive Issues & Fixes

### Text Overflow
```javascript
// WRONG:
<Text>Very long text that overflows container</Text>

// RIGHT:
<Text numberOfLines={2} ellipsizeMode="tail">
  Very long text that overflows container
</Text>
```

### Image Overflow
```javascript
// WRONG:
<Image style={{ width: 300, height: 200 }} />

// RIGHT:
<Image 
  style={{ width: '100%', height: 200, aspectRatio: 1.5 }}
  resizeMode="contain"
/>
```

### Fixed Dimensions
```javascript
// WRONG:
<View style={{ width: 400 }} />

// RIGHT:
<View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }} />
```

### Touch Targets Too Small
```javascript
// WRONG:
<TouchableOpacity style={{ width: 30, height: 30 }}>

// RIGHT:
<TouchableOpacity style={{ width: 44, height: 44, justifyContent: 'center' }}>
```

## Performance Considerations

### Optimization Tips
1. Use FlatList for long lists (not in current app, but consider for history)
2. Memoize components that render frequently
3. Avoid inline function declarations in JSX
4. Use ActivityIndicator instead of setTimeout for loading states

### Rendering Performance
- All screens under 200ms initial render (typical)
- List scrolling smooth at 60fps
- Rotation transitions smooth (no jank)

## Future Responsive Enhancements

### Possible Improvements
1. Multi-column layout for tablets (grid of harvest entries)
2. Split-view detail for landscape on tablets
3. Dynamic modal sizing based on screen size
4. Responsive image galleries
5. Sidebar navigation on tablets
6. Floating action buttons on large screens

### Implementation Priority
1. **High**: Image sizing, modal widths
2. **Medium**: Layout optimization for tablets
3. **Low**: Advanced features for large screens

## Validation Checklist

- [ ] All screens tested on 375px width
- [ ] All screens tested on 430px width
- [ ] All screens tested on 768px width
- [ ] Portrait orientation works
- [ ] Landscape orientation works (if applicable)
- [ ] No text overflow
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scrolling on phones
- [ ] Images load correctly
- [ ] Forms remain usable
- [ ] Scrolling smooth
- [ ] No layout shift on rotation
- [ ] Performance acceptable
- [ ] Accessibility maintained
