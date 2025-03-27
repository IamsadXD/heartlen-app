The HeartLen App is a web-based tool designed to process photoplethysmography (PPG) signals captured via a webcam. It calculates heart rate, heart rate variability (HRV), and signal quality using machine learning models. The processed data can be saved to a MongoDB database for further analysis.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/heartlen-app.git
   cd heartlen-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
- Create a .env.local file in the root directory and add your MongoDB connection string (for details, read **Connecting to MongoDB**)
  ```bash
  MONGODB_URI=your_mongodb_connection_string
  ```
4. Start the development server
   ```bash
   npm run dev
   ```
5. Open the app in your browser:
- Navigate to http://localhost:3000

### Connecting to MongoDB
To link the app to your MongoDB database:
1. Create a MongoDB Atlas cluster or use a local MongoDB instance.
2. Copy the connection string from MongoDB Atlas and paste it into the `.env.local` file as shown above.
3. Ensure the database has a collection named `records` to store PPG data.

### Deployment
To deploy the app:
1. Build the production version:
   ```bash
   npm run build
   ```
