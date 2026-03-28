# Ingrediate Mobile App

React Native mobile app for Ingrediate using Expo.

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)

### Installation

```bash
cd mobile
npm install
```

### Environment Configuration

The app connects to your Rails backend. By default it uses `http://localhost:3000`.

To change the API base URL:

1. Create a `.env` file in the `mobile/` directory:
```
API_BASE_URL=http://192.168.1.100:3000
```

2. Or set it when running:
```bash
API_BASE_URL=http://192.168.1.100:3000 npm start
```

**Note for iOS Simulator:** Use `http://localhost:3000`
**Note for Android Emulator:** Use `http://10.0.2.2:3000`
**Note for physical device:** Use your computer's local IP address (e.g., `http://192.168.1.100:3000`)

### Running the App

Start the Expo development server:

```bash
npm start
```

Then:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your phone

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Base HTTP client with bearer token auth
│   │   ├── auth.ts       # Authentication API
│   │   ├── recipes.ts    # Recipe API functions
│   │   ├── pantry.ts     # Pantry API functions
│   │   └── shopping.ts   # Shopping list API functions
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state management
│   ├── screens/          # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── PantryScreen.tsx
│   │   ├── ShoppingScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Navigation setup
│   ├── types/
│   │   └── index.ts      # TypeScript types
│   └── theme.ts          # App theme colors
├── App.tsx               # Entry point
├── app.config.js         # Expo config with env vars
└── package.json
```

## Backend Requirements

The mobile app expects the Rails backend to have token-based authentication endpoints:

- `POST /api/auth/token/sign_in` - Login with email/password, returns `{user, token}`
- `POST /api/auth/token/sign_up` - Register, returns `{user, token}`
- `DELETE /api/auth/token/sign_out` - Logout
- `GET /api/auth/status` - Check auth status with bearer token

**IMPORTANT:** The current Rails backend uses session-based authentication (Devise). You'll need to add token-based auth endpoints for mobile. The mobile app sends:

```
Authorization: Bearer <token>
```

with every authenticated request (NO CSRF tokens).

## Authentication Flow

1. User enters credentials
2. App calls `/api/auth/token/sign_in` or `/api/auth/token/sign_up`
3. Backend returns JWT or token
4. Token stored in `expo-secure-store` (encrypted)
5. All subsequent requests include `Authorization: Bearer <token>` header
6. On 401 response, token is cleared and user redirected to login

## API Functions

All API calls are in `src/api/`:

### Recipes
- `generateRecipes(ingredients, filters)` - AI recipe generation
- `searchByMealName(mealName)` - Search recipes by name
- `analyzePhoto(uri, fileName, mimeType)` - Photo ingredient recognition
- `saveRecipe(recipe)` - Save a recipe
- `fetchSavedRecipes()` - Get user's saved recipes
- `deleteSavedRecipe(id)` - Delete a recipe
- `updateSavedRecipe(id, updates)` - Update a recipe
- `importRecipeFromUrl(url)` - Import from URL
- `suggestSubstitutions(recipeId, ingredient)` - Get AI substitutions
- `estimateRecipeCost(recipeId)` - Estimate recipe cost
- `shareRecipe(id)` - Generate share link
- `fetchSharedRecipe(token)` - View shared recipe
- `publishRecipe(id)` / `unpublishRecipe(id)` - Public feed

### Pantry
- `fetchPantryItems()` - Get pantry items
- `addPantryItem(name, category, expiresAt)` - Add item
- `bulkAddPantryItems(items)` - Add multiple items
- `deletePantryItem(id)` - Delete item
- `clearPantry()` - Clear all items
- `voiceAddPantryItems(text)` - Voice input parsing

### Shopping
- `fetchShoppingList()` - Get shopping list
- `addShoppingListItem(name, amount, source)` - Add item
- `toggleShoppingListItem(id)` - Check/uncheck item
- `deleteShoppingListItem(id)` - Delete item
- `clearCheckedItems()` - Remove checked items
- `populateFromPlan(planId)` - Add items from meal plan
- `addCheckedToPantry()` - Move checked items to pantry

## Tech Stack

- **React Native** with TypeScript
- **Expo** (managed workflow)
- **React Navigation** (stack + bottom tabs)
- **Expo Secure Store** (encrypted token storage)
- **Expo Image Picker** (camera/photos)
- **Expo Constants** (environment config)

## Development Notes

- All screens currently have placeholder UI
- Full functionality to be implemented in future iterations
- Uses React Native StyleSheet (not Tailwind/NativeWind)
- Theme colors: Emerald green (#10B981) primary
- Clean, minimal design matching web app aesthetic

## Next Steps

1. **Add token auth to Rails backend** - Create token endpoints
2. **Implement recipe generation UI** - Connect to API
3. **Build pantry management** - CRUD operations
4. **Build shopping list** - With check/uncheck
5. **Add image picker** - For ingredient photo analysis
6. **Add meal plans** - View and manage plans
7. **Add saved recipes** - Browse and edit
8. **Implement filters** - Dietary, cuisine, etc.
9. **Add error handling** - Better UX for failures
10. **Add loading states** - Spinners and skeletons

## Testing

To test without backend:
1. Mock the API responses in `src/api/client.ts`
2. Or use a local Rails server with CORS enabled

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

Follow Expo's deployment guides for App Store and Google Play submission.
