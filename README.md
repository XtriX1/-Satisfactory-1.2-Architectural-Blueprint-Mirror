# Satisfactory 1.2 Architectural Blueprint Mirror

A lightweight, local Node.js tool to mirror `.sbp` blueprint files in **Satisfactory 1.2**, specifically calibrated for complex architectural builds and pieces rotated onto non-standard axes using **Infinite Nudge**.

> ⚠️ **IMPORTANT WARNING — ARCHITECTURAL USE ONLY**
> **DO NOT use this tool on Conveyor Belts, Conveyor Lifts, Pipes, Power Cables, Splitters/Mergers, or Production Machines (Factories).** 
> These logistical and functional elements have **not** been tested and contain directional input/output logic that cannot be geometrically mirrored. Mirror your architectural shell first, then place and connect belts, pipes, and machines manually in-game.

---

## 🧪 Tested & Calibrated Pieces (Including Infinite Nudge!)
Stress-tested on multi-story brutalist megastructure modules (up to **936+ pieces**) containing pieces rotated 90° on vertical/horizontal axes via **Infinite Nudge**:
* **Foundations & Ramps:** Standard, Concrete, Frame Foundations, Glass Frame Foundations, and Inverted Frame Ramps
* **Walls & Windows:** Standard Walls, Tilted Walls, Hexagonal Frame Windows, and Single Windows (calibrated for bottom-center pivots even when laid flat or rotated sideways)
* **Triangular Walls:** `Tris` & `FlipTris` in all sizes (`1m`, `2m`, `4m`, `8m`) across all materials (Concrete, FICSIT, Steel)
* **Quarter Pipes & Inverted Quarter Pipes**
* **Beams:** Painted & Steel Beams (including angled/crossed structural trusses)
* **Signs & Small Billboards:** Including horizontal ceiling-mounted light panels (keeps emission faces pointed in the right direction)
* **Catwalks & Walkways:** Straight, Ramp, T-Junction, Intersection, Modern Railings, and **Catwalk Corners**
* **Asymmetric `_Left` / `_Right` Assets:** Automatically swapped

---

## 🛠️ How to Set It Up & Use It (Zero Coding Required)

### Step 1: Install Node.js
1. Download and install the **LTS version** of [Node.js](https://nodejs.org).

### Step 2: Download This Tool
1. Click the green **`<> Code`** button at the top of this page and select **`Download ZIP`**.
2. Extract the ZIP folder anywhere on your PC (e.g., on your Desktop).

### Step 3: One-Time Setup
1. Open the extracted folder, click the address bar at the top (or press **Alt + D**), type `cmd`, and press **Enter** to open a black command window.
2. Paste this command and press **Enter** to install the Satisfactory blueprint parser:
   ```cmd
   npm init -y && npm install @etothepii/satisfactory-file-parser && npm pkg set type="module"
   ```

### Step 4: Mirror Any Blueprint!
1. **Exit to the Main Menu** in Satisfactory (the game only scans new blueprint files when loading a save).
2. Double-click **`Mirror.bat`** inside the folder.
3. Open your blueprints folder (`%LocalAppData%\FactoryGame\Saved\SaveGames\blueprints\<YourSessionName>`) and **drag & drop your `.sbp` file** into the black window, then press **Enter**.
4. Type **`X`** (mirrors Left ↔ Right when facing the Blueprint Designer control panel) or **`Y`** (mirrors Front ↔ Back), and press **Enter**.
5. Load your save—your new **`<BlueprintName>_MIRROR_X`** will be ready in the build menu! It never overwrites your original blueprint.

---

## 🔧 Adding Support for More Niche Pieces
If you run into a specific architectural piece that rotates the wrong way, you don't need to know how to code to fix it:
1. Copy the code from `mirror.js` and paste it into **Google Gemini** (or your preferred AI assistant).
2. Tell it: *"Here is my Satisfactory 1.2 blueprint mirroring script. Piece `[Exact In-Game Name]` is rotating `[X/Y/Z]` degrees the wrong way—please add a calibration rule for its internal `typePath` without changing the existing rules."*
3. Paste the updated code back into `mirror.js` and save.

---

*Built through a human + AI collaboration: 3D pivot/axis diagnostics and in-game testing paired with Node.js implementation via Google Gemini.*
