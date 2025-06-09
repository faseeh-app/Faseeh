# Faseeh Stylesheet Organization

This document describes the organization of the Faseeh utility classes and component stylesheets.

## Directory Structure

```
src/renderer/src/common/assets/styles/
├── base.css                 # Base styles and theme variables
├── faseeh-dark.css         # Dark theme styles
├── main.css                # Main entry point with imports
├── components/             # Component-specific utilities
│   ├── buttons.css         # Button utilities
│   ├── inputs.css          # Input and search bar utilities
│   ├── dropdowns.css       # Dropdown menu utilities
│   ├── tooltips.css        # Tooltip utilities
│   ├── scroll-areas.css    # Scroll area utilities
│   ├── icons.css           # Icon and icon button utilities
│   ├── titlebar.css        # TitleBar component utilities
│   ├── sidebar.css         # Sidebar component utilities
│   ├── media-cards.css     # Media card utilities
│   ├── filter-menu.css     # Filter menu utilities
│   └── command-palette.css # Command palette utilities
├── layouts/                # Layout-related utilities
│   ├── grids.css          # Grid and masonry layout utilities
│   └── flex-grid.css      # Flexbox and grid layout utilities
└── utilities/              # General-purpose utilities
    ├── common.css         # Common utilities (spacers, dividers)
    └── interactive.css    # Interactive state utilities
```

## Component Categories

### Buttons (`components/buttons.css`)

- `faseeh-button` - Base button styles
- `faseeh-button-primary` - Primary button variant

### Inputs (`components/inputs.css`)

- `faseeh-input` - Base input styles with focus states and validation
- `faseeh-search-bar` - Search bar container with icon
- `faseeh-search-bar__input` - Search input field
- `faseeh-search-bar__icon` - Search icon

### Dropdowns (`components/dropdowns.css`)

- `faseeh-dropdown-content` - Dropdown menu content container
- `faseeh-dropdown-item` - Base dropdown menu item
- `faseeh-dropdown-item--radio` - Radio button dropdown item
- `faseeh-dropdown-item--checkbox` - Checkbox dropdown item

### Tooltips (`components/tooltips.css`)

- `faseeh-tooltip-content` - Tooltip content container
- `faseeh-tooltip-arrow` - Tooltip arrow element

### Scroll Areas (`components/scroll-areas.css`)

- `faseeh-scroll-area` - Scroll area container
- `faseeh-scroll-area__viewport` - Scroll viewport
- `faseeh-scroll-bar` - Base scroll bar
- `faseeh-scroll-bar--vertical` - Vertical scroll bar
- `faseeh-scroll-bar--horizontal` - Horizontal scroll bar

### Icons (`components/icons.css`)

- `faseeh-icon` - Base icon styles
- `faseeh-icon--sm` - Small icon variant
- `faseeh-icon--lg` - Large icon variant
- `faseeh-icon--xl` - Extra large icon variant
- `faseeh-icon-button` - Clickable icon button
- `faseeh-icon-button--sm` - Small icon button
- `faseeh-icon-button--lg` - Large icon button

### TitleBar (`components/titlebar.css`)

- `faseeh-titlebar` - Main titlebar container
- `faseeh-titlebar__logo` - Logo area
- `faseeh-titlebar__window-controls` - Window control buttons container
- `faseeh-titlebar__window-controls__button` - Individual window control button
- `faseeh-titlebar__window-controls__button--danger` - Danger variant (close button)
- `faseeh-titlebar__tabs` - Tab container
- `faseeh-titlebar__tabs__item` - Individual tab

### Sidebar (`components/sidebar.css`)

- `faseeh-sidebar` - Main sidebar container
- `faseeh-sidebar__logo` - Sidebar logo area
- `faseeh-sidebar__button` - Sidebar navigation button

### Media Cards (`components/media-cards.css`)

- `faseeh-media-card` - Base media card styles
- `faseeh-media-card__thumbnail` - Card thumbnail/image
- `faseeh-media-card__placeholder` - Placeholder when no thumbnail
- `faseeh-media-card__overlay` - Hover overlay
- `faseeh-media-card__info` - Card information overlay
- `faseeh-media-card__title` - Card title
- `faseeh-media-card__subtitle` - Card subtitle
- `faseeh-media-card__type-badge` - Content type badge
- Variants: `--video`, `--audio`, `--document`, `--collection`

### Filter Menu (`components/filter-menu.css`)

- `faseeh-filter-menu__icon` - Filter menu icon
- `faseeh-filter-menu__content` - Filter menu content area
- `faseeh-filter-menu__clear-button` - Clear filter button
- `faseeh-filter-menu__clear-icon` - Clear filter icon

### Command Palette (`components/command-palette.css`)

- `faseeh-command-palette__container` - Main command palette container with flex layout
- `faseeh-command-palette__list` - Scrollable command list area
- `faseeh-command-palette__footer` - Fixed footer with navigation shortcuts
- `faseeh-command-palette__footer-content` - Footer content layout
- `faseeh-command-palette__shortcuts-group--main` - Main navigation shortcuts group
- `faseeh-command-palette__shortcuts-group--toggle` - Toggle shortcut group
- `faseeh-command-palette__shortcut-item` - Individual shortcut item
- `faseeh-command-palette__kbd` - Keyboard shortcut badge styling
- `faseeh-command-palette__shortcut-label` - Shortcut description label
- `faseeh-command-palette__command-content` - Command item content container
- `faseeh-command-palette__command-title` - Command title text
- `faseeh-command-palette__command-description` - Command description text

#### Mobile-Specific Utilities

- `faseeh-command-palette__mobile-list-compact` - Mobile list with enhanced height constraint (60vh)
- `faseeh-command-palette__mobile-command` - Mobile command container with flex layout
- `faseeh-command-palette__mobile-group` - Mobile command group with no padding (p-0)
- `faseeh-command-palette__mobile-item` - Mobile command item with ultra-compact spacing (py-0.5, px-2)
- `faseeh-command-palette__mobile-content` - Mobile command content with no gap
- `faseeh-command-palette__mobile-title` - Mobile command title with extra small font (text-xs)
- `faseeh-command-palette__mobile-description` - Mobile command description with extra small font
- `faseeh-command-palette__mobile-input` - Mobile search input with compact height (h-8, py-1.5, px-2)
- `faseeh-command-palette__mobile-header` - Mobile drawer header with minimal padding (p-2, pb-1)
- `faseeh-command-palette__mobile-header-title` - Mobile drawer title with small font (text-sm)
- `faseeh-command-palette__mobile-header-description` - Mobile drawer description with reduced margin
- `faseeh-command-palette__mobile-footer-compact` - Ultra-compact mobile footer (pt-0.5, pb-1)
- `faseeh-command-palette__mobile-close-button` - Compact close button (h-7, text-xs, px-3)
- `faseeh-command-palette__mobile-empty` - Ultra-compact empty state text (text-xs, py-1)
- `faseeh-command-palette__mobile-separator` - No spacing separator (my-0)

### Grid Layouts (`layouts/grids.css`)

- `faseeh-media-grid` - Base masonry grid layout
- `faseeh-media-grid--dense` - Dense grid variant
- `faseeh-media-grid--sparse` - Sparse grid variant

### Flex & Grid Layouts (`layouts/flex-grid.css`)

- `faseeh-flex-center` - Flex container with center alignment
- `faseeh-flex-between` - Flex container with space-between
- `faseeh-flex-start` - Flex container with start alignment
- `faseeh-flex-end` - Flex container with end alignment
- `faseeh-card` - Base card styles
- `faseeh-card--interactive` - Interactive card with hover effects
- `faseeh-grid` - Base grid layout
- `faseeh-grid--cols-1` to `faseeh-grid--cols-4` - Grid column variants
- `faseeh-grid--responsive` - Responsive grid layout

### Common Utilities (`utilities/common.css`)

- `faseeh-spacer` - Flexible spacer element
- `faseeh-divider--horizontal` - Horizontal divider
- `faseeh-divider--vertical` - Vertical divider

### Interactive Utilities (`utilities/interactive.css`)

- `faseeh-interactive` - Base interactive element styles
- `faseeh-interactive--hover` - Hover state styles
- `faseeh-interactive--active` - Active state styles
- `faseeh-interactive--focus` - Focus state styles
- `faseeh-interactive--all` - All interactive states
- `faseeh-filter-width--sm` to `faseeh-filter-width--xl` - Filter width variants

## Usage

All stylesheets are automatically imported through `main.css`. To use any utility class, simply apply it to your HTML/Vue components:

```html
<div class="faseeh-media-grid">
  <div class="faseeh-media-card faseeh-media-card--video">
    <img class="faseeh-media-card__thumbnail" src="..." alt="..." />
    <div class="faseeh-media-card__info">
      <h3 class="faseeh-media-card__title">Video Title</h3>
      <p class="faseeh-media-card__subtitle">Video Description</p>
    </div>
  </div>
</div>
```

## Adding New Components

When adding new component utilities:

1. Create a new file in the appropriate directory (`components/`, `layouts/`, or `utilities/`)
2. Follow the BEM-like naming convention: `faseeh-component__element--modifier`
3. Add the import to `main.css`
4. Document the new utilities in this README

## Theme Support

All utilities are designed to work with the Faseeh theming system using CSS custom properties defined in `base.css` and `faseeh-dark.css`.
