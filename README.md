# Roman Baths Game

A 3D game where you explore Roman baths and collect gold pots while competing against an AI opponent.

## Game Description

In this game, you control a bath attendant who must collect gold pots scattered throughout ancient Roman baths. Your opponent, Cousin Lydia (in red), is also trying to collect the pots. The player who collects the most pots wins the game.

## Features

- 3D environment with realistic water effects
- Player vs AI competition
- Multiple bath areas to explore
- Collision detection and physics
- Minimap for navigation
- Progressive difficulty levels

## How to Play

- Use WASD keys to move the character
- F key toggles camera follow mode
- Mouse to rotate the camera
- Scroll wheel to zoom in/out
- M key to toggle music
- Collect gold pots before your opponent does
- If you collide with your opponent, both of you will drop some pots

## Deployment to Render

This game can be easily deployed as a static site on [Render](https://render.com/). There are two ways to deploy:

### Option 1: Using the render.yaml file (recommended)

1. **Create a GitHub repository**
   - Push all the game files to a GitHub repository

2. **Sign up for Render**
   - Go to [render.com](https://render.com/) and sign up for an account
   - Connect your GitHub account

3. **Create a new Blueprint**
   - From the Render dashboard, click "New" and select "Blueprint"
   - Select the GitHub repository containing the game
   - Render will automatically detect the `render.yaml` file and configure the deployment

4. **Deploy the Site**
   - Render will automatically deploy your site
   - Once deployed, you'll get a URL like `https://roman-baths-game.onrender.com`

### Option 2: Manual configuration

1. **Create a GitHub repository**
   - Push all the game files to a GitHub repository

2. **Sign up for Render**
   - Go to [render.com](https://render.com/) and sign up for an account
   - Connect your GitHub account

3. **Create a new Static Site**
   - From the Render dashboard, click "New" and select "Static Site"
   - Select the GitHub repository containing the game
   - Configure the following settings:
     - **Name**: Choose a name for your site (e.g., roman-baths-game)
     - **Build Command**: Leave empty (no build step required)
     - **Publish Directory**: `.` (root directory)

4. **Deploy the Site**
   - Click "Create Static Site"
   - Render will automatically deploy your site
   - Once deployed, you'll get a URL like `https://your-site-name.onrender.com`

5. **Custom Domain (Optional)**
   - In the Render dashboard, go to your static site settings
   - Under "Custom Domain", you can add your own domain if desired

## Local Development

To run the game locally:

### Option 1: Using Node.js (recommended)

1. Clone the repository
2. Open the project folder
3. Install Node.js if you don't have it already (https://nodejs.org/)
4. Run the server:
   ```
   npm start
   ```
   Or directly with Node:
   ```
   node server.js
   ```
5. Open a browser and navigate to `http://localhost:8080`

### Option 2: Using Python's built-in server

1. Clone the repository
2. Open the project folder
3. Start a local server:
   ```
   python -m http.server 8080
   ```
   Or for Python 3:
   ```
   python3 -m http.server 8080
   ```
4. Open a browser and navigate to `http://localhost:8080`

## Credits

- Built with Three.js
- Textures generated procedurally
- Water effect based on Three.js Water example
